'use client'

import { useState } from 'react'
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
    <div className="space-y-8">
      {/* Client Tab Bar */}
      <div className="glass rounded-2xl p-2 flex items-center gap-2 overflow-x-auto border border-white/10">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
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

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
        >
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Financial Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <div className="glass-card rounded-3xl p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-light tracking-tight text-white">Performance Trajectory</h3>
                    <p className="text-gray-400 text-sm mt-1">Historic valuation curve across all assigned hedge allocations.</p>
                  </div>

                  <div className="flex items-center gap-1 bg-black/50 border border-white/10 rounded-xl p-1">
                    {(['1M', '3M', '6M', '1Y', 'ALL'] as const).map((tf) => (
                      <button
                        key={tf}
                        onClick={() => setTimeframe(tf)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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

                <div className="h-[400px] w-full pt-4">
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
            <div className="glass-card rounded-3xl p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <h3 className="text-2xl font-light text-white">Account Activity & Ledger History</h3>
                  <p className="text-gray-400 text-sm mt-1">Verified audit history of deposits, withdrawals, fee structures, and valuation points.</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40">
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
            <div className="glass-card rounded-3xl p-8 space-y-6 max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white">Monthly Statements & Audited Reports</h3>
                  <p className="text-gray-400 text-sm mt-1">Download official portfolio performance updates, valuation statements, and audited summaries.</p>
                </div>
                <button
                  onClick={() => setShowPDFModal(true)}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-xl flex items-center gap-2 transition-all shrink-0"
                >
                  <Download className="w-4 h-4" />
                  Generate Official PDF Statement
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: 'August 2026 Institutional Performance Report', date: 'August 2026', type: 'PDF Summary', size: '2.4 MB' },
                  { title: 'July 2026 Monthly Statement & Yield Distribution', date: 'July 2026', type: 'PDF Statement', size: '1.8 MB' },
                  { title: 'June 2026 Monthly Statement', date: 'June 2026', type: 'PDF Statement', size: '1.7 MB' },
                  { title: 'Annual Tax Assessment (K-1 Schedule Draft)', date: 'Tax Year 2025', type: 'Tax Filing', size: '3.1 MB' },
                ].map((doc, idx) => (
                  <div key={idx} className="p-5 bg-black/40 border border-white/10 rounded-2xl flex items-center justify-between hover:border-blue-500/40 transition-all group">
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">{doc.title}</h4>
                      <p className="text-xs text-gray-400 flex items-center gap-2">
                        <span>{doc.date}</span> • <span>{doc.size}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => setShowPDFModal(true)}
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-blue-600 hover:text-white text-gray-300 transition-all flex items-center gap-1 text-xs font-semibold"
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
