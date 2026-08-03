import { api } from './client'
import type { NotificationPreference } from '@/lib/notifications'

export interface AppNotification {
  id: string
  type: string
  title: string
  body: string
  isRead: boolean
  priority?: string
  parcelId?: string | null
  bidId?: string | null
  senderId?: string | null
  senderName?: string | null
  data?: { trackingNumber?: string; status?: string } & Record<string, unknown>
  readAt?: string | null
  createdAt?: string
}

/** Recent notifications for the current user (most recent first). */
export async function list(limit = 20): Promise<AppNotification[]> {
  const { data } = await api.get('/notifications', { params: { limit } })
  return (data.notifications ?? data.data ?? []) as AppNotification[]
}

export async function unreadCount(): Promise<number> {
  const { data } = await api.get('/notifications/unread-count')
  return (data.unreadCount ?? data.count ?? 0) as number
}

export async function markRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read`)
}

export async function markAllRead(): Promise<void> {
  await api.post('/notifications/read-all')
}

/** Retire une notification de la boîte de l'utilisateur (définitif). */
export async function remove(id: string): Promise<void> {
  await api.delete(`/notifications/${id}`)
}

/** Vide entièrement la boîte de l'utilisateur. */
export async function removeAll(): Promise<void> {
  await api.delete('/notifications/all')
}

export async function getPreferences(): Promise<NotificationPreference[]> {
  const { data } = await api.get('/notifications/preferences')
  return (data.preferences ?? []) as NotificationPreference[]
}

export async function updatePreferences(preferences: NotificationPreference[]): Promise<void> {
  await api.put('/notifications/preferences', { preferences })
}
