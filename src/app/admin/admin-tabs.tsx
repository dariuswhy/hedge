'use client'

import { useState } from 'react'
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
  Crown
} from 'lucide-react'
import AdminForms from './admin-forms'
import ClientSearch from './client-search'
import HedgePoolsManager from './hedge-pools-manager'
import { HedgePool } from '@/lib/hedge-pools'
import { sendStatements } from './actions'
import { approveResetRequestAction, respondToApplicationAction } from '../login/actions'

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
  
  // Statement dispatch scope state
  const [dispatchScope, setDispatchScope] = useState<'all' | 'pool' | 'client'>('all')
  const [selectedTargetId, setSelectedTargetId] = useState<string>('')
  const [statementStatus, setStatementStatus] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)

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

  // Map clients to enhanced structure for search
  const enrichedClients = clients.map((c) => {
    const totalInvested = c.totalInvested || 100000
    const currentBalance = c.currentBalance || 118500
    const roiAmount = currentBalance - totalInvested
    const roiPercent = totalInvested > 0 ? (roiAmount / totalInvested) * 100 : 0
    return {
      id: c.id,
      full_name: c.full_name,
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
                onClick={() => setActiveTab(tab.id as any)}
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
                      <span className="text-xs text-gray-400">Co-owned: Darius (50%) & Dionica (50%)</span>
                    </div>
                    <h4 className="text-xl font-bold text-white mt-1">Founders Profit Pocket</h4>
                    <p className="text-xs text-gray-400">Automated accumulation of all client profit cuts and management fees.</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Total Pocket Reserve</p>
                    <p className="text-2xl font-bold font-mono text-amber-300">
                      ${profitPocketBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[11px] font-mono text-gray-400">
                      ${(profitPocketBalance / 2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} each
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveTab('pocket')}
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
                        <span className="text-xs text-gray-400 flex items-center gap-1 font-mono">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          Multi-Admin Synchronized
                        </span>
                      </div>
                      <h3 className="text-3xl font-light text-white tracking-tight">
                        Founders Profit Pocket
                      </h3>
                      <p className="text-gray-400 text-sm mt-1">
                        Centralized treasury co-owned by <strong>Darius Neagu</strong> and <strong>Dionica</strong>. All profit cuts executed on client portfolios automatically pool here.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3 Main Pocket KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  {/* Total Pocket Balance */}
                  <div className="glass-card rounded-2xl p-6 bg-black/60 border border-amber-500/40 space-y-2 relative overflow-hidden group">
                    <div className="flex items-center justify-between text-xs text-amber-300 font-semibold uppercase tracking-wider">
                      <span>Total Pocket Reserve</span>
                      <Coins className="w-4 h-4 text-amber-400" />
                    </div>
                    <p className="text-3xl font-bold font-mono text-white tracking-tight">
                      ${profitPocketBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-400 font-mono">
                      {profitCutTransactions.length} total profit cut(s) captured
                    </p>
                  </div>

                  {/* Partner 1: Darius Neagu (50%) */}
                  <div className="glass-card rounded-2xl p-6 bg-black/60 border border-blue-500/30 space-y-2 relative overflow-hidden group">
                    <div className="flex items-center justify-between text-xs text-blue-300 font-semibold uppercase tracking-wider">
                      <span>Darius Neagu Allocation</span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold font-mono">50% SHARE</span>
                    </div>
                    <p className="text-3xl font-bold font-mono text-blue-400 tracking-tight">
                      ${(profitPocketBalance / 2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-400 font-mono flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      Managing Partner & Co-Founder
                    </p>
                  </div>

                  {/* Partner 2: Dionica (50%) */}
                  <div className="glass-card rounded-2xl p-6 bg-black/60 border border-purple-500/30 space-y-2 relative overflow-hidden group">
                    <div className="flex items-center justify-between text-xs text-purple-300 font-semibold uppercase tracking-wider">
                      <span>Dionica Allocation</span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-bold font-mono">50% SHARE</span>
                    </div>
                    <p className="text-3xl font-bold font-mono text-purple-400 tracking-tight">
                      ${(profitPocketBalance / 2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-400 font-mono flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-400" />
                      Co-Managing Partner & Co-Founder
                    </p>
                  </div>
                </div>
              </div>

              {/* Profit Cut Stream & History Log */}
              <div className="glass-card rounded-3xl p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                  <div>
                    <h4 className="text-2xl font-light text-white flex items-center gap-2.5">
                      <TrendingUp className="w-6 h-6 text-amber-400" />
                      Profit Cut Capture Audit Stream
                    </h4>
                    <p className="text-gray-400 text-sm mt-1">
                      Real-time audit log of all profit cut fees deducted from clients and channeled into the Founders Pocket.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider font-semibold border-b border-white/10">
                      <tr>
                        <th className="py-4 px-6">Timestamp</th>
                        <th className="py-4 px-6">Client / Account</th>
                        <th className="py-4 px-6">Source Action</th>
                        <th className="py-4 px-6">Profit Cut Amount</th>
                        <th className="py-4 px-6">Pocket Allocation (50/50)</th>
                        <th className="py-4 px-6">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-200">
                      {profitCutTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-gray-400 space-y-2">
                            <Coins className="w-8 h-8 text-gray-600 mx-auto" />
                            <p>No profit cuts have been recorded in the pocket yet.</p>
                            <p className="text-xs text-gray-500">
                              When you process a "Profit Cut" on any client account in <strong>Process Transaction</strong>, it will automatically credit into this pocket.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        profitCutTransactions.map((tx: any, idx: number) => {
                          const cutAmount = Number(tx.amount || 0)
                          const halfCut = cutAmount / 2

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
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                  Profit Cut Fee
                                </span>
                              </td>
                              <td className="py-4 px-6 font-mono font-bold text-emerald-400 text-base">
                                +${cutAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-4 px-6 font-mono text-xs text-gray-300">
                                <span className="text-blue-400">Darius: +${halfCut.toFixed(2)}</span>
                                <span className="mx-1 text-gray-600">|</span>
                                <span className="text-purple-400">Dionica: +${halfCut.toFixed(2)}</span>
                              </td>
                              <td className="py-4 px-6">
                                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                  Secured in Pocket
                                </span>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
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
                    {recentTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-gray-400">
                          No transaction activity recorded in ledger yet.
                        </td>
                      </tr>
                    ) : (
                      recentTransactions.map((tx: any, idx: number) => {
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

                        // 3-Color Financial System:
                        // Capital -> Amber / Gold
                        // Win Trade -> Emerald Green
                        // Loss Trade / Withdrawal -> Red
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
                        </div>

                        {/* Action Buttons Toolbar */}
                        <div className="flex flex-wrap items-center gap-3 pt-2">
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
