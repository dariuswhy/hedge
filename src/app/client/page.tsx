import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClientTabs from './client-tabs'
import { fetchUserHedgePoolsWithClient } from '@/lib/hedge-pools'
import { ShieldCheck } from 'lucide-react'

export default async function ClientPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  // 1. Fetch Total Invested Capital (latest snapshot)
  const { data: capitalData } = await supabase
    .from('invested_capital')
    .select('amount_invested')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const totalInvested = capitalData && capitalData.length > 0 ? Number(capitalData[0].amount_invested) : 0

  // 2. Fetch Ledger History
  const { data: ledgerData } = await supabase
    .from('ledger')
    .select('current_value, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  const latestLedger = ledgerData && ledgerData.length > 0 ? ledgerData[ledgerData.length - 1] : null
  const currentBalance = latestLedger ? Number(latestLedger.current_value) : totalInvested
  const allTimeRoi = currentBalance - totalInvested
  const roiPercentage = totalInvested > 0 ? (allTimeRoi / totalInvested) * 100 : 0

  // 3. Fetch Pooled Hedges the client participates in
  const userHedgePools = await fetchUserHedgePoolsWithClient(supabase, user.id)

  // 4. Fetch Client Transactions
  const { data: userTransactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-[#030712] text-white pt-28 pb-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-400 tracking-widest uppercase">
                Investor Dashboard Active
              </span>
            </div>
            <h1 className="text-4xl font-light tracking-tight text-white">
              Welcome, {profile?.full_name || 'Investor'}
            </h1>
            <p className="text-gray-400 mt-1 text-base">
              Comprehensive institutional portfolio overview and pooled hedge split management.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="glass px-5 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 text-blue-200 border border-blue-500/30">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              Encrypted Session
            </div>
          </div>
        </header>

        {/* Tabbed Navigation Container */}
        <ClientTabs
          currentUserId={user.id}
          fullName={profile?.full_name || 'Investor'}
          totalInvested={totalInvested}
          currentBalance={currentBalance}
          allTimeRoi={allTimeRoi}
          roiPercentage={roiPercentage}
          ledgerData={ledgerData || []}
          hedgePools={userHedgePools}
          userTransactions={userTransactions || []}
        />
      </div>
    </div>
  )
}
