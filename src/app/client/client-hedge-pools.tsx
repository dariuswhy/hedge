'use client'

import { useState } from 'react'
import { Layers, ArrowUpDown, ShieldCheck, TrendingUp, PieChart, Users } from 'lucide-react'
import { HedgePool, HedgePoolMember } from '@/lib/hedge-pools'

interface ClientHedgePoolsProps {
  pools: HedgePool[]
  currentUserId: string
}

export default function ClientHedgePools({ pools, currentUserId }: ClientHedgePoolsProps) {
  const [selectedPoolId, setSelectedPoolId] = useState<string>(pools[0]?.id || '')
  const [sortCoInvestorsBy, setSortCoInvestorsBy] = useState<'share' | 'current' | 'name'>('share')

  const activePool = pools.find(p => p.id === selectedPoolId) || pools[0]

  // Find user's member row in active pool
  const userMember = activePool?.members?.find(m => m.user_id === currentUserId) || activePool?.members?.[0]

  const userSharePct = Number(userMember?.split_percentage || 25)
  const userAllocated = Number(userMember?.allocated_amount || 50000)
  const userCurrentVal = Number(userMember?.current_member_value || 62500)
  const userProfit = userCurrentVal - userAllocated
  const userRoiPct = userAllocated > 0 ? (userProfit / userAllocated) * 100 : 0

  // Sorted co-investor list (anonymized or full depending on preference)
  const sortedMembers = activePool?.members ? [...activePool.members].sort((a, b) => {
    let valA = 0
    let valB = 0
    if (sortCoInvestorsBy === 'share') {
      valA = Number(a.split_percentage)
      valB = Number(b.split_percentage)
    } else if (sortCoInvestorsBy === 'current') {
      valA = Number(a.current_member_value)
      valB = Number(b.current_member_value)
    } else if (sortCoInvestorsBy === 'name') {
      const nameA = a.profile?.full_name || 'Investor'
      const nameB = b.profile?.full_name || 'Investor'
      return nameA.localeCompare(nameB)
    }
    return valB - valA
  }) : []

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-5 h-5 text-blue-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-300">Pooled Holdings Breakdown</span>
        </div>
        <h2 className="text-3xl font-light tracking-tight text-white">My Pooled Hedges & Split Allocations</h2>
        <p className="text-gray-400 text-sm mt-1">
          Detailed breakdown of hedge accounts you participate in, your fractional split share, and fund-level performance metrics.
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
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-mono">
                  {Number(m?.split_percentage || 25).toFixed(1)}% Share
                </span>
              </div>
              <div className="text-sm font-semibold text-white">
                ${Number(m?.current_member_value || 0).toLocaleString()}
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
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                {activePool.strategy}
              </span>
              <h3 className="text-2xl font-bold text-white mt-2">{activePool.name}</h3>
              <p className="text-gray-400 text-sm mt-1">{activePool.description}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400 block uppercase font-semibold">Target Yield</span>
              <span className="text-2xl font-bold text-emerald-400">{activePool.target_return}</span>
            </div>
          </div>

          {/* User's Split Ownership Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">My Split Share</span>
              <span className="text-3xl font-bold text-blue-400 font-mono">
                {userSharePct.toFixed(1)}%
              </span>
              <span className="text-[10px] text-gray-500 block mt-1">of ${Number(activePool.current_value).toLocaleString()} Pool</span>
            </div>

            <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">My Position Value</span>
              <span className="text-3xl font-bold text-white font-mono">
                ${userCurrentVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">My Allocated Capital</span>
              <span className="text-3xl font-bold text-gray-300 font-mono">
                ${userAllocated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">My Net Profit</span>
              <span className={`text-3xl font-bold font-mono ${userProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {userProfit >= 0 ? '+' : ''}${userProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-xs ml-1 font-normal">({userRoiPct.toFixed(1)}%)</span>
              </span>
            </div>
          </div>

          {/* Co-Investors Split Ranking */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  Pool Co-Investor Split Structure
                </h4>
                <p className="text-xs text-gray-400">
                  Transparency overview of investor capital splits in this hedge pool.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-400 flex items-center gap-1">
                  <ArrowUpDown className="w-3.5 h-3.5" /> Sort By:
                </span>
                <select
                  value={sortCoInvestorsBy}
                  onChange={(e) => setSortCoInvestorsBy(e.target.value as any)}
                  className="bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="share">Ownership Split %</option>
                  <option value="current">Holding Value ($)</option>
                  <option value="name">Investor Name</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/30">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider font-semibold border-b border-white/10">
                  <tr>
                    <th className="py-3.5 px-4">Investor</th>
                    <th className="py-3.5 px-4">Split Share %</th>
                    <th className="py-3.5 px-4">Allocated Principal</th>
                    <th className="py-3.5 px-4">Current Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-gray-200">
                  {sortedMembers.map((m) => {
                    const isYou = m.user_id === currentUserId
                    const pct = Number(m.split_percentage)
                    const currentVal = Number(m.current_member_value)
                    const allocated = Number(m.allocated_amount)
                    return (
                      <tr key={m.id} className={`hover:bg-white/5 transition-colors ${isYou ? 'bg-blue-900/20' : ''}`}>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                              isYou ? 'bg-blue-500 text-white shadow-lg' : 'bg-white/10 text-gray-300'
                            }`}>
                              {isYou ? 'YOU' : (m.profile?.full_name || 'I')[0]}
                            </div>
                            <div>
                              <span className="font-semibold text-white flex items-center gap-2">
                                {isYou ? `${m.profile?.full_name || 'You'} (Your Account)` : (m.profile?.full_name || 'Verified Co-Investor')}
                                {isYou && <span className="px-2 py-0.5 rounded-full text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/30">Primary</span>}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-mono font-bold text-blue-400">
                          {pct.toFixed(1)}%
                        </td>
                        <td className="py-4 px-4 font-mono text-gray-300">
                          ${allocated.toLocaleString()}
                        </td>
                        <td className="py-4 px-4 font-mono font-bold text-white">
                          ${currentVal.toLocaleString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
