'use client'

import { useActionState, useState } from 'react'
import { login, requestPasswordResetApprovalAction } from './actions'
import { motion } from 'framer-motion'
import { ArrowRight, Lock, TrendingUp, Mail, CheckCircle } from 'lucide-react'
import Link from 'next/link'

const initialState: { error?: string } = {}
const initialResetState: { error?: string; success?: string } = {}

export default function LoginPage() {
  const [showForgotModal, setShowForgotModal] = useState(false)

  const [state, formAction, isPending] = useActionState(
    async (prevState: { error?: string }, formData: FormData) => {
      return await login(prevState, formData)
    },
    initialState
  )

  const [resetState, resetFormAction, isResetPending] = useActionState(
    async (prevState: { error?: string; success?: string }, formData: FormData) => {
      return await requestPasswordResetApprovalAction(prevState, formData)
    },
    initialResetState
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
              <Lock className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-3xl font-light tracking-tight text-white mb-2">Client Portal</h1>
            <p className="text-sm text-gray-400">Sign in to access your portfolio</p>
          </div>

          <form action={formAction} className="space-y-6">
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
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider" htmlFor="password">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner"
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
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:from-blue-500 hover:to-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]"
            >
              {isPending ? 'Authenticating...' : 'Sign In'}
              {!isPending && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>
        </div>
        <p className="text-center text-gray-500 text-sm mt-8">
          Secure, institutional-grade access.
        </p>
        <div className="mt-4 text-center">
           <span className="text-gray-400 text-sm">Don't have an account? </span>
           <Link href="/signup" className="text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium">
             Apply for access
           </Link>
        </div>
      </motion.div>

      {/* Forgot Password Reset Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-8 max-w-md w-full space-y-6 border border-white/10 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-400" />
                Reset Password
              </h3>
              <button
                onClick={() => setShowForgotModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 text-gray-400 hover:text-white flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form action={resetFormAction} className="space-y-4">
              <p className="text-xs text-gray-300">
                Enter your registered email address and we will send you a password reset link.
              </p>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="client@example.com"
                  className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                />
              </div>

              {resetState?.error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                  {resetState.error}
                </div>
              )}

              {resetState?.success && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  {resetState.success}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/10 text-white text-xs font-medium hover:bg-white/20"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isResetPending}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 disabled:opacity-50"
                >
                  {isResetPending ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
