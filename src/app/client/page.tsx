import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClientChart from './client-chart'
import { Wallet, TrendingUp, ArrowRightCircle } from 'lucide-react'

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

  // Admins going to /client should probably be allowed, but we can keep them out or let them test.
  // For now, let admins see it if they want, or redirect them.
  if (profile?.role === 'admin') {
    // If we want admins to test client view, we shouldn't redirect.
    // redirect('/admin')
  }

  // 1. Fetch Total Invested Capital
  const { data: capitalData } = await supabase
    .from('invested_capital')
    .select('amount_invested')
    .eq('user_id', user.id)

  const totalInvested = capitalData?.reduce((acc, curr) => acc + Number(curr.amount_invested), 0) || 0

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

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="mb-12">
          <h1 className="text-3xl font-light tracking-tight">Welcome back, {profile?.full_name}</h1>
          <p className="text-gray-400 mt-1">Here is your portfolio overview.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-900/40 to-blue-900/10 border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Wallet className="w-24 h-24" />
            </div>
            <p className="text-blue-200 text-sm font-medium uppercase tracking-wider mb-2">Current Balance</p>
            <p className="text-4xl font-semibold text-white">
              ${currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-card/40 border border-white/5 rounded-2xl p-6">
            <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Total Invested</p>
            <p className="text-3xl font-light text-white">
              ${totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-card/40 border border-white/5 rounded-2xl p-6">
            <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">All-Time ROI</p>
            <div className="flex items-baseline gap-3">
              <p className={`text-3xl font-light ${allTimeRoi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${Math.abs(allTimeRoi).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <div className={`flex items-center text-sm font-medium ${allTimeRoi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {allTimeRoi >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingUp className="w-4 h-4 mr-1 rotate-180" />}
                {allTimeRoi >= 0 ? '+' : '-'}{Math.abs(roiPercentage).toFixed(2)}%
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-xl font-medium mb-4">Performance History</h2>
          <ClientChart data={ledgerData || []} />
        </div>
      </div>
    </div>
  )
}
