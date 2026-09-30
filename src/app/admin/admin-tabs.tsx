'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Layers,
  Search,
  FileText,
  Mail,
  DollarSign,
  TrendingUp,
  Users,
  Activity,
  ShieldCheck,
  Send,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Key,
  CheckCircle2,
  Calendar,
  Clock,
  Video,
  XCircle,
  Coins,
  Wallet,
  Crown,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown
} from 'lucide-react'
import AdminForms from './admin-forms'
import ClientSearch from './client-search'
import HedgePoolsManager from './hedge-pools-manager'
import { HedgePool } from '@/lib/hedge-pools'
import { sendStatements, deleteResetRequestAction } from './actions'
import { approveResetRequestAction, respondToApplicationAction } from '../login/actions'
import { payoutFromPocketAction, reinvestPocketIntoPoolAction } from './pocket-actions'

interface AdminTabsProps {
  clients: any[]
  totalFundValue: number
  totalInvestedCapital: number
  hedgePools: HedgePool[]
  recentTransactions?: any[]
  resetRequests?: any[]
  profitPocketBalance?: number
  profitCutTransactions?: any[]
}

export default function AdminTabs({
  clients,
  totalFundValue,
  totalInvestedCapital,
  hedgePools,
  recentTransactions = [],
  resetRequests = [],
  profitPocketBalance = 0,
  profitCutTransactions = []
}: AdminTabsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'pocket' | 'pools' | 'search' | 'ledger' | 'statements' | 'requests'>('overview')

  // Persist active tab across page refreshes and navigation
  useEffect(() => {
    const validTabs = ['overview', 'pocket', 'pools', 'search', 'ledger', 'statements', 'requests']
    const searchParams = new URLSearchParams(window.location.search)
    const tabParam = searchParams.get('tab')
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam as any)
      localStorage.setItem('hedge_admin_active_tab', tabParam)
      return
    }

    const saved = localStorage.getItem('hedge_admin_active_tab')
    if (saved && validTabs.includes(saved)) {
      setActiveTab(saved as any)
      const url = new URL(window.location.href)
      url.searchParams.set('tab', saved)
      window.history.replaceState({}, '', url.toString())
    }
  }, [])

  const handleTabChange = (tabId: 'overview' | 'pocket' | 'pools' | 'search' | 'ledger' | 'statements' | 'requests') => {
    setActiveTab(tabId)
    localStorage.setItem('hedge_admin_active_tab', tabId)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', tabId)
    window.history.replaceState({}, '', url.toString())
  }
  
  const [dispatchScope, setDispatchScope] = useState<'all' | 'pool' | 'client'>('all')
  const [selectedTargetId, setSelectedTargetId] = useState<string>('')
  const [statementStatus, setStatementStatus] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)

  // Founders Profit Pocket interactive actions state
  const [pocketPayoutAmount, setPocketPayoutAmount] = useState('')
  const [pocketPayoutNote, setPocketPayoutNote] = useState('')
  const [pocketReinvestAmount, setPocketReinvestAmount] = useState('')
  const [pocketReinvestPoolId, setPocketReinvestPoolId] = useState(hedgePools[0]?.id || '')
  const [pocketActionStatus, setPocketActionStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [isExecutingPocket, setIsExecutingPocket] = useState(false)

  // Founders Profit Pocket Ledger Filter & Pagination States
  const [pocketSearch, setPocketSearch] = useState('')
  const [pocketFilterType, setPocketFilterType] = useState<'ALL' | 'FEE' | 'PAYOUT' | 'REINVEST'>('ALL')
  const [pocketDateFilter, setPocketDateFilter] = useState<'ALL' | 'TODAY' | '7DAYS' | '30DAYS' | 'MONTH'>('ALL')
  const [pocketCurrentPage, setPocketCurrentPage] = useState(1)
  const pocketPageSize = 10

  // Master Financial Ledger Filter & Pagination States
  const [ledgerSearch, setLedgerSearch] = useState('')
  const [ledgerFilterType, setLedgerFilterType] = useState<'ALL' | 'CAPITAL' | 'WINS' | 'LOSSES' | 'WITHDRAWALS'>('ALL')
  const [ledgerDateFilter, setLedgerDateFilter] = useState<'ALL' | 'TODAY' | '7DAYS' | '30DAYS' | 'MONTH'>('ALL')
  const [ledgerCurrentPage, setLedgerCurrentPage] = useState(1)
  const ledgerPageSize = 15

  // Reset pagination when filters change
  useEffect(() => {
    setPocketCurrentPage(1)
  }, [pocketSearch, pocketFilterType, pocketDateFilter])

  useEffect(() => {
    setLedgerCurrentPage(1)
  }, [ledgerSearch, ledgerFilterType, ledgerDateFilter])

  // Founders Profit Pocket comprehensive calculations:
  // 1. Active Hedge Pool Stakes owned by Founders Profit Pocket
  const pocketPoolHoldings: Array<{
    poolId: string
    poolName: string
    strategy: string
    allocated: number
    splitPct: number
    currentVal: number
    profit: number
    roiPct: number
  }> = []

  let pocketInvestedInPools = 0
  let pocketCurrentPoolValue = 0

  for (const pool of hedgePools) {
    if (pool.members) {
      const pocketMember = pool.members.find(m =>
        m.profile?.email?.toLowerCase().includes('pocket') ||
        m.profile?.full_name?.toLowerCase().includes('pocket')
      )
      if (pocketMember) {
        const allocated = Number(pocketMember.allocated_amount || 0)
        const currentVal = Number(pocketMember.current_member_value || 0)
        const profit = currentVal - allocated
        const roiPct = allocated > 0 ? (profit / allocated) * 100 : 0
        pocketInvestedInPools += allocated
        pocketCurrentPoolValue += currentVal

        pocketPoolHoldings.push({
          poolId: pool.id,
          poolName: pool.name,
          strategy: pool.strategy,
          allocated,
          splitPct: Number(pocketMember.split_percentage || 0),
          currentVal,
          profit,
          roiPct
        })
      }
    }
  }

  const pocketPoolsProfit = pocketCurrentPoolValue - pocketInvestedInPools
  const pocketLiquidReserve = profitPocketBalance
  const totalPocketWorth = Math.round((pocketLiquidReserve + pocketCurrentPoolValue) * 100) / 100

  const totalPaidOutToOurselves = profitCutTransactions
    .filter((t: any) => t.type === 'pocket_payout')
    .reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0)

  const totalHarvestedFromClients = profitCutTransactions
    .filter((t: any) => t.type === 'fee')
    .reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0)

  const totalReinvestedInFunds = profitCutTransactions
    .filter((t: any) => t.type === 'pocket_reinvest')
    .reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0)

  // Filtered Pocket Transactions
  const filteredPocketTxs = profitCutTransactions.filter((tx: any) => {
    if (pocketSearch.trim()) {
      const q = pocketSearch.toLowerCase().trim()
      const nameMatch = (tx.user_name || '').toLowerCase().includes(q)
      const emailMatch = (tx.user_email || '').toLowerCase().includes(q)
      const typeMatch = (tx.type || '').toLowerCase().includes(q)
      if (!nameMatch && !emailMatch && !typeMatch) return false
    }

    if (pocketFilterType === 'FEE' && tx.type !== 'fee') return false
    if (pocketFilterType === 'PAYOUT' && tx.type !== 'pocket_payout') return false
    if (pocketFilterType === 'REINVEST' && tx.type !== 'pocket_reinvest') return false

    if (pocketDateFilter !== 'ALL' && tx.created_at) {
      const d = new Date(tx.created_at)
      const now = new Date()
      if (pocketDateFilter === 'TODAY' && d.toDateString() !== now.toDateString()) return false
      if (pocketDateFilter === '7DAYS' && (now.getTime() - d.getTime()) / (1000 * 3600 * 24) > 7) return false
      if (pocketDateFilter === '30DAYS' && (now.getTime() - d.getTime()) / (1000 * 3600 * 24) > 30) return false
      if (pocketDateFilter === 'MONTH' && (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear())) return false
    }

    return true
  })

  const totalPocketPages = Math.max(1, Math.ceil(filteredPocketTxs.length / pocketPageSize))
  const paginatedPocketTxs = filteredPocketTxs.slice((pocketCurrentPage - 1) * pocketPageSize, pocketCurrentPage * pocketPageSize)

  // Filtered Master Ledger Transactions
  const filteredLedgerTxs = recentTransactions.filter((tx: any) => {
    const rawType = (tx.type || '').toUpperCase()
    const rawAmount = Number(tx.amount || 0)
    const isCapital = rawType.includes('CAPITAL') || rawType === 'DEPOSIT'
    const isTrade = rawType.includes('TRADE')
    const isLoss = isTrade ? rawAmount < 0 : rawType.includes('WITHDRAWAL')
    const isWin = isTrade && rawAmount >= 0

    if (ledgerSearch.trim()) {
      const q = ledgerSearch.toLowerCase().trim()
      const userMatch = (tx.user_name || '').toLowerCase().includes(q)
      const typeMatch = rawType.toLowerCase().includes(q)
      if (!userMatch && !typeMatch) return false
    }

    if (ledgerFilterType === 'CAPITAL' && !isCapital) return false
    if (ledgerFilterType === 'WINS' && !isWin) return false
    if (ledgerFilterType === 'LOSSES' && !isLoss) return false
    if (ledgerFilterType === 'WITHDRAWALS' && !rawType.includes('WITHDRAWAL')) return false

    if (ledgerDateFilter !== 'ALL' && tx.created_at) {
      const d = new Date(tx.created_at)
      const now = new Date()
      if (ledgerDateFilter === 'TODAY' && d.toDateString() !== now.toDateString()) return false
      if (ledgerDateFilter === '7DAYS' && (now.getTime() - d.getTime()) / (1000 * 3600 * 24) > 7) return false
      if (ledgerDateFilter === '30DAYS' && (now.getTime() - d.getTime()) / (1000 * 3600 * 24) > 30) return false
      if (ledgerDateFilter === 'MONTH' && (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear())) return false
    }

    return true
  })

  const totalLedgerPages = Math.max(1, Math.ceil(filteredLedgerTxs.length / ledgerPageSize))
  const paginatedLedgerTxs = filteredLedgerTxs.slice((ledgerCurrentPage - 1) * ledgerPageSize, ledgerCurrentPage * ledgerPageSize)

  // Onboarding Request Meeting Modal State
  const [selectedRequestForMeeting, setSelectedRequestForMeeting] = useState<any | null>(null)
  const [meetingDay, setMeetingDay] = useState<string>('27')
  const [meetingMonth, setMeetingMonth] = useState<string>('August')
  const [meetingYear, setMeetingYear] = useState<string>('2026')
  const [meetingTimeInput, setMeetingTimeInput] = useState<string>('03:00 PM')
  const [meetingTypeInput, setMeetingTypeInput] = useState<string>('Google Meet Online Video Call')
  const [meetingLinkInput, setMeetingLinkInput] = useState<string>('https://meet.google.com/new')
  const [meetingNotesInput, setMeetingNotesInput] = useState<string>('Looking forward to discussing your portfolio targets and hedge fund allocations.')

  // Generate 15-minute time slots
  const timeSlots: string[] = []
  const hoursList = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
  for (const h of hoursList) {
    const period = h >= 12 ? 'PM' : 'AM'
    const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h
    const strH = String(displayH).padStart(2, '0')
    for (const m of [0, 15, 30, 45]) {
      if (h === 20 && m > 0) break
      const strM = String(m).padStart(2, '0')
      timeSlots.push(`${strH}:${strM} ${period}`)
    }
  }

  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const daysList = Array.from({ length: 31 }, (_, i) => String(i + 1))
  const yearsList = ['2026', '2027', '2028', '2029', '2030']

  // Map clients to enhanced structure for search (clean real values only, no mock fallbacks)
  const enrichedClients = clients.map((c) => {
    const totalInvested = typeof c.initialCapital === 'number' ? c.initialCapital : (typeof c.totalInvested === 'number' ? c.totalInvested : 0)
    const currentBalance = typeof c.currentBalance === 'number' ? c.currentBalance : 0
    const roiAmount = currentBalance - totalInvested
    const roiPercent = totalInvested > 0 ? (roiAmount / totalInvested) * 100 : 0
    return {
      id: c.id,
      full_name: c.name || c.full_name || null,
      email: c.email,
      totalInvested,
      currentBalance,
      roiAmount,
      roiPercent,
      poolNames: hedgePools
        .filter((p) => p.members?.some((m) => m.user_id === c.id))
        .map((p) => p.name)
    }
  })

  const fundProfit = totalFundValue - totalInvestedCapital
  const fundRoiPercent = totalInvestedCapital > 0 ? (fundProfit / totalInvestedCapital) * 100 : 0

  const handleSendStatements = async () => {
    setIsSending(true)
    setStatementStatus(null)
    const res = await sendStatements(null, dispatchScope, selectedTargetId)
    setIsSending(false)
    if (res.error) {
      setStatementStatus(`Error: ${res.error}`)
    } else {
      setStatementStatus(res.success || 'Statements deployed successfully!')
    }
  }

  const pendingRequestsCount = resetRequests.filter((r) => r.status === 'pending').length

  const tabs = [
    { id: 'overview', label: 'Overview & Analytics', icon: LayoutDashboard },
    {
      id: 'pocket',
      label: 'Founders Profit Pocket',
      icon: Coins,
      badge: profitPocketBalance > 0 ? `$${profitPocketBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : undefined
    },
    { id: 'pools', label: 'Hedge Pools & Splits', icon: Layers, badge: hedgePools.length },
    { id: 'search', label: 'Client Search', icon: Search, badge: clients.length },
    { id: 'ledger', label: 'Ledger & Transactions', icon: FileText },
    { id: 'statements', label: 'Statements Dispatch', icon: Mail },
    { id: 'requests', label: 'Whitelist & Onboarding Requests', icon: Sparkles, badge: pendingRequestsCount }
  ]

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
      {/* Left Sidebar Navigation */}
      <aside className="w-full lg:w-64 shrink-0 glass-card rounded-3xl p-4 border border-white/10 space-y-2 lg:sticky lg:top-28 z-20 shadow-2xl">
        <div className="px-3 py-2 mb-2 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-gray-400 tracking-wider uppercase">Navigation Menu</span>
          </div>
        </div>

        <nav className="space-y-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as any)}
                className={`relative w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-semibold tracking-wide transition-all duration-300 ${
                  isActive
                    ? 'text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="adminSidebarGlow"
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl"
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2.5 min-w-0 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  <span className="truncate">{tab.label}</span>
                </span>

                {tab.badge !== undefined && (
                  <span
                    className={`relative z-10 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ml-1.5 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : tab.id === 'requests' && pendingRequestsCount > 0
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
                        : 'bg-white/10 text-gray-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Main Right Content Panel */}
      <main className="flex-1 w-full min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
          {/* TAB 1: OVERVIEW & ANALYTICS */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Financial KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                <div className="glass-card rounded-3xl p-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
                    <DollarSign className="w-20 h-20 text-blue-400" />
                  </div>
                  <p className="text-blue-300 text-xs font-semibold uppercase tracking-widest mb-2">Total Fund AUM</p>
                  <p className="text-2xl xl:text-3xl font-bold text-white tracking-tight font-mono whitespace-nowrap">
                    ${totalFundValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-blue-200/70">
                    <Activity className="w-3.5 h-3.5 text-blue-400" />
                    <span>Real-time aggregated asset value</span>
                  </div>
                </div>

                <div className="glass-card rounded-3xl p-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
                    <TrendingUp className="w-20 h-20 text-emerald-400" />
                  </div>
                  <p className="text-emerald-300 text-xs font-semibold uppercase tracking-widest mb-2">Fund Net Profit</p>
                  <p className="text-2xl xl:text-3xl font-bold text-emerald-400 tracking-tight font-mono whitespace-nowrap">
                    +${fundProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-emerald-200/70">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold text-[10px]">
                      +{fundRoiPercent.toFixed(2)}% ROI
                    </span>
                    <span>vs principal capital</span>
                  </div>
                </div>

                <div className="glass-card rounded-3xl p-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
                    <Users className="w-20 h-20 text-purple-400" />
                  </div>
                  <p className="text-purple-300 text-xs font-semibold uppercase tracking-widest mb-2">Active Investors</p>
                  <p className="text-2xl xl:text-3xl font-bold text-white tracking-tight font-mono">
                    {clients.length}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-purple-200/70">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                    <span>Verified platform accounts</span>
                  </div>
                </div>

                <div className="glass-card rounded-3xl p-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
                    <Layers className="w-20 h-20 text-amber-400" />
                  </div>
                  <p className="text-amber-300 text-xs font-semibold uppercase tracking-widest mb-2">Hedge Accounts</p>
                  <p className="text-2xl xl:text-3xl font-bold text-white tracking-tight font-mono">
                    {hedgePools.length}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-amber-200/70">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Active multi-investor pools</span>
                  </div>
                </div>
              </div>

              {/* Founders Profit Pocket Quick Banner */}
              <div className="glass-card rounded-3xl p-6 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-blue-500/10 border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                    <Coins className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Shared Partners Treasury
                      </span>
                      <span className="text-xs text-gray-400">Co-owned: Darius (100%) & Capitan (100%) Joint Ownership</span>
                    </div>
                    <h4 className="text-xl font-bold text-white mt-1">Founders Profit Pocket</h4>
                    <p className="text-xs text-gray-400">Automated accumulation of client profit cuts, executive payouts & hedge pool reinvestments.</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Total Pocket Reserve</p>
                    <p className="text-2xl font-bold font-mono text-amber-300">
                      ${profitPocketBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[11px] font-mono text-emerald-400 font-semibold">
                      100% Mutual Co-Ownership
                    </p>
                  </div>

                  <button
                    onClick={() => handleTabChange('pocket')}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white font-semibold text-xs transition-all shadow-lg flex items-center gap-2 whitespace-nowrap"
                  >
                    Open Pocket Vault →
                  </button>
                </div>
              </div>

              {/* Quick Actions & Fund Performance Forms */}
              <div className="glass-card rounded-3xl p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-6">
                  <div>
                    <h3 className="text-2xl font-light text-white">Client Onboarding & Capital Injection</h3>
                    <p className="text-gray-400 text-sm mt-1">Create client with email, name, AND initial capital in 1 step.</p>
                  </div>
                </div>
                <AdminForms clients={clients} />
              </div>
            </div>
          )}

          {/* TAB: FOUNDERS PROFIT POCKET */}
          {activeTab === 'pocket' && (
            <div className="space-y-8">
              {/* Header & Overview Card */}
              <div className="glass-card rounded-3xl p-8 bg-gradient-to-b from-amber-500/10 via-black/40 to-black/60 border border-amber-500/30 space-y-6 relative overflow-hidden shadow-2xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 via-amber-400 to-purple-600 flex items-center justify-center text-white shadow-[0_0_35px_rgba(245,158,11,0.4)]">
                      <Coins className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          Shared Reserve Vault
                        </span>
                        <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          100% Mutual Co-Ownership
                        </span>
                      </div>
                      <h3 className="text-3xl font-light text-white tracking-tight">
                        Founders Profit Pocket
                      </h3>
                      <p className="text-gray-400 text-sm mt-1">
                        Centralized treasury co-owned by <strong>Darius</strong> and <strong>Capitan</strong>. Both partners hold <strong>100% mutual ownership</strong> and full access to withdraw or reinvest all profit cuts.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 5 Main Pocket KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-2">
                  {/* KPI 1: Total Combined Pocket Net Worth */}
                  <div className="glass-card rounded-2xl p-5 bg-gradient-to-b from-amber-500/20 via-black/60 to-black/80 border border-amber-500/50 space-y-2 relative overflow-hidden group shadow-xl">
                    <div className="flex items-center justify-between text-[11px] text-amber-300 font-semibold uppercase tracking-wider">
                      <span>Total Pocket Worth</span>
                      <Crown className="w-4 h-4 text-amber-400" />
                    </div>
                    <p className="text-2xl lg:text-3xl font-bold font-mono text-white tracking-tight">
                      ${totalPocketWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[11px] text-amber-300/80 font-mono">
                      ${pocketLiquidReserve.toLocaleString(undefined, { minimumFractionDigits: 2 })} Cash + ${pocketCurrentPoolValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} Funds
                    </p>
                  </div>

                  {/* KPI 2: Paid Out to Ourselves */}
                  <div className="glass-card rounded-2xl p-5 bg-gradient-to-b from-emerald-500/10 via-black/60 to-black/80 border border-emerald-500/40 space-y-2 relative overflow-hidden group">
                    <div className="flex items-center justify-between text-[11px] text-emerald-300 font-semibold uppercase tracking-wider">
                      <span>Paid Out to Ourselves</span>
                      <Wallet className="w-4 h-4 text-emerald-400" />
                    </div>
                    <p className="text-2xl lg:text-3xl font-bold font-mono text-emerald-400 tracking-tight">
                      ${totalPaidOutToOurselves.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[11px] text-gray-400 font-mono">
                      Withdrawn & pocketed by Darius & Capitan
                    </p>
                  </div>

                  {/* KPI 3: Liquid Vault Reserve */}
                  <div className="glass-card rounded-2xl p-5 bg-black/60 border border-white/10 space-y-2 relative overflow-hidden group">
                    <div className="flex items-center justify-between text-[11px] text-blue-300 font-semibold uppercase tracking-wider">
                      <span>Liquid Vault Reserve</span>
                      <Coins className="w-4 h-4 text-blue-400" />
                    </div>
                    <p className="text-2xl lg:text-3xl font-bold font-mono text-white tracking-tight">
                      ${pocketLiquidReserve.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Ready for payout or reinvestment
                    </p>
                  </div>

                  {/* KPI 4: Active Fund Holdings */}
                  <div className="glass-card rounded-2xl p-5 bg-black/60 border border-purple-500/30 space-y-2 relative overflow-hidden group">
                    <div className="flex items-center justify-between text-[11px] text-purple-300 font-semibold uppercase tracking-wider">
                      <span>Capital in Hedge Pools</span>
                      <Layers className="w-4 h-4 text-purple-400" />
                    </div>
                    <p className="text-2xl lg:text-3xl font-bold font-mono text-purple-400 tracking-tight">
                      ${pocketCurrentPoolValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[11px] text-gray-400 font-mono">
                      Principal: ${pocketInvestedInPools.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({pocketPoolsProfit >= 0 ? '+' : ''}${pocketPoolsProfit.toFixed(2)})
                    </p>
                  </div>

                  {/* KPI 5: Total Harvested Cuts */}
                  <div className="glass-card rounded-2xl p-5 bg-black/60 border border-white/10 space-y-2 relative overflow-hidden group">
                    <div className="flex items-center justify-between text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
                      <span>Lifetime Profit Cuts</span>
                      <TrendingUp className="w-4 h-4 text-amber-400" />
                    </div>
                    <p className="text-2xl lg:text-3xl font-bold font-mono text-white tracking-tight">
                      ${totalHarvestedFromClients.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[11px] text-gray-400 font-mono">
                      Cumulative performance fees
                    </p>
                  </div>
                </div>

                {/* Partner Ownership Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* Partner 1: Darius */}
                  <div className="glass-card rounded-2xl p-5 bg-black/60 border border-blue-500/30 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">Darius</span>
                        <span className="px-2 py-0.2 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold font-mono">100% CO-OWNER</span>
                      </div>
                      <p className="text-xs text-gray-400">
                        Entitled Net Worth: <strong className="text-white font-mono">${totalPocketWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Lifetime Paid Out</span>
                      <span className="text-base font-bold font-mono text-emerald-400">
                        ${totalPaidOutToOurselves.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Partner 2: Capitan */}
                  <div className="glass-card rounded-2xl p-5 bg-black/60 border border-purple-500/30 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">Capitan</span>
                        <span className="px-2 py-0.2 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-bold font-mono">100% CO-OWNER</span>
                      </div>
                      <p className="text-xs text-gray-400">
                        Entitled Net Worth: <strong className="text-white font-mono">${totalPocketWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Lifetime Paid Out</span>
                      <span className="text-base font-bold font-mono text-emerald-400">
                        ${totalPaidOutToOurselves.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Active Hedge Pool Positions Owned by Founders Profit Pocket */}
                {pocketPoolHoldings.length > 0 && (
                  <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-300 flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5" />
                        Active Hedge Pool Positions Owned by Founders Profit Pocket ({pocketPoolHoldings.length})
                      </h4>
                      <span className="text-xs font-mono font-bold text-white">
                        Total Fund Equity: ${pocketCurrentPoolValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-white/5">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-white/5 text-gray-400 uppercase tracking-wider font-semibold border-b border-white/10">
                          <tr>
                            <th className="py-2.5 px-3">Hedge Pool</th>
                            <th className="py-2.5 px-3">Strategy</th>
                            <th className="py-2.5 px-3">Allocated Principal</th>
                            <th className="py-2.5 px-3">Ownership Split %</th>
                            <th className="py-2.5 px-3">Current Stake Value</th>
                            <th className="py-2.5 px-3">Unrealized ROI</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono text-gray-200">
                          {pocketPoolHoldings.map((h) => (
                            <tr key={h.poolId} className="hover:bg-white/5">
                              <td className="py-3 px-3 font-bold text-white font-sans">
                                {h.poolName}
                              </td>
                              <td className="py-3 px-3 text-gray-400 font-sans">
                                {h.strategy || 'Multi-Asset Fund'}
                              </td>
                              <td className="py-3 px-3">
                                ${h.allocated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-3 px-3 text-blue-400 font-bold">
                                {h.splitPct.toFixed(1)}%
                              </td>
                              <td className="py-3 px-3 font-bold text-white">
                                ${h.currentVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className={`py-3 px-3 font-bold ${h.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {h.profit >= 0 ? '+' : ''}${h.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({h.roiPct.toFixed(1)}%)
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Alert Message for Pocket Actions */}
              {pocketActionStatus && (
                <div className={`p-4 rounded-2xl border text-sm flex items-center justify-between ${
                  pocketActionStatus.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}>
                  <span>{pocketActionStatus.text}</span>
                  <button onClick={() => setPocketActionStatus(null)} className="text-xs opacity-70 hover:opacity-100">Dismiss</button>
                </div>
              )}

              {/* Executive Pocket Controls: Payout & Reinvest into Hedge Pool */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Control 1: Partner Payout (Withdraw from Pocket) */}
                <div className="glass-card rounded-3xl p-8 border border-white/10 space-y-5 bg-gradient-to-b from-red-500/5 to-transparent">
                  <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white">Partner Payout (Withdraw)</h4>
                      <p className="text-xs text-gray-400">Withdraw cash from the Founders Pocket reserve to pay yourselves.</p>
                    </div>
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault()
                      const amt = parseFloat(pocketPayoutAmount)
                      if (isNaN(amt) || amt <= 0) {
                        setPocketActionStatus({ type: 'error', text: 'Please enter a valid payout amount.' })
                        return
                      }
                      setIsExecutingPocket(true)
                      setPocketActionStatus(null)
                      const res = await payoutFromPocketAction(amt, pocketPayoutNote)
                      setIsExecutingPocket(false)
                      if (res.error) {
                        setPocketActionStatus({ type: 'error', text: res.error })
                      } else {
                        setPocketActionStatus({ type: 'success', text: res.success || 'Payout executed!' })
                        setPocketPayoutAmount('')
                        setPocketPayoutNote('')
                        setTimeout(() => window.location.reload(), 1000)
                      }
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                        Withdrawal Amount (USD)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono">$</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={pocketPayoutAmount}
                          onChange={(e) => setPocketPayoutAmount(e.target.value)}
                          className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-red-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                        Distribution Note (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. September Partner Profit Share"
                        value={pocketPayoutNote}
                        onChange={(e) => setPocketPayoutNote(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isExecutingPocket || profitPocketBalance <= 0}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold text-xs tracking-wider uppercase transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Wallet className="w-4 h-4" />
                      {isExecutingPocket ? 'Processing Payout...' : 'Withdraw to Partners (Pay Out)'}
                    </button>
                  </form>
                </div>

                {/* Control 2: Reinvest Pocket into Hedge Pool */}
                <div className="glass-card rounded-3xl p-8 border border-white/10 space-y-5 bg-gradient-to-b from-blue-500/5 to-transparent">
                  <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white">Reinvest Pocket into Hedge</h4>
                      <p className="text-xs text-gray-400">Transfer capital directly from the Pocket into an active Hedge Pool.</p>
                    </div>
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault()
                      const amt = parseFloat(pocketReinvestAmount)
                      if (isNaN(amt) || amt <= 0) {
                        setPocketActionStatus({ type: 'error', text: 'Please enter a valid reinvestment amount.' })
                        return
                      }
                      if (!pocketReinvestPoolId) {
                        setPocketActionStatus({ type: 'error', text: 'Please select a destination Hedge Pool.' })
                        return
                      }
                      setIsExecutingPocket(true)
                      setPocketActionStatus(null)
                      const res = await reinvestPocketIntoPoolAction(amt, pocketReinvestPoolId)
                      setIsExecutingPocket(false)
                      if (res.error) {
                        setPocketActionStatus({ type: 'error', text: res.error })
                      } else {
                        setPocketActionStatus({ type: 'success', text: res.success || 'Reinvested successfully!' })
                        setPocketReinvestAmount('')
                        setTimeout(() => window.location.reload(), 1000)
                      }
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                        Reinvestment Amount (USD)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono">$</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={pocketReinvestAmount}
                          onChange={(e) => setPocketReinvestAmount(e.target.value)}
                          className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                        Target Hedge Pool
                      </label>
                      <select
                        value={pocketReinvestPoolId}
                        onChange={(e) => setPocketReinvestPoolId(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500"
                      >
                        {hedgePools.length === 0 ? (
                          <option value="">No active hedge pools created yet</option>
                        ) : (
                          hedgePools.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (Strategy: {p.strategy || 'Fund'})
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={isExecutingPocket || profitPocketBalance <= 0 || hedgePools.length === 0}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs tracking-wider uppercase transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Layers className="w-4 h-4" />
                      {isExecutingPocket ? 'Transferring Capital...' : 'Inject Pocket into Hedge Pool'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Profit Cut Stream & History Log */}
              <div className="glass-card rounded-3xl p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                  <div>
                    <h4 className="text-2xl font-light text-white flex items-center gap-2.5">
                      <TrendingUp className="w-6 h-6 text-amber-400" />
                      Founders Pocket Master Ledger & Audit Stream
                    </h4>
                    <p className="text-gray-400 text-sm mt-1">
                      Complete real-time record of all profit cut inflows, partner payouts, and fund reinvestments.
                    </p>
                  </div>
                </div>

                {/* Filter and Search Controls for Pocket Ledger */}
                <div className="space-y-3 p-4 bg-black/40 rounded-2xl border border-white/10">
                  <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search by client name, email, or transaction note..."
                        value={pocketSearch}
                        onChange={(e) => setPocketSearch(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-all"
                      />
                      {pocketSearch && (
                        <button
                          onClick={() => setPocketSearch('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Date quick filter */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                      <span className="text-[11px] text-gray-500 uppercase font-semibold mr-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-amber-400" /> Date:
                      </span>
                      {[
                        { id: 'ALL', label: 'All' },
                        { id: 'TODAY', label: 'Today' },
                        { id: '7DAYS', label: '7 Days' },
                        { id: '30DAYS', label: '30 Days' },
                        { id: 'MONTH', label: 'Month' }
                      ].map((d) => (
                        <button
                          key={d.id}
                          onClick={() => setPocketDateFilter(d.id as any)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                            pocketDateFilter === d.id
                              ? 'bg-amber-500 text-black font-semibold shadow-sm'
                              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/5">
                    <span className="text-[11px] text-gray-500 uppercase font-semibold mr-1 flex items-center gap-1">
                      <Filter className="w-3 h-3 text-amber-400" /> Type:
                    </span>
                    {[
                      { id: 'ALL', label: 'All Records', count: profitCutTransactions.length },
                      { id: 'FEE', label: 'Profit Cuts (+ Inflow)', count: profitCutTransactions.filter((t: any) => t.type === 'fee').length },
                      { id: 'PAYOUT', label: 'Partner Payouts (- Outflow)', count: profitCutTransactions.filter((t: any) => t.type === 'pocket_payout').length },
                      { id: 'REINVEST', label: 'Fund Reinvestments (->)', count: profitCutTransactions.filter((t: any) => t.type === 'pocket_reinvest').length }
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setPocketFilterType(f.id as any)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          pocketFilterType === f.id
                            ? 'bg-amber-500 text-black shadow-md'
                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <span>{f.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          pocketFilterType === f.id ? 'bg-black/20 text-black font-bold' : 'bg-white/10 text-gray-400'
                        }`}>
                          {f.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider font-semibold border-b border-white/10">
                      <tr>
                        <th className="py-4 px-6">Timestamp</th>
                        <th className="py-4 px-6">Party / Account</th>
                        <th className="py-4 px-6">Transaction Type</th>
                        <th className="py-4 px-6">Flow Impact</th>
                        <th className="py-4 px-6">Co-Ownership</th>
                        <th className="py-4 px-6">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-200">
                      {filteredPocketTxs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-gray-400 space-y-2">
                            <Coins className="w-8 h-8 text-gray-600 mx-auto" />
                            <p>No transactions match your current search/filter.</p>
                            <button
                              onClick={() => { setPocketSearch(''); setPocketFilterType('ALL'); setPocketDateFilter('ALL'); }}
                              className="text-xs text-amber-400 hover:underline"
                            >
                              Reset Filters
                            </button>
                          </td>
                        </tr>
                      ) : (
                        paginatedPocketTxs.map((tx: any, idx: number) => {
                          const cutAmount = Number(tx.amount || 0)
                          const isFee = tx.type === 'fee'
                          const isPayout = tx.type === 'pocket_payout'
                          const isReinvest = tx.type === 'pocket_reinvest'

                          return (
                            <tr key={tx.id || idx} className="hover:bg-white/5 transition-colors">
                              <td className="py-4 px-6 font-mono text-xs text-gray-400">
                                {new Date(tx.created_at || Date.now()).toLocaleString()}
                              </td>
                              <td className="py-4 px-6 font-medium text-white">
                                {tx.user_name}
                                {tx.user_email && <span className="block text-xs text-gray-500 font-mono">{tx.user_email}</span>}
                              </td>
                              <td className="py-4 px-6">
                                {isFee && (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                    Profit Cut Inflow
                                  </span>
                                )}
                                {isPayout && (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                    Partner Payout
                                  </span>
                                )}
                                {isReinvest && (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide bg-blue-500/20 text-blue-300 border border-blue-500/40">
                                    Hedge Reinvestment
                                  </span>
                                )}
                              </td>
                              <td className={`py-4 px-6 font-mono font-bold text-base ${isFee ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {isFee ? '+' : '-'}${cutAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-4 px-6 font-mono text-xs text-gray-300">
                                <span className="text-emerald-400 font-semibold">100% Darius & Capitan</span>
                              </td>
                              <td className="py-4 px-6">
                                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                  Settled in Vault
                                </span>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPocketPages > 1 && (
                  <div className="flex items-center justify-between text-xs text-gray-400 pt-2 px-1">
                    <span>
                      Page <strong className="text-white">{pocketCurrentPage}</strong> of{' '}
                      <strong className="text-white">{totalPocketPages}</strong> ({filteredPocketTxs.length} total entries)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPocketCurrentPage(p => Math.max(1, p - 1))}
                        disabled={pocketCurrentPage === 1}
                        className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> Previous
                      </button>
                      <button
                        onClick={() => setPocketCurrentPage(p => Math.min(totalPocketPages, p + 1))}
                        disabled={pocketCurrentPage === totalPocketPages}
                        className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1"
                      >
                        Next <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: HEDGE POOLS & MULTI-INVESTOR SPLITS */}
          {activeTab === 'pools' && (
            <HedgePoolsManager pools={hedgePools} clients={clients} />
          )}

          {/* TAB 3: CLIENT SEARCH & DIRECTORY */}
          {activeTab === 'search' && (
            <ClientSearch clients={enrichedClients} />
          )}

          {/* TAB 4: LEDGER & TRANSACTIONS */}
          {activeTab === 'ledger' && (
            <div className="glass-card rounded-3xl p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <h3 className="text-2xl font-light text-white">Master Ledger & Transactions Log</h3>
                  <p className="text-gray-400 text-sm mt-1">Real-time audit log of deposits, withdrawals, fees, and valuation adjustments.</p>
                </div>
              </div>

              {/* Search & Filter Controls for Master Ledger */}
              <div className="space-y-3 p-4 bg-black/40 rounded-2xl border border-white/10">
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search ledger by client, type, or amount..."
                      value={ledgerSearch}
                      onChange={(e) => setLedgerSearch(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all"
                    />
                    {ledgerSearch && (
                      <button
                        onClick={() => setLedgerSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Date quick filter */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                    <span className="text-[11px] text-gray-500 uppercase font-semibold mr-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-blue-400" /> Date:
                    </span>
                    {[
                      { id: 'ALL', label: 'All' },
                      { id: 'TODAY', label: 'Today' },
                      { id: '7DAYS', label: '7 Days' },
                      { id: '30DAYS', label: '30 Days' },
                      { id: 'MONTH', label: 'Month' }
                    ].map((d) => (
                      <button
                        key={d.id}
                        onClick={() => setLedgerDateFilter(d.id as any)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          ledgerDateFilter === d.id
                            ? 'bg-blue-600 text-white font-semibold shadow-sm'
                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/5">
                  <span className="text-[11px] text-gray-500 uppercase font-semibold mr-1 flex items-center gap-1">
                    <Filter className="w-3 h-3 text-blue-400" /> Filter:
                  </span>
                  {[
                    { id: 'ALL', label: 'All Records', count: recentTransactions.length },
                    { id: 'CAPITAL', label: 'Capital Injections', count: recentTransactions.filter((t: any) => (t.type || '').toUpperCase().includes('CAPITAL') || (t.type || '').toUpperCase() === 'DEPOSIT').length },
                    { id: 'WINS', label: 'Trade Wins', count: recentTransactions.filter((t: any) => (t.type || '').toUpperCase().includes('TRADE') && Number(t.amount || 0) >= 0).length },
                    { id: 'LOSSES', label: 'Trade Losses', count: recentTransactions.filter((t: any) => (t.type || '').toUpperCase().includes('TRADE') && Number(t.amount || 0) < 0).length },
                    { id: 'WITHDRAWALS', label: 'Withdrawals', count: recentTransactions.filter((t: any) => (t.type || '').toUpperCase().includes('WITHDRAWAL')).length }
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setLedgerFilterType(f.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        ledgerFilterType === f.id
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span>{f.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        ledgerFilterType === f.id ? 'bg-black/20 text-white font-bold' : 'bg-white/10 text-gray-400'
                      }`}>
                        {f.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider font-semibold border-b border-white/10">
                    <tr>
                      <th className="py-4 px-6">Timestamp</th>
                      <th className="py-4 px-6">Transaction Type</th>
                      <th className="py-4 px-6">Client</th>
                      <th className="py-4 px-6">Amount</th>
                      <th className="py-4 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-200">
                    {filteredLedgerTxs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-gray-400 space-y-2">
                          <p>No transaction activity matching current filters.</p>
                          <button
                            onClick={() => { setLedgerSearch(''); setLedgerFilterType('ALL'); setLedgerDateFilter('ALL'); }}
                            className="text-xs text-blue-400 hover:underline"
                          >
                            Reset Filters
                          </button>
                        </td>
                      </tr>
                    ) : (
                      paginatedLedgerTxs.map((tx: any, idx: number) => {
                        const rawType = (tx.type || '').toUpperCase()
                        const rawAmount = Number(tx.amount || 0)
                        const isCapital = rawType.includes('CAPITAL') || rawType === 'DEPOSIT'
                        const isTrade = rawType.includes('TRADE')
                        const isLoss = isTrade ? rawAmount < 0 : rawType.includes('WITHDRAWAL')
                        const isWin = isTrade && rawAmount >= 0

                        let typeLabel = rawType
                        if (isCapital) typeLabel = 'Capital Injection (Personal -> Fund)'
                        else if (isWin) typeLabel = `Hedge Win (${rawType.replace('TRADE_', '')})`
                        else if (isLoss && isTrade) typeLabel = `Trade Loss (${rawType.replace('TRADE_', '')})`
                        else if (rawType.includes('WITHDRAWAL')) typeLabel = 'Capital Withdrawal'

                        const badgeStyle = isCapital
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : isWin
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-red-500/20 text-red-300 border border-red-500/40'

                        const amountStyle = isCapital
                          ? 'text-amber-400'
                          : isWin
                          ? 'text-emerald-400'
                          : 'text-red-400'

                        const signPrefix = isCapital ? '' : isWin ? '+' : '-'

                        return (
                          <tr key={tx.id || idx} className="hover:bg-white/5 transition-colors">
                            <td className="py-4 px-6 font-mono text-xs text-gray-400">
                              {new Date(tx.created_at || Date.now()).toLocaleString()}
                            </td>
                            <td className="py-4 px-6">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide ${badgeStyle}`}>
                                {isCapital ? <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" /> : isWin ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />}
                                {typeLabel}
                              </span>
                            </td>
                            <td className="py-4 px-6 font-medium text-white">
                              {tx.user_name || tx.user_id || 'System Client'}
                            </td>
                            <td className={`py-4 px-6 font-mono font-bold ${amountStyle}`}>
                              {signPrefix}${Math.abs(rawAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                Settled
                              </span>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalLedgerPages > 1 && (
                <div className="flex items-center justify-between text-xs text-gray-400 pt-2 px-1">
                  <span>
                    Page <strong className="text-white">{ledgerCurrentPage}</strong> of{' '}
                    <strong className="text-white">{totalLedgerPages}</strong> ({filteredLedgerTxs.length} total entries)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setLedgerCurrentPage(p => Math.max(1, p - 1))}
                      disabled={ledgerCurrentPage === 1}
                      className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Previous
                    </button>
                    <button
                      onClick={() => setLedgerCurrentPage(p => Math.min(totalLedgerPages, p + 1))}
                      disabled={ledgerCurrentPage === totalLedgerPages}
                      className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1"
                    >
                      Next <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: STATEMENTS DISPATCH (GRANULAR DEPLOYMENT) */}
          {activeTab === 'statements' && (
            <div className="glass-card rounded-3xl p-8 space-y-6 max-w-3xl mx-auto">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mx-auto">
                  <Mail className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-white">Granular Statement Deployment Engine</h3>
                <p className="text-gray-400 text-sm max-w-lg mx-auto">
                  Deploy monthly portfolio valuation statements globally, to a specific Hedge Pool, or to an individual client.
                </p>
              </div>

              {/* Target Scope Selection */}
              <div className="p-6 bg-black/40 border border-white/10 rounded-2xl space-y-4">
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Select Deployment Target Audience:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => { setDispatchScope('all'); setSelectedTargetId(''); }}
                    className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                      dispatchScope === 'all'
                        ? 'bg-purple-600 text-white border-purple-500 shadow-lg'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    All Fund Clients ({clients.length})
                  </button>

                  <button
                    onClick={() => { setDispatchScope('pool'); setSelectedTargetId(hedgePools[0]?.id || ''); }}
                    className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                      dispatchScope === 'pool'
                        ? 'bg-amber-600 text-white border-amber-500 shadow-lg'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    Specific Hedge Pool
                  </button>

                  <button
                    onClick={() => { setDispatchScope('client'); setSelectedTargetId(clients[0]?.id || ''); }}
                    className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                      dispatchScope === 'client'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-lg'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                    Specific Client
                  </button>
                </div>

                {/* Sub-selector depending on scope */}
                {dispatchScope === 'pool' && (
                  <div className="pt-2">
                    <label className="block text-[11px] text-gray-400 font-semibold mb-1 uppercase">Choose Hedge Pool:</label>
                    <select
                      value={selectedTargetId}
                      onChange={(e) => setSelectedTargetId(e.target.value)}
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      {hedgePools.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.members?.length || 0} Members)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {dispatchScope === 'client' && (
                  <div className="pt-2">
                    <label className="block text-[11px] text-gray-400 font-semibold mb-1 uppercase">Choose Client:</label>
                    <select
                      value={selectedTargetId}
                      onChange={(e) => setSelectedTargetId(e.target.value)}
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.full_name || c.email} ({c.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {statementStatus && (
                <div className={`p-4 rounded-xl text-xs font-medium border text-center ${
                  statementStatus.includes('Error')
                    ? 'bg-red-500/10 border-red-500/30 text-red-300'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                }`}>
                  {statementStatus}
                </div>
              )}

              <div className="flex justify-center">
                <button
                  onClick={handleSendStatements}
                  disabled={isSending}
                  className="px-8 py-3 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {isSending ? 'Deploying Statements...' : `Deploy Statement Payload (${dispatchScope.toUpperCase()})`}
                </button>
              </div>

            </div>
          )}

          {/* TAB 6: WHITELIST & ONBOARDING REQUESTS */}
          {activeTab === 'requests' && (
            <div className="glass-card rounded-3xl p-8 space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Investor Pipeline</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white">Whitelist Onboarding & Access Requests</h3>
                  <p className="text-gray-400 text-sm mt-1">Review incoming investor applications submitted from the landing page, schedule consultations, approve access, or send email responses.</p>
                </div>

                {statementStatus && (
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-medium">
                    {statementStatus}
                  </div>
                )}
              </div>

              {resetRequests.length === 0 ? (
                <div className="p-12 text-center bg-black/40 rounded-3xl border border-dashed border-white/10 space-y-3">
                  <Sparkles className="w-10 h-10 text-gray-500 mx-auto" />
                  <p className="text-base text-gray-300 font-medium">No pending whitelist applications at this moment.</p>
                  <p className="text-xs text-gray-500">Incoming applications submitted from the landing page will appear here automatically.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {resetRequests.map((req: any) => {
                    const isPending = req.status === 'pending'
                    const rawText = req.email || ''
                    const isWhitelistApplication = rawText.startsWith('[APPLY')
                    // Extract email if formatted as [APPLY] Name (email@domain.com) - Capital: $25k...
                    const emailMatch = rawText.match(/\(([^)]+)\)/)
                    const cleanEmail = emailMatch ? emailMatch[1] : (rawText.split(' ')[0] || rawText)

                    return (
                      <div
                        key={req.id}
                        className="p-6 bg-black/50 border border-white/10 rounded-3xl space-y-4 hover:border-white/20 transition-all shadow-xl"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              {/* Request Type Badge */}
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                isWhitelistApplication 
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              }`}>
                                {isWhitelistApplication ? 'Whitelist Application' : 'Password Reset Request'}
                              </span>

                              {/* Status Badge */}
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                isPending ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : req.status === 'rejected' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}>
                                {req.status}
                              </span>

                              <span className="text-xs font-mono text-gray-400 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {new Date(req.created_at).toLocaleString()}
                              </span>
                            </div>

                            <h4 className="text-base font-bold text-white mt-2 font-mono">
                              {rawText}
                            </h4>
                          </div>

                          {/* Delete Request Button */}
                          <button
                            onClick={async () => {
                              if (!confirm(`Are you sure you want to dismiss this request?`)) return
                              setIsSending(true)
                              const res = await deleteResetRequestAction(req.id)
                              setIsSending(false)
                              if (res.error) setStatementStatus(`Error: ${res.error}`)
                              else setStatementStatus('Request dismissed successfully.')
                            }}
                            disabled={isSending}
                            title="Dismiss Request"
                            className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs self-start md:self-center transition-all flex items-center gap-1.5"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="text-[11px] font-medium hidden sm:inline">Dismiss</span>
                          </button>
                        </div>

                        {/* Action Buttons Toolbar */}
                        <div className="flex flex-wrap items-center gap-3 pt-2">
                          {isWhitelistApplication ? (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedRequestForMeeting({ id: req.id, email: cleanEmail, rawText: req.email })
                                }}
                                className="px-4 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center gap-2 transition-all"
                              >
                                <Calendar className="w-4 h-4 text-blue-400" />
                                Schedule Meeting / Google Meet
                              </button>

                              <button
                                onClick={async () => {
                                  setIsSending(true)
                                  const res = await respondToApplicationAction(req.id, cleanEmail, 'approve')
                                  setIsSending(false)
                                  if (res.error) setStatementStatus(`Error: ${res.error}`)
                                  else setStatementStatus(res.success || 'Approved!')
                                }}
                                disabled={isSending}
                                className="px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 transition-all"
                              >
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                Approve & Send Access Link
                              </button>

                              <button
                                onClick={async () => {
                                  if (!confirm(`Are you sure you want to decline application for ${cleanEmail}?`)) return
                                  setIsSending(true)
                                  const res = await respondToApplicationAction(req.id, cleanEmail, 'decline')
                                  setIsSending(false)
                                  if (res.error) setStatementStatus(`Error: ${res.error}`)
                                  else setStatementStatus(res.success || 'Declined.')
                                }}
                                disabled={isSending}
                                className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2 transition-all"
                              >
                                <XCircle className="w-4 h-4 text-red-400" />
                                Decline Application
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={async () => {
                                  setIsSending(true)
                                  const res = await approveResetRequestAction(req.id, cleanEmail)
                                  setIsSending(false)
                                  if (res.error) setStatementStatus(`Error: ${res.error}`)
                                  else setStatementStatus(res.success || 'Password reset approved & email sent!')
                                }}
                                disabled={isSending}
                                className="px-4 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center gap-2 transition-all"
                              >
                                <Key className="w-4 h-4 text-blue-400" />
                                Send Password Reset Link
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      </main>

      {/* Modal: Schedule Consultation Meeting & Email Invitation */}
      {selectedRequestForMeeting && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-8 max-w-lg w-full space-y-6 border border-white/10 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  Schedule Consultation Meeting
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Send email invitation to <strong>{selectedRequestForMeeting.email}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedRequestForMeeting(null)}
                className="w-8 h-8 rounded-full bg-white/10 text-gray-400 hover:text-white flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault()
                setIsSending(true)
                const fullFormattedDate = `${meetingDay} ${meetingMonth} ${meetingYear} at ${meetingTimeInput}`
                const res = await respondToApplicationAction(
                  selectedRequestForMeeting.id,
                  selectedRequestForMeeting.email,
                  'schedule_meeting',
                  {
                    meetingDate: fullFormattedDate,
                    meetingType: meetingTypeInput,
                    meetingLink: meetingLinkInput,
                    customMessage: meetingNotesInput
                  }
                )
                setIsSending(false)
                setSelectedRequestForMeeting(null)
                if (res.error) setStatementStatus(`Error: ${res.error}`)
                else setStatementStatus(res.success || 'Meeting invitation sent!')
              }}
              className="space-y-4 text-left"
            >
              {/* Day, Month, Year Scrollable Pickers */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Meeting Date (Day / Month / Year)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Day Dropdown */}
                  <div>
                    <select
                      value={meetingDay}
                      onChange={(e) => setMeetingDay(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-blue-500 max-h-48 overflow-y-auto"
                    >
                      {daysList.map((d) => (
                        <option key={d} value={d}>Day {d}</option>
                      ))}
                    </select>
                  </div>

                  {/* Month Dropdown */}
                  <div>
                    <select
                      value={meetingMonth}
                      onChange={(e) => setMeetingMonth(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-blue-500 max-h-48 overflow-y-auto"
                    >
                      {monthsList.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  {/* Year Dropdown */}
                  <div>
                    <select
                      value={meetingYear}
                      onChange={(e) => setMeetingYear(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                    >
                      {yearsList.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 15-Minute Time Slot Picker */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Time Slot (15-Minute Intervals)
                </label>
                <select
                  value={meetingTimeInput}
                  onChange={(e) => setMeetingTimeInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-blue-500 max-h-56 overflow-y-auto"
                >
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Consultation Format / Venue
                </label>
                <select
                  value={meetingTypeInput}
                  onChange={(e) => setMeetingTypeInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="Google Meet Online Video Call">Google Meet Video Call</option>
                  <option value="In-Person Private Office Meeting">In-Person Private Office Meeting</option>
                  <option value="Direct Phone Call Consultation">Direct Phone Call Consultation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Google Meet / Meeting Link (Optional)
                </label>
                <input
                  type="url"
                  value={meetingLinkInput}
                  onChange={(e) => setMeetingLinkInput(e.target.value)}
                  placeholder="https://meet.google.com/xyz-abc-123"
                  className="w-full px-4 py-3 rounded-xl glass-input text-sm font-mono text-blue-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Custom Invitation Message
                </label>
                <textarea
                  value={meetingNotesInput}
                  onChange={(e) => setMeetingNotesInput(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setSelectedRequestForMeeting(null)}
                  className="px-5 py-2.5 rounded-xl bg-white/10 text-white text-xs font-medium hover:bg-white/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold disabled:opacity-50 shadow-lg flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  {isSending ? 'Sending Invitation...' : 'Send Meeting Invitation Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
