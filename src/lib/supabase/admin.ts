import { createClient } from '@supabase/supabase-js'

// Note: This client uses the SERVICE_ROLE_KEY. 
// It bypasses Row Level Security (RLS).
// NEVER use this client in the browser or expose it to the client.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
