import { readHistory, writeHistory } from './history-store'
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
      // Écriture dual-backend (LS pour la lecture synchrone au boot, IDB pour
      // la durée + les gros volumes). `writeHistory` retourne une Promise
      // mais on la laisse voler : l'historique n'est pas un verrou métier.
      void writeHistory(owner, {
        savedAt: new Date().toISOString(),
        entries: [...entries.values()]
          .sort((a, b) => Date.parse(b.updatedAt ?? '') - Date.parse(a.updatedAt ?? ''))
          .slice(0, 300),
      })
    })
  }, [owner, session])
  return null
}
