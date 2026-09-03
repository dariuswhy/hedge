'use client'

import { useState } from 'react'
import {
  Layers,
  Plus,
  Users,
  DollarSign,
  TrendingUp,
  ArrowUpDown,
  RefreshCw,
  Sparkles,
  ChevronRight,
  TrendingDown,
  Activity,
  FileSpreadsheet,
  Check,
  AlertTriangle,
  Trash2
} from 'lucide-react'
import { HedgePool, HedgePoolMember, getUnallocatedFreeCapital } from '@/lib/hedge-pools'
import {
  createHedgePoolAction,
  addMembersToHedgePoolAction,
  updateHedgePoolValuationAction,
  addHedgePoolTradeAction,
  deleteHedgePoolAction
} from './hedge-actions'

interface ClientOption {
  id: string
  full_name: string | null
  email: string | null
  totalInvested?: number
}

interface HedgePoolsManagerProps {
  pools: HedgePool[]
  clients: ClientOption[]
}

export default function HedgePoolsManager({ pools, clients }: HedgePoolsManagerProps) {
  const [selectedPoolId, setSelectedPoolId] = useState<string>(pools[0]?.id || '')
  const [showCreatePoolModal, setShowCreatePoolModal] = useState(false)
  const [showMergeModal, setShowMergeModal] = useState(false)
  const [showValuationModal, setShowValuationModal] = useState(false)
  const [showAddTradeModal, setShowAddTradeModal] = useState(false)

  // Member sorting state inside pool
  const [memberSortBy, setMemberSortBy] = useState<'share' | 'allocated' | 'current' | 'name'>('share')
  const [memberSortOrder, setMemberSortOrder] = useState<'asc' | 'desc'>('desc')

  // Merge form state (up to 4+ clients selected with individual amounts)
  const [selectedClientAllocations, setSelectedClientAllocations] = useState<{ userId: string; amount: number | string }[]>([
    { userId: clients[0]?.id || '', amount: 25000 },
    { userId: clients[1]?.id || '', amount: 25000 },
  ])

  // Valuation state
  const [newValuationInput, setNewValuationInput] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const activePool = pools.find(p => p.id === selectedPoolId) || pools[0]

  const handleOpenMergeModal = (pool: HedgePool) => {
    setSelectedPoolId(pool.id)
    if (pool.members && pool.members.length > 0) {
      setSelectedClientAllocations(pool.members.map(m => ({ userId: m.user_id, amount: m.allocated_amount })))
    } else {
      setSelectedClientAllocations([
        { userId: clients[0]?.id || '', amount: 25000 },
        { userId: clients[1]?.id || '', amount: 25000 },
      ].filter(item => Boolean(item.userId)))
    }
    setShowMergeModal(true)
  }// Sorted member list
  const sortedMembers = activePool?.members ? [...activePool.members].sort((a, b) => {
    let valA = 0
    let valB = 0
    if (memberSortBy === 'share') {
      valA = Number(a.split_percentage)
      valB = Number(b.split_percentage)
    } else if (memberSortBy === 'allocated') {
      valA = Number(a.allocated_amount)
      valB = Number(b.allocated_amount)
    } else if (memberSortBy === 'current') {
      valA = Number(a.current_member_value)
      valB = Number(b.current_member_value)
    } else if (memberSortBy === 'name') {
      const nameA = a.profile?.full_name || a.profile?.email || ''
      const nameB = b.profile?.full_name || b.profile?.email || ''
      return memberSortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
    }
    return memberSortOrder === 'asc' ? valA - valB : valB - valA
  }) : []

  // Handlers
  const handleCreatePool = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setStatusMessage(null)
    const formData = new FormData(e.currentTarget)
    const res = await createHedgePoolAction(null, formData)
    setIsSubmitting(false)

    if (res.error) {
      setStatusMessage({ type: 'error', text: res.error })
    } else {
      setStatusMessage({ type: 'success', text: res.success || 'Hedge Pool Created!' })
      setShowCreatePoolModal(false)
    }
  }

  const handleMergeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activePool) return
    setIsSubmitting(true)
    setStatusMessage(null)

    const formData = new FormData()
    formData.append('poolId', activePool.id)
    formData.append(
      'membersJson',
      JSON.stringify(
        selectedClientAllocations
          .filter(m => m.userId && Number(m.amount || 0) > 0)
          .map(m => ({ userId: m.userId, allocatedAmount: Number(m.amount || 0) }))
      )
    )

    const res = await addMembersToHedgePoolAction(null, formData)
    setIsSubmitting(false)

    if (res.error) {
      setStatusMessage({ type: 'error', text: res.error })
    } else {
      setStatusMessage({ type: 'success', text: res.success || 'Investors Merged Successfully!' })
      setShowMergeModal(false)
    }
  }

  const handleValuationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activePool || !newValuationInput) return
    setIsSubmitting(true)
    setStatusMessage(null)

    const formData = new FormData()
    formData.append('poolId', activePool.id)
    formData.append('newValue', newValuationInput)

    const res = await updateHedgePoolValuationAction(null, formData)
    setIsSubmitting(false)

    if (res.error) {
      setStatusMessage({ type: 'error', text: res.error })
    } else {
      setStatusMessage({ type: 'success', text: res.success || 'Valuation Updated!' })
      setShowValuationModal(false)
    }
  }

  const handleAddTradeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!activePool) return
    setIsSubmitting(true)
    setStatusMessage(null)

    const formData = new FormData(e.currentTarget)
    formData.append('poolId', activePool.id)

    const res = await addHedgePoolTradeAction(null, formData)
    setIsSubmitting(false)

    if (res.error) {
      setStatusMessage({ type: 'error', text: res.error })
    } else {
      setStatusMessage({ type: 'success', text: res.success || 'Trade logged successfully!' })
      setShowAddTradeModal(false)
      setTimeout(() => window.location.reload(), 800)
    }
  }


  const handleDeletePool = async () => {
    if (!activePool) return
    if (!confirm(`Are you sure you want to permanently delete "${activePool.name}" and all associated trades and member allocations?`)) return
    setIsSubmitting(true)
    setStatusMessage(null)

    const res = await deleteHedgePoolAction(activePool.id)
    setIsSubmitting(false)
    if (res.error) {
      setStatusMessage({ type: 'error', text: res.error })
    } else {
      setStatusMessage({ type: 'success', text: res.success || 'Hedge pool deleted!' })
      setTimeout(() => window.location.reload(), 800)
    }
  }

  const addClientRow = () => {
    const unselected = clients.find(c => !selectedClientAllocations.some(a => a.userId === c.id))
    if (unselected) {
      const freeCap = getUnallocatedFreeCapital(unselected.id, pools, unselected.totalInvested || 100000).free
      setSelectedClientAllocations([...selectedClientAllocations, { userId: unselected.id, amount: Math.min(25000, freeCap || 25000) }])
    }
  }

  const removeClientRow = (index: number) => {
    if (selectedClientAllocations.length <= 1) return
    setSelectedClientAllocations(selectedClientAllocations.filter((_, i) => i !== index))
  }

  const updateClientRow = (index: number, key: 'userId' | 'amount', val: any) => {
    const copy = [...selectedClientAllocations]
    copy[index] = { ...copy[index], [key]: val }
    setSelectedClientAllocations(copy)
  }

  const mergeTotalCapital = selectedClientAllocations.reduce((acc, m) => acc + Number(m.amount || 0), 0)

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">Pooled Account & Trades Management</span>
          </div>
          <h2 className="text-3xl font-light tracking-tight text-white">Multi-Investor Hedge Funds</h2>
          <p className="text-gray-400 text-sm mt-1">
            Merge investors (e.g. 4 people) into a hedge pool, track free capital, log individual trades, and manage split holdings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowCreatePoolModal(true)}
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs shadow-lg flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Hedge Pool
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-xl text-xs font-medium border ${
          statusMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'
        }`}>
          {statusMessage.text}
        </div>
      )}

      {/* Hedge Pools Tab Pills */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 border-b border-white/10">
        {pools.map((p) => {
          const isSelected = p.id === activePool?.id
          const totalVal = Number(p.current_value || p.total_capital)
          const memberCount = p.members?.length || 0
          return (
            <button
              key={p.id}
              onClick={() => setSelectedPoolId(p.id)}
              className={`px-5 py-3 rounded-2xl text-left transition-all min-w-[220px] flex flex-col justify-between border ${
                isSelected
                  ? 'bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.25)]'
                  : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className={`text-xs font-bold truncate ${isSelected ? 'text-blue-300' : 'text-white'}`}>
                  {p.name}
                </span>
                <span className="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded-full font-mono">
                  {memberCount} Investors
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-white font-mono">
                  ${totalVal.toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold">{p.target_return}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Selected Hedge Pool Detail Card */}
      {activePool && (
        <div className="glass-card rounded-3xl p-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
            <div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  {activePool.status}
                </span>
                <span className="text-xs text-gray-400 font-mono">Strategy: {activePool.strategy}</span>
              </div>
              <h3 className="text-2xl font-bold text-white mt-2">{activePool.name}</h3>
              <p className="text-gray-400 text-sm mt-1">{activePool.description}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowAddTradeModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Log Trade on Pool
              </button>
              <button
                onClick={() => {
                  setNewValuationInput(activePool.current_value.toString())
                  setShowValuationModal(true)
                }}
                className="px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-medium flex items-center gap-2 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Update Pool Valuation
              </button>
              <button
                onClick={() => setShowMergeModal(true)}
                className="px-4 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-medium flex items-center gap-2 transition-all"
              >
                <Users className="w-3.5 h-3.5" />
                Merge Investors & Split Amounts
              </button>
              <button
                onClick={handleDeletePool}
                disabled={isSubmitting}
                className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 text-xs font-medium flex items-center gap-1.5 transition-all"
                title="Delete Hedge Pool"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Hedge
              </button>
            </div>
          </div>

          {/* Pool Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">Total Fund Valuation</span>
              <span className="text-2xl font-bold text-white font-mono">
                ${Number(activePool.current_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">Initial Merged Principal</span>
              <span className="text-2xl font-bold text-gray-300 font-mono">
                ${Number(activePool.total_capital || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">Pooled Net Profit</span>
              {(() => {
                const profit = Number(activePool.current_value || 0) - Number(activePool.total_capital || 0)
                const pct = Number(activePool.total_capital) > 0 ? (profit / Number(activePool.total_capital)) * 100 : 0
                return (
                  <span className={`text-2xl font-bold font-mono ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {profit >= 0 ? '+' : ''}${profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({pct.toFixed(1)}%)
                  </span>
                )
              })()}
            </div>
            <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">Merged Members</span>
              <span className="text-2xl font-bold text-amber-300 font-mono">
                {activePool.members?.length || 0} Investors
              </span>
            </div>
          </div>

          {/* Members Breakdown & Individual Sorting Table */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  Individual Investor Splits & Free Capital Status
                </h4>
                <p className="text-xs text-gray-400">
                  Individual ownership %, custom split amounts, and live unallocated capital per investor.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-400 flex items-center gap-1">
                  <ArrowUpDown className="w-3.5 h-3.5" /> Sort Members By:
                </span>
                <select
                  value={memberSortBy}
                  onChange={(e) => setMemberSortBy(e.target.value as any)}
                  className="bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="share">Split Percentage (%)</option>
                  <option value="allocated">Allocated Capital ($)</option>
                  <option value="current">Current Valuation ($)</option>
                  <option value="name">Member Name</option>
                </select>
                <button
                  onClick={() => setMemberSortOrder(memberSortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 font-mono"
                >
                  {memberSortOrder.toUpperCase()}
                </button>
              </div>
            </div>

            {sortedMembers.length === 0 ? (
              <div className="p-8 text-center bg-black/30 rounded-2xl border border-dashed border-white/10 space-y-3">
                <Users className="w-8 h-8 text-gray-500 mx-auto" />
                <p className="text-sm text-gray-400">No investors merged into this Hedge Account yet.</p>
                <button
                  onClick={() => setShowMergeModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-medium hover:bg-blue-500"
                >
                  Merge Investors Now
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/30">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider font-semibold border-b border-white/10">
                    <tr>
                      <th className="py-3.5 px-4">Investor</th>
                      <th className="py-3.5 px-4">Allocated Principal</th>
                      <th className="py-3.5 px-4">Ownership Split %</th>
                      <th className="py-3.5 px-4">Current Value</th>
                      <th className="py-3.5 px-4">Individual ROI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-200">
                    {sortedMembers.map((m) => {
                      const allocated = Number(m.allocated_amount)
                      const currentVal = Number(m.current_member_value)
                      const profit = currentVal - allocated
                      const roiPct = allocated > 0 ? (profit / allocated) * 100 : 0
                      return (
                        <tr key={m.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs">
                                {(m.profile?.full_name || m.profile?.email || 'I')[0].toUpperCase()}
                              </div>
                              <div>
                                <span className="font-semibold text-white block">
                                  {m.profile?.full_name || 'Verified Investor'}
                                </span>
                                <span className="text-[11px] text-gray-500">{m.profile?.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 font-mono font-medium">
                            ${allocated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-white/10 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full"
                                  style={{ width: `${Math.min(100, Number(m.split_percentage))}%` }}
                                />
                              </div>
                              <span className="font-bold text-blue-400 font-mono text-xs">
                                {Number(m.split_percentage).toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4 font-mono font-bold text-white">
                            ${currentVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`font-semibold font-mono ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {profit >= 0 ? '+' : ''}${profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              <span className="text-[10px] ml-1 font-normal">({roiPct.toFixed(1)}%)</span>
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Individual Trades Log Section */}
          <div className="space-y-4 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  Individual Trades Executed on "{activePool.name}"
                </h4>
                <p className="text-xs text-gray-400">
                  Audit log of active asset trades, positions, entry/exit prices, and realized PnL.
                </p>
              </div>
              <button
                onClick={() => setShowAddTradeModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Log Trade
              </button>
            </div>

            {(!activePool.trades || activePool.trades.length === 0) ? (
              <div className="p-6 text-center bg-black/20 rounded-2xl border border-dashed border-white/10 text-gray-400 text-xs">
                No active asset trades logged for this Hedge Pool yet.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/30">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 text-gray-400 uppercase tracking-wider font-semibold border-b border-white/10">
                    <tr>
                      <th className="py-3 px-4">Asset Symbol</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Position Size</th>
                      <th className="py-3 px-4">Entry / Exit Price</th>
                      <th className="py-3 px-4">Realized PnL</th>
                      <th className="py-3 px-4">Notes</th>
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
                          <td className="py-3 px-4">
                            ${Number(t.position_size).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-gray-400">
                            {t.entry_price ? `$${t.entry_price}` : '-'} / {t.exit_price ? `$${t.exit_price}` : '-'}
                          </td>
                          <td className={`py-3 px-4 font-bold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isProfit ? '+' : ''}${Number(t.pnl_amount).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 font-sans text-gray-400 truncate max-w-[200px]">
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

      {/* Modal 1: Create Hedge Pool */}
      {showCreatePoolModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-8 max-w-md w-full space-y-6 border border-white/10 shadow-2xl relative animate-in fade-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-400" />
                Create New Hedge Fund Pool
              </h3>
              <button
                onClick={() => setShowCreatePoolModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 text-gray-400 hover:text-white flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePool} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Pool Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Apex Arbitrage Fund"
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Investment Strategy
                </label>
                <input
                  type="text"
                  name="strategy"
                  required
                  placeholder="e.g. Quantitative High-Frequency Delta Neutral"
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Target Return APY
                </label>
                <input
                  type="text"
                  name="targetReturn"
                  defaultValue="+20.0% APY"
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Description / Thesis
                </label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Describe portfolio strategy and asset mix..."
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreatePoolModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/10 text-white text-xs font-medium hover:bg-white/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Pool'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Merge Investors & Free Capital Calculator */}
      {showMergeModal && activePool && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-8 max-w-2xl w-full space-y-6 border border-white/10 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  Merge Investors into "{activePool.name}"
                </h3>
                <p className="text-xs text-gray-400">See free unallocated capital per investor and split amounts.</p>
              </div>
              <button
                onClick={() => setShowMergeModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 text-gray-400 hover:text-white flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleMergeSubmit} className="space-y-4">
              <div className="space-y-3">
                {selectedClientAllocations.map((item, index) => {
                  const clientObj = clients.find(c => c.id === item.userId)
                  const freeCap = getUnallocatedFreeCapital(item.userId, pools, Number(clientObj?.totalInvested || 0))
                  const itemShare = mergeTotalCapital > 0 ? (Number(item.amount || 0) / mergeTotalCapital) * 100 : 0
                  return (
                    <div key={index} className="p-4 bg-black/40 border border-white/10 rounded-2xl flex flex-col gap-3">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="w-full sm:w-1/2">
                          <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">Investor #{index + 1}</label>
                          <select
                            value={item.userId}
                            onChange={(e) => updateClientRow(index, 'userId', e.target.value)}
                            className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                          >
                            {clients.map(c => {
                              const isSelectedElsewhere = selectedClientAllocations.some((alloc, i) => i !== index && alloc.userId === c.id)
                              const isAdmin = (c as any).role === 'admin' || c.email?.includes('admin') || c.email?.includes('darius')
                              const name = isAdmin ? `${c.full_name || 'Darius'} (Admin)` : (c.full_name || c.email)
                              return (
                                <option key={c.id} value={c.id} disabled={isSelectedElsewhere}>
                                  {name} {isSelectedElsewhere ? '(Already Added)' : ''}
                                </option>
                              )
                            })}
                          </select>
                        </div>

                        <div className="w-full sm:w-1/3">
                          <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">Split Amount ($)</label>
                          <input
                            type="number"
                            value={item.amount}
                            onChange={(e) => updateClientRow(index, 'amount', e.target.value === '' ? '' : (parseFloat(e.target.value) || 0))}
                            placeholder="0"
                            className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div className="w-full sm:w-1/6 flex items-center justify-between sm:justify-end gap-2 pt-2">
                          <span className="text-xs font-bold text-blue-400 font-mono">
                            {itemShare.toFixed(1)}%
                          </span>
                          {selectedClientAllocations.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeClientRow(index)}
                              className="text-red-400 hover:text-red-300 text-xs p-1"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Free Capital Indicator Badge */}
                      <div className="flex items-center gap-3 text-[11px] pt-1 border-t border-white/5">
                        <span className="text-gray-400 font-medium">Free Capital Status:</span>
                        <span className={`px-2 py-0.5 rounded-full font-mono font-semibold ${
                          freeCap.free >= Number(item.amount || 0)
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          ${freeCap.free.toLocaleString()} Free Available
                        </span>
                        <span className="text-gray-500 font-mono">
                          (Allocated: ${freeCap.allocated.toLocaleString()})
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <button
                type="button"
                onClick={addClientRow}
                className="w-full py-2.5 rounded-xl border border-dashed border-white/20 hover:border-blue-500 text-gray-300 hover:text-blue-400 text-xs font-medium flex items-center justify-center gap-2 transition-all"
              >
                <Plus className="w-4 h-4" /> Add Another Investor to Merge
              </button>

              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-between text-xs">
                <span className="text-blue-300 font-medium">Total Merged Capital:</span>
                <span className="text-base font-bold text-white font-mono">
                  ${mergeTotalCapital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowMergeModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/10 text-white text-xs font-medium hover:bg-white/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || mergeTotalCapital <= 0}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving Merged Split...' : 'Confirm Merged Account Split'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Update Valuation */}
      {showValuationModal && activePool && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-8 max-w-md w-full space-y-6 border border-white/10 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-purple-400" />
                Update Pool Valuation
              </h3>
              <button
                onClick={() => setShowValuationModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 text-gray-400 hover:text-white flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleValuationSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  New Total Pool Valuation ($)
                </label>
                <input
                  type="number"
                  step="any"
                  value={newValuationInput}
                  onChange={(e) => setNewValuationInput(e.target.value)}
                  placeholder="Enter updated total fund value..."
                  required
                  className="w-full px-4 py-3 rounded-xl glass-input text-base font-mono font-bold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowValuationModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/10 text-white text-xs font-medium hover:bg-white/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-medium hover:bg-purple-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Apply Valuation & Rebalance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Log New Trade on Hedge Pool */}
      {showAddTradeModal && activePool && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-8 max-w-md w-full space-y-6 border border-white/10 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                Log Trade on "{activePool.name}"
              </h3>
              <button
                onClick={() => setShowAddTradeModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 text-gray-400 hover:text-white flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTradeSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-semibold mb-1 uppercase tracking-wider">
                  Asset Symbol
                </label>
                <input
                  type="text"
                  name="assetSymbol"
                  required
                  placeholder="e.g. NVDA, BTC-USD, AAPL"
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-bold uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1 uppercase tracking-wider">
                    Trade Type
                  </label>
                  <select
                    name="tradeType"
                    required
                    className="w-full px-3 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="BUY_LONG">Buy / Long</option>
                    <option value="SELL_SHORT">Sell / Short</option>
                    <option value="PROFIT_TAKE">Profit Take</option>
                    <option value="STOP_LOSS">Stop Loss</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1 uppercase tracking-wider">
                    Position Size ($)
                  </label>
                  <input
                    type="number"
                    name="positionSize"
                    placeholder="100000"
                    required
                    className="w-full px-3 py-2.5 rounded-xl glass-input font-mono text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1 uppercase tracking-wider">
                    Entry Price ($)
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="entryPrice"
                    placeholder="120.50"
                    className="w-full px-3 py-2.5 rounded-xl glass-input font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1 uppercase tracking-wider">
                    Exit Price ($)
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="exitPrice"
                    placeholder="135.00"
                    className="w-full px-3 py-2.5 rounded-xl glass-input font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1 uppercase tracking-wider">
                  Realized PnL Profit / Loss ($)
                </label>
                <input
                  type="number"
                  step="any"
                  name="pnlAmount"
                  required
                  placeholder="+14500 (Positive for Profit, Negative for Loss)"
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input font-mono text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1 uppercase tracking-wider">
                  Trade Notes / Thesis
                </label>
                <input
                  type="text"
                  name="notes"
                  placeholder="e.g. Cloud earnings catalyst breakout..."
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddTradeModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/10 text-white text-xs font-medium hover:bg-white/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Logging Trade...' : 'Confirm & Log Trade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
