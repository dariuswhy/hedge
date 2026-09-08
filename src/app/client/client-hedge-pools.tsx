'use client'

import { useState } from 'react'
import { Layers, ShieldCheck, TrendingUp, Activity, CheckCircle2 } from 'lucide-react'
import { HedgePool } from '@/lib/hedge-pools'

interface ClientHedgePoolsProps {
  pools: HedgePool[]
  currentUserId: string
}

export default function ClientHedgePools({ pools, currentUserId }: ClientHedgePoolsProps) {
  const [selectedPoolId, setSelectedPoolId] = useState<string>(pools[0]?.id || '')

  const activePool = pools.find(p => p.id === selectedPoolId) || pools[0]

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

            {(!activePool.trades || activePool.trades.length === 0) ? (
              <div className="p-8 text-center bg-black/30 rounded-2xl border border-dashed border-white/10 space-y-2">
                <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-sm text-gray-300 font-medium">Fund Capital Fully Deployed & Hedged</p>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  Positions are systematically rebalanced according to the {activePool.strategy} strategy mandate.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/30">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 text-gray-400 uppercase tracking-wider font-semibold border-b border-white/10">
                    <tr>
                      <th className="py-3 px-4">Asset</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Entry / Exit</th>
                      <th className="py-3 px-4">Realized PnL</th>
                      <th className="py-3 px-4">Strategy Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-200 font-mono">
                    {activePool.trades.map((t) => {
                      const isProfit = t.pnl_amount >= 0
                      return (
                        <tr key={t.id} className="hover:bg-white/5">
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
                          <td className="py-3 px-4 font-sans text-gray-400 truncate max-w-[240px]">
                            {t.notes || '-'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
