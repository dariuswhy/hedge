import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminForms from './admin-forms'
import { Users, TrendingUp, DollarSign } from 'lucide-react'

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/client')
  }

  // Fetch some basic stats
  const { data: clients } = await supabase.from('profiles').select('id, full_name, email').eq('role', 'client')
  
  // To get the latest fund value, we can sum the latest ledger entry for each user.
  // This might require a complex query or just fetching all and grouping in memory for this simple dashboard.
  const { data: latestLedgers } = await supabase
    .from('ledger')
    .select('user_id, current_value')
    .order('created_at', { ascending: false })

  const latestUserValues = new Map()
  if (latestLedgers) {
    for (const l of latestLedgers) {
      if (!latestUserValues.has(l.user_id)) {
        latestUserValues.set(l.user_id, l.current_value)
      }
    }
  }

  let totalFundValue = 0
  latestUserValues.forEach(val => { totalFundValue += Number(val) })

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light tracking-tight">Admin Dashboard</h1>
            <p className="text-gray-400">Manage clients, capital, and fund performance.</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Current Total Fund Value</p>
            <p className="text-4xl font-semibold text-blue-400">
              ${totalFundValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card/40 border border-white/5 rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-xl font-medium">Clients</h2>
            </div>
            <p className="text-3xl font-light">{clients?.length || 0}</p>
          </div>
          {/* We can add more stat cards here later */}
        </div>

        {/* Client Management Forms (Client Component) */}
        <AdminForms clients={clients || []} />
      </div>
    </div>
  )
}
