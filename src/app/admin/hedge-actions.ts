'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createHedgePoolAction(state: any, formData: FormData) {
  const name = formData.get('name') as string
  const strategy = formData.get('strategy') as string
  const description = formData.get('description') as string
  const targetReturn = formData.get('targetReturn') as string || '+18.5% APY'

  if (!name || !strategy) {
    return { error: 'Hedge pool name and investment strategy are required.' }
  }

  const supabase = await createClient()

  // Verify caller is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const supabaseAdmin = createAdminClient()

  const { data: newPool, error } = await supabaseAdmin
    .from('hedge_pools')
    .insert({
      id: crypto.randomUUID(),
      name,
      strategy,
      description,
      target_return: targetReturn,
      total_capital: 0,
      current_value: 0,
      status: 'active'
    })
    .select()
    .single()

  if (error) {
    console.error('Create Hedge Pool error:', error)
    return { error: 'Failed to create hedge pool: ' + error.message }
  }

  revalidatePath('/admin')
  return { success: `Hedge Pool "${name}" created successfully!`, pool: newPool }
}

export async function addMembersToHedgePoolAction(state: any, formData: FormData) {
  const poolId = formData.get('poolId') as string
  const membersJson = formData.get('membersJson') as string

  if (!poolId || !membersJson) {
    return { error: 'Pool ID and members list are required.' }
  }

  let membersData: { userId: string; allocatedAmount: number }[] = []
  try {
    membersData = JSON.parse(membersJson)
  } catch {
    return { error: 'Invalid members format.' }
  }

  if (membersData.length === 0) {
    return { error: 'At least 1 member must be selected for the Hedge Account.' }
  }

  const totalAllocated = membersData.reduce((acc, m) => acc + Number(m.allocatedAmount || 0), 0)
  if (totalAllocated <= 0) {
    return { error: 'Total capital allocated to pool must be greater than $0.' }
  }

  const supabase = await createClient()

  // Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const supabaseAdmin = createAdminClient()

  // 1. Failsafe Check: Verify each investor has enough free capital!
  for (const m of membersData) {
    const allocated = Number(m.allocatedAmount || 0)
    if (allocated <= 0) continue

    // Fetch user total invested capital
    const { data: userCapRows } = await supabaseAdmin
      .from('invested_capital')
      .select('amount_invested')
      .eq('user_id', m.userId)

    const totalUserCap = userCapRows?.reduce((acc, curr) => acc + Number(curr.amount_invested), 0) || 0

    // Fetch allocations in other active pools
    const { data: otherPoolAllocations } = await supabaseAdmin
      .from('hedge_pool_members')
      .select('allocated_amount')
      .eq('user_id', m.userId)
      .neq('pool_id', poolId)

    const existingAllocated = otherPoolAllocations?.reduce((acc, curr) => acc + Number(curr.allocated_amount), 0) || 0
    const freeAvailable = Math.max(0, totalUserCap - existingAllocated)

    if (allocated > freeAvailable) {
      const { data: targetProfile } = await supabaseAdmin.from('profiles').select('full_name, email').eq('id', m.userId).single()
      const userName = targetProfile?.full_name || targetProfile?.email || 'Investor'
      return {
        error: `Failsafe Capital Protection Triggered: ${userName} only has $${freeAvailable.toLocaleString()} free capital available. You cannot allocate $${allocated.toLocaleString()} into this pool. Deposit capital first under Top-Up Capital.`
      }
    }
  }

  // 2. Delete existing members for clean merge re-allocation
  await supabaseAdmin.from('hedge_pool_members').delete().eq('pool_id', poolId)

  // 2. Prepare member rows with percentage splits & initial values
  const memberRows = membersData.map(m => {
    const allocated = Number(m.allocatedAmount)
    const splitPercentage = (allocated / totalAllocated) * 100
    return {
      id: crypto.randomUUID(),
      pool_id: poolId,
      user_id: m.userId,
      allocated_amount: allocated,
      split_percentage: parseFloat(splitPercentage.toFixed(4)),
      current_member_value: allocated
    }
  })

  const { error: insertError } = await supabaseAdmin.from('hedge_pool_members').insert(memberRows)

  if (insertError) {
    return { error: 'Failed to insert pool members: ' + insertError.message }
  }

  // 3. Update pool total capital and current value
  await supabaseAdmin
    .from('hedge_pools')
    .update({
      total_capital: totalAllocated,
      current_value: totalAllocated
    })
    .eq('id', poolId)

  revalidatePath('/admin')
  return { success: `Successfully merged ${membersData.length} investors into Hedge Pool!` }
}

export async function updateHedgePoolValuationAction(state: any, formData: FormData) {
  const poolId = formData.get('poolId') as string
  const newValueStr = formData.get('newValue') as string
  const newValue = parseFloat(newValueStr)

  if (!poolId || isNaN(newValue) || newValue < 0) {
    return { error: 'Valid pool ID and new fund value are required.' }
  }

  const supabase = await createClient()

  // Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const supabaseAdmin = createAdminClient()

  // 1. Fetch current pool members
  const { data: members, error: fetchErr } = await supabaseAdmin
    .from('hedge_pool_members')
    .select('*')
    .eq('pool_id', poolId)

  if (fetchErr || !members || members.length === 0) {
    return { error: 'No members found in this Hedge Pool to re-evaluate.' }
  }

  // 2. Update each member's valuation based on split percentage
  for (const m of members) {
    const memberShare = (Number(m.split_percentage) / 100) * newValue
    await supabaseAdmin
      .from('hedge_pool_members')
      .update({ current_member_value: memberShare })
      .eq('id', m.id)

    // Also update main client ledger
    const { data: userLedger } = await supabaseAdmin
      .from('ledger')
      .select('current_value')
      .eq('user_id', m.user_id)
      .order('created_at', { ascending: false })
      .limit(1)

    const prevLedgerValue = userLedger && userLedger.length > 0 ? Number(userLedger[0].current_value) : Number(m.allocated_amount)
    const diff = memberShare - Number(m.current_member_value || m.allocated_amount)
    const updatedUserLedger = Math.max(0, prevLedgerValue + diff)

    await supabaseAdmin.from('ledger').insert({
      id: crypto.randomUUID(),
      user_id: m.user_id,
      current_value: updatedUserLedger
    })
  }

  // 3. Update pool valuation
  await supabaseAdmin
    .from('hedge_pools')
    .update({ current_value: newValue })
    .eq('id', poolId)

  revalidatePath('/admin')
  return { success: `Hedge Pool valuation updated to $${newValue.toLocaleString()} across all member splits!` }
}

export async function addHedgePoolTradeAction(state: any, formData: FormData) {
  const poolId = formData.get('poolId') as string
  const assetSymbol = (formData.get('assetSymbol') as string || '').toUpperCase()
  const tradeType = formData.get('tradeType') as 'BUY_LONG' | 'SELL_SHORT' | 'PROFIT_TAKE' | 'STOP_LOSS'
  const positionSize = parseFloat(formData.get('positionSize') as string) || 0
  const entryPrice = parseFloat(formData.get('entryPrice') as string) || undefined
  const exitPrice = parseFloat(formData.get('exitPrice') as string) || undefined
  const pnlAmount = parseFloat(formData.get('pnlAmount') as string) || 0
  const notes = formData.get('notes') as string

  if (!poolId || !assetSymbol || !tradeType) {
    return { error: 'Pool ID, Asset Symbol, and Trade Type are required.' }
  }

  const supabase = await createClient()

  // Verify Admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const supabaseAdmin = createAdminClient()

  // 1. Record Trade Row
  const { error: tradeErr } = await supabaseAdmin.from('hedge_pool_trades').insert({
    id: crypto.randomUUID(),
    pool_id: poolId,
    asset_symbol: assetSymbol,
    trade_type: tradeType,
    position_size: positionSize,
    entry_price: entryPrice,
    exit_price: exitPrice,
    pnl_amount: pnlAmount,
    notes: notes
  })

  if (tradeErr) {
    console.error('Trade insert error:', tradeErr)
  }

  // 2. Insert audit transaction into master transactions table
  await supabaseAdmin.from('transactions').insert({
    id: crypto.randomUUID(),
    user_id: user.id,
    type: `TRADE_${tradeType}_${assetSymbol}`,
    amount: pnlAmount
  })

  // 3. Adjust Pool Valuation if PnL is non-zero
  if (pnlAmount !== 0) {
    const { data: poolData } = await supabaseAdmin
      .from('hedge_pools')
      .select('current_value')
      .eq('id', poolId)
      .single()

    const currentVal = poolData ? Number(poolData.current_value) : 0
    const updatedVal = Math.max(0, currentVal + pnlAmount)

    // Trigger valuation update across member splits
    const valForm = new FormData()
    valForm.append('poolId', poolId)
    valForm.append('newValue', updatedVal.toString())
    await updateHedgePoolValuationAction(null, valForm)
  }

  revalidatePath('/admin')
  return { success: `Trade ${assetSymbol} (${tradeType}) logged successfully! PnL: ${pnlAmount >= 0 ? '+' : ''}$${pnlAmount.toLocaleString()}` }
}

export async function deleteHedgePoolAction(poolId: string) {
  if (!poolId) return { error: 'Pool ID is required' }

  const supabase = await createClient()

  // Verify Admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const supabaseAdmin = createAdminClient()

  // Delete trades & members
  await supabaseAdmin.from('hedge_pool_trades').delete().eq('pool_id', poolId)
  await supabaseAdmin.from('hedge_pool_members').delete().eq('pool_id', poolId)

  // Delete pool
  const { error } = await supabaseAdmin.from('hedge_pools').delete().eq('id', poolId)
  if (error) return { error: 'Failed to delete hedge pool: ' + error.message }

  revalidatePath('/admin')
  return { success: 'Hedge pool deleted successfully.' }
}

export async function purgeFakeDataAction() {
  const supabase = await createClient()

  // Verify Admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const supabaseAdmin = createAdminClient()

  // 1. Delete fake clients (where email is example.com or john pork)
  const { data: fakeUsers } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .neq('role', 'admin')
    .or('email.ilike.%example.com%,full_name.ilike.%john pork%,full_name.ilike.%demo%')

  if (fakeUsers && fakeUsers.length > 0) {
    const ids = fakeUsers.map(u => u.id)
    await supabaseAdmin.from('invested_capital').delete().in('user_id', ids)
    await supabaseAdmin.from('ledger').delete().in('user_id', ids)
    await supabaseAdmin.from('transactions').delete().in('user_id', ids)
    await supabaseAdmin.from('hedge_pool_members').delete().in('user_id', ids)
    await supabaseAdmin.from('profiles').delete().in('id', ids)
  }

  // 2. Delete all demo hedge pools
  const { data: demoPools } = await supabaseAdmin
    .from('hedge_pools')
    .select('id')
    .or('name.ilike.%Quantum%,name.ilike.%Macro%')

  if (demoPools && demoPools.length > 0) {
    const poolIds = demoPools.map(p => p.id)
    await supabaseAdmin.from('hedge_pool_trades').delete().in('pool_id', poolIds)
    await supabaseAdmin.from('hedge_pool_members').delete().in('pool_id', poolIds)
    await supabaseAdmin.from('hedge_pools').delete().in('id', poolIds)
  }

  revalidatePath('/admin')
  return { success: 'All fake clients & demo hedge pools have been purged! Fund reset to clean state.' }
}
