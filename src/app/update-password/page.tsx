'use client'

import { useActionState } from 'react'
import { updatePassword } from './actions'
import { motion } from 'framer-motion'
import { ArrowRight, Lock, TrendingUp } from 'lucide-react'
import Link from 'next/link'

const initialState: { error?: string; success?: string } = {}

export default function UpdatePasswordPage() {
  const [state, formAction, isPending] = useActionState(
    async (prevState: { error?: string; success?: string }, formData: FormData) => {
      return await updatePassword(prevState, formData)
    },
    initialState
  )

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 overflow-hidden relative">
      {/* Background Gradients */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.15)_0,rgba(0,0,0,0)_50%)] animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(147,51,234,0.1)_0,rgba(0,0,0,0)_50%)]" />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[50px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <Link href="/" className="flex items-center justify-center gap-2 mb-8 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center group-hover:shadow-[0_0_20px_rgba(37,99,235,0.5)] transition-all">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-medium tracking-wide text-white">Hedge<span className="text-blue-500 font-bold">Capital</span></span>
        </Link>

        <div className="glass-card p-10 rounded-3xl relative">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-6 shadow-inner">
              <Lock className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-3xl font-light tracking-tight text-white mb-2">Setup Password</h1>
            <p className="text-sm text-gray-400">Welcome! Please secure your account.</p>
          </div>

          <form action={formAction} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider" htmlFor="password">
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all shadow-inner"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all shadow-inner"
              />
            </div>

            {state?.error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20 text-center"
              >
                {state.error}
              </motion.div>
            )}

            {state?.success && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-green-400 text-sm bg-green-400/10 p-3 rounded-lg border border-green-400/20 text-center"
              >
                {state.success}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isPending || !!state?.success}
              className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white font-medium py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:from-green-500 hover:to-green-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)]"
            >
              {isPending ? 'Updating...' : 'Set Password'}
              {!isPending && !state?.success && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>

            {state?.success && (
               <div className="mt-4 text-center">
                 <Link href="/" className="text-blue-400 text-sm hover:underline">
                   Continue to Portal
                 </Link>
               </div>
            )}
          </form>
        </div>
      </motion.div>
    </div>
  )
}
