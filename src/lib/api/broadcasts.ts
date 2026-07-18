import { api } from './client'
import type { Broadcast } from '@/lib/broadcasts'

/** Public broadcasts for the banner (all authenticated users).
 *  Reuses GET /super-admin/config since broadcasts are stored in
 *  system_configs alongside other config. A dedicated /broadcasts
 *  endpoint should be created by the backend team for better perf. */
export async function fetchActiveBroadcasts(): Promise<Broadcast[]> {
  const { data } = await api.get('/super-admin/config')
  const config = (data.config ?? data.data ?? {}) as Record<string, unknown>
  const raw = config.broadcasts
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
