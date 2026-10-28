import { prefix, readHistory } from './history-store'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { queryClient } from '@/lib/queryClient'
import type { Parcel } from '@/lib/api/types'

/** Ne conserver que les listes propres au compte, jamais les positions, codes
 * de remise, messages, documents d'identité ou résultats de disponibilité. */
export function OfflineHistoryRecorder() {
  const owner = useAuthStore((s) => s.user?.id),
    session = useAuthStore((s) => s.sessionId)
  useEffect(() => {
    if (!owner || !session) return
    return queryClient.getQueryCache().subscribe((event) => {
      if (
        event.type !== 'updated' ||
        event.action.type !== 'success' ||
        useAuthStore.getState().sessionId !== session
      )
        return
      const query = event.query,
        keys = query.queryKey
      if (!['client', 'driver'].includes(String(keys[0])) || keys[1] !== 'parcels') return
      const data = query.state.data as { parcels?: Parcel[] } | undefined
      if (!Array.isArray(data?.parcels)) return
      const entries = new Map((readHistory(owner)?.entries ?? []).map((e) => [e.id, e]))
      data.parcels.forEach((p) =>
        entries.set(p.id, {
          id: p.id,
          trackingNumber: p.trackingNumber,
          status: p.status,
          departure: p.departureZoneName ?? p.departureCity ?? '—',
          arrival: p.arrivalZoneName ?? p.arrivalCity ?? '—',
          updatedAt: p.updatedAt,
          price: p.price,
        }),
      )
      try {
        localStorage.setItem(
          prefix + owner,
          JSON.stringify({
            savedAt: new Date().toISOString(),
            entries: [...entries.values()]
              .sort((a, b) => Date.parse(b.updatedAt ?? '') - Date.parse(a.updatedAt ?? ''))
              .slice(0, 300),
          }),
        )
      } catch {
        console.warn('[PWA] Historique local non sauvegardé : stockage indisponible')
      }
    })
  }, [owner, session])
  return null
}
