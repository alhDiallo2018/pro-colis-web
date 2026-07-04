import { useMemo, useState } from 'react'
import { Badge, Button } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import { OfferDialog } from './OfferDialog'
import { useDriverFreeParcels, useDriverBidsSent } from './hooks'
import { formatFcfa, formatWeight } from '@/lib/format'
import type { Parcel } from '@/lib/api/types'

export function LibreServiceScreen() {
  const query = useDriverFreeParcels()
  const bidsQuery = useDriverBidsSent()
  const parcels = query.data?.parcels ?? []
  const [offerTarget, setOfferTarget] = useState<Parcel | null>(null)

  const bidMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const b of bidsQuery.data ?? []) {
      if (b.parcelId) map.set(b.parcelId, b.id)
    }
    return map
  }, [bidsQuery.data])

  return (
    <div style={{ maxWidth: 920, margin: '0 auto' }}>
      <Panel title="Annonces" flush action={<Badge tone="primary">{parcels.length}</Badge>}>
        <QueryState
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          isEmpty={parcels.length === 0}
          emptyTitle="Aucune annonce"
          emptyMessage="Aucune annonce sur vos trajets pour le moment."
          onRetry={() => query.refetch()}
        >
          {parcels.map((p) => {
            const hasBid = bidMap.has(p.id)
            return (
              <div
                key={p.id}
                role="button"
                tabIndex={0}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: '1px solid var(--slate-100)', cursor: 'pointer' }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-soft)', color: 'var(--color-primary)', flex: 'none' }}>
                  <span className="material-symbols-rounded fill" style={{ fontSize: 23 }}>
                    package_2
                  </span>
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-strong)' }}>
                    {p.departureCity ?? p.departureGarageName ?? '—'}
                    <span className="material-symbols-rounded" style={{ fontSize: 16, color: 'var(--text-faint)' }}>
                      arrow_right_alt
                    </span>
                    {p.arrivalCity ?? p.arrivalGarageName ?? '—'}
                    {p.isUrgent && (
                      <span style={{ color: 'var(--red-400)', fontWeight: 800, letterSpacing: '-1px' }}>»</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{p.trackingNumber}</span>
                    {p.weight != null && <span>· {formatWeight(p.weight)}</span>}
                    {p.type && <span>· {p.type}</span>}
                    {(p.photoUrls?.length ?? 0) > 0 && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, marginLeft: 4, color: 'var(--text-faint)' }}>
                        <span className="material-symbols-rounded" style={{ fontSize: 14 }}>photo_camera</span>
                        {p.photoUrls!.length}
                      </span>
                    )}
                    {(p.audioUrls?.length ?? 0) > 0 && (
                      <span className="material-symbols-rounded" style={{ fontSize: 14, marginLeft: 4, color: 'var(--text-faint)' }}>mic</span>
                    )}
                  </div>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15, color: 'var(--teal-600)' }}>{formatFcfa(p.price)}</span>
                <Button size="sm" icon={hasBid ? 'forum' : 'gavel'} onClick={() => setOfferTarget(p)}>
                  {hasBid ? 'Negocier' : 'Faire une offre'}
                </Button>
              </div>
            )
          })}
        </QueryState>
      </Panel>

      <OfferDialog
        parcel={offerTarget}
        onClose={() => setOfferTarget(null)}
        existingBidId={offerTarget ? bidMap.get(offerTarget.id) ?? null : null}
      />
    </div>
  )
}
