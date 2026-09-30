'use client'

import { useState, useEffect } from 'react'
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
  Trash2,
  Coins,
  Search,
  ChevronDown,
  Filter,
  Calendar,
  ChevronLeft,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { HedgePool, HedgePoolMember, getUnallocatedFreeCapital } from '@/lib/hedge-pools'
import {
  createHedgePoolAction,
  addMembersToHedgePoolAction,
  updateHedgePoolValuationAction,
  addHedgePoolTradeAction,
  deleteHedgePoolAction,
  takeHedgePoolProfitCutAction
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

function SearchableInvestorSelect({
  value,
  onChange,
  clients,
  selectedUserIds,
}: {
  value: string
  onChange: (userId: string) => void
  clients: ClientOption[]
  selectedUserIds: string[]
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const selectedClient = clients.find(c => c.id === value)
  const isAdmin = selectedClient && ((selectedClient as any).role === 'admin' || selectedClient.email?.includes('admin') || selectedClient.email?.includes('darius'))
  const isPocket = selectedClient && (selectedClient.email?.includes('pocket') || selectedClient.full_name?.includes('Pocket'))
  const displayName = selectedClient
    ? (isPocket ? '👑 Founders Profit Pocket' : isAdmin ? `${selectedClient.full_name || 'Darius'} (Admin)` : (selectedClient.full_name || selectedClient.email))
    : 'Select Investor...'

  const filteredClients = clients.filter(c => {
    const q = searchTerm.toLowerCase().trim()
    if (!q) return true
    const nameMatch = (c.full_name || '').toLowerCase().includes(q)
    const emailMatch = (c.email || '').toLowerCase().includes(q)
    return nameMatch || emailMatch
  })

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-black/60 border border-white/10 hover:border-white/20 rounded-xl text-xs text-left text-white focus:outline-none focus:border-blue-500 flex items-center justify-between gap-2 transition-all"
      >
        <div className="flex items-center gap-2 truncate">
          <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-gray-300">
            {selectedClient?.full_name ? selectedClient.full_name[0].toUpperCase() : '?'}
          </div>
          <span className="truncate font-medium">{displayName}</span>
          {selectedClient?.email && (
            <span className="text-[10px] text-gray-500 truncate hidden sm:inline">({selectedClient.email})</span>
          )}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[#0d131f] border border-white/15 rounded-2xl shadow-2xl p-2 space-y-2 animate-in fade-in zoom-in-95 max-h-64 flex flex-col">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-8 pr-3 py-1.5 bg-black/70 border border-white/10 rounded-xl text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="overflow-y-auto space-y-1 flex-1 pr-1 custom-scrollbar">
              {filteredClients.length === 0 ? (
                <div className="p-3 text-center text-xs text-gray-500">
                  No investors matching "{searchTerm}"
                </div>
              ) : (
                filteredClients.map((c) => {
                  const isSelectedHere = c.id === value
                  const isSelectedElsewhere = selectedUserIds.includes(c.id) && !isSelectedHere
                  const isAdm = (c as any).role === 'admin' || c.email?.includes('admin') || c.email?.includes('darius')
                  const isPkt = c.email?.includes('pocket') || c.full_name?.includes('Pocket')
                  const label = isPkt
                    ? 'Founders Profit Pocket'
                    : isAdm
                    ? `${c.full_name || 'Darius'} (Admin)`
                    : (c.full_name || 'Investor')

                  return (
                    <button
                      key={c.id}
                      type="button"
                      disabled={isSelectedElsewhere}
                      onClick={() => {
                        onChange(c.id)
                        setIsOpen(false)
                        setSearchTerm('')
                      }}
                      className={`w-full px-3 py-2 rounded-xl text-left text-xs flex items-center justify-between transition-colors ${
                        isSelectedHere
                          ? 'bg-blue-600/30 text-blue-200 border border-blue-500/30'
                          : isSelectedElsewhere
                          ? 'opacity-40 cursor-not-allowed text-gray-500'
                          : 'hover:bg-white/10 text-gray-200'
                      }`}
                    >
                      <div className="truncate">
                        <div className="font-semibold truncate flex items-center gap-1.5">
                          {label}
                          {isPkt && <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">Founders</span>}
                          {isAdm && !isPkt && <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono">Admin</span>}
                        </div>
                        <div className="text-[10px] text-gray-500 truncate">{c.email}</div>
                      </div>
                      {isSelectedHere && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 ml-2" />}
                      {isSelectedElsewhere && <span className="text-[10px] text-gray-500 shrink-0 ml-2">(Added)</span>}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function HedgePoolsManager({ pools, clients }: HedgePoolsManagerProps) {
  const [selectedPoolId, setSelectedPoolId] = useState<string>(pools[0]?.id || '')
  const [showCreatePoolModal, setShowCreatePoolModal] = useState(false)
  const [showMergeModal, setShowMergeModal] = useState(false)
  const [showValuationModal, setShowValuationModal] = useState(false)
  const [showAddTradeModal, setShowAddTradeModal] = useState(false)
  const [showProfitCutModal, setShowProfitCutModal] = useState(false)
  const [profitCutPercentage, setProfitCutPercentage] = useState('20')
  const [profitCutDestination, setProfitCutDestination] = useState<'pocket' | 'reinvest_hedge'>('pocket')
  const [isSubmittingProfitCut, setIsSubmittingProfitCut] = useState(false)

  // Persist selected pool across page reloads and tab changes
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const poolParam = searchParams.get('pool')
    if (poolParam && pools.some(p => p.id === poolParam)) {
      setSelectedPoolId(poolParam)
      return
    }
    const saved = localStorage.getItem('hedge_admin_selected_pool')
    if (saved && pools.some(p => p.id === saved)) {
      setSelectedPoolId(saved)
    }
  }, [pools])

  const handleSelectPool = (id: string) => {
    setSelectedPoolId(id)
    localStorage.setItem('hedge_admin_selected_pool', id)
    const url = new URL(window.location.href)
    url.searchParams.set('pool', id)
    window.history.replaceState({}, '', url.toString())
  }

  // Member sorting state inside pool
  const [memberSortBy, setMemberSortBy] = useState<'share' | 'allocated' | 'current' | 'name'>('share')
  const [memberSortOrder, setMemberSortOrder] = useState<'asc' | 'desc'>('desc')

  // Merge form state (up to 4+ clients selected with individual amounts)
  const [selectedClientAllocations, setSelectedClientAllocations] = useState<{ userId: string; amount: number | string }[]>([
    { userId: clients[0]?.id || '', amount: '' },
    { userId: clients[1]?.id || '', amount: '' },
  ])

  // Valuation state
  const [newValuationInput, setNewValuationInput] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const activePool = pools.find(p => p.id === selectedPoolId) || pools[0]

  // Trade search, filter, date bar, and pagination states
  const [tradeSearch, setTradeSearch] = useState('')
  const [tradeFilterType, setTradeFilterType] = useState<'ALL' | 'TRADES' | 'PROFIT_CUTS' | 'INJECTIONS' | 'WINS' | 'LOSSES'>('ALL')
  const [tradeDateFilter, setTradeDateFilter] = useState<'ALL' | 'TODAY' | '7DAYS' | '30DAYS' | 'MONTH' | 'CUSTOM'>('ALL')
  const [tradeDateFrom, setTradeDateFrom] = useState('')
  const [tradeDateTo, setTradeDateTo] = useState('')
  const [tradeSortBy, setTradeSortBy] = useState<'date' | 'pnl' | 'size' | 'asset'>('date')
  const [tradeSortOrder, setTradeSortOrder] = useState<'desc' | 'asc'>('desc')
  const [tradeCurrentPage, setTradeCurrentPage] = useState(1)
  const [tradePageSize, setTradePageSize] = useState<number | 'ALL'>(15)

  // Reset page when search or filter changes
  useEffect(() => {
    setTradeCurrentPage(1)
  }, [tradeSearch, tradeFilterType, tradeDateFilter, tradeDateFrom, tradeDateTo, selectedPoolId])

  const allTrades = activePool?.trades || []

  // Pre-calculate counts for filter tabs
  const tradesCount = allTrades.filter(t => !t.asset_symbol?.includes('PROFIT_CUT') && !t.asset_symbol?.includes('POCKET_INJECTION') && !t.notes?.toLowerCase().includes('profit cut') && !t.notes?.toLowerCase().includes('reinvestment')).length
  const profitCutsCount = allTrades.filter(t => t.asset_symbol?.includes('PROFIT_CUT') || t.notes?.toLowerCase().includes('profit cut')).length
  const injectionsCount = allTrades.filter(t => t.asset_symbol?.includes('POCKET_INJECTION') || t.notes?.toLowerCase().includes('reinvestment')).length
  const winsCount = allTrades.filter(t => Number(t.pnl_amount) > 0).length
  const lossesCount = allTrades.filter(t => Number(t.pnl_amount) < 0).length

  // Filtered and sorted trades
  const filteredTrades = allTrades.filter((t) => {
    if (tradeSearch.trim()) {
      const q = tradeSearch.toLowerCase().trim()
      const symbolMatch = (t.asset_symbol || '').toLowerCase().includes(q)
      const typeMatch = (t.trade_type || '').toLowerCase().includes(q)
      const notesMatch = (t.notes || '').toLowerCase().includes(q)
      if (!symbolMatch && !typeMatch && !notesMatch) return false
    }

    const isProfitCut = t.asset_symbol?.includes('PROFIT_CUT') || t.notes?.toLowerCase().includes('profit cut')
    const isInjection = t.asset_symbol?.includes('POCKET_INJECTION') || t.notes?.toLowerCase().includes('reinvestment')
    const isRegularTrade = !isProfitCut && !isInjection
    const isWin = Number(t.pnl_amount) > 0
    const isLoss = Number(t.pnl_amount) < 0

    if (tradeFilterType === 'TRADES' && !isRegularTrade) return false
    if (tradeFilterType === 'PROFIT_CUTS' && !isProfitCut) return false
    if (tradeFilterType === 'INJECTIONS' && !isInjection) return false
    if (tradeFilterType === 'WINS' && !isWin) return false
    if (tradeFilterType === 'LOSSES' && !isLoss) return false

    if (tradeDateFilter !== 'ALL' && t.created_at) {
      const tradeDate = new Date(t.created_at)
      const now = new Date()

      if (tradeDateFilter === 'TODAY') {
        if (tradeDate.toDateString() !== now.toDateString()) return false
      } else if (tradeDateFilter === '7DAYS') {
        const diffDays = (now.getTime() - tradeDate.getTime()) / (1000 * 3600 * 24)
        if (diffDays > 7) return false
      } else if (tradeDateFilter === '30DAYS') {
        const diffDays = (now.getTime() - tradeDate.getTime()) / (1000 * 3600 * 24)
        if (diffDays > 30) return false
      } else if (tradeDateFilter === 'MONTH') {
        if (tradeDate.getMonth() !== now.getMonth() || tradeDate.getFullYear() !== now.getFullYear()) return false
      } else if (tradeDateFilter === 'CUSTOM') {
        if (tradeDateFrom) {
          const fromDate = new Date(tradeDateFrom)
          if (tradeDate < fromDate) return false
        }
        if (tradeDateTo) {
          const toDate = new Date(tradeDateTo)
          toDate.setHours(23, 59, 59, 999)
          if (tradeDate > toDate) return false
        }
      }
    }

    return true
  }).sort((a, b) => {
    let comparison = 0
    if (tradeSortBy === 'date') {
      const dateA = new Date(a.created_at || 0).getTime()
      const dateB = new Date(b.created_at || 0).getTime()
      comparison = dateA - dateB
    } else if (tradeSortBy === 'pnl') {
      comparison = Number(a.pnl_amount || 0) - Number(b.pnl_amount || 0)
    } else if (tradeSortBy === 'size') {
      comparison = Number(a.position_size || 0) - Number(b.position_size || 0)
    } else if (tradeSortBy === 'asset') {
      comparison = (a.asset_symbol || '').localeCompare(b.asset_symbol || '')
    }
    return tradeSortOrder === 'desc' ? -comparison : comparison
  })

  const totalTradesCount = filteredTrades.length
  const effectivePageSize = tradePageSize === 'ALL' ? totalTradesCount : Number(tradePageSize)
  const totalPages = Math.max(1, Math.ceil(totalTradesCount / (effectivePageSize || 1)))
  const safeCurrentPage = Math.min(tradeCurrentPage, totalPages)
  const paginatedTrades = tradePageSize === 'ALL'
    ? filteredTrades
    : filteredTrades.slice((safeCurrentPage - 1) * effectivePageSize, safeCurrentPage * effectivePageSize)

  const filteredPnL = filteredTrades.reduce((acc, t) => acc + Number(t.pnl_amount || 0), 0)
  const filteredVolume = filteredTrades.reduce((acc, t) => acc + Number(t.position_size || 0), 0)

  const handleOpenMergeModal = (pool: HedgePool) => {
    handleSelectPool(pool.id)
    if (pool.members && pool.members.length > 0) {
      setSelectedClientAllocations(
        pool.members.map(m => ({
          userId: m.user_id,
          amount: Number(m.allocated_amount || 0) > 0 ? m.allocated_amount : ''
        }))
      )
    } else {
      setSelectedClientAllocations(
        clients.slice(0, 2).map(c => ({
          userId: c.id,
          amount: ''
        }))
      )
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

    const validMembers = selectedClientAllocations.filter(m => m.userId && Number(m.amount || 0) > 0)
    if (validMembers.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please type an amount greater than $0 for at least one investor.' })
      return
    }

    setIsSubmitting(true)
    setStatusMessage(null)

    const formData = new FormData()
    formData.append('poolId', activePool.id)
    formData.append(
      'membersJson',
      JSON.stringify(
        validMembers.map(m => ({ userId: m.userId, allocatedAmount: Number(m.amount || 0) }))
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

  const handleTakeProfitCutSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activePool) return
    const pct = parseFloat(profitCutPercentage)
    if (isNaN(pct) || pct <= 0 || pct > 100) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid percentage between 1% and 100%.' })
      return
    }

    setIsSubmittingProfitCut(true)
    setStatusMessage(null)

    const res = await takeHedgePoolProfitCutAction(activePool.id, pct, profitCutDestination)
    setIsSubmittingProfitCut(false)

    if (res.error) {
      setStatusMessage({ type: 'error', text: res.error })
    } else {
      setStatusMessage({ type: 'success', text: res.success || 'Profit Cut Executed Successfully!' })
      setShowProfitCutModal(false)
      setTimeout(() => window.location.reload(), 1000)
    }
  }

  const addClientRow = () => {
    const unselected = clients.find(c => !selectedClientAllocations.some(a => a.userId === c.id))
    if (unselected) {
      setSelectedClientAllocations([...selectedClientAllocations, { userId: unselected.id, amount: '' }])
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
              onClick={() => handleSelectPool(p.id)}
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
                onClick={() => handleOpenMergeModal(activePool)}
                className="px-4 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-medium flex items-center gap-2 transition-all"
              >
                <Users className="w-3.5 h-3.5" />
                Merge Investors & Split Amounts
              </button>
              <button
                onClick={() => {
                  setProfitCutPercentage('20')
                  setProfitCutDestination('pocket')
                  setShowProfitCutModal(true)
                }}
                className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-center gap-2 transition-all shadow-lg"
              >
                <Coins className="w-3.5 h-3.5" />
                Take Profit Cut (%)
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
                  onClick={() => handleOpenMergeModal(activePool)}
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
            {/* Header + Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  Individual Trades Executed on "{activePool.name}"
                </h4>
                <p className="text-xs text-gray-400">
                  Audit log of active asset trades, positions, profit cuts, and realized PnL.
                </p>
              </div>
              <button
                onClick={() => setShowAddTradeModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Log Trade
              </button>
            </div>

            {/* Quick Summary KPIs on Filtered Trades */}
            {allTrades.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Filtered Records</div>
                  <div className="text-base font-bold font-mono text-white mt-0.5">
                    {totalTradesCount} <span className="text-xs font-normal text-gray-500">/ {allTrades.length}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Realized PnL</div>
                  <div className={`text-base font-bold font-mono mt-0.5 ${filteredPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {filteredPnL >= 0 ? '+' : ''}${filteredPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Total Volume</div>
                  <div className="text-base font-bold font-mono text-blue-400 mt-0.5">
                    ${filteredVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Win Rate</div>
                  <div className="text-base font-bold font-mono text-amber-400 mt-0.5">
                    {totalTradesCount > 0 ? ((filteredTrades.filter(t => Number(t.pnl_amount) > 0).length / totalTradesCount) * 100).toFixed(0) : 0}%
                  </div>
                </div>
              </div>
            )}

            {/* Search Bar + Filter Pills */}
            <div className="space-y-3 p-4 bg-black/40 rounded-2xl border border-white/10">
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by asset (NQ, ES...), type, or notes..."
                    value={tradeSearch}
                    onChange={(e) => setTradeSearch(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-all"
                  />
                  {tradeSearch && (
                    <button
                      onClick={() => setTradeSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Sort selector */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 shrink-0">
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Sort:</span>
                  </div>
                  <select
                    value={tradeSortBy}
                    onChange={(e) => setTradeSortBy(e.target.value as any)}
                    className="bg-black/60 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="date">Date Executed</option>
                    <option value="pnl">Realized PnL</option>
                    <option value="size">Position Size</option>
                    <option value="asset">Asset Symbol</option>
                  </select>

                  <button
                    onClick={() => setTradeSortOrder(tradeSortOrder === 'desc' ? 'asc' : 'desc')}
                    className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white text-xs flex items-center gap-1"
                    title={tradeSortOrder === 'desc' ? 'Descending (Newest / Highest)' : 'Ascending (Oldest / Lowest)'}
                  >
                    {tradeSortOrder === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>

                  {/* Page Size */}
                  <select
                    value={tradePageSize}
                    onChange={(e) => setTradePageSize(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                    className="bg-black/60 border border-white/10 rounded-xl px-2 py-2 text-xs text-gray-300 focus:outline-none focus:border-emerald-500"
                  >
                    <option value={10}>10 / pg</option>
                    <option value={15}>15 / pg</option>
                    <option value={25}>25 / pg</option>
                    <option value={50}>50 / pg</option>
                    <option value="ALL">All ({allTrades.length})</option>
                  </select>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/5">
                <span className="text-[11px] text-gray-500 uppercase font-semibold mr-1 flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Category:
                </span>
                {[
                  { id: 'ALL', label: 'All Records', count: allTrades.length },
                  { id: 'TRADES', label: 'Market Trades', count: tradesCount },
                  { id: 'PROFIT_CUTS', label: 'Profit Cuts', count: profitCutsCount },
                  { id: 'INJECTIONS', label: 'Injections', count: injectionsCount },
                  { id: 'WINS', label: 'Wins (+)', count: winsCount },
                  { id: 'LOSSES', label: 'Losses (-)', count: lossesCount }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setTradeFilterType(cat.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
                      tradeFilterType === cat.id
                        ? 'bg-emerald-500 text-black shadow-md'
                        : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      tradeFilterType === cat.id ? 'bg-black/20 text-black font-bold' : 'bg-white/10 text-gray-400'
                    }`}>
                      {cat.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Date Filter Bar ("Data Bar") */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/5">
                <span className="text-[11px] text-gray-500 uppercase font-semibold mr-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-blue-400" /> Date Range:
                </span>
                {[
                  { id: 'ALL', label: 'All Time' },
                  { id: 'TODAY', label: 'Today' },
                  { id: '7DAYS', label: 'Last 7 Days' },
                  { id: '30DAYS', label: 'Last 30 Days' },
                  { id: 'MONTH', label: 'This Month' },
                  { id: 'CUSTOM', label: 'Custom Date' }
                ].map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setTradeDateFilter(d.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                      tradeDateFilter === d.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}

                {/* Custom Date Pickers */}
                {tradeDateFilter === 'CUSTOM' && (
                  <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                    <span className="text-[10px] text-gray-400">From:</span>
                    <input
                      type="date"
                      value={tradeDateFrom}
                      onChange={(e) => setTradeDateFrom(e.target.value)}
                      className="bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-[10px] text-gray-400">To:</span>
                    <input
                      type="date"
                      value={tradeDateTo}
                      onChange={(e) => setTradeDateTo(e.target.value)}
                      className="bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-blue-500"
                    />
                    {(tradeDateFrom || tradeDateTo) && (
                      <button
                        onClick={() => { setTradeDateFrom(''); setTradeDateTo(''); }}
                        className="text-[10px] text-red-400 hover:underline"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* The Table */}
            {(!activePool.trades || activePool.trades.length === 0) ? (
              <div className="p-8 text-center bg-black/20 rounded-2xl border border-dashed border-white/10 text-gray-400 text-xs">
                No active asset trades logged for this Hedge Pool yet.
              </div>
            ) : filteredTrades.length === 0 ? (
              <div className="p-8 text-center bg-black/20 rounded-2xl border border-dashed border-white/10 space-y-2">
                <Search className="w-6 h-6 text-gray-600 mx-auto" />
                <p className="text-sm text-gray-300 font-medium">No matching trades or records found</p>
                <p className="text-xs text-gray-500">
                  Try adjusting your search terms, category pills, or date range filter.
                </p>
                <button
                  onClick={() => {
                    setTradeSearch('')
                    setTradeFilterType('ALL')
                    setTradeDateFilter('ALL')
                    setTradeDateFrom('')
                    setTradeDateTo('')
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold mt-2 inline-block"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/30">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/5 text-gray-400 uppercase tracking-wider font-semibold border-b border-white/10">
                      <tr>
                        <th className="py-3 px-4">Date & Time</th>
                        <th className="py-3 px-4">Asset Symbol</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Position Size</th>
                        <th className="py-3 px-4">Entry / Exit Price</th>
                        <th className="py-3 px-4">Realized PnL</th>
                        <th className="py-3 px-4">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-200 font-mono">
                      {paginatedTrades.map((t) => {
                        const isProfit = Number(t.pnl_amount) >= 0
                        const isProfitCut = t.asset_symbol?.includes('PROFIT_CUT')
                        const isInjection = t.asset_symbol?.includes('POCKET_INJECTION')

                        return (
                          <tr key={t.id} className="hover:bg-white/5 transition-colors">
                            <td className="py-3 px-4 text-gray-400 whitespace-nowrap text-[11px]">
                              {t.created_at ? new Date(t.created_at).toLocaleString() : 'Recent'}
                            </td>
                            <td className="py-3 px-4 font-bold text-white">
                              {isProfitCut ? (
                                <span className="text-amber-300 flex items-center gap-1 font-mono">
                                  <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  {t.asset_symbol}
                                </span>
                              ) : isInjection ? (
                                <span className="text-purple-300 flex items-center gap-1 font-mono">
                                  <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                  {t.asset_symbol}
                                </span>
                              ) : (
                                <span className="text-white font-mono font-bold">
                                  {t.asset_symbol}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 font-sans">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isProfitCut
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : isInjection
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                  : t.trade_type === 'BUY_LONG'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : t.trade_type === 'PROFIT_TAKE'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
                              }`}>
                                {isProfitCut ? 'PROFIT_CUT' : isInjection ? 'POCKET_INJECTION' : t.trade_type}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-semibold text-white">
                              ${Number(t.position_size).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-4 text-gray-400">
                              {t.entry_price ? `$${Number(t.entry_price).toFixed(2)}` : '-'} / {t.exit_price ? `$${Number(t.exit_price).toFixed(2)}` : '-'}
                            </td>
                            <td className={`py-3 px-4 font-bold text-sm ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
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

                {/* Pagination Controls */}
                {tradePageSize !== 'ALL' && totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 px-1 text-xs text-gray-400 font-sans">
                    <div>
                      Showing <span className="font-bold text-white">{(safeCurrentPage - 1) * effectivePageSize + 1}</span> to{' '}
                      <span className="font-bold text-white">{Math.min(safeCurrentPage * effectivePageSize, totalTradesCount)}</span> of{' '}
                      <span className="font-bold text-white">{totalTradesCount}</span> records
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setTradeCurrentPage(p => Math.max(1, p - 1))}
                        disabled={safeCurrentPage === 1}
                        className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white disabled:opacity-30 disabled:pointer-events-none text-xs flex items-center gap-1 transition-all"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> Previous
                      </button>

                      <div className="px-3 py-1 rounded-lg bg-black/60 border border-white/10 text-xs font-mono text-white">
                        Page {safeCurrentPage} of {totalPages}
                      </div>

                      <button
                        onClick={() => setTradeCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={safeCurrentPage === totalPages}
                        className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white disabled:opacity-30 disabled:pointer-events-none text-xs flex items-center gap-1 transition-all"
                      >
                        Next <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
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
                  const freeCap = getUnallocatedFreeCapital(
                    item.userId,
                    pools,
                    Number(clientObj?.totalInvested || 0),
                    (clientObj as any)?.freePocketReserve
                  )
                  const itemShare = mergeTotalCapital > 0 ? (Number(item.amount || 0) / mergeTotalCapital) * 100 : 0
                  return (
                    <div key={index} className="p-4 bg-black/40 border border-white/10 rounded-2xl flex flex-col gap-3">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="w-full sm:w-1/2">
                          <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">Investor #{index + 1}</label>
                          <SearchableInvestorSelect
                            value={item.userId}
                            onChange={(id) => updateClientRow(index, 'userId', id)}
                            clients={clients}
                            selectedUserIds={selectedClientAllocations.map(a => a.userId)}
                          />
                        </div>

                        <div className="w-full sm:w-1/3">
                          <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">Split Amount ($)</label>
                          <input
                            type="number"
                            value={item.amount}
                            onChange={(e) => updateClientRow(index, 'amount', e.target.value)}
                            placeholder="Type amount"
                            className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-blue-500 placeholder:text-gray-500"
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

      {/* Modal 4: Take Profit Cut (%) */}
      {showProfitCutModal && activePool && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-8 max-w-lg w-full space-y-6 border border-white/10 shadow-2xl relative animate-in fade-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Coins className="w-5 h-5 text-amber-400" />
                  Take Profit Cut on "{activePool.name}"
                </h3>
                <p className="text-xs text-gray-400">Harvest percentage-based profit cuts into the Vault or compound as Hedge equity.</p>
              </div>
              <button
                onClick={() => setShowProfitCutModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 text-gray-400 hover:text-white flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Profit Snapshot Card */}
            {(() => {
              const currentVal = Number(activePool.current_value || 0)
              const principal = Number(activePool.total_capital || 0)
              const netProfit = Math.max(0, currentVal - principal)
              const cutPct = Math.min(100, Math.max(0, parseFloat(profitCutPercentage) || 0))
              const cutAmount = (netProfit * cutPct) / 100

              return (
                <form onSubmit={handleTakeProfitCutSubmit} className="space-y-5">
                  <div className="grid grid-cols-3 gap-3 p-3.5 bg-black/40 border border-white/10 rounded-2xl text-center">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">Total Principal</span>
                      <span className="text-sm font-bold text-gray-300 font-mono">${principal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">Current Value</span>
                      <span className="text-sm font-bold text-white font-mono">${currentVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-400 uppercase font-semibold block">Net Profit</span>
                      <span className="text-sm font-bold text-emerald-400 font-mono">+${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  {netProfit <= 0 ? (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs text-center">
                      This pool currently has no net profit above initial principal. Mark-to-market trade profits must exist to harvest a profit cut.
                    </div>
                  ) : (
                    <>
                      {/* Percentage Input & Presets */}
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                          Profit Cut Percentage (%)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            step="0.1"
                            required
                            value={profitCutPercentage}
                            onChange={(e) => setProfitCutPercentage(e.target.value)}
                            placeholder="e.g. 20"
                            className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">%</span>
                        </div>

                        {/* Quick Presets */}
                        <div className="flex items-center gap-2 pt-1">
                          {['10', '20', '30', '50'].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setProfitCutPercentage(preset)}
                              className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${
                                profitCutPercentage === preset
                                  ? 'bg-amber-500 text-black shadow-md'
                                  : 'bg-white/5 hover:bg-white/10 text-gray-300'
                              }`}
                            >
                              {preset}%
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Calculated Cut Banner */}
                      <div className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-amber-300 uppercase font-bold tracking-wider block">Harvested Amount</span>
                          <span className="text-xs text-gray-400">{cutPct}% of ${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} profit</span>
                        </div>
                        <span className="text-2xl font-bold font-mono text-amber-400">
                          ${cutAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* Destination Choice (2 Options requested by user) */}
                      <div className="space-y-2.5">
                        <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                          Choose Profit Cut Destination
                        </label>

                        <div className="grid grid-cols-1 gap-3">
                          {/* Option 1: Direct to Founders Pocket */}
                          <div
                            onClick={() => setProfitCutDestination('pocket')}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                              profitCutDestination === 'pocket'
                                ? 'bg-amber-500/15 border-amber-500/50 shadow-lg'
                                : 'bg-black/40 border-white/10 hover:border-white/20'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center ${
                              profitCutDestination === 'pocket' ? 'border-amber-400 bg-amber-400' : 'border-gray-500'
                            }`}>
                              {profitCutDestination === 'pocket' && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                            </div>
                            <div>
                              <span className="text-xs font-bold text-white block">
                                Deposit directly into Founders Pocket Vault
                              </span>
                              <span className="text-[11px] text-gray-400 block mt-0.5">
                                Skims and extracts cash into your liquid Founders Pocket reserve, available immediately for partner payouts or external transfers.
                              </span>
                            </div>
                          </div>

                          {/* Option 2: Reinvest in same Hedge as Founders Profit Pocket */}
                          <div
                            onClick={() => setProfitCutDestination('reinvest_hedge')}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                              profitCutDestination === 'reinvest_hedge'
                                ? 'bg-indigo-500/15 border-indigo-500/50 shadow-lg'
                                : 'bg-black/40 border-white/10 hover:border-white/20'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center ${
                              profitCutDestination === 'reinvest_hedge' ? 'border-indigo-400 bg-indigo-400' : 'border-gray-500'
                            }`}>
                              {profitCutDestination === 'reinvest_hedge' && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                            </div>
                            <div>
                              <span className="text-xs font-bold text-white block flex items-center gap-1.5">
                                Reinvest in this Hedge as "Founders Profit Pocket"
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">Equity Stake</span>
                              </span>
                              <span className="text-[11px] text-gray-400 block mt-0.5">
                                Retains the money inside this fund. Founders Profit Pocket is treated as a client/co-investor with its own ownership % to compound profits.
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Modal Actions */}
                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                        <button
                          type="button"
                          onClick={() => setShowProfitCutModal(false)}
                          className="px-5 py-2.5 rounded-xl bg-white/10 text-white text-xs font-medium hover:bg-white/20"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingProfitCut || cutAmount <= 0}
                          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold text-xs tracking-wide transition-all shadow-lg disabled:opacity-50"
                        >
                          {isSubmittingProfitCut ? 'Executing Cut...' : `Confirm Harvest ($${cutAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`}
                        </button>
                      </div>
                    </>
                  )}
                </form>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
