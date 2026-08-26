'use client'

import { useState, useMemo } from 'react'
import { Search, Filter, ArrowUpDown, UserCheck, Wallet, TrendingUp, Layers, ChevronRight, Sparkles, DollarSign, Mail } from 'lucide-react'
import Link from 'next/link'

interface ClientItem {
  id: string
  full_name: string | null
  email: string | null
  totalInvested: number
  currentBalance: number
  roiAmount: number
  roiPercent: number
  poolNames?: string[]
}

interface ClientSearchProps {
  clients: ClientItem[]
}

export default function ClientSearch({ clients }: ClientSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'hnw' | 'positive_roi' | 'pooled'>('all')
  const [sortBy, setSortBy] = useState<'balance' | 'name' | 'roi' | 'invested'>('balance')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [activeModalClient, setActiveModalClient] = useState<ClientItem | null>(null)

  const filteredClients = useMemo(() => {
    return clients
      .filter((client) => {
        const query = searchQuery.toLowerCase().trim()
        const matchesQuery =
          !query ||
          (client.full_name && client.full_name.toLowerCase().includes(query)) ||
          (client.email && client.email.toLowerCase().includes(query)) ||
          client.id.toLowerCase().includes(query)

        if (!matchesQuery) return false

        if (selectedFilter === 'hnw') return client.currentBalance >= 50000
        if (selectedFilter === 'positive_roi') return client.roiAmount > 0
        if (selectedFilter === 'pooled') return (client.poolNames && client.poolNames.length > 0)

        return true
      })
      .sort((a, b) => {
        let valA = 0
        let valB = 0

        if (sortBy === 'balance') {
          valA = a.currentBalance
          valB = b.currentBalance
        } else if (sortBy === 'invested') {
          valA = a.totalInvested
          valB = b.totalInvested
        } else if (sortBy === 'roi') {
          valA = a.roiPercent
          valB = b.roiPercent
        } else if (sortBy === 'name') {
          const nameA = a.full_name || a.email || ''
          const nameB = b.full_name || b.email || ''
          return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
        }

        return sortOrder === 'asc' ? valA - valB : valB - valA
      })
  }, [clients, searchQuery, selectedFilter, sortBy, sortOrder])

  const totalFilteredValue = filteredClients.reduce((acc, c) => acc + c.currentBalance, 0)
  const avgFilteredRoi = filteredClients.length > 0
    ? filteredClients.reduce((acc, c) => acc + c.roiPercent, 0) / filteredClients.length
    : 0

  return (
    <div className="space-y-8">
      {/* Header Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-6 border-l-4 border-l-blue-500">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Matched Clients</p>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-white">{filteredClients.length}</span>
            <span className="text-xs text-gray-400">of {clients.length} total</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 border-l-4 border-l-purple-500">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Aggregate Capital</p>
          <span className="text-3xl font-bold text-white tracking-tight">
            ${totalFilteredValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className="glass-card rounded-2xl p-6 border-l-4 border-l-emerald-500">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Average ROI</p>
          <span className={`text-3xl font-bold tracking-tight ${avgFilteredRoi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {avgFilteredRoi >= 0 ? '+' : ''}{avgFilteredRoi.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Control Bar: Search Input, Filters, Sort */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by client name, email or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-black/50 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                selectedFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              All Clients
            </button>
            <button
              onClick={() => setSelectedFilter('hnw')}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                selectedFilter === 'hnw'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              HNW ($50k+)
            </button>
            <button
              onClick={() => setSelectedFilter('positive_roi')}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                selectedFilter === 'positive_roi'
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              Profitable ROI
            </button>
            <button
              onClick={() => setSelectedFilter('pooled')}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                selectedFilter === 'pooled'
                  ? 'bg-amber-600 text-white shadow-lg'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              In Pooled Hedges
            </button>
          </div>

          {/* Sorting Controller */}
          <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3" /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="balance">Current Balance</option>
              <option value="invested">Total Invested</option>
              <option value="roi">ROI %</option>
              <option value="name">Client Name</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 transition-colors text-xs font-mono"
            >
              {sortOrder.toUpperCase()}
            </button>
          </div>
        </div>
      </div>

      {/* Client Search Cards / Table Grid */}
      {filteredClients.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center space-y-4">
          <UserCheck className="w-12 h-12 text-gray-500 mx-auto" />
          <h3 className="text-xl font-medium text-white">No Clients Found</h3>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            No matching investor accounts found for standard query "{searchQuery}". Try broadening your search or resetting filters.
          </p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedFilter('all'); }}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-full text-xs font-medium hover:bg-blue-500 transition-all"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => {
            const isProfitable = client.roiAmount >= 0
            return (
              <div
                key={client.id}
                className="glass-card rounded-2xl p-6 flex flex-col justify-between group hover:border-blue-500/40 transition-all duration-300 relative overflow-hidden"
              >
                {/* Accent glow on hover */}
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all" />

                <div>
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm shrink-0">
                        {(client.full_name || client.email || 'C')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                          {client.full_name || 'Unnamed Investor'}
                        </h4>
                        <p className="text-xs text-gray-400 flex items-center gap-1 truncate" title={client.email || ''}>
                          <Mail className="w-3 h-3 text-gray-500 shrink-0" />
                          <span className="truncate">{client.email}</span>
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 whitespace-nowrap ${
                      client.currentBalance >= 50000
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}>
                      {client.currentBalance >= 50000 ? 'HNW Tier' : 'Standard'}
                    </span>
                  </div>

                  {/* Financial Overview Cards */}
                  <div className="space-y-2.5 my-4 p-3.5 bg-black/50 rounded-2xl border border-white/10">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Current Value</span>
                      <span className="text-sm font-bold text-white font-mono whitespace-nowrap">
                        ${client.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                      <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Total ROI</span>
                      <span className={`text-sm font-bold font-mono whitespace-nowrap ${isProfitable ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isProfitable ? '+' : ''}${client.roiAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span className="text-[10px] ml-1 font-normal text-gray-300">({client.roiPercent.toFixed(1)}%)</span>
                      </span>
                    </div>
                  </div>

                  {/* Pooled Hedge Badges */}
                  {client.poolNames && client.poolNames.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {client.poolNames.map((name, idx) => (
                        <span key={idx} className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Layers className="w-2.5 h-2.5 text-amber-400" />
                          {name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-4 border-t border-white/5 flex items-center justify-between mt-2">
                  <span className="text-[11px] text-gray-500 font-mono">
                    ID: {client.id.slice(0, 8)}...
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveModalClient(client)}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium transition-colors"
                    >
                      Quick Stats
                    </button>
                    <Link
                      href={`/admin/clients/${client.id}`}
                      className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-medium border border-blue-500/30 flex items-center gap-1 transition-all"
                    >
                      Manage <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Quick Stats Modal */}
      {activeModalClient && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-8 max-w-lg w-full space-y-6 border border-white/10 shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{activeModalClient.full_name || 'Client Details'}</h3>
                <p className="text-xs text-gray-400">{activeModalClient.email}</p>
              </div>
              <button
                onClick={() => setActiveModalClient(null)}
                className="w-8 h-8 rounded-full bg-white/10 text-gray-400 hover:text-white flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between p-3 bg-black/40 rounded-xl">
                <span className="text-gray-400">Total Capital Invested:</span>
                <span className="font-bold text-white">${activeModalClient.totalInvested.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-3 bg-black/40 rounded-xl">
                <span className="text-gray-400">Current Portfolio Value:</span>
                <span className="font-bold text-white">${activeModalClient.currentBalance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-3 bg-black/40 rounded-xl">
                <span className="text-gray-400">All-Time Profit / Loss:</span>
                <span className={`font-bold ${activeModalClient.roiAmount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {activeModalClient.roiAmount >= 0 ? '+' : ''}${activeModalClient.roiAmount.toLocaleString()} ({activeModalClient.roiPercent.toFixed(2)}%)
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => setActiveModalClient(null)}
                className="px-5 py-2 rounded-xl bg-white/10 text-white text-xs font-medium hover:bg-white/20"
              >
                Close
              </button>
              <Link
                href={`/admin/clients/${activeModalClient.id}`}
                className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-medium hover:bg-blue-500"
              >
                Go to Full Ledger
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
