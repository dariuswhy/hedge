'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function payoutFromPocketAction(amount: number, note?: string) {
  if (isNaN(amount) || amount <= 0) {
    return { error: 'Please enter a valid payout amount greater than $0.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const supabaseAdmin = createAdminClient()
  const { data: profile } = await supabaseAdmin.from('profiles').select('role, full_name, email').eq('id', user.id).single()
  const isAdm = profile?.role === 'admin' ||
                user.email === 'darius.neagu27@gmail.com' ||
                user.email === 'daudionica@gmail.com'

  if (!isAdm) return { error: 'Unauthorized' }

  // 1. Calculate available pocket balance
  const { data: txs } = await supabaseAdmin.from('transactions').select('type, amount')
  const inflow = (txs || []).filter(t => (t.type || '').toLowerCase() === 'fee').reduce((acc, t) => acc + Math.abs(Number(t.amount || 0)), 0)
  const outflow = (txs || []).filter(t => ['pocket_payout', 'pocket_reinvest'].includes((t.type || '').toLowerCase())).reduce((acc, t) => acc + Math.abs(Number(t.amount || 0)), 0)
  const available = Math.max(0, inflow - outflow)

  if (amount > available) {
    return { error: `Insufficient pocket reserve. Available: $${available.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
  }

  // 2. Record payout transaction
  const { error: insertErr } = await supabaseAdmin.from('transactions').insert({
    id: crypto.randomUUID(),
    user_id: user.id,
    type: 'pocket_payout',
    amount: amount
  })

  if (insertErr) {
    return { error: insertErr.message }
  }

  revalidatePath('/admin')
  return { success: `Successfully executed partner payout of $${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} from Founders Pocket!` }
}

export async function reinvestPocketIntoPoolAction(amount: number, poolId: string) {
  if (isNaN(amount) || amount <= 0) {
    return { error: 'Please enter a valid reinvestment amount greater than $0.' }
  }
  if (!poolId) {
    return { error: 'Please select a Hedge Pool to reinvest into.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const supabaseAdmin = createAdminClient()
  const { data: profile } = await supabaseAdmin.from('profiles').select('role, full_name, email').eq('id', user.id).single()
  const isAdm = profile?.role === 'admin' ||
                user.email === 'darius.neagu27@gmail.com' ||
                user.email === 'daudionica@gmail.com'

  if (!isAdm) return { error: 'Unauthorized' }

  // 1. Calculate available pocket balance
  const { data: txs } = await supabaseAdmin.from('transactions').select('type, amount')
  const inflow = (txs || []).filter(t => (t.type || '').toLowerCase() === 'fee').reduce((acc, t) => acc + Math.abs(Number(t.amount || 0)), 0)
  const outflow = (txs || []).filter(t => ['pocket_payout', 'pocket_reinvest'].includes((t.type || '').toLowerCase())).reduce((acc, t) => acc + Math.abs(Number(t.amount || 0)), 0)
  const available = Math.max(0, inflow - outflow)

  if (amount > available) {
    return { error: `Insufficient pocket reserve. Available: $${available.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
  }

  // 2. Fetch target pool
  const { data: pool, error: poolErr } = await supabaseAdmin.from('hedge_pools').select('*').eq('id', poolId).single()
  if (poolErr || !pool) {
    return { error: 'Selected Hedge Pool not found.' }
  }

  // 3. Update pool total capital & current value
  const newCapital = Number(pool.total_capital || 0) + amount
  const newCurrentValue = Number(pool.current_value || 0) + amount
  const { error: updatePoolErr } = await supabaseAdmin
    .from('hedge_pools')
    .update({
      total_capital: newCapital,
      current_value: newCurrentValue
    })
    .eq('id', poolId)

  if (updatePoolErr) {
    return { error: `Failed to update pool: ${updatePoolErr.message}` }
  }

  // 4. Update or register pool member allocation for the injection
  const { data: members } = await supabaseAdmin.from('hedge_pool_members').select('*').eq('pool_id', poolId)
  
  if (members && members.length > 0) {
    const existingMember = members.find((m: any) => m.user_id === user.id)
    if (existingMember) {
      const updatedAllocated = Number(existingMember.allocated_amount || 0) + amount
      const updatedValue = Number(existingMember.current_member_value || 0) + amount
      await supabaseAdmin
        .from('hedge_pool_members')
        .update({
          allocated_amount: updatedAllocated,
          current_member_value: updatedValue
        })
        .eq('id', existingMember.id)
    } else {
      // Add admin as a new co-investor member in this pool
      await supabaseAdmin.from('hedge_pool_members').insert({
        id: crypto.randomUUID(),
        pool_id: poolId,
        user_id: user.id,
        allocated_amount: amount,
        split_percentage: 0,
        current_member_value: amount
      })
    }

    // Recalculate split percentages for all members with new capital
    const { data: refreshedMembers } = await supabaseAdmin.from('hedge_pool_members').select('*').eq('pool_id', poolId)
    if (refreshedMembers && newCapital > 0) {
      for (const m of refreshedMembers) {
        const splitPct = (Number(m.allocated_amount || 0) / newCapital) * 100
        await supabaseAdmin
          .from('hedge_pool_members')
          .update({ split_percentage: parseFloat(splitPct.toFixed(4)) })
          .eq('id', m.id)
      }
    }
  } else {
    // If pool has no members yet, create first member record
    await supabaseAdmin.from('hedge_pool_members').insert({
      id: crypto.randomUUID(),
      pool_id: poolId,
      user_id: user.id,
      allocated_amount: amount,
      split_percentage: 100,
      current_member_value: amount
    })
  }

  // 5. Log audit trade on the Hedge Pool
  await supabaseAdmin.from('hedge_pool_trades').insert({
    id: crypto.randomUUID(),
    pool_id: poolId,
    asset_symbol: 'POCKET_INJECTION',
    trade_type: 'PROFIT_TAKE',
    position_size: amount,
    entry_price: 1,
    exit_price: 1,
    pnl_amount: 0,
    notes: `Founders Pocket Capital Reinvestment ($${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) injected into pool.`,
  })

  // 6. Record transaction in pocket audit log
  const { error: insertErr } = await supabaseAdmin.from('transactions').insert({
    id: crypto.randomUUID(),
    user_id: user.id,
    type: 'pocket_reinvest',
    amount: amount
  })

  if (insertErr) {
    console.error('Transactions table insert error:', insertErr)
  }

  revalidatePath('/admin')
  revalidatePath('/client')
  return { success: `Successfully transferred and reinvested $${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} from Pocket into ${pool.name}!` }
}
