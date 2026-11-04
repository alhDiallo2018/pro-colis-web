import { ParcelDetailDialog } from '@/components/ParcelDetailDialog'
import { ZoneFilter } from '@/components/ZoneFilter'
import { useZoneFilter } from '@/lib/useZoneFilter'
import { Button, EmptyState, Icon } from '@/ds'
import type { Parcel } from '@/lib/api/types'
import { formatFcfa, formatWeight } from '@/lib/format'
import { useMemo, useState } from 'react'
import { OfferDialog } from './OfferDialog'
import { CommissionDebtNotice } from './CommissionDebtNotice'
import { useDriverBidsSent, useDriverFreeParcels } from './hooks'

type ExtraFilter = 'none' | 'express' | 'light' | 'today'

const EXTRA_FILTERS: { value: ExtraFilter; label: string; icon: string }[] = [
  { value: 'none', label: 'Tous', icon: 'filter_list' },
  { value: 'express', label: 'Express', icon: 'bolt' },
  { value: 'light', label: '< 10 kg', icon: 'feather' },
  { value: 'today', label: "Aujourd'hui", icon: 'today' },
]

function isSameDay(iso?: string) {
  if (!iso) return false
  const d = new Date(iso)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}

export function LibreServiceScreen() {
  const query = useDriverFreeParcels()
  const bidsQuery = useDriverBidsSent()
  const [offerTarget, setOfferTarget] = useState<Parcel | null>(null)
  const [detailTarget, setDetailTarget] = useState<Parcel | null>(null)
  const [extraFilter, setExtraFilter] = useState<ExtraFilter>('none')

  const allParcels = useMemo(() => query.data?.parcels ?? [], [query.data])
  const {
    items: zoneFiltered,
    mode: filterMode,
    setMode: setFilterMode,
    hasZone,
    zone: homeZone,
  } = useZoneFilter(allParcels)

  const parcels = useMemo(() => {
    if (extraFilter === 'express') return zoneFiltered.filter((p) => p.isUrgent)
    if (extraFilter === 'light') return zoneFiltered.filter((p) => (p.weight ?? Infinity) < 10)
    if (extraFilter === 'today') return zoneFiltered.filter((p) => isSameDay(p.createdAt))
    return zoneFiltered
  }, [zoneFiltered, extraFilter])

  const filterCounts: Record<ExtraFilter, number> = {
    none: zoneFiltered.length,
    express: zoneFiltered.filter((p) => p.isUrgent).length,
    light: zoneFiltered.filter((p) => (p.weight ?? Infinity) < 10).length,
    today: zoneFiltered.filter((p) => isSameDay(p.createdAt)).length,
  }

  const bidMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const b of bidsQuery.data ?? []) {
      if (b.parcelId) map.set(b.parcelId, b.id)
    }
    return map
  }, [bidsQuery.data])

  if (query.isLoading) {
    return (
      <div className="cm-detail-page" style={{ padding: '40px 0' }}>
        <p role="status" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Chargement des colis…</p>
      </div>
    )
  }

  if (query.isError) {
    return (
      <div className="cm-detail-page" style={{ maxWidth: 920 }}>
        <EmptyState
          icon="cloud_off"
          tone="amber"
          title="Impossible de charger les colis"
          message={query.error?.message || 'Vérifiez votre connexion et réessayez.'}
          action={<Button icon="refresh" onClick={() => query.refetch()}>Réessayer</Button>}
        />
      </div>
    )
  }

  return (
    <div className="cm-detail-page" style={{ maxWidth: 920 }}>
      <CommissionDebtNotice compact />

      {/* ---- Header ---- */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, letterSpacing: '-0.015em', color: 'var(--text-strong)' }}>
            Colis à prendre
          </h1>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            {filterMode === 'zone' && hasZone
              ? `Zone · ${homeZone.name ?? 'Non définie'}`
              : 'Toutes les zones disponibles'}
            {' · '}
            <strong style={{ color: 'var(--text-body)' }}>{parcels.length} colis</strong>
          </p>
        </div>
        <ZoneFilter
          mode={filterMode}
          onChange={setFilterMode}
          zoneName={homeZone.name}
          hasZone={hasZone}
        />
      </div>

      {/* ---- Chip filters ---- */}
      <div className="cm-chip-row">
        {EXTRA_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className="cm-chip"
            aria-pressed={extraFilter === f.value}
            onClick={() => setExtraFilter(f.value)}
          >
            <Icon name={f.icon} size={15} />
            {f.label}
            <span className="cm-chip-count">{filterCounts[f.value]}</span>
          </button>
        ))}
      </div>

      {/* ---- List ---- */}
      {parcels.length === 0 ? (
        <EmptyState
          icon="inbox"
          tone="neutral"
          title="Aucun colis disponible"
          message={
            filterMode === 'zone' && hasZone
              ? `Aucun colis disponible dans votre zone (${homeZone.name}).`
              : "Essayez un autre filtre ou revenez plus tard."
          }
          action={<Button variant="secondary" icon="refresh" onClick={() => query.refetch()}>Rafraîchir</Button>}
        />
      ) : (
        <div className="cm-list-stack">
          {parcels.map((p) => (
            <ParcelRow
              key={p.id}
              parcel={p}
              hasBid={bidMap.has(p.id)}
              onOffer={() => setOfferTarget(p)}
              onDetails={() => setDetailTarget(p)}
            />
          ))}
        </div>
      )}

      <OfferDialog
        parcel={offerTarget}
        onClose={() => setOfferTarget(null)}
        existingBidId={offerTarget ? bidMap.get(offerTarget.id) ?? null : null}
      />
      <ParcelDetailDialog parcel={detailTarget} onClose={() => setDetailTarget(null)} />
    </div>
  )
}

function ParcelRow({
  parcel, hasBid, onOffer, onDetails,
}: {
  parcel: Parcel
  hasBid: boolean
  onOffer: () => void
  onDetails: () => void
}) {
  const classes = ['cm-parcel-row']
  if (parcel.isUrgent) classes.push('cm-parcel-row--urgent')
  return (
    <button type="button" className={classes.join(' ')} onClick={onOffer}>
      <span className="cm-parcel-row-icon">
        <Icon name="package_2" size={22} />
      </span>
      <div className="cm-parcel-row-body">
        <div className="cm-parcel-row-route">
          {parcel.departureCity ?? parcel.departureZoneName ?? '—'}
          <Icon name="arrow_right_alt" size={16} style={{ color: 'var(--text-faint)' }} />
          {parcel.arrivalCity ?? parcel.arrivalZoneName ?? '—'}
          {parcel.isUrgent && <span className="cm-parcel-row-urgent-mark">»</span>}
        </div>
        <div className="cm-parcel-row-meta">
          <span className="cm-parcel-row-tracking">{parcel.trackingNumber}</span>
          {parcel.weight != null && <span>· {formatWeight(parcel.weight)}</span>}
          {parcel.type && <span>· {parcel.type}</span>}
          {(parcel.photoUrls?.length ?? 0) > 0 && (
            <span style={{ color: 'var(--text-faint)' }}>
              <Icon name="photo_camera" size={13} />
              {parcel.photoUrls!.length}
            </span>
          )}
          {(parcel.audioUrls?.length ?? 0) > 0 && (
            <span style={{ color: 'var(--text-faint)' }}>
              <Icon name="mic" size={13} />
            </span>
          )}
        </div>
      </div>
      <span className="cm-parcel-row-price">{formatFcfa(parcel.price)}</span>
      <div className="cm-parcel-row-actions">
        <button
          type="button"
          className="cm-parcel-row-info-btn"
          title="Voir les détails du colis"
          aria-label="Voir les détails du colis"
          onClick={(e) => { e.stopPropagation(); onDetails() }}
        >
          <Icon name="info" size={18} />
        </button>
        <Button
          size="sm"
          icon={hasBid ? 'forum' : 'gavel'}
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); onOffer() }}
        >
          {hasBid ? 'Suivi offre' : 'Faire une offre'}
        </Button>
      </div>
    </button>
  )
}
