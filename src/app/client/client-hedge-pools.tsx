'use client'

import { useState, useEffect } from 'react'
import { Layers, ShieldCheck, TrendingUp, Activity, CheckCircle2, Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { HedgePool } from '@/lib/hedge-pools'

interface ClientHedgePoolsProps {
  pools: HedgePool[]
  currentUserId: string
}

export default function ClientHedgePools({ pools, currentUserId }: ClientHedgePoolsProps) {
  const [selectedPoolId, setSelectedPoolId] = useState<string>(pools[0]?.id || '')
  const [tradeSearch, setTradeSearch] = useState('')
  const [tradeFilterType, setTradeFilterType] = useState<'ALL' | 'TRADES' | 'PROFIT_CUTS' | 'WINS' | 'LOSSES'>('ALL')
  const [tradeDateFilter, setTradeDateFilter] = useState<'ALL' | 'TODAY' | '7DAYS' | '30DAYS' | 'MONTH'>('ALL')
  const [tradeCurrentPage, setTradeCurrentPage] = useState(1)
  const pageSize = 12

  const activePool = pools.find(p => p.id === selectedPoolId) || pools[0]

  useEffect(() => {
    setTradeCurrentPage(1)
  }, [tradeSearch, tradeFilterType, tradeDateFilter, selectedPoolId])

  const allTrades = activePool?.trades || []
  const filteredTrades = allTrades.filter((t) => {
    if (tradeSearch.trim()) {
      const q = tradeSearch.toLowerCase().trim()
      const symbolMatch = (t.asset_symbol || '').toLowerCase().includes(q)
      const typeMatch = (t.trade_type || '').toLowerCase().includes(q)
      const notesMatch = (t.notes || '').toLowerCase().includes(q)
      if (!symbolMatch && !typeMatch && !notesMatch) return false
    }

    const isProfitCut = t.asset_symbol?.includes('PROFIT_CUT') || t.notes?.toLowerCase().includes('profit cut')
    const isWin = Number(t.pnl_amount) > 0
    const isLoss = Number(t.pnl_amount) < 0

    if (tradeFilterType === 'TRADES' && isProfitCut) return false
    if (tradeFilterType === 'PROFIT_CUTS' && !isProfitCut) return false
    if (tradeFilterType === 'WINS' && !isWin) return false
    if (tradeFilterType === 'LOSSES' && !isLoss) return false

    if (tradeDateFilter !== 'ALL' && t.created_at) {
      const tradeDate = new Date(t.created_at)
      const now = new Date()
      if (tradeDateFilter === 'TODAY' && tradeDate.toDateString() !== now.toDateString()) return false
      if (tradeDateFilter === '7DAYS' && (now.getTime() - tradeDate.getTime()) / (1000 * 3600 * 24) > 7) return false
      if (tradeDateFilter === '30DAYS' && (now.getTime() - tradeDate.getTime()) / (1000 * 3600 * 24) > 30) return false
      if (tradeDateFilter === 'MONTH' && (tradeDate.getMonth() !== now.getMonth() || tradeDate.getFullYear() !== now.getFullYear())) return false
    }

    return true
  })

  const totalPages = Math.max(1, Math.ceil(filteredTrades.length / pageSize))
  const paginatedTrades = filteredTrades.slice((tradeCurrentPage - 1) * pageSize, tradeCurrentPage * pageSize)

  // Find user's member row in active pool
  const userMember = activePool?.members?.find(m => m.user_id === currentUserId) || activePool?.members?.[0]

  const userAllocated = Number(userMember?.allocated_amount || 0)
  const userCurrentVal = Number(userMember?.current_member_value || 0)
  const userProfit = userCurrentVal - userAllocated
  const userRoiPct = userAllocated > 0 ? (userProfit / userAllocated) * 100 : 0

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-5 h-5 text-blue-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-300">Pooled Holdings Breakdown</span>
        </div>
        <h2 className="text-3xl font-light tracking-tight text-white">My Pooled Hedge Allocations</h2>
        <p className="text-gray-400 text-sm mt-1">
          Detailed performance metrics of the hedge accounts you participate in and live trade allocations.
        </p>
      </div>

      {/* Pool Selector Tabs */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 border-b border-white/10">
        {pools.map((p) => {
          const isSelected = p.id === activePool?.id
          const m = p.members?.find(mem => mem.user_id === currentUserId) || p.members?.[0]
          return (
            <button
              key={p.id}
              onClick={() => setSelectedPoolId(p.id)}
              className={`px-5 py-3 rounded-2xl text-left transition-all min-w-[220px] border ${
                isSelected
                  ? 'bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.25)]'
                  : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className={`text-xs font-bold truncate ${isSelected ? 'text-blue-300' : 'text-white'}`}>
                  {p.name}
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Active
                </span>
              </div>
              <div className="text-sm font-semibold text-white font-mono">
                ${Number(m?.current_member_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </button>
          )
        })}
      </div>

      {activePool && (
        <div className="glass-card rounded-3xl p-8 space-y-8">
          {/* Header Card */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  {activePool.strategy}
                </span>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  Status: {activePool.status}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white mt-2">{activePool.name}</h3>
              <p className="text-gray-400 text-sm mt-1">{activePool.description}</p>
            </div>
            <div className="text-left md:text-right">
              <span className="text-xs text-gray-400 block uppercase font-semibold">Target Fund Yield</span>
              <span className="text-2xl font-bold text-emerald-400">{activePool.target_return}</span>
            </div>
          </div>

          {/* User's Personal Performance Highlights (No Fund Total Or % Split Excluded) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">My Position Value</span>
              <span className="text-2xl font-bold text-white font-mono">
                ${userCurrentVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-emerald-400 block mt-1">Live Marked-to-Market</span>
            </div>

            <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">My Allocated Principal</span>
              <span className="text-2xl font-bold text-gray-300 font-mono">
                ${userAllocated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-gray-500 block mt-1">Dedicated Invested Capital</span>
            </div>

            <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">My Net Profit</span>
              <span className={`text-2xl font-bold font-mono ${userProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {userProfit >= 0 ? '+' : ''}${userProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-gray-500 block mt-1">Cumulative Generated Gain</span>
            </div>

            <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">My Return on Investment</span>
              <span className={`text-2xl font-bold font-mono ${userRoiPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {userRoiPct >= 0 ? '+' : ''}{userRoiPct.toFixed(2)}%
              </span>
              <span className="text-[10px] text-gray-500 block mt-1">Net Realized ROI</span>
            </div>
          </div>

          {/* Active Fund Trades & Execution Log */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-400" />
                  Active Trades & Execution Log
                </h4>
                <p className="text-xs text-gray-400">
                  Real-time audit log of active positions and trade executions managed by fund managers.
                </p>
              </div>
            </div>

            {allTrades.length > 0 && (
              <div className="space-y-3 p-3.5 bg-black/40 rounded-2xl border border-white/10">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search trade by asset, strategy or note..."
                      value={tradeSearch}
                      onChange={(e) => setTradeSearch(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl pl-8 pr-7 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                    {tradeSearch && (
                      <button onClick={() => setTradeSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs">✕</button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                    {[
                      { id: 'ALL', label: 'All' },
                      { id: 'TRADES', label: 'Trades' },
                      { id: 'WINS', label: 'Wins' },
                      { id: 'LOSSES', label: 'Losses' }
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setTradeFilterType(f.id as any)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                          tradeFilterType === f.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-white/5 text-gray-400 hover:text-white'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {(!activePool.trades || activePool.trades.length === 0) ? (
              <div className="p-8 text-center bg-black/30 rounded-2xl border border-dashed border-white/10 space-y-2">
                <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-sm text-gray-300 font-medium">Fund Capital Fully Deployed & Hedged</p>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  Positions are systematically rebalanced according to the {activePool.strategy} strategy mandate.
                </p>
              </div>
            ) : filteredTrades.length === 0 ? (
              <div className="p-8 text-center bg-black/30 rounded-2xl border border-dashed border-white/10 text-gray-400 text-xs">
                No matching trade executions found.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/30">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/5 text-gray-400 uppercase tracking-wider font-semibold border-b border-white/10">
                      <tr>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Asset</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Entry / Exit</th>
                        <th className="py-3 px-4">Realized PnL</th>
                        <th className="py-3 px-4">Strategy Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-200 font-mono">
                      {paginatedTrades.map((t) => {
                        const isProfit = Number(t.pnl_amount) >= 0
                        return (
                          <tr key={t.id} className="hover:bg-white/5 transition-colors">
                            <td className="py-3 px-4 text-gray-400 whitespace-nowrap text-[11px]">
                              {t.created_at ? new Date(t.created_at).toLocaleDateString() : 'Recent'}
                            </td>
                            <td className="py-3 px-4 font-bold text-white">
                              {t.asset_symbol}
                            </td>
                            <td className="py-3 px-4 font-sans">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                t.trade_type === 'BUY_LONG'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : t.trade_type === 'PROFIT_TAKE'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}>
                                {t.trade_type}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-400">
                              {t.entry_price ? `$${Number(t.entry_price).toFixed(2)}` : '-'} / {t.exit_price ? `$${Number(t.exit_price).toFixed(2)}` : '-'}
                            </td>
                            <td className={`py-3 px-4 font-bold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                              {isProfit ? '+' : ''}${Number(t.pnl_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-4 font-sans text-gray-400 truncate max-w-[240px]" title={t.notes || ''}>
                              {t.notes || '-'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between text-xs text-gray-400 pt-2 px-1">
                    <span>Page {tradeCurrentPage} of {totalPages} ({filteredTrades.length} records)</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setTradeCurrentPage(p => Math.max(1, p - 1))}
                        disabled={tradeCurrentPage === 1}
                        className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30"
                      >
                        Prev
                      </button>
                      <button
                        onClick={() => setTradeCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={tradeCurrentPage === totalPages}
                        className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
