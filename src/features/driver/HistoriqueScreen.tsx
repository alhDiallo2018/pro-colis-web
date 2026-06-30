import { StatusBadge } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import { useDriverParcels } from './hooks'
import { formatDate, formatFcfa, toStatusKey } from '@/lib/format'

export function HistoriqueScreen() {
  const query = useDriverParcels()
  const history = (query.data?.parcels ?? []).filter((p) => p.status === 'delivered' || p.status === 'cancelled')

  return (
    <div style={{ maxWidth: 920, margin: '0 auto' }}>
      <Panel title="Historique des courses" flush>
        <QueryState
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          isEmpty={history.length === 0}
          emptyTitle="Aucune course terminée"
          emptyMessage="Vos livraisons terminées ou annulées apparaîtront ici."
          onRetry={() => query.refetch()}
        >
          {history.map((p) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: '1px solid var(--slate-100)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14.5, color: 'var(--text-strong)' }}>
                  {p.departureCity ?? p.departureGarageName ?? '—'}
                  <span className="material-symbols-rounded" style={{ fontSize: 16, color: 'var(--text-faint)' }}>arrow_right_alt</span>
                  {p.arrivalCity ?? p.arrivalGarageName ?? '—'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{p.trackingNumber}</span> · {formatDate(p.deliveryDate ?? p.updatedAt)}
                </div>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: 'var(--teal-600)' }}>{p.price != null ? formatFcfa(p.price) : '—'}</span>
              <StatusBadge status={toStatusKey(p.status)} size="sm" />
            </div>
          ))}
        </QueryState>
      </Panel>
    </div>
  )
}
