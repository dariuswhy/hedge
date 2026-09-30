'use client'

import { useEffect } from 'react'
import { recordUserHeartbeat } from '@/app/admin/actions'

interface ClientPresenceProps {
  userId: string
  userName?: string
  userEmail?: string
  userRole?: string
}

export default function ClientPresence({ userId }: ClientPresenceProps) {
  useEffect(() => {
    if (!userId) return

    // 1. Initial heartbeat when entering client portal
    recordUserHeartbeat(userId)

    // 2. Periodic heartbeat every 45 seconds while active
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        recordUserHeartbeat(userId)
      }
    }, 45000)

    // 3. Heartbeat when user switches back to this tab
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        recordUserHeartbeat(userId)
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [userId])

  return null
}
