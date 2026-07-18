import { useMemo, useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { fetchActiveBroadcasts } from '@/lib/api/broadcasts'

const STORAGE_KEY = 'procolis-broadcasts'

export interface Broadcast {
  id: string
  title: string
  message: string
  imageUrl?: string
  scroll?: boolean
  targetRoles: ('client' | 'driver' | 'admin' | 'super_admin')[]
  type: 'info' | 'warning' | 'success' | 'promo'
  active: boolean
  startsAt: string
  endsAt: string
  createdAt: string
}

export function loadBroadcasts(): Broadcast[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Broadcast[]) : []
  } catch {
    return []
  }
}

export function saveBroadcasts(list: Broadcast[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

const DISMISSED_KEY = 'procolis-broadcasts-dismissed'

function loadDismissed(): string[] {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function dismissBroadcast(id: string): void {
  const set = new Set(loadDismissed())
  set.add(id)
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...set]))
}

export function useActiveBroadcasts(): Broadcast[] {
  const role = useAuthStore((s) => s.user?.role)
  const accessToken = useAuthStore((s) => s.accessToken)
  const [serverBroadcasts, setServerBroadcasts] = useState<Broadcast[] | null>(null)

  useEffect(() => {
    if (!accessToken || !role) {
      setServerBroadcasts(null)
      return
    }
    let cancelled = false
    fetchActiveBroadcasts()
      .then((b) => {
        if (!cancelled) setServerBroadcasts(b)
      })
      .catch(() => {
        if (!cancelled) setServerBroadcasts(null)
      })
    return () => { cancelled = true }
  }, [accessToken, role])

  return useMemo(() => {
    if (!role) return []
    const now = new Date().toISOString()
    const dismissed = new Set(loadDismissed())

    const source = serverBroadcasts ?? loadBroadcasts()

    return source.filter(
      (b) =>
        b.active &&
        b.targetRoles.includes(role) &&
        b.startsAt <= now &&
        b.endsAt >= now &&
        !dismissed.has(b.id),
    )
  }, [role, serverBroadcasts])
}
