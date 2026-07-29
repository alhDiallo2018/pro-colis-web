import { api } from './client'
import type { Broadcast } from '@/lib/broadcasts'

/** Public broadcasts for the banner, including anonymous visitors. */
export async function fetchActiveBroadcasts(): Promise<Broadcast[]> {
  const { data } = await api.get('/public/broadcasts')
  const raw = data.broadcasts ?? data.data?.broadcasts
  if (!Array.isArray(raw)) return []
  return raw as Broadcast[]
}

export async function adminLoadBroadcasts(): Promise<Broadcast[]> {
  const { data } = await api.get('/super-admin/config')
  const config = (data.config ?? data.data ?? {}) as Record<string, unknown>
  const raw = config.broadcasts
  if (!Array.isArray(raw)) return []
  return raw as Broadcast[]
}

export async function adminSaveBroadcasts(broadcasts: Broadcast[]): Promise<void> {
  await api.put('/super-admin/config', { broadcasts })
}
