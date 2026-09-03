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

  // 4. Record transaction in pocket audit log
  const { error: insertErr } = await supabaseAdmin.from('transactions').insert({
    id: crypto.randomUUID(),
    user_id: user.id,
    type: 'pocket_reinvest',
    amount: amount
  })

  if (insertErr) {
    return { error: insertErr.message }
  }

  revalidatePath('/admin')
  return { success: `Successfully transferred and reinvested $${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} from Pocket into ${pool.name}!` }
}
