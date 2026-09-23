'use client'

import { motion } from 'framer-motion'
import { ArrowRight, ShieldCheck, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 overflow-hidden relative bg-[#030712]">
      {/* Background Gradients */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(147,51,234,0.15)_0,rgba(0,0,0,0)_50%)] animate-pulse" style={{ animationDuration: '7s' }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.1)_0,rgba(0,0,0,0)_50%)]" />
        <div className="absolute inset-0 bg-black/75 backdrop-blur-[50px]" />
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

        <div className="glass-card p-10 rounded-3xl relative text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-inner">
            <ShieldCheck className="w-8 h-8 text-amber-400" />
          </div>
          
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Access Restricted</h1>
            <p className="text-xs uppercase tracking-widest text-emerald-400 font-semibold mb-3">Institutional Whitelist Required</p>
            <p className="text-sm text-gray-400 leading-relaxed">
              Public self-registration is closed. Hedge Capital client accounts are provisioned exclusively by Senior Managing Partners following qualification review.
            </p>
          </div>

          <div className="pt-2 space-y-3">
            <Link
              href="/?apply=true"
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              <span>Apply for Whitelist Access</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/login"
              className="w-full block py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300 font-medium transition-all"
            >
              Already an approved client? Sign In
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
