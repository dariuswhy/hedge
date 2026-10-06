'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { TrendingUp, User, LogOut, ShieldCheck, LayoutDashboard, Menu, X, Home as HomeIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchRole = async (userId: string) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()
      if (profile?.role) {
        setUserRole(profile.role)
      }
    }

    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      if (session?.user) {
        await fetchRole(session.user.id)
      }
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user || null)
      if (session?.user) {
        await fetchRole(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const handleSignOut = async () => {
    setMobileMenuOpen(false)
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (pathname === '/login') return null

  const isAdminPath = pathname.startsWith('/admin')
  const isClientPath = pathname.startsWith('/client')

  return (
    <header className="fixed top-0 w-full z-50 glass border-b border-white/10 shadow-2xl transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] group-hover:scale-105 transition-all duration-300 shrink-0">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-1.5 leading-none">
              Hedge<span className="text-gradient">Capital</span>
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase font-semibold text-gray-400 tracking-wider sm:tracking-widest mt-1">
              Asset Management
            </span>
          </div>
        </Link>

        {/* Center Portal Toggle Navigation - Desktop */}
        <div className="hidden md:flex items-center p-1 bg-black/40 border border-white/10 rounded-full">
          <Link
            href="/client"
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 ${
              isClientPath
                ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Client Portal
          </Link>
          <Link
            href="/admin"
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 ${
              isAdminPath
                ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
            Admin Operations
          </Link>
        </div>

        {/* User Account Controls & Mobile Menu Trigger */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Desktop User Account Details */}
          {user || isAdminPath || isClientPath ? (
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-xs font-medium text-gray-200 truncate max-w-[150px]">
                  {user?.email || (isAdminPath ? 'admin@hedge.com' : 'investor@hedge.com')}
                </span>
                <span className={`text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 ${
                  userRole === 'admin' ? 'text-purple-400' : 'text-blue-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                    userRole === 'admin' ? 'bg-purple-400' : 'bg-emerald-400'
                  }`} />
                  {userRole === 'admin' ? 'Fund Manager' : 'Verified Investor'}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 transition-all text-xs font-medium"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 transition-all text-white text-xs font-medium"
            >
              <User className="w-4 h-4" />
              <span>Sign In</span>
            </Link>
          )}

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden border-t border-white/10 bg-[#030712]/95 backdrop-blur-2xl overflow-hidden px-4 py-5 space-y-4 shadow-2xl"
          >
            {/* User status info for mobile */}
            {(user || isAdminPath || isClientPath) && (
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
                <div className="space-y-0.5 truncate">
                  <p className="text-xs font-semibold text-white truncate">
                    {user?.email || (isAdminPath ? 'admin@hedge.com' : 'investor@hedge.com')}
                  </p>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                    userRole === 'admin' ? 'text-purple-400' : 'text-blue-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                      userRole === 'admin' ? 'bg-purple-400' : 'bg-emerald-400'
                    }`} />
                    {userRole === 'admin' ? 'Fund Manager (Admin)' : 'Verified Investor'}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium shrink-0 ml-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            )}

            {/* Navigation links for mobile */}
            <div className="grid grid-cols-1 gap-2">
              <Link
                href="/client"
                className={`flex items-center justify-between p-3.5 rounded-xl border text-sm font-semibold transition-all ${
                  isClientPath
                    ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                    : 'bg-black/40 border-white/10 text-gray-300 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="w-4 h-4 text-blue-400" />
                  <span>Client Investor Portal</span>
                </div>
                <span className="text-xs text-blue-400 font-mono">Open</span>
              </Link>

              <Link
                href="/admin"
                className={`flex items-center justify-between p-3.5 rounded-xl border text-sm font-semibold transition-all ${
                  isAdminPath
                    ? 'bg-purple-600/20 border-purple-500/40 text-purple-300'
                    : 'bg-black/40 border-white/10 text-gray-300 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span>Fund Operations (Admin)</span>
                </div>
                <span className="text-xs text-purple-400 font-mono">Open</span>
              </Link>

              <Link
                href="/"
                className="flex items-center gap-3 p-3.5 rounded-xl bg-black/40 border border-white/10 text-sm font-semibold text-gray-300 hover:text-white"
              >
                <HomeIcon className="w-4 h-4 text-gray-400" />
                <span>Hedge Capital Home</span>
              </Link>

              {!user && !isAdminPath && !isClientPath && (
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm shadow-lg mt-2"
                >
                  <User className="w-4 h-4" />
                  <span>Sign In to Portal</span>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
