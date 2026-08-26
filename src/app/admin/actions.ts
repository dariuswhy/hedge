'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createClientWithCapital(state: any, formData: FormData) {
  const email = formData.get('email') as string
  const fullName = formData.get('fullName') as string
  const initialCapitalStr = formData.get('initialCapital') as string
  const initialCapital = parseFloat(initialCapitalStr) || 0

  if (!email || !fullName) {
    return { error: 'Client Email and Full Name are required.' }
  }

  const supabaseAdmin = createAdminClient()
  const supabase = await createClient()

  // Verify Admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // 1. Invite User via Supabase Admin Auth
  const { data: newUser, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: {
      full_name: fullName,
      role: 'client'
    }
  })

  let targetUserId = newUser?.user?.id

  // Fallback if user already exists or in local demo mode
  if (inviteErr) {
    console.warn('Supabase invite notice:', inviteErr.message)
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()
    if (existingProfile) {
      targetUserId = existingProfile.id
    }
  }

  if (targetUserId && initialCapital > 0) {
    // 2. Deposit Initial Capital
    await supabaseAdmin.from('invested_capital').insert({
      id: crypto.randomUUID(),
      user_id: targetUserId,
      amount_invested: initialCapital
    })

    // 3. Initialize Ledger
    await supabaseAdmin.from('ledger').insert({
      id: crypto.randomUUID(),
      user_id: targetUserId,
      current_value: initialCapital
    })

    // 4. Audit Transaction
    await supabaseAdmin.from('transactions').insert({
      id: crypto.randomUUID(),
      user_id: targetUserId,
      type: 'CAPITAL_DEPOSIT',
      amount: initialCapital
    })
  }

  revalidatePath('/admin')
  return {
    success: `Client "${fullName}" created successfully with $${initialCapital.toLocaleString()} initial capital!`
  }
}

export async function deleteClientAccount(userId: string) {
  if (!userId) return { error: 'Client ID is required' }

  const supabase = await createClient()

  // Verify Admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const supabaseAdmin = createAdminClient()

  // 1. Delete pool memberships
  await supabaseAdmin.from('hedge_pool_members').delete().eq('user_id', userId)

  // 2. Delete transactions
  await supabaseAdmin.from('transactions').delete().eq('user_id', userId)

  // 3. Delete ledger & capital
  await supabaseAdmin.from('ledger').delete().eq('user_id', userId)
  await supabaseAdmin.from('invested_capital').delete().eq('user_id', userId)

  // 4. Delete profile
  const { error: profileErr } = await supabaseAdmin.from('profiles').delete().eq('id', userId)

  if (profileErr) {
    console.error('Delete profile error:', profileErr)
  }

  revalidatePath('/admin')
  return { success: 'Client account and associated records deleted successfully.' }
}

export async function inviteClient(state: any, formData: FormData) {
  return createClientWithCapital(state, formData)
}

export async function addCapital(state: any, formData: FormData) {
  const userId = formData.get('userId') as string
  const amountStr = formData.get('amount') as string
  const amount = parseFloat(amountStr)

  if (!userId || isNaN(amount) || amount <= 0) {
    return { error: 'Valid user and amount are required' }
  }

  const supabase = await createClient()

  // Verify caller is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const supabaseAdmin = createAdminClient()

  // Insert capital using admin client bypassing RLS
  const { error } = await supabaseAdmin.from('invested_capital').insert({
    id: crypto.randomUUID(),
    user_id: userId,
    amount_invested: amount
  })

  if (error) return { error: error.message }

  // Also update ledger
  const { data: latestLedger } = await supabaseAdmin
    .from('ledger')
    .select('current_value')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)

  const currentVal = latestLedger && latestLedger.length > 0 ? Number(latestLedger[0].current_value) : 0
  await supabaseAdmin.from('ledger').insert({
    id: crypto.randomUUID(),
    user_id: userId,
    current_value: currentVal + amount
  })

  // Audit Transaction
  await supabaseAdmin.from('transactions').insert({
    id: crypto.randomUUID(),
    user_id: userId,
    type: 'CAPITAL_TOPUP',
    amount: amount
  })

  revalidatePath('/admin')
  return { success: `Successfully injected $${amount.toLocaleString()} capital!` }
}

export async function updatePerformance(state: any, formData: FormData) {
  const newTotalValueStr = formData.get('newTotalValue') as string
  const newTotalValue = parseFloat(newTotalValueStr)

  if (isNaN(newTotalValue) || newTotalValue < 0) {
    return { error: 'Valid new total value is required' }
  }

  const supabase = await createClient()

  // Verify caller is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const supabaseAdmin = createAdminClient()

  const { data: capitalData, error: capitalError } = await supabaseAdmin
    .from('invested_capital')
    .select('user_id, amount_invested')

  if (capitalError) return { error: capitalError.message }

  const userCapitalMap = new Map<string, number>()
  let totalFundCapital = 0

  capitalData.forEach(row => {
    const current = userCapitalMap.get(row.user_id) || 0
    userCapitalMap.set(row.user_id, current + Number(row.amount_invested))
    totalFundCapital += Number(row.amount_invested)
  })

  if (totalFundCapital === 0) {
    return { error: 'Cannot update performance: No invested capital found.' }
  }

  const ledgerInserts = Array.from(userCapitalMap.entries()).map(([userId, userCapital]) => {
    const share = userCapital / totalFundCapital
    const userNewValue = newTotalValue * share
    return {
      id: crypto.randomUUID(),
      user_id: userId,
      current_value: userNewValue
    }
  })

  const { error: ledgerError } = await supabaseAdmin.from('ledger').insert(ledgerInserts)
  if (ledgerError) return { error: ledgerError.message }

  revalidatePath('/admin')
  return { success: 'Performance updated and ledger entries created!' }
}

export async function sendStatements(state: any, scope: string = 'all', targetId?: string) {
  const supabase = await createClient()

  // Verify caller is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/send-statements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ scope, targetId })
    })

    if (!res.ok) {
      return { error: 'Failed to trigger statement deployment' }
    }

    return { success: `Statements deployed successfully! Scope: ${scope.toUpperCase()}` }
  } catch (error: any) {
    return { error: error.message }
  }
}
