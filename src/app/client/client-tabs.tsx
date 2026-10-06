'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Layers,
  FileText,
  Download,
  Wallet,
  TrendingUp,
  Activity,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Calendar
} from 'lucide-react'
import ClientChart from './client-chart'
import ClientHedgePools from './client-hedge-pools'
import PDFStatementModal from '@/components/pdf-statement-modal'
import { HedgePool } from '@/lib/hedge-pools'

interface ClientTabsProps {
  currentUserId: string
  fullName: string
  totalInvested: number
  currentBalance: number
  allTimeRoi: number
  roiPercentage: number
  ledgerData: any[]
  hedgePools: HedgePool[]
  userTransactions?: any[]
}

export default function ClientTabs({
  currentUserId,
  fullName,
  totalInvested,
  currentBalance,
  allTimeRoi,
  roiPercentage,
  ledgerData,
  hedgePools,
  userTransactions = []
}: ClientTabsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'hedges' | 'activity' | 'reports'>('overview')

  // Persist active tab across page refreshes and navigation
  useEffect(() => {
    const validTabs = ['overview', 'hedges', 'activity', 'reports']
    const searchParams = new URLSearchParams(window.location.search)
    const tabParam = searchParams.get('tab')
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam as any)
      localStorage.setItem('hedge_client_active_tab', tabParam)
      return
    }

    const saved = localStorage.getItem('hedge_client_active_tab')
    if (saved && validTabs.includes(saved)) {
      setActiveTab(saved as any)
      const url = new URL(window.location.href)
      url.searchParams.set('tab', saved)
      window.history.replaceState({}, '', url.toString())
    }
  }, [])

  const handleTabChange = (tabId: 'overview' | 'hedges' | 'activity' | 'reports') => {
    setActiveTab(tabId)
    localStorage.setItem('hedge_client_active_tab', tabId)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', tabId)
    window.history.replaceState({}, '', url.toString())
  }

  const [timeframe, setTimeframe] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>('ALL')
  const [showPDFModal, setShowPDFModal] = useState(false)

  const isProfitable = allTimeRoi >= 0

  const tabs = [
    { id: 'overview', label: 'Portfolio Overview', icon: LayoutDashboard },
    { id: 'hedges', label: 'My Pooled Hedges', icon: Layers, badge: hedgePools.length },
    { id: 'activity', label: 'Transactions & Ledger', icon: FileText },
    { id: 'reports', label: 'Statements & Reports', icon: Download }
  ]

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Desktop Client Tab Bar */}
      <div className="hidden md:flex glass rounded-2xl p-2 items-center gap-2 overflow-x-auto border border-white/10">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`relative flex items-center gap-2.5 px-6 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 whitespace-nowrap ${
                isActive
                  ? 'text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="clientTabGlow"
                  className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-xl"
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                {tab.label}
                {tab.badge !== undefined && (
                  <span
                    className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-gray-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>

      {/* Mobile Top Segmented Quick Switcher */}
      <div className="md:hidden flex items-center p-1 bg-black/60 border border-white/10 rounded-2xl overflow-x-auto gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`flex-1 min-w-[76px] py-2 px-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.id === 'overview' ? 'Overview' : tab.id === 'hedges' ? 'Hedges' : tab.id === 'activity' ? 'Activity' : 'Reports'}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 sm:space-y-8">
              
              {/* MOBILE DECLUTTERED KPI VIEW (< 768px) */}
              <div className="md:hidden space-y-3">
                {/* Hero Net Worth Card */}
                <div className="glass-card rounded-2xl p-5 relative overflow-hidden border-l-4 border-l-blue-500">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-blue-300">Portfolio Net Worth</span>
                    <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live
                    </span>
                  </div>
                  <p className="text-3xl font-bold font-mono tracking-tight text-white">
                    ${currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    Real-time valuation across all allocations
                  </p>
                </div>

                {/* 2-Column Compact Side-by-Side Metrics */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3.5 bg-black/50 border border-white/10 rounded-2xl border-l-2 border-l-purple-500">
                    <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider block mb-1">Principal</span>
                    <p className="text-base sm:text-lg font-bold font-mono text-white truncate">
                      ${totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <span className="text-[9px] text-emerald-400 font-semibold mt-1 inline-block">Tier 1 Secured</span>
                  </div>

                  <div className="p-3.5 bg-black/50 border border-white/10 rounded-2xl border-l-2 border-l-emerald-500">
                    <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider block mb-1">Cumulative ROI</span>
                    <p className={`text-base sm:text-lg font-bold font-mono truncate ${isProfitable ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isProfitable ? '+' : '-'}${Math.abs(allTimeRoi).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <span className={`text-[9px] font-bold mt-1 inline-flex items-center gap-0.5 ${isProfitable ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isProfitable ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingUp className="w-2.5 h-2.5 rotate-180" />}
                      {Math.abs(roiPercentage).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* DESKTOP FINANCIAL SUMMARY CARDS (>= 768px) */}
              <div className="hidden md:grid md:grid-cols-3 gap-6">
                <div className="glass-card rounded-3xl p-8 relative overflow-hidden group border-l-4 border-l-blue-500">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
                    <Wallet className="w-32 h-32 text-blue-400" />
                  </div>
                  <p className="text-blue-300 text-xs font-semibold uppercase tracking-widest mb-3">Portfolio Net Worth</p>
                  <p className="text-5xl font-bold text-white tracking-tight">
                    ${currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <div className="mt-6 flex items-center gap-2 text-xs text-blue-200/70">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <span>Real-time mark-to-market valuation</span>
                  </div>
                </div>

                <div className="glass-card rounded-3xl p-8 flex flex-col justify-between border-l-4 border-l-purple-500">
                  <div>
                    <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-3">Principal Invested</p>
                    <p className="text-4xl font-light text-white tracking-tight font-mono">
                      ${totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="mt-8 space-y-2">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Capital Safety Level</span>
                      <span className="text-emerald-400 font-semibold">Tier 1 Secured</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full w-full" />
                    </div>
                  </div>
                </div>

                <div className="glass-card rounded-3xl p-8 flex flex-col justify-between border-l-4 border-l-emerald-500">
                  <div>
                    <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-3">All-Time Cumulative ROI</p>
                    <p className={`text-4xl font-bold tracking-tight font-mono ${isProfitable ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isProfitable ? '+' : '-'}${Math.abs(allTimeRoi).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="mt-8 flex items-center gap-3">
                    <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                      isProfitable ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {isProfitable ? <TrendingUp className="w-4 h-4" /> : <TrendingUp className="w-4 h-4 rotate-180" />}
                      {Math.abs(roiPercentage).toFixed(2)}%
                    </div>
                    <span className="text-xs text-gray-400">vs invested capital</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Chart Container */}
              <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-8 space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <div>
                    <h3 className="text-lg sm:text-2xl font-light tracking-tight text-white">Performance Trajectory</h3>
                    <p className="text-gray-400 text-xs sm:text-sm mt-0.5">Historic valuation curve across all assigned hedge allocations.</p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-start gap-1 bg-black/50 border border-white/10 rounded-xl p-1 w-full sm:w-auto">
                    {(['1M', '3M', '6M', '1Y', 'ALL'] as const).map((tf) => (
                      <button
                        key={tf}
                        onClick={() => setTimeframe(tf)}
                        className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          timeframe === tf
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-[260px] sm:h-[340px] md:h-[400px] w-full pt-2 sm:pt-4">
                  <ClientChart data={ledgerData || []} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MY POOLED HEDGES */}
          {activeTab === 'hedges' && (
            <ClientHedgePools pools={hedgePools} currentUserId={currentUserId} />
          )}

          {/* TAB 3: TRANSACTIONS & ACTIVITY */}
          {activeTab === 'activity' && (
            <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-8 space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 border-b border-white/10 pb-4 sm:pb-6">
                <div>
                  <h3 className="text-lg sm:text-2xl font-light text-white">Account Activity & Ledger History</h3>
                  <p className="text-gray-400 text-xs sm:text-sm mt-0.5">Verified audit history of deposits, withdrawals, fee structures, and valuation points.</p>
                </div>
              </div>

              {/* Mobile Cardified Transaction List (< 768px) */}
              <div className="md:hidden space-y-3">
                {userTransactions.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-xs bg-black/40 rounded-2xl border border-white/10">
                    No recent transactions recorded for this profile.
                  </div>
                ) : (
                  userTransactions.map((tx: any, idx: number) => {
                    const rawType = (tx.type || '').toUpperCase()
                    const rawAmount = Number(tx.amount || 0)
                    
                    const isCapital = rawType.includes('CAPITAL') || rawType === 'DEPOSIT'
                    const isTrade = rawType.includes('TRADE')
                    const isLoss = isTrade ? rawAmount < 0 : rawType.includes('WITHDRAWAL')
                    const isWin = isTrade && rawAmount >= 0

                    let labelText = rawType
                    if (isCapital) labelText = 'Capital Injection'
                    else if (isWin) labelText = `Hedge Win (${rawType.replace('TRADE_', '')})`
                    else if (isLoss && isTrade) labelText = `Trade Loss (${rawType.replace('TRADE_', '')})`
                    else if (rawType.includes('WITHDRAWAL')) labelText = 'Capital Withdrawal'

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
                      <div key={tx.id || idx} className="p-4 bg-black/50 border border-white/10 rounded-2xl space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono text-gray-400 text-[11px]">
                            {new Date(tx.created_at || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Verified
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badgeStyle}`}>
                            {isCapital ? <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" /> : isWin ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />}
                            {labelText}
                          </span>
                          <span className={`text-base font-mono font-bold ${amountStyle}`}>
                            {signPrefix}${Math.abs(rawAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Desktop Transaction Table (>= 768px) */}
              <div className="hidden md:block overflow-x-auto rounded-2xl border border-white/10 bg-black/40">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider font-semibold border-b border-white/10">
                    <tr>
                      <th className="py-4 px-6">Date</th>
                      <th className="py-4 px-6">Activity Type</th>
                      <th className="py-4 px-6">Amount</th>
                      <th className="py-4 px-6">Audit Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-200">
                    {userTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-gray-400">
                          No recent transactions recorded for this profile.
                        </td>
                      </tr>
                    ) : (
                      userTransactions.map((tx: any, idx: number) => {
                        const rawType = (tx.type || '').toUpperCase()
                        const rawAmount = Number(tx.amount || 0)
                        
                        const isCapital = rawType.includes('CAPITAL') || rawType === 'DEPOSIT'
                        const isTrade = rawType.includes('TRADE')
                        const isLoss = isTrade ? rawAmount < 0 : rawType.includes('WITHDRAWAL')
                        const isWin = isTrade && rawAmount >= 0

                        let labelText = rawType
                        if (isCapital) labelText = 'Capital Injection (Personal -> Fund)'
                        else if (isWin) labelText = `Hedge Win (${rawType.replace('TRADE_', '')})`
                        else if (isLoss && isTrade) labelText = `Trade Loss (${rawType.replace('TRADE_', '')})`
                        else if (rawType.includes('WITHDRAWAL')) labelText = 'Capital Withdrawal'

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
                              {new Date(tx.created_at || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </td>
                            <td className="py-4 px-6">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${badgeStyle}`}>
                                {isCapital ? <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" /> : isWin ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />}
                                {labelText}
                              </span>
                            </td>
                            <td className={`py-4 px-6 font-mono font-bold ${amountStyle}`}>
                              {signPrefix}${Math.abs(rawAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Verified
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

          {/* TAB 4: STATEMENTS & REPORTS */}
          {activeTab === 'reports' && (
            <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-8 space-y-4 sm:space-y-6 max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-white/10 pb-4 sm:pb-6">
                <div>
                  <h3 className="text-lg sm:text-2xl font-bold text-white">Monthly Statements & Audited Reports</h3>
                  <p className="text-gray-400 text-xs sm:text-sm mt-0.5">Download official portfolio performance updates, valuation statements, and audited summaries.</p>
                </div>
                <button
                  onClick={() => setShowPDFModal(true)}
                  className="w-full sm:w-auto px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-xl flex items-center justify-center gap-2 transition-all shrink-0"
                >
                  <Download className="w-4 h-4" />
                  Generate Official PDF Statement
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {[
                  { title: 'August 2026 Institutional Performance Report', date: 'August 2026', type: 'PDF Summary', size: '2.4 MB' },
                  { title: 'July 2026 Monthly Statement & Yield Distribution', date: 'July 2026', type: 'PDF Statement', size: '1.8 MB' },
                  { title: 'June 2026 Monthly Statement', date: 'June 2026', type: 'PDF Statement', size: '1.7 MB' },
                  { title: 'Annual Tax Assessment (K-1 Schedule Draft)', date: 'Tax Year 2025', type: 'Tax Filing', size: '3.1 MB' },
                ].map((doc, idx) => (
                  <div key={idx} className="p-4 sm:p-5 bg-black/40 border border-white/10 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-blue-500/40 transition-all group">
                    <div className="space-y-1">
                      <h4 className="text-xs sm:text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">{doc.title}</h4>
                      <p className="text-[11px] sm:text-xs text-gray-400 flex items-center gap-2">
                        <span>{doc.date}</span> • <span>{doc.size}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => setShowPDFModal(true)}
                      className="w-full sm:w-auto px-3 py-2 rounded-xl bg-white/5 hover:bg-blue-600 hover:text-white text-gray-300 transition-all flex items-center justify-center gap-1.5 text-xs font-semibold shrink-0"
                      title="Download PDF"
                    >
                      <Download className="w-3.5 h-3.5" /> PDF
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Sticky Bottom Navigation Bar for Mobile (< 768px) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#030712]/95 backdrop-blur-2xl border-t border-white/10 px-2 py-2 flex items-center justify-around shadow-[0_-10px_25px_rgba(0,0,0,0.7)]">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all relative ${
                isActive ? 'text-blue-400 font-semibold' : 'text-gray-400 hover:text-white'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'text-blue-400 scale-110' : 'text-gray-400'}`} />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-blue-600 text-white">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight font-medium">
                {tab.id === 'overview' ? 'Overview' : tab.id === 'hedges' ? 'Hedges' : tab.id === 'activity' ? 'Activity' : 'Reports'}
              </span>
              {isActive && (
                <motion.div
                  layoutId="mobileActiveTabIndicator"
                  className="absolute bottom-0 w-8 h-0.5 bg-blue-500 rounded-full"
                />
              )}
            </button>
          )
        })}
      </nav>

      {/* PDF Statement Generator Modal */}
      <PDFStatementModal
        isOpen={showPDFModal}
        onClose={() => setShowPDFModal(false)}
        clientName={fullName}
        clientEmail="investor@hedge.com"
        currentValue={currentBalance}
        investedAmount={totalInvested}
        pools={hedgePools}
      />
    </div>
  )
}
