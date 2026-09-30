import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft,
  User,
  Activity,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Scissors,
  Trash2,
  Coins,
  Wallet,
  Crown,
  ShieldCheck,
  Layers
} from 'lucide-react'
import { TransactionForm } from './transaction-form'
import { deleteClientAccount } from '@/app/admin/actions'

export default async function ClientDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const clientId = params.id
  const supabase = await createClient()

  // Ensure Admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdminEmail = user.email?.toLowerCase().includes('darius') ||
                       user.email?.toLowerCase().includes('dionica') ||
                       user.email?.toLowerCase().includes('admin') ||
                       user.email === 'daudionica@gmail.com' ||
                       user.email === 'darius.neagu27@gmail.com'

  if (profile?.role !== 'admin' && !isAdminEmail) redirect('/client')

  const supabaseAdmin = createAdminClient()

  // Fetch client details
  const { data: client } = await supabaseAdmin.from('profiles').select('*').eq('id', clientId).single()
  if (!client) redirect('/admin')

  const isPocket = client.email?.toLowerCase().includes('pocket') || client.full_name?.toLowerCase().includes('pocket')

  // Fetch ledger for current value
  const { data: ledgerData } = await supabaseAdmin
    .from('ledger')
    .select('current_value')
    .eq('user_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1)

  const currentValue = ledgerData && ledgerData.length > 0 ? Number(ledgerData[0].current_value) : 0

  // Fetch invested capital
  const { data: investedData } = await supabaseAdmin
    .from('invested_capital')
    .select('amount_invested')
    .eq('user_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1)
    
  const investedCapital = investedData && investedData.length > 0 ? Number(investedData[0].amount_invested) : 0

  // If isPocket, calculate true liquid balance + pool equity + total paid out to ourselves
  let pocketLiquidBalance = 0
  let pocketPoolValue = 0
  let pocketAllocatedInPools = 0
  let pocketPaidOutToOurselves = 0

  if (isPocket) {
    const { data: allPocketTxs } = await supabaseAdmin
      .from('transactions')
      .select('type, amount')
      .in('type', ['fee', 'pocket_payout', 'pocket_reinvest', 'FEE', 'POCKET_PAYOUT', 'POCKET_REINVEST'])

    const inflow = (allPocketTxs || []).filter(t => (t.type || '').toLowerCase() === 'fee').reduce((acc, t) => acc + Math.abs(Number(t.amount || 0)), 0)
    const outflow = (allPocketTxs || []).filter(t => ['pocket_payout', 'pocket_reinvest'].includes((t.type || '').toLowerCase())).reduce((acc, t) => acc + Math.abs(Number(t.amount || 0)), 0)
    pocketLiquidBalance = Math.round(Math.max(0, inflow - outflow) * 100) / 100
    pocketPaidOutToOurselves = (allPocketTxs || []).filter(t => (t.type || '').toLowerCase() === 'pocket_payout').reduce((acc, t) => acc + Math.abs(Number(t.amount || 0)), 0)

    const { data: poolMemberships } = await supabaseAdmin
      .from('hedge_pool_members')
      .select('allocated_amount, current_member_value')
      .eq('user_id', clientId)

    if (poolMemberships) {
      for (const m of poolMemberships) {
        pocketAllocatedInPools += Number(m.allocated_amount || 0)
        pocketPoolValue += Number(m.current_member_value || 0)
      }
    }
  }

  const effectiveCurrentValue = isPocket ? Math.round((pocketLiquidBalance + pocketPoolValue) * 100) / 100 : currentValue
  const effectiveInvestedCapital = isPocket ? (pocketAllocatedInPools + pocketLiquidBalance) : investedCapital
  const roi = effectiveInvestedCapital > 0 ? ((effectiveCurrentValue - effectiveInvestedCapital) / effectiveInvestedCapital) * 100 : 0
  const isPositive = roi >= 0

  // Fetch transactions using admin client (bypasses RLS so admin sees all transactions)
  let transactions: any[] = []
  const { data: txData, error: txError } = await supabaseAdmin
    .from('transactions')
    .select('*')
    .eq('user_id', clientId)
    .order('created_at', { ascending: false })
    .limit(25)
    
  if (!txError && txData) {
      transactions = txData
  }

  // Delete handler server action wrapper
  const handleDeleteClient = async () => {
    'use server'
    if (isPocket) return
    await deleteClientAccount(clientId)
    redirect('/admin')
  }

  return (
    <div className="min-h-screen bg-[#030712] text-white pt-28 pb-12 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Admin Command Center
        </Link>

        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div className="flex items-center gap-6">
             <div className={`w-20 h-20 rounded-3xl border flex items-center justify-center font-bold text-2xl ${
               isPocket 
                 ? 'bg-gradient-to-tr from-purple-500/30 to-amber-500/20 border-purple-500/30 text-purple-300 shadow-lg shadow-purple-500/10'
                 : 'bg-gradient-to-tr from-blue-500/20 to-purple-500/20 border-white/10 text-blue-400'
             }`}>
                {isPocket ? <Crown className="w-9 h-9 text-purple-400" /> : (client.full_name || client.email || 'C')[0].toUpperCase()}
             </div>
             <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-light tracking-tight">{isPocket ? 'Founders Profit Pocket' : (client.full_name || 'Unnamed Investor')}</h1>
                  {isPocket && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-purple-500/20 border border-purple-500/40 text-purple-300">
                      Treasury Vault
                    </span>
                  )}
                </div>
                <p className="text-gray-400 mt-1 text-base font-mono">{client.email}</p>
             </div>
          </div>

          {isPocket ? (
            <Link
              href="/admin?tab=pocket"
              className="px-5 py-2.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-purple-500/10"
            >
              <Crown className="w-4 h-4 text-purple-400" />
              Open Profit Pocket Hub
            </Link>
          ) : (
            <form action={handleDeleteClient}>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 text-xs font-semibold flex items-center gap-2 transition-all shadow-lg"
              >
                <Trash2 className="w-4 h-4" />
                Delete Client Account
              </button>
            </form>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Stats Overview */}
           <div className="lg:col-span-2 space-y-6">
              {isPocket ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {/* Total Pocket Worth */}
                   <div className="glass-card rounded-3xl p-6 relative overflow-hidden group bg-gradient-to-br from-purple-950/20 to-black/40 border border-purple-500/20">
                      <div className="absolute top-0 right-0 p-5 opacity-10 group-hover:scale-110 transition-transform">
                         <Crown className="w-24 h-24 text-purple-400" />
                      </div>
                      <p className="text-purple-300 text-xs font-semibold uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Crown className="w-3.5 h-3.5 text-purple-400" />
                        Total Pocket Worth (Liquid + Pools)
                      </p>
                      <p className="text-3xl md:text-4xl font-bold text-white tracking-tight font-mono">
                         ${effectiveCurrentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-purple-300/70 mt-2 font-mono">
                        Vault Cash (${pocketLiquidBalance.toLocaleString()}) + Pool Equity (${pocketPoolValue.toLocaleString()})
                      </p>
                   </div>

                   {/* Paid Out to Ourselves */}
                   <div className="glass-card rounded-3xl p-6 relative overflow-hidden group bg-gradient-to-br from-amber-950/20 to-black/40 border border-amber-500/20">
                      <div className="absolute top-0 right-0 p-5 opacity-10 group-hover:scale-110 transition-transform">
                         <Coins className="w-24 h-24 text-amber-400" />
                      </div>
                      <p className="text-amber-300 text-xs font-semibold uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                        Paid Out to Ourselves
                      </p>
                      <p className="text-3xl md:text-4xl font-bold text-amber-400 tracking-tight font-mono">
                         ${pocketPaidOutToOurselves.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-amber-300/70 mt-2 font-mono">
                        Distributed to founders via Profit Pocket payouts
                      </p>
                   </div>

                   {/* Liquid Vault Cash */}
                   <div className="glass-card rounded-3xl p-6 relative overflow-hidden group border border-blue-500/20">
                      <div className="absolute top-0 right-0 p-5 opacity-10 group-hover:scale-110 transition-transform">
                         <Wallet className="w-24 h-24 text-blue-400" />
                      </div>
                      <p className="text-blue-300 text-xs font-semibold uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Wallet className="w-3.5 h-3.5 text-blue-400" />
                        Liquid Vault Reserve
                      </p>
                      <p className="text-2xl md:text-3xl font-bold text-blue-400 tracking-tight font-mono">
                         ${pocketLiquidBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">Available for payout or pool injection</p>
                   </div>

                   {/* Active Equity in Pools */}
                   <div className="glass-card rounded-3xl p-6 relative overflow-hidden group border border-emerald-500/20">
                      <div className="absolute top-0 right-0 p-5 opacity-10 group-hover:scale-110 transition-transform">
                         <Layers className="w-24 h-24 text-emerald-400" />
                      </div>
                      <p className="text-emerald-300 text-xs font-semibold uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-emerald-400" />
                        Active Capital in Pools
                      </p>
                      <p className="text-2xl md:text-3xl font-bold text-emerald-400 tracking-tight font-mono">
                         ${pocketPoolValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">Cost basis: ${pocketAllocatedInPools.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                   </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {/* Current Value */}
                   <div className="glass-card rounded-3xl p-8 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-500">
                         <DollarSign className="w-32 h-32 text-blue-400" />
                      </div>
                      <p className="text-blue-300 text-xs font-semibold uppercase tracking-widest mb-3">Current Total Value</p>
                      <p className="text-4xl md:text-5xl font-bold text-white tracking-tight font-mono">
                         ${currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                   </div>

                   {/* ROI */}
                   <div className="glass-card rounded-3xl p-8 flex flex-col justify-between">
                      <div>
                         <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-3">Total Return (ROI)</p>
                         <div className="flex items-center gap-4">
                            <p className={`text-4xl font-bold tracking-tight font-mono ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                               {isPositive ? '+' : ''}{roi.toFixed(2)}%
                            </p>
                            <div className={`p-2 rounded-xl ${isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                               {isPositive ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                            </div>
                         </div>
                      </div>
                      <div className="mt-8 text-xs text-gray-500 font-mono">
                         Based on net invested capital of ${investedCapital.toLocaleString()}
                      </div>
                   </div>
                </div>
              )}

              {/* Transaction History */}
              <div className="glass-card rounded-3xl p-8 space-y-4">
                 <h3 className="text-2xl font-light flex items-center gap-3 text-white">
                    <Activity className="w-6 h-6 text-blue-400" />
                    Account Transaction Ledger
                 </h3>

                 {transactions.length > 0 ? (
                    <div className="space-y-3">
                       {transactions.map(tx => (
                          <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                             <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${
                                   tx.type === 'deposit' ? 'bg-emerald-500/20 text-emerald-400' : 
                                   tx.type === 'withdrawal' ? 'bg-red-500/20 text-red-400' : 
                                   'bg-purple-500/20 text-purple-400'
                                }`}>
                                   {tx.type === 'deposit' ? <TrendingUp className="w-5 h-5" /> : 
                                    tx.type === 'withdrawal' ? <TrendingDown className="w-5 h-5" /> : 
                                    <Scissors className="w-5 h-5" />}
                                </div>
                                <div>
                                   <p className="font-medium text-white capitalize">{tx.type}</p>
                                   <p className="text-xs text-gray-500 font-mono">{new Date(tx.created_at).toLocaleString()}</p>
                                </div>
                             </div>
                             <div className={`font-mono font-bold ${
                                tx.type === 'deposit' ? 'text-emerald-400' : 'text-white'
                             }`}>
                                {tx.type === 'deposit' ? '+' : '-'}${Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                             </div>
                          </div>
                       ))}
                    </div>
                 ) : (
                    <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
                       <p className="text-gray-500 text-sm">No recorded transaction log entries yet.</p>
                    </div>
                 )}
              </div>
           </div>

           {/* Action Panel */}
           <div className="lg:col-span-1">
              <TransactionForm userId={clientId} />
           </div>
        </div>

      </div>
    </div>
  )
}
