import { prefix, readHistory } from './history-store'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { formatDate, formatFcfa } from '@/lib/format'
import { Button } from '@/ds'
import '@/features/transport/transport.css'
export { OfflineHistoryRecorder } from './OfflineHistoryRecorder'
export function OfflineHistory() {
  const user = useAuthStore((s) => s.user),
    [snapshot, setSnapshot] = useState(() => (user ? readHistory(user.id) : null))
  useEffect(() => setSnapshot(user ? readHistory(user.id) : null), [user])
  return (
    <section className="transport-panel">
      <h2>Mon historique hors connexion</h2>
      <p>
        {user?.fullName} · {user?.role === 'driver' ? 'Chauffeur' : 'Client'}
      </p>
      <p className="transport-note">
        Lecture seule des colis déjà chargés sur cet appareil. Les statuts peuvent avoir changé
        depuis la dernière synchronisation. Une première connexion et les opérations nécessitent
        Internet.
      </p>
      {snapshot ? (
        <>
          <p>
            Dernière sauvegarde : {formatDate(snapshot.savedAt)} · {snapshot.entries.length} colis
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              if (user) localStorage.removeItem(prefix + user.id)
              setSnapshot(null)
            }}
          >
            Effacer la copie sur cet appareil
          </Button>
          <div className="transport-preview" style={{ maxHeight: 'none' }}>
            {snapshot.entries.map((p) => (
              <article key={p.id} className="transport-panel">
                <strong>{p.trackingNumber}</strong>
                <span>
                  {p.departure} → {p.arrival}
                </span>
                <span>
                  {p.status} · {p.price != null ? formatFcfa(p.price) : 'Prix à confirmer'} ·{' '}
                  {formatDate(p.updatedAt)}
                </span>
              </article>
            ))}
          </div>
        </>
      ) : (
        <p>
          Aucun historique sauvegardé. Consultez vos colis une première fois avec une connexion.
        </p>
      )}
    </section>
  )
}
