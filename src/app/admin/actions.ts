'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function inviteClient(state: any, formData: FormData) {
  const email = formData.get('email') as string
  const fullName = formData.get('fullName') as string
  
  if (!email || !fullName) return { error: 'Email and Full Name are required' }

  const supabaseAdmin = createAdminClient()

  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: {
      full_name: fullName,
      role: 'client'
    }
  })

  if (error) return { error: error.message }
  
  revalidatePath('/admin')
  return { success: 'Invitation sent successfully!' }
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

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  // Insert capital
  const { error } = await supabase.from('invested_capital').insert({
    user_id: userId,
    amount_invested: amount
  })

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: 'Capital added successfully!' }
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

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  // Calculate dynamic shares
  // 1. Get sum of all invested capital per user
  const { data: capitalData, error: capitalError } = await supabase
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

  // 2. Calculate new value for each user and prepare insert payload
  const ledgerInserts = Array.from(userCapitalMap.entries()).map(([userId, userCapital]) => {
    const share = userCapital / totalFundCapital
    const userNewValue = newTotalValue * share
    return {
      user_id: userId,
      current_value: userNewValue
    }
  })

  // 3. Insert into ledger
  const { error: ledgerError } = await supabase.from('ledger').insert(ledgerInserts)

  if (ledgerError) return { error: ledgerError.message }

  revalidatePath('/admin')
  return { success: 'Performance updated and ledger entries created!' }
}

export async function sendStatements(state: any) {
  const supabase = await createClient()

  // Verify caller is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  try {
    // Calling our internal API route
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/send-statements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!res.ok) {
      return { error: 'Failed to trigger statements' }
    }
    
    return { success: 'Statements triggered successfully!' }
  } catch (error: any) {
    return { error: error.message }
  }
}
