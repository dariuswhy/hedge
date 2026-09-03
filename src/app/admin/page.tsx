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
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  const supabaseAdmin = createAdminClient()

  const isAdminEmail = user.email?.toLowerCase().includes('darius') ||
                       user.email?.toLowerCase().includes('dionica') ||
                       user.email?.toLowerCase().includes('admin') ||
                       user.email === 'daudionica@gmail.com' ||
                       user.email === 'darius.neagu27@gmail.com'

  if (isAdminEmail && profile?.role !== 'admin') {
    await supabaseAdmin.from('profiles').upsert({
      id: user.id,
      email: user.email,
      role: 'admin',
      full_name: profile?.full_name || 'Darius (Admin)'
    })
  }

  const isAdmin = profile?.role === 'admin' || isAdminEmail

  if (!isAdmin) {
    redirect('/client')
  }

  // 1. Fetch Clients using Admin client (all profiles so Admin can also be an investor/client!)
  const { data: clients } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, email, role')

  // 2. Fetch Capital per client (latest snapshot per client)
  const { data: capitalRows } = await supabaseAdmin
    .from('invested_capital')
    .select('user_id, amount_invested, created_at')
    .order('created_at', { ascending: false })

  // 3. Fetch Ledger per client
  const { data: ledgerRows } = await supabaseAdmin
    .from('ledger')
    .select('user_id, current_value, created_at')
    .order('created_at', { ascending: false })

  // Calculate latest capital & latest balance per client
  const userCapitalMap = new Map<string, number>()
  if (capitalRows) {
    for (const c of capitalRows) {
      if (!userCapitalMap.has(c.user_id)) {
        userCapitalMap.set(c.user_id, Number(c.amount_invested))
      }
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

  // 4. Fetch Multi-Investor Hedge Pools using Admin client
  const hedgePools = await fetchAllHedgePoolsWithClient(supabaseAdmin)

  // 5. Fetch Recent Transactions Log using Admin client (shows all transactions across clients)
  const { data: transactions } = await supabaseAdmin
    .from('transactions')
    .select('*, profile:profiles(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(60)

  // 6. Fetch Pending Reset & Onboarding Requests using Admin Client
  const { data: resetRequests } = await supabaseAdmin
    .from('reset_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(30)

  // 7. Calculate Founders Profit Pocket from all profit cuts (type: 'fee')
  const profitCutTransactions = (transactions || [])
    .filter((t: any) => (t.type || '').toLowerCase() === 'fee')
    .map((t: any) => ({
      id: t.id,
      created_at: t.created_at,
      type: t.type,
      amount: Math.abs(Number(t.amount || 0)),
      user_name: t.profile?.full_name || t.profile?.email || 'Fund Client',
      user_email: t.profile?.email || ''
    }))

  const profitPocketBalance = profitCutTransactions.reduce((acc, t) => acc + t.amount, 0)

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
              Admin Privilege Active (Darius & Dionica)
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
          profitPocketBalance={profitPocketBalance}
          profitCutTransactions={profitCutTransactions}
        />
      </div>
    </div>
  )
}
