import { prefix, readHistory } from './history-store'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { formatDate, formatFcfa } from '@/lib/format'
import { Button, Icon } from '@/ds'
import './pwa.css'
export { OfflineHistoryRecorder } from './OfflineHistoryRecorder'

export function OfflineHistory() {
  const user = useAuthStore((s) => s.user)
  const [snapshot, setSnapshot] = useState(() => (user ? readHistory(user.id) : null))
  useEffect(() => setSnapshot(user ? readHistory(user.id) : null), [user])

  return (
    <div className="cm-detail-page" style={{ maxWidth: 820 }}>
      <div className="cm-page-head">
        <div className="cm-page-head-body">
          <h1>Mon historique hors connexion</h1>
          <p className="cm-page-head-sub">
            {user?.fullName} · {user?.role === 'driver' ? 'Chauffeur' : 'Client'}
          </p>
        </div>
      </div>

      <div className="pwa-offline-info">
        Lecture seule des colis déjà chargés sur cet appareil. Les statuts peuvent avoir changé
        depuis la dernière synchronisation. Une première connexion et les opérations nécessitent
        Internet.
      </div>

      {snapshot ? (
        <>
          <p className="pwa-offline-meta">
            Dernière sauvegarde : <strong>{formatDate(snapshot.savedAt)}</strong> ·{' '}
            <strong>{snapshot.entries.length}</strong> colis
          </p>
          <div>
            <Button
              variant="secondary"
              icon="delete_outline"
              onClick={() => {
                if (user) localStorage.removeItem(prefix + user.id)
                setSnapshot(null)
              }}
            >
              Effacer la copie sur cet appareil
            </Button>
          </div>
          <div className="pwa-offline-list">
            {snapshot.entries.map((p) => (
              <article key={p.id} className="pwa-offline-row">
                <strong>{p.trackingNumber}</strong>
                <span className="pwa-offline-row-route">
                  {p.departure}
                  <Icon name="arrow_right_alt" size={16} style={{ color: 'var(--text-faint)' }} />
                  {p.arrival}
                </span>
                <span className="pwa-offline-row-meta">
                  {p.status} · {p.price != null ? formatFcfa(p.price) : 'Prix à confirmer'} ·{' '}
                  {formatDate(p.updatedAt)}
                </span>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="pwa-offline-empty">
          Aucun historique sauvegardé. Consultez vos colis une première fois avec une connexion.
        </div>
      )}
    </div>
  )
}
