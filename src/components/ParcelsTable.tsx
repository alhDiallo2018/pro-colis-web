import { StatusBadge } from '@/ds'
import type { Parcel } from '@/lib/api/types'
import { formatFcfa, toStatusKey } from '@/lib/format'

interface ParcelsTableProps {
  parcels: Parcel[]
  loading?: boolean
  onRowClick?: (parcel: Parcel) => void
  emptyHint?: string
}

const GRID = '128px 1fr 132px 110px 40px'

const cell: React.CSSProperties = { display: 'flex', alignItems: 'center', minWidth: 0 }

/** Compact recent-parcels table (tracking · route · status · price). */
export function ParcelsTable({ parcels, loading, onRowClick, emptyHint }: ParcelsTableProps) {
  return (
    <div>
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
        <span>Trajet</span>
        <span>Statut</span>
        <span>Prix</span>
        <span />
      </div>

      {loading && <div style={{ padding: 18, color: 'var(--text-muted)', fontSize: 13.5 }}>Chargement…</div>}

      {!loading && parcels.length === 0 && (
        <div style={{ padding: 18, color: 'var(--text-muted)', fontSize: 13.5 }}>{emptyHint ?? 'Aucun colis.'}</div>
      )}

      {!loading &&
        parcels.map((p) => (
          <div
            key={p.id}
            onClick={onRowClick ? () => onRowClick(p) : undefined}
            style={{
              display: 'grid',
              gridTemplateColumns: GRID,
              alignItems: 'center',
              padding: '13px 18px',
              borderBottom: '1px solid var(--slate-100)',
              cursor: onRowClick ? 'pointer' : 'default',
            }}
          >
            <span style={{ ...cell, fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 12.5, color: 'var(--text-strong)' }}>
              {p.trackingNumber}
            </span>
            <span style={{ ...cell, gap: 6, fontSize: 13.5, color: 'var(--text-body)', fontWeight: 500 }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.departureCity ?? p.departureGarageName ?? '—'}
              </span>
              <span className="material-symbols-rounded" style={{ fontSize: 16, color: 'var(--text-faint)', flex: 'none' }}>
                arrow_right_alt
              </span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.arrivalCity ?? p.arrivalGarageName ?? '—'}
              </span>
            </span>
            <span style={cell}>
              <StatusBadge status={toStatusKey(p.status)} size="sm" />
            </span>
            <span style={{ ...cell, fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13.5, color: 'var(--teal-600)' }}>
              {p.price != null ? formatFcfa(p.price) : '—'}
            </span>
            <span style={{ ...cell, justifyContent: 'flex-end' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 20, color: 'var(--text-faint)' }}>
                chevron_right
              </span>
            </span>
          </div>
        ))}
    </div>
  )
}
