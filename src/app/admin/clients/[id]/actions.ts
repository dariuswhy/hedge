'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function processTransaction(state: any, formData: FormData) {
  const userId = formData.get('userId') as string
  const type = formData.get('type') as 'deposit' | 'withdrawal' | 'fee'
  const amountStr = formData.get('amount') as string
  const amount = parseFloat(amountStr)

  if (!userId || !type || isNaN(amount) || amount <= 0) {
    return { error: 'Invalid input. Please provide a valid positive amount.' }
  }

  const supabase = await createClient()

  // Ensure Admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  // 1. Get current ledger value
  const { data: ledgerData } = await supabase
    .from('ledger')
    .select('current_value')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)

  const currentValue = ledgerData && ledgerData.length > 0 ? Number(ledgerData[0].current_value) : 0

  // Calculate new value
  let newValue = currentValue
  if (type === 'deposit') {
    newValue += amount
  } else if (type === 'withdrawal' || type === 'fee') {
    newValue -= amount
  }

  // 2. Insert into transactions
  const { error: txError } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      type: type,
      amount: amount
    })

  if (txError) {
    // If table doesn't exist, they might not have run the sql script yet
    console.error('Transaction Insert Error:', txError)
    if (txError.message.includes('relation "public.transactions" does not exist')) {
       return { error: 'Transactions table does not exist. Please run the SQL schema update in Supabase.' }
    }
    return { error: 'Failed to record transaction: ' + txError.message }
  }

  // 3. Insert new ledger entry
  const { error: ledgerError } = await supabase
    .from('ledger')
    .insert({
      user_id: userId,
      current_value: newValue
    })

  if (ledgerError) {
    return { error: 'Failed to update ledger: ' + ledgerError.message }
  }

  // 4. If deposit, optionally update invested_capital
  if (type === 'deposit') {
      const { data: investedData } = await supabase
        .from('invested_capital')
        .select('amount_invested')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        
      const currentInvested = investedData && investedData.length > 0 ? Number(investedData[0].amount_invested) : 0
      
      await supabase.from('invested_capital').insert({
          user_id: userId,
          amount_invested: currentInvested + amount
      })
  } else if (type === 'withdrawal') {
      // For withdrawal, we might want to reduce invested capital if we withdraw principal, 
      // but usually withdrawals reduce current value and possibly invested capital. Let's keep it simple and just update ledger.
      // Or we can just log a new invested capital entry
      const { data: investedData } = await supabase
        .from('invested_capital')
        .select('amount_invested')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        
      const currentInvested = investedData && investedData.length > 0 ? Number(investedData[0].amount_invested) : 0
      
      await supabase.from('invested_capital').insert({
          user_id: userId,
          amount_invested: Math.max(0, currentInvested - amount) // prevent negative invested capital
      })
  }

  revalidatePath(`/admin/clients/${userId}`)
  return { success: `Successfully processed ${type} of $${amount}` }
}
