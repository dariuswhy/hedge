'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { recordUserHeartbeat } from '@/app/admin/actions'

interface ClientPresenceProps {
  userId: string
  userName: string
  userEmail: string
  userRole?: string
}

export default function ClientPresence({
  userId,
  userName,
  userEmail,
  userRole = 'client'
}: ClientPresenceProps) {
  useEffect(() => {
    if (!userId) return

    const supabase = createClient()
    const channel = supabase.channel('hedge-live-presence', {
      config: {
        presence: {
          key: userId
        }
      }
    })

    // 1. Initial heartbeat to update persistent last_seen_at
    recordUserHeartbeat(userId)

    // 2. Periodic heartbeat every 90 seconds
    const interval = setInterval(() => {
      recordUserHeartbeat(userId)
    }, 90000)

    // 3. Track presence on Supabase Realtime channel
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: userId,
          full_name: userName,
          email: userEmail,
          role: userRole,
          online_at: new Date().toISOString(),
          current_path: typeof window !== 'undefined' ? window.location.pathname : '/client'
        })
      }
    })

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        recordUserHeartbeat(userId)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      channel.untrack().then(() => {
        supabase.removeChannel(channel)
      })
    }
  }, [userId, userName, userEmail, userRole])

  return null
}
