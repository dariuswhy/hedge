import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import AdminTabs from './admin-tabs'
import { fetchAllHedgePoolsWithClient } from '@/lib/hedge-pools'
import { ShieldAlert } from 'lucide-react'

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/client')
  }

  // 1. Fetch Clients (all profiles so Admin can also be an investor/client!)
  const { data: clients } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')

  // 2. Fetch Capital per client
  const { data: capitalRows } = await supabase
    .from('invested_capital')
    .select('user_id, amount_invested')

  // 3. Fetch Ledger per client
  const { data: ledgerRows } = await supabase
    .from('ledger')
    .select('user_id, current_value, created_at')
    .order('created_at', { ascending: false })

  // Calculate capital & latest balance per client
  const userCapitalMap = new Map<string, number>()
  if (capitalRows) {
    for (const c of capitalRows) {
      const prev = userCapitalMap.get(c.user_id) || 0
      userCapitalMap.set(c.user_id, prev + Number(c.amount_invested))
    }
  }

  const userBalanceMap = new Map<string, number>()
  if (ledgerRows) {
    for (const l of ledgerRows) {
      if (!userBalanceMap.has(l.user_id)) {
        userBalanceMap.set(l.user_id, Number(l.current_value))
      }
    }
  }

  let totalFundValue = 0
  let totalInvestedCapital = 0

  userBalanceMap.forEach((val) => { totalFundValue += val })
  userCapitalMap.forEach((val) => { totalInvestedCapital += val })

  const enrichedClients = (clients || []).map((c) => ({
    id: c.id,
    full_name: c.full_name,
    email: c.email,
    totalInvested: userCapitalMap.get(c.id) || 0,
    currentBalance: userBalanceMap.get(c.id) || (userCapitalMap.get(c.id) || 0)
  }))

  // 4. Fetch Multi-Investor Hedge Pools
  const hedgePools = await fetchAllHedgePoolsWithClient(supabase)

  // 5. Fetch Recent Transactions Log
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*, profile:profiles(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(25)

  // 6. Fetch Pending Reset & Onboarding Requests using Admin Client
  const adminSupabase = createAdminClient()
  const { data: resetRequests } = await adminSupabase
    .from('reset_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(30)

  const formattedTransactions = (transactions || []).map((t: any) => ({
    id: t.id,
    created_at: t.created_at,
    type: t.type,
    amount: t.amount,
    user_name: t.profile?.full_name || t.profile?.email || t.user_id
  }))

  return (
    <div className="min-h-screen bg-[#030712] text-white pt-28 pb-16 px-4 sm:px-8">
      <div className="max-w-[1650px] mx-auto space-y-10">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
              <span className="text-xs font-semibold text-purple-400 tracking-widest uppercase">
                Admin Command Center
              </span>
            </div>
            <h1 className="text-4xl font-light tracking-tight text-white">Institutional Oversight</h1>
            <p className="text-gray-400 mt-1 text-base">
              Manage client accounts, pooled hedge funds, client search, and master financial ledgers.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="glass px-5 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 text-purple-200 border border-purple-500/30">
              <ShieldAlert className="w-4 h-4 text-purple-400" />
              Admin Privilege Active
            </div>
          </div>
        </header>

        {/* Tabbed Navigation Container */}
        <AdminTabs
          clients={enrichedClients}
          totalFundValue={totalFundValue || 0}
          totalInvestedCapital={totalInvestedCapital || 0}
          hedgePools={hedgePools}
          recentTransactions={formattedTransactions}
          resetRequests={resetRequests || []}
        />
      </div>
    </div>
  )
}
