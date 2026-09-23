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
  const available = Math.round(Math.max(0, inflow - outflow) * 100) / 100

  if (amount > available + 0.0001) {
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

  // 1. Calculate available pocket balance with 2-decimal floating point precision
  const { data: txs } = await supabaseAdmin.from('transactions').select('type, amount')
  const inflow = (txs || []).filter(t => (t.type || '').toLowerCase() === 'fee').reduce((acc, t) => acc + Math.abs(Number(t.amount || 0)), 0)
  const outflow = (txs || []).filter(t => ['pocket_payout', 'pocket_reinvest'].includes((t.type || '').toLowerCase())).reduce((acc, t) => acc + Math.abs(Number(t.amount || 0)), 0)
  const available = Math.round(Math.max(0, inflow - outflow) * 100) / 100

  if (amount > available + 0.0001) {
    return { error: `Insufficient pocket reserve. Available: $${available.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
  }

  // 2. Fetch target pool
  const { data: pool, error: poolErr } = await supabaseAdmin.from('hedge_pools').select('*').eq('id', poolId).single()
  if (poolErr || !pool) {
    return { error: 'Selected Hedge Pool not found.' }
  }

  // 3. Resolve Founders Profit Pocket institutional profile
  const { data: pocketProfiles } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('email', 'founders.pocket@hedge.internal')

  const pocketUserId = (pocketProfiles && pocketProfiles.length > 0) ? pocketProfiles[0].id : user.id

  // 4. Update pool total capital & current value
  const newCapital = Number(pool.total_capital || 0) + amount
  const newCurrentValue = Number(pool.current_value || 0) + amount
  const { error: updatePoolErr } = await supabaseAdmin
    .from('hedge_pools')
    .update({
      total_capital: parseFloat(newCapital.toFixed(2)),
      current_value: parseFloat(newCurrentValue.toFixed(2))
    })
    .eq('id', poolId)

  if (updatePoolErr) {
    return { error: `Failed to update pool: ${updatePoolErr.message}` }
  }

  // 5. Update or register pool member allocation for Founders Profit Pocket
  const { data: members } = await supabaseAdmin.from('hedge_pool_members').select('*').eq('pool_id', poolId)
  
  if (members && members.length > 0) {
    const existingMember = members.find((m: any) => m.user_id === pocketUserId)
    if (existingMember) {
      const updatedAllocated = Number(existingMember.allocated_amount || 0) + amount
      const updatedValue = Number(existingMember.current_member_value || 0) + amount
      await supabaseAdmin
        .from('hedge_pool_members')
        .update({
          allocated_amount: parseFloat(updatedAllocated.toFixed(2)),
          current_member_value: parseFloat(updatedValue.toFixed(2))
        })
        .eq('id', existingMember.id)
    } else {
      // Add Founders Profit Pocket as a new co-investor member in this pool
      await supabaseAdmin.from('hedge_pool_members').insert({
        id: crypto.randomUUID(),
        pool_id: poolId,
        user_id: pocketUserId,
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
      user_id: pocketUserId,
      allocated_amount: amount,
      split_percentage: 100,
      current_member_value: amount
    })
  }

  // 6. Update invested_capital for Founders Profit Pocket
  const { data: currentCapRows } = await supabaseAdmin
    .from('invested_capital')
    .select('amount_invested')
    .eq('user_id', pocketUserId)
    .order('created_at', { ascending: false })
    .limit(1)

  const currentCap = currentCapRows && currentCapRows.length > 0 ? Number(currentCapRows[0].amount_invested) : 0
  await supabaseAdmin.from('invested_capital').insert({
    id: crypto.randomUUID(),
    user_id: pocketUserId,
    amount_invested: parseFloat((currentCap + amount).toFixed(2))
  })

  // 7. Update ledger for Founders Profit Pocket
  const { data: currentLedgerRows } = await supabaseAdmin
    .from('ledger')
    .select('current_value')
    .eq('user_id', pocketUserId)
    .order('created_at', { ascending: false })
    .limit(1)

  const currentVal = currentLedgerRows && currentLedgerRows.length > 0 ? Number(currentLedgerRows[0].current_value) : 0
  await supabaseAdmin.from('ledger').insert({
    id: crypto.randomUUID(),
    user_id: pocketUserId,
    current_value: parseFloat((currentVal + amount).toFixed(2))
  })

  // 8. Log audit trade on the Hedge Pool
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

  // 9. Record transaction in pocket audit log
  const { error: insertErr } = await supabaseAdmin.from('transactions').insert({
    id: crypto.randomUUID(),
    user_id: pocketUserId,
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
