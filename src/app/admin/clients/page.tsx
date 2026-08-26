import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Search, ChevronRight, User, TrendingUp, DollarSign } from 'lucide-react'

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams?: { query?: string }
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/client')

  // Fetch clients
  let query = supabase.from('profiles').select('*').eq('role', 'client')
  
  if (searchParams?.query) {
    query = query.ilike('full_name', `%${searchParams.query}%`)
  }

  const { data: clients } = await query

  // Fetch latest ledger values for these clients
  const clientIds = clients?.map(c => c.id) || []
  
  // Actually, we can fetch all ledgers and sort them
  const { data: ledgers } = await supabase
    .from('ledger')
    .select('user_id, current_value')
    .order('created_at', { ascending: false })

  // Map to get the latest value per user
  const latestValues = new Map()
  if (ledgers) {
    for (const l of ledgers) {
      if (!latestValues.has(l.user_id)) {
        latestValues.set(l.user_id, l.current_value)
      }
    }
  }

  return (
    <div className="min-h-screen bg-black text-white pt-28 pb-12 px-6">
      <div className="max-w-7xl mx-auto space-y-10">
        
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-sm font-medium text-blue-400 tracking-wide uppercase">Client Directory</span>
            </div>
            <h1 className="text-4xl font-light tracking-tight">Manage Clients</h1>
            <p className="text-gray-400 mt-2 text-lg">Search and manage individual client portfolios.</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin" className="glass px-6 py-2.5 rounded-full text-sm font-medium hover:bg-white/10 transition-colors text-white">
              Back to Overview
            </Link>
          </div>
        </header>

        {/* Search */}
        <div className="glass-card rounded-3xl p-4 md:p-6 flex flex-col md:flex-row items-center gap-4">
          <form className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input 
              name="query"
              type="text" 
              defaultValue={searchParams?.query || ''}
              placeholder="Search clients by name..." 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
            />
          </form>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="bg-white/5 px-3 py-1 rounded-full">{clients?.length || 0}</span>
            Total Clients
          </div>
        </div>

        {/* Client List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients?.map((client) => {
            const currentValue = latestValues.get(client.id) || 0
            
            return (
              <Link 
                href={`/admin/clients/${client.id}`} 
                key={client.id}
                className="glass-card rounded-3xl p-6 group hover:border-blue-500/30 transition-all hover:bg-white/[0.03] cursor-pointer"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <User className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-white">{client.full_name}</h3>
                      <p className="text-sm text-gray-500">{client.email}</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5">
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <DollarSign className="w-4 h-4" />
                      Current Value
                    </div>
                    <div className="font-semibold text-white">
                      ${Number(currentValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
          
          {(!clients || clients.length === 0) && (
            <div className="col-span-full py-20 text-center glass-card rounded-3xl border-dashed border-white/20">
              <User className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-400">No clients found</h3>
              <p className="text-gray-500 mt-2">Try a different search query or wait for users to sign up.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
