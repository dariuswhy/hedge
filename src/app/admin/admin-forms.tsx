'use client'

import { useActionState } from 'react'
import { createClientWithCapital, addCapital, updatePerformance } from './actions'
import { UserPlus, DollarSign, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react'

interface AdminFormsProps {
  clients: { id: string; full_name: string | null; email: string | null }[]
}

const initialState: { error?: string; success?: string } = {}

export default function AdminForms({ clients }: AdminFormsProps) {
  const [inviteState, inviteFormAction, isInvitePending] = useActionState(
    async (prevState: { error?: string; success?: string }, formData: FormData) => {
      return await createClientWithCapital(prevState, formData)
    },
    initialState
  )

  const [capitalState, capitalFormAction, isCapitalPending] = useActionState(
    async (prevState: { error?: string; success?: string }, formData: FormData) => {
      return await addCapital(prevState, formData)
    },
    initialState
  )

  const [perfState, perfFormAction, isPerfPending] = useActionState(
    async (prevState: { error?: string; success?: string }, formData: FormData) => {
      return await updatePerformance(prevState, formData)
    },
    initialState
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* 1. Unified Client Onboarding Form (Name + Email + Initial Capital) */}
      <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-4">
        <div className="flex items-center gap-3 border-b border-white/10 pb-3">
          <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-white">Create New Client Account</h4>
            <p className="text-[11px] text-gray-400">Add email, full name, and initial capital in 1 step.</p>
          </div>
        </div>

        <form action={inviteFormAction} className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-300 font-semibold mb-1 uppercase tracking-wider">
              Full Name
            </label>
            <input
              type="text"
              name="fullName"
              placeholder="e.g. Marcus Vance"
              required
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
            />
          </div>

          <div>
            <label className="block text-gray-300 font-semibold mb-1 uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              placeholder="marcus@vancecap.com"
              required
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
            />
          </div>

          <div>
            <label className="block text-gray-300 font-semibold mb-1 uppercase tracking-wider">
              Initial Capital Deposit ($)
            </label>
            <input
              type="number"
              name="initialCapital"
              step="any"
              placeholder="100000"
              required
              className="w-full px-3.5 py-2.5 rounded-xl glass-input font-mono text-xs font-bold"
            />
          </div>

          {inviteState?.error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-[11px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {inviteState.error}
            </div>
          )}

          {inviteState?.success && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              {inviteState.success}
            </div>
          )}

          <button
            type="submit"
            disabled={isInvitePending}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg transition-all disabled:opacity-50"
          >
            {isInvitePending ? 'Creating Client...' : 'Create & Deposit Capital'}
          </button>
        </form>
      </div>

      {/* 2. Add Top-Up Capital Form */}
      <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-4">
        <div className="flex items-center gap-3 border-b border-white/10 pb-3">
          <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-white">Add Top-Up Capital</h4>
            <p className="text-[11px] text-gray-400">Inject additional capital into existing client account.</p>
          </div>
        </div>

        <form action={capitalFormAction} className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-300 font-semibold mb-1 uppercase tracking-wider">
              Select Client
            </label>
            <select
              name="userId"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="">-- Choose a client --</option>
              {clients.map((c: any) => {
                const isAdmin = c.role === 'admin' || c.email?.includes('admin') || c.email?.includes('darius')
                const displayName = isAdmin
                  ? `${c.full_name || 'Darius'} (Admin)`
                  : c.full_name && c.full_name !== c.email
                  ? `${c.full_name} (${c.email})`
                  : c.email
                return (
                  <option key={c.id} value={c.id}>
                    {displayName}
                  </option>
                )
              })}
            </select>
          </div>

          <div>
            <label className="block text-gray-300 font-semibold mb-1 uppercase tracking-wider">
              Amount ($)
            </label>
            <input
              type="number"
              name="amount"
              step="any"
              placeholder="50000"
              required
              className="w-full px-3.5 py-2.5 rounded-xl glass-input font-mono text-xs font-bold"
            />
          </div>

          {capitalState?.error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-[11px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {capitalState.error}
            </div>
          )}

          {capitalState?.success && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              {capitalState.success}
            </div>
          )}

          <button
            type="submit"
            disabled={isCapitalPending}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg transition-all disabled:opacity-50"
          >
            {isCapitalPending ? 'Injecting...' : 'Inject Top-Up Capital'}
          </button>
        </form>
      </div>

      {/* 3. Global Fund Valuation Form */}
      <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-4">
        <div className="flex items-center gap-3 border-b border-white/10 pb-3">
          <div className="p-2 bg-purple-500/20 rounded-xl text-purple-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-white">Update Global Fund AUM</h4>
            <p className="text-[11px] text-gray-400">Distributes total fund performance proportionally across clients.</p>
          </div>
        </div>

        <form action={perfFormAction} className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-300 font-semibold mb-1 uppercase tracking-wider">
              New Total Fund Valuation ($)
            </label>
            <input
              type="number"
              name="newTotalValue"
              step="any"
              placeholder="e.g. 650000"
              required
              className="w-full px-3.5 py-2.5 rounded-xl glass-input font-mono text-xs font-bold"
            />
          </div>

          {perfState?.error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-[11px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {perfState.error}
            </div>
          )}

          {perfState?.success && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              {perfState.success}
            </div>
          )}

          <button
            type="submit"
            disabled={isPerfPending}
            className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg transition-all disabled:opacity-50"
          >
            {isPerfPending ? 'Updating Fund...' : 'Update Global Fund Performance'}
          </button>
        </form>
      </div>
    </div>
  )
}
