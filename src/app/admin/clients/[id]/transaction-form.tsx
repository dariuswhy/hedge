'use client'

import { useActionState, useEffect, useRef } from 'react'
import { processTransaction } from './actions'
import { PlusCircle, MinusCircle, Scissors, ArrowRight } from 'lucide-react'

export function TransactionForm({ userId }: { userId: string }) {
  const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
    return await processTransaction(prevState, formData)
  }, null)

  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset()
    }
  }, [state])

  return (
    <div className="glass-card rounded-3xl p-8">
      <h3 className="text-2xl font-light mb-6">Process Transaction</h3>
      
      <form ref={formRef} action={formAction} className="space-y-6">
        <input type="hidden" name="userId" value={userId} />
        
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Transaction Type</label>
          <div className="grid grid-cols-3 gap-4">
            <label className="cursor-pointer group">
              <input type="radio" name="type" value="deposit" className="peer sr-only" required defaultChecked />
              <div className="rounded-xl border border-white/10 p-4 text-center peer-checked:bg-green-500/20 peer-checked:border-green-500/50 peer-checked:text-green-400 transition-all hover:bg-white/5">
                <PlusCircle className="w-6 h-6 mx-auto mb-2 opacity-70 group-hover:opacity-100 peer-checked:opacity-100" />
                <span className="text-sm font-medium">Deposit</span>
              </div>
            </label>
            
            <label className="cursor-pointer group">
              <input type="radio" name="type" value="withdrawal" className="peer sr-only" required />
              <div className="rounded-xl border border-white/10 p-4 text-center peer-checked:bg-red-500/20 peer-checked:border-red-500/50 peer-checked:text-red-400 transition-all hover:bg-white/5">
                <MinusCircle className="w-6 h-6 mx-auto mb-2 opacity-70 group-hover:opacity-100 peer-checked:opacity-100" />
                <span className="text-sm font-medium">Withdraw</span>
              </div>
            </label>

            <label className="cursor-pointer group">
              <input type="radio" name="type" value="fee" className="peer sr-only" required />
              <div className="rounded-xl border border-white/10 p-4 text-center peer-checked:bg-purple-500/20 peer-checked:border-purple-500/50 peer-checked:text-purple-400 transition-all hover:bg-white/5">
                <Scissors className="w-6 h-6 mx-auto mb-2 opacity-70 group-hover:opacity-100 peer-checked:opacity-100" />
                <span className="text-sm font-medium">Profit Cut</span>
              </div>
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider" htmlFor="amount">Amount (USD)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              id="amount"
              name="amount"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner"
            />
          </div>
        </div>

        {state?.error && (
          <div className="text-red-400 text-sm bg-red-400/10 p-4 rounded-xl border border-red-400/20">
            {state.error}
          </div>
        )}
        
        {state?.success && (
          <div className="text-green-400 text-sm bg-green-400/10 p-4 rounded-xl border border-green-400/20">
            {state.success}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:from-blue-500 hover:to-purple-500 transition-all disabled:opacity-50 group"
        >
          {isPending ? 'Processing...' : 'Execute Transaction'}
          {!isPending && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
        </button>
      </form>
    </div>
  )
}
