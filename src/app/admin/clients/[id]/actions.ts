'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

  const isAdminEmail = user.email?.toLowerCase().includes('darius') ||
                       user.email?.toLowerCase().includes('dionica') ||
                       user.email?.toLowerCase().includes('admin') ||
                       user.email === 'daudionica@gmail.com' ||
                       user.email === 'darius.neagu27@gmail.com'

  if (profile?.role !== 'admin' && !isAdminEmail) return { error: 'Unauthorized' }

  const supabaseAdmin = createAdminClient()

  // 1. Get current ledger value using admin client
  const { data: ledgerData, error: ledgerFetchErr } = await supabaseAdmin
    .from('ledger')
    .select('current_value')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (ledgerFetchErr) {
    console.error('Ledger Fetch Error:', ledgerFetchErr)
  }

  const currentValue = ledgerData && ledgerData.length > 0 ? Number(ledgerData[0].current_value) : 0

  // Calculate new value
  let newValue = currentValue
  if (type === 'deposit') {
    newValue += amount
  } else if (type === 'withdrawal' || type === 'fee') {
    newValue = Math.max(0, currentValue - amount)
  }

  // 2. Insert into transactions using admin client (bypasses RLS)
  const { error: txError } = await supabaseAdmin
    .from('transactions')
    .insert({
      id: crypto.randomUUID(),
      user_id: userId,
      type: type,
      amount: amount
    })

  if (txError) {
    console.error('Transaction Insert Error:', txError)
    if (txError.message.includes('relation "public.transactions" does not exist')) {
       return { error: 'Transactions table does not exist. Please run the SQL schema update in Supabase.' }
    }
    return { error: 'Failed to record transaction: ' + txError.message }
  }

  // 3. Insert new ledger entry using admin client
  const { error: ledgerError } = await supabaseAdmin
    .from('ledger')
    .insert({
      id: crypto.randomUUID(),
      user_id: userId,
      current_value: newValue
    })

  if (ledgerError) {
    console.error('Ledger Insert Error:', ledgerError)
    return { error: 'Failed to update ledger: ' + ledgerError.message }
  }

  // 4. If deposit or withdrawal, update invested_capital
  if (type === 'deposit') {
      const { data: investedData } = await supabaseAdmin
        .from('invested_capital')
        .select('amount_invested')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        
      const currentInvested = investedData && investedData.length > 0 ? Number(investedData[0].amount_invested) : 0
      
      await supabaseAdmin.from('invested_capital').insert({
          id: crypto.randomUUID(),
          user_id: userId,
          amount_invested: currentInvested + amount
      })
  } else if (type === 'withdrawal') {
      const { data: investedData } = await supabaseAdmin
        .from('invested_capital')
        .select('amount_invested')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        
      const currentInvested = investedData && investedData.length > 0 ? Number(investedData[0].amount_invested) : 0
      
      await supabaseAdmin.from('invested_capital').insert({
          id: crypto.randomUUID(),
          user_id: userId,
          amount_invested: Math.max(0, currentInvested - amount)
      })
  }

  revalidatePath(`/admin/clients/${userId}`)
  revalidatePath('/admin')
  return { success: `Successfully processed ${type} of $${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
}
