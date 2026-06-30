import { useState } from 'react'
import { Avatar, SegmentedControl, StatusBadge } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import { useAdminParcels } from './hooks'
import { formatFcfa, toStatusKey } from '@/lib/format'

const FILTERS = [
  { value: '', label: 'Tous' },
  { value: 'pending', label: 'En attente' },
  { value: 'free', label: 'Annonces' },
  { value: 'in_transit', label: 'En transit' },
  { value: 'delivered', label: 'Livrés' },
]

const GRID = '120px 140px 1fr 160px 120px 100px'
const cell: React.CSSProperties = { display: 'flex', alignItems: 'center', minWidth: 0 }

export function ColisPage() {
  const [status, setStatus] = useState('')
  const query = useAdminParcels(status ? { status } : {})
  const parcels = query.data?.parcels ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SegmentedControl size="sm" options={FILTERS} value={status} onChange={setStatus} />

      <Panel title={`Colis${query.data?.pagination ? ` · ${query.data.pagination.total}` : ''}`} flush>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: GRID,
            padding: '11px 18px',
            borderBottom: '1px solid var(--border-subtle)',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--text-faint)',
          }}
        >
          <span>Suivi</span>
          <span>Client</span>
          <span>Trajet</span>
          <span>Chauffeur</span>
          <span>Statut</span>
          <span>Prix</span>
        </div>

        <QueryState
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          isEmpty={parcels.length === 0}
          emptyTitle="Aucun colis"
          emptyMessage="Aucun colis ne correspond à ce filtre."
          onRetry={() => query.refetch()}
        >
          {parcels.map((p) => (
            <div key={p.id} style={{ display: 'grid', gridTemplateColumns: GRID, alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid var(--slate-100)' }}>
              <span style={{ ...cell, fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 12, color: 'var(--text-strong)' }}>{p.trackingNumber}</span>
              <span style={{ ...cell, fontSize: 13, color: 'var(--text-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{p.senderName}</span>
              <span style={{ ...cell, gap: 5, fontSize: 13, color: 'var(--text-body)', fontWeight: 500 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.departureCity ?? p.departureGarageName ?? '—'}</span>
                <span className="material-symbols-rounded" style={{ fontSize: 15, color: 'var(--text-faint)', flex: 'none' }}>arrow_right_alt</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.arrivalCity ?? p.arrivalGarageName ?? '—'}</span>
              </span>
              <span style={cell}>
                {p.driverName ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    <Avatar name={p.driverName} size="xs" />
                    <span style={{ fontSize: 12.5, color: 'var(--text-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.driverName}</span>
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-faint)', fontStyle: 'italic', fontSize: 12.5 }}>Non assigné</span>
                )}
              </span>
              <span style={cell}>
                <StatusBadge status={toStatusKey(p.status)} size="sm" />
              </span>
              <span style={{ ...cell, fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12.5, color: 'var(--teal-600)' }}>{p.price != null ? formatFcfa(p.price) : '—'}</span>
            </div>
          ))}
        </QueryState>
      </Panel>
    </div>
  )
}
