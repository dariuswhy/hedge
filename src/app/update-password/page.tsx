'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Lock, TrendingUp, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { updatePassword } from './actions'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [hasSession, setHasSession] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = createClient()

    // 1. If ?code= is present in URL, exchange it client-side as well
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search)
      const code = searchParams.get('code')
      if (code) {
        supabase.auth.exchangeCodeForSession(code).then(({ data, error: codeErr }) => {
          if (data?.session) {
            setHasSession(true)
            setError(null)
          } else if (codeErr) {
            console.warn('Code exchange client error:', codeErr.message)
          }
        })
      }
    }

    // 2. Listen for auth state changes (e.g. PASSWORD_RECOVERY or SIGNED_IN from URL hash)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setHasSession(true)
        setError(null)
      }
    })

    // 3. Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setHasSession(true)
      } else {
        // If not immediately present, wait briefly for Supabase to parse URL hash tokens
        setTimeout(async () => {
          const { data: { session: delayedSession } } = await supabase.auth.getSession()
          setHasSession(!!delayedSession)
        }, 1500)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!password || !confirmPassword) {
      setError('Please fill in both password fields.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify both fields.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    setIsPending(true)
    const supabase = createClient()

    try {
      // 1. Attempt client-side password update (works with URL hash tokens from email links)
      const { data: updateData, error: clientError } = await supabase.auth.updateUser({
        password: password
      })

      if (!clientError && updateData?.user) {
        setSuccess('Password updated successfully! Redirecting to client portal...')
        setTimeout(() => {
          router.push('/client')
        }, 1400)
        setIsPending(false)
        return
      }

      // 2. If client-side failed, attempt server action fallback
      const formData = new FormData()
      formData.append('password', password)
      formData.append('confirmPassword', confirmPassword)
      const serverRes = await updatePassword(null, formData)

      if (serverRes.success) {
        setSuccess('Password updated successfully! Redirecting to client portal...')
        setTimeout(() => {
          router.push('/client')
        }, 1400)
      } else {
        setError(
          clientError?.message ||
          serverRes.error ||
          'Session expired or link invalid. Please request a new link or contact the administrator.'
        )
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to update password. Please try again.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 overflow-hidden relative bg-[#030712]">
      {/* Background Gradients */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.15)_0,rgba(0,0,0,0)_50%)] animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(16,185,129,0.1)_0,rgba(0,0,0,0)_50%)]" />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[50px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <Link href="/" className="flex items-center justify-center gap-2 mb-8 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-600 flex items-center justify-center group-hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-medium tracking-wide text-white">Captain<span className="text-emerald-400 font-bold">Hedge</span></span>
        </Link>

        <div className="glass-card p-10 rounded-3xl relative border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-6 shadow-inner">
              <Lock className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-3xl font-light tracking-tight text-white mb-2">Setup Password</h1>
            <p className="text-sm text-gray-400">Welcome! Please secure your account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider" htmlFor="password">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password (min. 6 chars)"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 pr-11 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 pr-11 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-red-400 text-xs bg-red-500/10 p-4 rounded-xl border border-red-500/20 text-center leading-relaxed flex items-center justify-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-emerald-400 text-xs bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 text-center flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isPending || !!success}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:from-emerald-500 hover:to-teal-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              {isPending ? 'Setting Password...' : 'Set Password'}
              {!isPending && !success && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>

            {hasSession === false && !error && !success && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center space-y-1.5">
                <p className="text-[12px] text-amber-300 font-medium">
                  Notice: No active authorization session found
                </p>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Please click the secure activation link sent to your email, or{' '}
                  <Link href="/login" className="text-emerald-400 underline hover:text-emerald-300">
                    request a new reset link
                  </Link>.
                </p>
              </div>
            )}
          </form>
        </div>
      </motion.div>
    </div>
  )
}
