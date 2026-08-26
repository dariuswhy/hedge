'use client'

import { useActionState } from 'react'
import { signup } from './actions'
import { motion } from 'framer-motion'
import { ArrowRight, UserPlus, TrendingUp } from 'lucide-react'
import Link from 'next/link'

const initialState = {
  error: null as string | null,
}

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
    return await signup(prevState, formData)
  }, initialState)

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 overflow-hidden relative">
      {/* Background Gradients */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(147,51,234,0.15)_0,rgba(0,0,0,0)_50%)] animate-pulse" style={{ animationDuration: '7s' }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.1)_0,rgba(0,0,0,0)_50%)]" />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[50px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <Link href="/" className="flex items-center justify-center gap-2 mb-8 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center group-hover:shadow-[0_0_20px_rgba(147,51,234,0.5)] transition-all">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-medium tracking-wide text-white">Hedge<span className="text-purple-500 font-bold">Capital</span></span>
        </Link>

        <div className="glass-card p-10 rounded-3xl relative">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-6 shadow-inner">
              <UserPlus className="w-8 h-8 text-purple-400" />
            </div>
            <h1 className="text-3xl font-light tracking-tight text-white mb-2">Create Account</h1>
            <p className="text-sm text-gray-400">Join the premium asset management platform</p>
          </div>

          <form action={formAction} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider" htmlFor="fullName">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="John Doe"
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="client@example.com"
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner"
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

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white font-medium py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:from-purple-500 hover:to-purple-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] mt-4"
            >
              {isPending ? 'Creating Account...' : 'Sign Up'}
              {!isPending && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="mt-6 text-center">
             <span className="text-gray-400 text-sm">Already have an account? </span>
             <Link href="/login" className="text-purple-400 hover:text-purple-300 transition-colors text-sm font-medium">
               Sign in instead
             </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
