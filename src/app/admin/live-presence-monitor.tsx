'use client'

import { useEffect, useState, useMemo, Component, ReactNode } from 'react'
import {
  Activity,
  Radio,
  Search,
  Wifi,
  Users,
  ChevronRight,
  Shield,
  Briefcase,
  Crown,
  Clock,
  RefreshCw,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'
import { getLivePresencesAction, recordUserHeartbeat } from './actions'

export interface ClientPresenceItem {
  id: string
  full_name: string | null
  email: string | null
  role?: string
  totalInvested: number
  currentBalance: number
  freePocketReserve?: number
  lastSignInAt?: string | null
  lastSeenAt?: string | null
}

interface LivePresenceMonitorProps {
  clients: ClientPresenceItem[]
}

const ONLINE_THRESHOLD_MS = 3 * 60 * 1000 // 3 minutes

function formatRelativeTime(dateString?: string | null): { relative: string; exact: string } {
  if (!dateString) return { relative: 'Never logged in', exact: 'No session history' }
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return { relative: 'Unknown', exact: '' }

  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHours = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHours / 24)

  const exact = d.toLocaleDateString('ro-RO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }) + ', ' + d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })

  if (diffSec < 60) return { relative: 'Just now', exact }
  if (diffMin < 60) return { relative: `${diffMin}m ago`, exact }
  if (diffHours < 24 && d.getDate() === now.getDate()) {
    const timeStr = d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
    return { relative: `Today at ${timeStr}`, exact }
  }
  if (diffDays === 1 || (diffHours < 48 && d.getDate() === now.getDate() - 1)) {
    const timeStr = d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
    return { relative: `Yesterday at ${timeStr}`, exact }
  }
  if (diffDays < 7) return { relative: `${diffDays} days ago`, exact }

  return { relative: exact, exact }
}

function checkIsOnline(lastSeenAt?: string | null): boolean {
  if (!lastSeenAt) return false
  const d = new Date(lastSeenAt)
  if (isNaN(d.getTime())) return false
  const diff = Date.now() - d.getTime()
  return diff >= 0 && diff <= ONLINE_THRESHOLD_MS
}

export default function LivePresenceMonitor({ clients }: LivePresenceMonitorProps) {
  const [mounted, setMounted] = useState(false)
  const [presenceMap, setPresenceMap] = useState<Map<string, { lastSeenAt?: string | null; lastSignInAt?: string | null }>>(new Map())
  const [filterMode, setFilterMode] = useState<'all' | 'online' | 'admins' | 'offline'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Admin heartbeat so admins are tracked as online too
    recordUserHeartbeat()
    const heartbeatInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        recordUserHeartbeat()
      }
    }, 45000)

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        recordUserHeartbeat()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    // Initial fetch of latest presence timestamps
    const fetchLatest = async () => {
      const res = await getLivePresencesAction()
      if (res?.success && res.users) {
        const map = new Map<string, { lastSeenAt?: string | null; lastSignInAt?: string | null }>()
        for (const u of res.users) {
          map.set(u.id, {
            lastSeenAt: u.lastSeenAt,
            lastSignInAt: u.lastSignInAt
          })
        }
        setPresenceMap(map)
      }
    }

    fetchLatest()

    // Background auto-refresh every 20 seconds
    const interval = setInterval(fetchLatest, 20000)
    return () => {
      clearInterval(interval)
      clearInterval(heartbeatInterval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    const res = await getLivePresencesAction()
    if (res?.success && res.users) {
      const map = new Map<string, { lastSeenAt?: string | null; lastSignInAt?: string | null }>()
      for (const u of res.users) {
        map.set(u.id, {
          lastSeenAt: u.lastSeenAt,
          lastSignInAt: u.lastSignInAt
        })
      }
      setPresenceMap(map)
    }
    setTimeout(() => setIsRefreshing(false), 500)
  }

  // Combine initial clients with live presence updates
  const enrichedList = useMemo(() => {
    return (clients || []).map((c) => {
      const liveData = presenceMap.get(c.id)
      const lastSeenAt = liveData ? (liveData.lastSeenAt || liveData.lastSignInAt) : (c.lastSeenAt || c.lastSignInAt)
      const lastSignInAt = liveData ? liveData.lastSignInAt : c.lastSignInAt
      const isOnline = checkIsOnline(lastSeenAt)

      return {
        ...c,
        lastSeenAt,
        lastSignInAt,
        isOnline
      }
    })
  }, [clients, presenceMap])

  // Filter clients
  const filteredClients = useMemo(() => {
    return enrichedList.filter((c) => {
      if (filterMode === 'online' && !c.isOnline) return false
      if (filterMode === 'admins' && c.role !== 'admin') return false
      if (filterMode === 'offline' && c.isOnline) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = (c.full_name || '').toLowerCase().includes(q)
        const matchEmail = (c.email || '').toLowerCase().includes(q)
        if (!matchName && !matchEmail) return false
      }

      return true
    })
  }, [enrichedList, filterMode, searchQuery])

  const onlineCount = enrichedList.filter((c) => c.isOnline).length
  const adminCount = enrichedList.filter((c) => c.role === 'admin').length
  const offlineCount = Math.max(0, enrichedList.length - onlineCount)

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 border border-emerald-500/20 bg-gradient-to-b from-emerald-950/10 via-black/40 to-black/60 shadow-2xl relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-1/4 w-96 h-48 bg-emerald-500/5 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-1/4 w-96 h-48 bg-blue-500/5 blur-3xl pointer-events-none rounded-full" />

      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <span className="absolute inset-0 rounded-2xl bg-emerald-500/20 animate-ping opacity-40 pointer-events-none" />
            <Radio className="w-6 h-6 relative z-10" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Telemetry Feed
              </span>
              <span className="text-[11px] font-mono text-gray-400 flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                Active Monitor
              </span>
            </div>
            <h3 className="text-2xl font-light text-white tracking-tight">Investor Presence & Last Seen Monitor</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Live broadcast of active client sessions, current portal locations & session activity history.
            </p>
          </div>
        </div>

        {/* Live Counters & Refresh Button */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleManualRefresh}
            title="Refresh Live Presence"
            className="p-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          <div className="px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 shadow-lg shadow-emerald-500/5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <div className="text-left">
              <p className="text-[9px] uppercase font-mono font-semibold tracking-wider text-emerald-400">Online Now</p>
              <p className="text-base font-bold font-mono text-white leading-none mt-0.5">
                {mounted ? onlineCount : 0} {onlineCount === 1 ? 'Client' : 'Clients'}
              </p>
            </div>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-2.5">
            <Users className="w-4 h-4 text-gray-400" />
            <div className="text-left">
              <p className="text-[9px] uppercase font-mono font-semibold tracking-wider text-gray-400">Total Registered</p>
              <p className="text-base font-bold font-mono text-white leading-none mt-0.5">
                {clients.length} Accounts
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter tabs & Search row */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pt-1">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              filterMode === 'all'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            All Accounts ({clients.length})
          </button>
          <button
            onClick={() => setFilterMode('online')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              filterMode === 'online'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Online Now ({mounted ? onlineCount : 0})
          </button>
          <button
            onClick={() => setFilterMode('admins')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              filterMode === 'admins'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            Admins ({adminCount})
          </button>
          <button
            onClick={() => setFilterMode('offline')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              filterMode === 'offline'
                ? 'bg-gray-700 text-white shadow-lg'
                : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            Offline / Idle ({mounted ? offlineCount : clients.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-72">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Grid of Users */}
      {filteredClients.length === 0 ? (
        <div className="py-12 px-6 rounded-2xl border border-dashed border-white/10 text-center space-y-3 bg-black/20">
          <Radio className="w-8 h-8 text-gray-500 mx-auto opacity-50" />
          <p className="text-gray-400 text-sm font-light">
            {filterMode === 'online'
              ? 'No investors currently connected in active session.'
              : 'No matching client accounts found for query.'}
          </p>
          <p className="text-[11px] text-gray-500 font-mono">
            {filterMode === 'online'
              ? 'Heartbeat monitor refreshes automatically every 20 seconds.'
              : 'Try clearing the search query or changing filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const isOnline = mounted && client.isOnline
            const isPocket = client.email?.includes('pocket') || client.full_name?.includes('Pocket')
            const isAdmin = client.role === 'admin'
            const lastSeen = formatRelativeTime(client.lastSeenAt || client.lastSignInAt)
            const balanceNum = Number(client.currentBalance || 0)

            return (
              <div
                key={client.id}
                className={`p-5 rounded-2xl border transition-all duration-300 relative group flex flex-col justify-between ${
                  isOnline
                    ? 'border-emerald-500/40 bg-gradient-to-br from-emerald-950/20 via-black/40 to-black/60 shadow-[0_0_25px_rgba(16,185,129,0.08)]'
                    : 'border-white/5 bg-black/40 hover:border-white/10 hover:bg-white/[0.02]'
                }`}
              >
                <div>
                  {/* Top user row: Avatar + Name + Status Pill */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar with status indicator */}
                      <div className="relative shrink-0">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm border ${
                            isPocket
                              ? 'bg-gradient-to-tr from-amber-500/30 to-purple-500/30 border-amber-500/40 text-amber-300'
                              : isAdmin
                              ? 'bg-gradient-to-tr from-purple-500/20 to-blue-500/20 border-purple-500/30 text-purple-300'
                              : 'bg-gradient-to-tr from-blue-500/20 to-emerald-500/20 border-white/10 text-blue-300'
                          }`}
                        >
                          {isPocket ? (
                            <Crown className="w-5 h-5 text-amber-400" />
                          ) : (
                            (client.full_name || client.email || 'C')[0].toUpperCase()
                          )}
                        </div>
                        {/* Status dot on avatar corner */}
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-black ${
                            isOnline ? 'bg-emerald-400' : 'bg-gray-600'
                          }`}
                        >
                          {isOnline && (
                            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
                          )}
                        </span>
                      </div>

                      {/* Name & Email */}
                      <div className="min-w-0 truncate">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-semibold text-white truncate">
                            {client.full_name || 'Unnamed Investor'}
                          </h4>
                          {isAdmin && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              Admin
                            </span>
                          )}
                          {isPocket && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Vault
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-mono text-gray-400 truncate mt-0.5">{client.email}</p>
                      </div>
                    </div>

                    {/* Status Pill */}
                    {isOnline ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        ONLINE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono text-gray-400 bg-white/5 border border-white/10 shrink-0">
                        <span className="w-1 h-1 rounded-full bg-gray-500" />
                        OFFLINE
                      </span>
                    )}
                  </div>

                  {/* Presence Details Banner */}
                  <div className="mt-4 pt-3 border-t border-white/5 space-y-1.5">
                    {isOnline ? (
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-emerald-400 flex items-center gap-1.5 text-[11px]">
                          <Activity className="w-3.5 h-3.5 animate-pulse" />
                          Active on platform
                        </span>
                        <span className="text-[10px] text-emerald-400 font-semibold">
                          Session Active
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-xs font-mono" suppressHydrationWarning>
                        <span className="text-gray-400 flex items-center gap-1.5 text-[11px]" suppressHydrationWarning>
                          <Clock className="w-3.5 h-3.5 text-gray-500" />
                          Last seen: <span className="text-gray-300" suppressHydrationWarning>{mounted ? lastSeen.relative : '...'}</span>
                        </span>
                        <span className="text-[10px] text-gray-500 truncate max-w-[120px]" title={lastSeen.exact} suppressHydrationWarning>
                          {mounted ? lastSeen.exact : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom row: Capital Balance + Link to Account */}
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] uppercase font-mono text-gray-500 tracking-wider block">Portfolio Worth</span>
                    <span className="text-sm font-bold font-mono text-white">
                      ${balanceNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <Link
                    href={`/admin/clients/${client.id}`}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-medium flex items-center gap-1 transition-all group-hover:border-emerald-500/30"
                  >
                    <span>View Account</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
