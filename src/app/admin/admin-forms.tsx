'use client'

import { useActionState } from 'react'
import { inviteClient, addCapital, updatePerformance, sendStatements } from './actions'

export default function AdminForms({ clients }: { clients: any[] }) {
  // We can use simplified states for forms without complex validation for now
  const [inviteState, inviteAction, isInviting] = useActionState(inviteClient, null)
  const [capitalState, capitalAction, isAddingCapital] = useActionState(addCapital, null)
  const [performanceState, performanceAction, isUpdating] = useActionState(updatePerformance, null)
  const [statementsState, statementsAction, isSending] = useActionState(sendStatements, null)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
      {/* Invite Client Form */}
      <div className="bg-card/40 border border-white/5 rounded-2xl p-6 shadow-xl">
        <h3 className="text-xl font-medium mb-4 text-blue-400">Invite New Client</h3>
        <form action={inviteAction} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
            <input name="fullName" type="text" required className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
            <input name="email" type="email" required className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white" />
          </div>
          {inviteState?.error && <p className="text-red-400 text-sm">{inviteState.error}</p>}
          {inviteState?.success && <p className="text-green-400 text-sm">{inviteState.success}</p>}
          <button disabled={isInviting} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors">
            {isInviting ? 'Sending...' : 'Send Invite'}
          </button>
        </form>
      </div>

      {/* Add Capital Form */}
      <div className="bg-card/40 border border-white/5 rounded-2xl p-6 shadow-xl">
        <h3 className="text-xl font-medium mb-4 text-green-400">Add Invested Capital</h3>
        <form action={capitalAction} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Select Client</label>
            <select name="userId" required className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white appearance-none">
              <option value="">-- Choose a client --</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.full_name} ({client.email})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Amount ($)</label>
            <input name="amount" type="number" step="0.01" min="0" required className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-white" />
          </div>
          {capitalState?.error && <p className="text-red-400 text-sm">{capitalState.error}</p>}
          {capitalState?.success && <p className="text-green-400 text-sm">{capitalState.success}</p>}
          <button disabled={isAddingCapital} className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors">
            {isAddingCapital ? 'Adding...' : 'Add Capital'}
          </button>
        </form>
      </div>

      {/* Update Fund Performance */}
      <div className="bg-card/40 border border-white/5 rounded-2xl p-6 shadow-xl md:col-span-2">
        <div className="md:flex gap-8 items-start">
          <div className="flex-1 mb-6 md:mb-0">
            <h3 className="text-xl font-medium mb-2 text-purple-400">Update Fund Performance</h3>
            <p className="text-sm text-gray-400 mb-6">
              Enter the new Total Value of the entire fund. The system will dynamically calculate each client's share based on their invested capital and update their ledger.
            </p>
            <form action={performanceAction} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">New Total Fund Value ($)</label>
                <input name="newTotalValue" type="number" step="0.01" min="0" required className="w-full max-w-md bg-black border border-white/10 rounded-lg px-4 py-3 text-white text-lg font-medium" />
              </div>
              {performanceState?.error && <p className="text-red-400 text-sm">{performanceState.error}</p>}
              {performanceState?.success && <p className="text-green-400 text-sm">{performanceState.success}</p>}
              <button disabled={isUpdating} className="w-full max-w-md bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg transition-colors font-medium">
                {isUpdating ? 'Calculating & Updating...' : 'Update Performance & Generate Ledger'}
              </button>
            </form>
          </div>

          <div className="flex-1 border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-8">
            <h3 className="text-xl font-medium mb-2 text-orange-400">Send Statements</h3>
            <p className="text-sm text-gray-400 mb-6">
              Send the latest statements via email to all clients using Resend.
            </p>
            <form action={statementsAction} className="space-y-4">
              {statementsState?.error && <p className="text-red-400 text-sm">{statementsState.error}</p>}
              {statementsState?.success && <p className="text-green-400 text-sm">{statementsState.success}</p>}
              <button disabled={isSending} className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg transition-colors font-medium">
                {isSending ? 'Sending Emails...' : 'Send Statements Now'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
