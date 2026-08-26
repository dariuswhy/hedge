'use client'

import { useActionState, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  Shield,
  Globe,
  Lock,
  Calendar,
  CheckCircle2,
  Users,
  TrendingUp,
  Award,
  Sparkles,
  Phone,
  Mail,
  DollarSign
} from 'lucide-react'
import { submitOnboardingApplicationAction } from './login/actions'

const initialApplyState: { error?: string; success?: string } = {}

export default function Home() {
  const [showApplyModal, setShowApplyModal] = useState(false)

  const [applyState, applyAction, isApplyPending] = useActionState(
    async (prevState: { error?: string; success?: string }, formData: FormData) => {
      return await submitOnboardingApplicationAction(prevState, formData)
    },
    initialApplyState
  )

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#030712] text-white">
      {/* Dynamic Ambient Background */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.18)_0,rgba(0,0,0,0)_50%)] animate-pulse"
          style={{ animationDuration: '6s' }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(147,51,234,0.12)_0,rgba(0,0,0,0)_50%)]" />
        <div className="absolute inset-0 bg-black/75 backdrop-blur-[100px]" />
      </div>

      <main className="relative z-10 flex flex-col items-center text-center px-6 pt-28 pb-20 max-w-6xl mx-auto w-full space-y-16">
        
        {/* Top Status Pill */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full glass border border-blue-500/30 shadow-[0_0_25px_rgba(59,130,246,0.25)]"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs font-semibold text-blue-200 tracking-wider uppercase">
            Institutional Whitelist Access • Private Allocation Q3
          </span>
        </motion.div>

        {/* Hero Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
          className="space-y-6 max-w-4xl"
        >
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-white leading-tight">
            Institutional-Grade <br />
            <span className="text-gradient">Quantitative Asset Management</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto font-light leading-relaxed">
            Hedge Capital delivers non-correlated alpha returns through high-frequency quantitative delta-neutral strategies, algorithmic market making, and multi-investor pooled accounts.
          </p>
        </motion.div>

        {/* Primary Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
        >
          <Link
            href="/login"
            className="group relative flex h-14 items-center justify-center gap-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 text-white font-semibold text-sm transition-all hover:scale-105 shadow-[0_0_30px_rgba(37,99,235,0.4)]"
          >
            <Lock className="w-4 h-4 text-blue-200" />
            <span>Take Me to Client Portal</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <button
            onClick={() => setShowApplyModal(true)}
            className="flex h-14 items-center justify-center gap-3 rounded-full glass border border-white/20 hover:border-blue-500/50 px-8 text-white font-semibold text-sm transition-all hover:bg-white/10 hover:scale-105"
          >
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>Apply for Access & Consultation</span>
          </button>
        </motion.div>

        {/* Live Institutional Metrics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl pt-8 border-t border-white/10"
        >
          <div className="p-6 glass-card rounded-2xl border border-white/10 text-center">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">Fund Net AUM</span>
            <span className="text-2xl sm:text-3xl font-bold text-white font-mono">$48.6M+</span>
          </div>

          <div className="p-6 glass-card rounded-2xl border border-white/10 text-center">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">Target Annual Yield</span>
            <span className="text-2xl sm:text-3xl font-bold text-emerald-400 font-mono">+24.8% APY</span>
          </div>

          <div className="p-6 glass-card rounded-2xl border border-white/10 text-center">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">Capital Protection</span>
            <span className="text-2xl sm:text-3xl font-bold text-blue-400 font-mono">Delta 1.00</span>
          </div>

          <div className="p-6 glass-card rounded-2xl border border-white/10 text-center">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">Investor Whitelist</span>
            <span className="text-2xl sm:text-3xl font-bold text-purple-400 font-mono">Approval Req.</span>
          </div>
        </motion.div>

        {/* Features / Strategy Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-10"
          id="features"
        >
          {[
            {
              icon: BarChart3,
              title: 'Quantitative Arbitrage',
              desc: 'High-frequency delta neutral algorithms capitalizing on price inefficiencies across top-tier liquidity venues.'
            },
            {
              icon: Shield,
              title: 'Risk & Capital Safety',
              desc: 'Automated position rebalancing and multi-tier capital protection safeguards against drawdown risks.'
            },
            {
              icon: Users,
              title: 'Pooled Hedge Accounts',
              desc: 'Merge individual investor capital into strategic fund pools with transparent split allocations and real-time NAV tracking.'
            }
          ].map((feature, idx) => (
            <div
              key={idx}
              className="glass-card p-8 rounded-3xl flex flex-col items-center text-center group hover:-translate-y-2 transition-transform duration-300 border border-white/10"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20 group-hover:scale-110 transition-transform">
                <feature.icon className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Footer Legal & Disclaimers */}
        <footer className="pt-16 border-t border-white/10 text-xs text-gray-500 max-w-4xl space-y-4 text-justify font-sans">
          <div className="text-center font-bold text-gray-400 uppercase tracking-widest text-[11px]">
            Hedge Capital Management LLC • Regulatory & Whitelist Policy
          </div>
          <p>
            Hedge Capital is a private quantitative asset management platform. Access to client portals, pooled hedge funds, and investment strategies is restricted strictly to verified whitelist applicants who have completed investor qualification and onboarding review.
          </p>
          <div className="flex flex-col sm:flex-row justify-between items-center text-gray-500 pt-4 font-mono text-[11px] border-t border-white/5">
            <span>© 2026 Hedge Capital Management LLC. All rights reserved.</span>
            <div className="flex gap-4">
              <Link href="/login" className="hover:text-blue-400">Client Portal</Link>
              <button onClick={() => setShowApplyModal(true)} className="hover:text-blue-400">Apply for Access</button>
            </div>
          </div>
        </footer>
      </main>

      {/* Modal: Whitelist Application & Consultation Request */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-8 max-w-lg w-full space-y-6 border border-white/10 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  Apply for Fund Whitelist Access
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Schedule a private consultation and apply for onboarding approval.
                </p>
              </div>
              <button
                onClick={() => setShowApplyModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 text-gray-400 hover:text-white flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form action={applyAction} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Full Name / Entity
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Darius Investor"
                  className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="investor@example.com"
                  className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="+40 700 000 000"
                    className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Intended Capital ($)
                  </label>
                  <select
                    name="capital"
                    className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="25,000">$25,000 - $50,000</option>
                    <option value="50,000">$50,000 - $100,000</option>
                    <option value="100,000">$100,000 - $250,000</option>
                    <option value="250,000">$250,000+</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Notes / Investment Goals
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  placeholder="Tell us about your portfolio targets or preferred investment strategy..."
                  className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                />
              </div>

              {applyState?.error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                  {applyState.error}
                </div>
              )}

              {applyState?.success && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  {applyState.success}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/10 text-white text-xs font-medium hover:bg-white/20"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isApplyPending}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-medium hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 shadow-lg"
                >
                  {isApplyPending ? 'Submitting Application...' : 'Submit Whitelist Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
