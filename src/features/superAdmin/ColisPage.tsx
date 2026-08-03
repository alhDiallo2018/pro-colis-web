import { useState } from 'react'
import { Avatar, Button, Dialog, IconButton, Input, SegmentedControl, StatusBadge } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import { ParcelDetailDialog } from '@/components/ParcelDetailDialog'
import { useAdminParcels, useDeleteAdminParcel, useSearchParcels } from './hooks'
import { formatFcfa, toStatusKey } from '@/lib/format'
import { useIsMobile } from '@/lib/useMediaQuery'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import type { Parcel } from '@/lib/api/types'

const FILTERS = [
  { value: '', label: 'Tous' },
  { value: 'pending', label: 'En attente' },
  { value: 'free', label: 'Annonces' },
  { value: 'in_transit', label: 'En transit' },
  { value: 'delivered', label: 'Livrés' },
]

const GRID = '120px 140px 1fr 160px 120px 100px 44px'
const cell: React.CSSProperties = { display: 'flex', alignItems: 'center', minWidth: 0 }

/** Paire label/valeur d'une carte mobile. */
function MobileField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontSize: 12.5 }}>
      <span style={{ color: 'var(--text-muted)', flex: 'none' }}>{label}</span>
      <span style={{ minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', color: 'var(--text-body)' }}>{children}</span>
    </div>
  )
}

export function ColisPage() {
  const isMobile = useIsMobile()
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [detailTarget, setDetailTarget] = useState<Parcel | null>(null)
  const [deleting, setDeleting] = useState<Parcel | null>(null)
  // `GET /super-admin/parcels` ne filtre que par statut et pagine : passé la
  // première page, retrouver un colis par son numéro exige la recherche
  // dédiée, qui interroge toute la base.
  const term = useDebouncedValue(search.trim(), 300)
  const searching = term.length >= 2
  const listQuery = useAdminParcels(status ? { status } : {})
  const searchQuery = useSearchParcels(term, status, searching)
  const query = searching ? searchQuery : listQuery
  const deleteMutation = useDeleteAdminParcel()
  const parcels = searching ? (searchQuery.data ?? []) : (listQuery.data?.parcels ?? [])

  const handleDelete = async () => {
    if (!deleting) return
    try {
      await deleteMutation.mutateAsync(deleting.id)
    } finally {
      setDeleting(null)
    }
  }

  const queryStateProps = {
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isEmpty: parcels.length === 0,
    emptyTitle: 'Aucun colis',
    emptyMessage: searching
      ? `Aucun colis ne correspond à « ${term} ».`
      : 'Aucun colis ne correspond à ce filtre.',
    onRetry: () => query.refetch(),
  }

  const renderDriver = (p: Parcel) =>
    p.driverName ? (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        <Avatar name={p.driverName} src={p.driver?.profilePhoto ?? undefined} size="xs" />
        <span style={{ fontSize: 12.5, color: 'var(--text-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.driverName}</span>
      </span>
    ) : (
      <span style={{ color: 'var(--text-faint)', fontStyle: 'italic', fontSize: 12.5 }}>Non assigné</span>
    )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <SegmentedControl size="sm" options={FILTERS} value={status} onChange={setStatus} />
        <div style={{ flex: 1, minWidth: 220 }}>
          <Input
            icon="search"
            placeholder="Rechercher (n° de suivi, expéditeur, destinataire…)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Panel
        title={
          searching
            ? `Résultats · ${parcels.length}`
            : `Colis${listQuery.data?.pagination ? ` · ${listQuery.data.pagination.total}` : ''}`
        }
        flush
      >
        {isMobile ? (
          <QueryState {...queryStateProps}>
            {parcels.map((p) => (
              <div
                key={p.id}
                onClick={() => setDetailTarget(p)}
                style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '13px 16px', borderBottom: '1px solid var(--slate-100)', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 12.5, color: 'var(--text-strong)' }}>{p.trackingNumber}</span>
                  <StatusBadge status={toStatusKey(p.status)} size="sm" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0, fontSize: 13, color: 'var(--text-body)', fontWeight: 500 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.departureCity ?? p.departureZoneName ?? '—'}</span>
                  <span className="material-symbols-rounded" style={{ fontSize: 15, color: 'var(--text-faint)', flex: 'none' }}>arrow_right_alt</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.arrivalCity ?? p.arrivalZoneName ?? '—'}</span>
                </div>
                <MobileField label="Client">
                  <span style={{ fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.senderName}</span>
                </MobileField>
                <MobileField label="Chauffeur">{renderDriver(p)}</MobileField>
                <MobileField label="Prix">
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12.5, color: 'var(--teal-600)' }}>
                    {p.price != null ? formatFcfa(p.price) : '—'}
                  </span>
                </MobileField>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }} onClick={(e) => e.stopPropagation()}>
                  <IconButton icon="delete" size="sm" variant="danger" title="Supprimer le colis" onClick={() => setDeleting(p)} />
                </div>
              </div>
            ))}
          </QueryState>
        ) : (
        <div className="pc-table-scroll">
        <div style={{ minWidth: 760 }}>
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
          <span />
        </div>

        <QueryState {...queryStateProps}>
          {parcels.map((p) => (
            <div
              key={p.id}
              style={{ display: 'grid', gridTemplateColumns: GRID, alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid var(--slate-100)', cursor: 'pointer' }}
              onClick={() => setDetailTarget(p)}
            >
              <span style={{ ...cell, fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 12, color: 'var(--text-strong)' }}>{p.trackingNumber}</span>
              <span style={{ ...cell, fontSize: 13, color: 'var(--text-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{p.senderName}</span>
              <span style={{ ...cell, gap: 5, fontSize: 13, color: 'var(--text-body)', fontWeight: 500 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.departureCity ?? p.departureZoneName ?? '—'}</span>
                <span className="material-symbols-rounded" style={{ fontSize: 15, color: 'var(--text-faint)', flex: 'none' }}>arrow_right_alt</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.arrivalCity ?? p.arrivalZoneName ?? '—'}</span>
              </span>
              <span style={cell}>{renderDriver(p)}</span>
              <span style={cell}>
                <StatusBadge status={toStatusKey(p.status)} size="sm" />
              </span>
              <span style={{ ...cell, fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12.5, color: 'var(--teal-600)' }}>{p.price != null ? formatFcfa(p.price) : '—'}</span>
              <span style={{ ...cell, justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
                <IconButton icon="delete" size="sm" variant="danger" title="Supprimer le colis" onClick={() => setDeleting(p)} />
              </span>
            </div>
          ))}
        </QueryState>
        </div>
        </div>
        )}
      </Panel>
      <ParcelDetailDialog parcel={detailTarget} onClose={() => setDetailTarget(null)} />

      <Dialog
        open={!!deleting}
        title="Supprimer le colis"
        icon="delete_forever"
        iconTone="danger"
        onClose={() => setDeleting(null)}
      >
        <p style={{ margin: 0 }}>
          Voulez-vous vraiment supprimer le colis <strong>{deleting?.trackingNumber}</strong> ? Cette action est définitive.
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <Button variant="secondary" onClick={() => setDeleting(null)} block>
            Annuler
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={deleteMutation.isPending} disabled={deleteMutation.isPending} block>
            Supprimer
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
