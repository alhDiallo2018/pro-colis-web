// ============================================================
// FILE: lib/screens/driver/LibreServiceScreen.tsx
// ============================================================

import { Panel } from '@/components/Panel'
import { ParcelDetailDialog } from '@/components/ParcelDetailDialog'
import { ZoneFilter } from '@/components/ZoneFilter'
import { useZoneFilter } from '@/lib/useZoneFilter'
import { Badge, Button } from '@/ds'
import type { Parcel } from '@/lib/api/types'
import { formatFcfa, formatWeight } from '@/lib/format'
import { useMemo, useState } from 'react'
import { OfferDialog } from './OfferDialog'
import { useDriverBidsSent, useDriverFreeParcels } from './hooks'

export function LibreServiceScreen() {
  const query = useDriverFreeParcels()
  const bidsQuery = useDriverBidsSent()
  const [offerTarget, setOfferTarget] = useState<Parcel | null>(null)
  const [detailTarget, setDetailTarget] = useState<Parcel | null>(null)
  
  const allParcels = useMemo(() => query.data?.parcels ?? [], [query.data])
  const {
    items: parcels,
    mode: filterMode,
    setMode: setFilterMode,
    hasZone,
    zone: homeZone,
  } = useZoneFilter(allParcels)

  const bidMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const b of bidsQuery.data ?? []) {
      if (b.parcelId) map.set(b.parcelId, b.id)
    }
    return map
  }, [bidsQuery.data])

  // ✅ Gestion des états de chargement
  if (query.isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <div>Chargement des colis...</div>
      </div>
    )
  }

  if (query.isError) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <div>Erreur: {query.error?.message || 'Erreur de chargement'}</div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 920, margin: '0 auto' }}>
      <Panel
        title="Colis à prendre"
        flush
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ZoneFilter
              mode={filterMode}
              onChange={setFilterMode}
              zoneName={homeZone.name}
              hasZone={hasZone}
            />
            <Badge tone="primary">{parcels.length}</Badge>
          </div>
        }
      >
        {parcels.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)' }}>
              {filterMode === 'zone' && hasZone
                ? `Aucun colis disponible dans votre zone (${homeZone.name}).`
                : 'Aucun colis disponible pour le moment.'}
            </p>
            <Button
              variant="secondary"
              onClick={() => query.refetch()}
              style={{ marginTop: 12 }}
            >
              Rafraîchir
            </Button>
          </div>
        )}

        {parcels.map((p) => {
          const hasBid = bidMap.has(p.id)
          return (
            <div
              key={p.id}
              role="button"
              tabIndex={0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 18px',
                borderBottom: '1px solid var(--slate-100)',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--slate-50)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
              onClick={() => setOfferTarget(p)}
            >
              {/* Icône */}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 44,
                  height: 44,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-primary-soft)',
                  color: 'var(--color-primary)',
                  flex: 'none',
                }}
              >
                <span className="material-symbols-rounded fill" style={{ fontSize: 23 }}>
                  package_2
                </span>
              </span>

              {/* Informations du colis */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: 15,
                    color: 'var(--text-strong)',
                  }}
                >
                  {p.departureCity ?? p.departureZoneName ?? '—'}
                  <span
                    className="material-symbols-rounded"
                    style={{ fontSize: 16, color: 'var(--text-faint)' }}
                  >
                    arrow_right_alt
                  </span>
                  {p.arrivalCity ?? p.arrivalZoneName ?? '—'}
                  {p.isUrgent && (
                    <span
                      style={{
                        color: 'var(--red-400)',
                        fontWeight: 800,
                        letterSpacing: '-1px',
                      }}
                    >
                      »
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    marginTop: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{p.trackingNumber}</span>
                  {p.weight != null && <span>· {formatWeight(p.weight)}</span>}
                  {p.type && <span>· {p.type}</span>}
                  {(p.photoUrls?.length ?? 0) > 0 && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 2,
                        marginLeft: 4,
                        color: 'var(--text-faint)',
                      }}
                    >
                      <span className="material-symbols-rounded" style={{ fontSize: 14 }}>
                        photo_camera
                      </span>
                      {p.photoUrls!.length}
                    </span>
                  )}
                  {(p.audioUrls?.length ?? 0) > 0 && (
                    <span
                      className="material-symbols-rounded"
                      style={{ fontSize: 14, marginLeft: 4, color: 'var(--text-faint)' }}
                    >
                      mic
                    </span>
                  )}
                </div>
              </div>

              {/* Prix */}
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  fontSize: 15,
                  color: 'var(--teal-600)',
                }}
              >
                {formatFcfa(p.price)}
              </span>

              {/* Bouton Détails */}
              <button
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation()
                  setDetailTarget(p)
                }}
                style={{
                  flex: 'none',
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'var(--surface-sunken)',
                  color: 'var(--text-muted)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                title="Voir les détails du colis"
              >
                <span className="material-symbols-rounded" style={{ fontSize: 20 }}>
                  info
                </span>
              </button>

              {/* Bouton Offre */}
              <Button
                size="sm"
                icon={hasBid ? 'forum' : 'gavel'}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation()
                  setOfferTarget(p)
                }}
              >
                {hasBid ? 'Suivi offre' : 'Faire une offre'}
              </Button>
            </div>
          )
        })}
      </Panel>

      <OfferDialog
        parcel={offerTarget}
        onClose={() => setOfferTarget(null)}
        existingBidId={offerTarget ? bidMap.get(offerTarget.id) ?? null : null}
      />
      <ParcelDetailDialog parcel={detailTarget} onClose={() => setDetailTarget(null)} />
    </div>
  )
}