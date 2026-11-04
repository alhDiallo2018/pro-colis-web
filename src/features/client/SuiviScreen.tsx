import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Avatar, Badge, Button, Card, EmptyState, Icon, IconButton, Input, Stepper, Tag } from '@/ds'
import { QrCode } from '@/components/QrCode'
import { useTrackParcel } from './hooks'
import { buildSteps } from './parcelSteps'
import { getDriverLocationState, type DriverLocationState } from './tracking'
import { TrackingMap, type MapPoint } from './TrackingMap'
import { TrackProgressCard } from './TrackProgressCard'
import { formatDate, formatFcfa, formatTimeAgo, formatWeight, toStatusKey } from '@/lib/format'
import { PARCEL_STATUS } from '@/ds'
import { ApiError } from '@/lib/api/client'
import type { DriverLocation, Parcel, ParcelZoneRef } from '@/lib/api/types'

export function SuiviScreen() {
  const params = useParams<{ trackingNumber: string }>()
  const [searchParams] = useSearchParams()
  const trackingNumber = params.trackingNumber ?? searchParams.get('tracking') ?? undefined
  const [input, setInput] = useState(trackingNumber ?? '')
  const [tracking, setTracking] = useState(trackingNumber?.trim().toUpperCase() ?? '')
  const query = useTrackParcel(tracking, !!tracking)
  const parcel = query.data

  useEffect(() => {
    if (!trackingNumber) return
    setInput(trackingNumber)
    setTracking(trackingNumber.trim().toUpperCase())
  }, [trackingNumber])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setTracking(input.trim().toUpperCase())
  }

  const statusKey = parcel ? toStatusKey(parcel.status) : null
  const statusMeta = statusKey ? PARCEL_STATUS[statusKey] : null
  const estimated = parcel?.estimatedDeliveryDate ? formatDate(parcel.estimatedDeliveryDate) : null

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* ---- Barre de recherche hero ---- */}
      <section className="cm-suivi-search">
        <h2>Suivre un colis</h2>
        <p>Entrez le numéro de suivi (ex. PC-7F3K-2291).</p>
        <form onSubmit={submit} className="cm-suivi-search-form">
          <Input
            icon="qr_code_2"
            mono
            placeholder="PC-XXXX-XXXX"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <Button type="submit" size="lg" iconTrailing="arrow_forward" loading={query.isFetching} disabled={!input.trim()}>
            Suivre
          </Button>
        </form>
      </section>

      {query.isError && (
        <EmptyState
          icon="search_off"
          tone="amber"
          title="Colis introuvable"
          message={query.error instanceof ApiError ? query.error.message : 'Vérifiez le numéro de suivi et réessayez.'}
        />
      )}

      {parcel && (
        <>
          {/* ---- Journey hero : OD + statut + méta ---- */}
          <section className="cm-journey-hero" aria-label="Résumé du trajet">
            <div className="cm-journey-hero-top">
              <span className="cm-journey-hero-track">
                <Icon name="qr_code_2" size={14} /> {parcel.trackingNumber}
              </span>
              {statusMeta && (
                <span className="cm-journey-hero-status">
                  <Icon name={statusMeta.icon} size={14} />
                  {statusMeta.label}
                </span>
              )}
            </div>

            <div className="cm-journey-hero-od">
              <div>
                <div className="cm-journey-hero-city-label">Départ</div>
                <div className="cm-journey-hero-city">
                  {parcel.departureCity ?? parcel.departureZoneName ?? '—'}
                </div>
              </div>
              <div className="cm-journey-hero-separator">
                <Icon name="local_shipping" size={20} />
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="cm-journey-hero-city-label">Arrivée</div>
                <div className="cm-journey-hero-city">
                  {parcel.arrivalCity ?? parcel.arrivalZoneName ?? '—'}
                </div>
              </div>
            </div>

            <div className="cm-journey-hero-meta">
              {parcel.weight != null && (
                <span><Icon name="scale" size={14} /> {formatWeight(parcel.weight)}</span>
              )}
              {parcel.price != null && (
                <span><Icon name="payments" size={14} /> {formatFcfa(parcel.price)}</span>
              )}
              {estimated && (
                <span><Icon name="schedule" size={14} /> ETA · {estimated}</span>
              )}
              {parcel.receiverName && (
                <span><Icon name="person" size={14} /> {parcel.receiverName}</span>
              )}
            </div>

            {(parcel.isUrgent || parcel.type) && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {parcel.isUrgent && <Tag express />}
                {parcel.type && <Tag icon="category">{parcel.type}</Tag>}
              </div>
            )}
          </section>

          {/* ---- Progress Citymapper-style ---- */}
          <TrackProgressCard parcel={parcel} />

          {/* ---- Panneau chauffeur + carte ---- */}
          <DriverPositionCard
            state={getDriverLocationState(parcel)}
            driver={parcel.driver}
            driverPoint={driverPoint(parcel.driverLocation)}
            accuracy={parcel.driverLocation?.accuracy ?? null}
            departurePoint={coordPoint(parcel.departureLatitude, parcel.departureLongitude) ?? zonePoint(parcel.departureZone)}
            destinationPoint={coordPoint(parcel.arrivalLatitude, parcel.arrivalLongitude) ?? zonePoint(parcel.arrivalZone)}
            offline={query.isError && !!query.data}
            onRefresh={() => query.refetch()}
            refreshing={query.isFetching}
          />

          {/* ---- Timeline historique ---- */}
          <Card>
            <h3 style={{ margin: '0 0 12px', fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)', color: 'var(--text-strong)' }}>Historique</h3>
            <Stepper steps={buildSteps(parcel)} />
          </Card>

          {/* ---- QR partage ---- */}
          <div className="cm-qr-card">
            <QrCode
              value={`${window.location.origin}/track/${parcel.trackingNumber}`}
              caption="Scanner pour suivre ce colis"
            />
          </div>
        </>
      )}
    </div>
  )
}

function zonePoint(zone: ParcelZoneRef | null | undefined): MapPoint | null {
  if (!zone || zone.latitude == null || zone.longitude == null) return null
  return { lat: zone.latitude, lng: zone.longitude }
}

function coordPoint(lat: number | null | undefined, lng: number | null | undefined): MapPoint | null {
  if (lat == null || lng == null) return null
  return { lat, lng }
}

function driverPoint(location: DriverLocation | null | undefined): MapPoint | null {
  if (!location || location.latitude == null || location.longitude == null) return null
  return { lat: location.latitude, lng: location.longitude }
}

function DriverPositionCard({
  state,
  driver,
  driverPoint,
  accuracy,
  departurePoint,
  destinationPoint,
  offline,
  onRefresh,
  refreshing,
}: {
  state: DriverLocationState
  driver: Parcel['driver']
  driverPoint: MapPoint | null
  accuracy: number | null
  departurePoint: MapPoint | null
  destinationPoint: MapPoint | null
  offline: boolean
  onRefresh: () => void
  refreshing: boolean
}) {
  const live = state.kind === 'active' || state.kind === 'stale'
  const liveLocation = live ? state.location : null
  const stale = state.kind === 'stale' || offline
  const liveLabel = offline
    ? 'Connexion interrompue'
    : state.kind === 'stale'
      ? 'Position ancienne'
      : state.kind === 'active'
        ? 'En direct'
        : null

  return (
    <section className="cm-driver-panel" aria-label="Position du chauffeur">
      <header className="cm-driver-panel-head">
        <h3 className="cm-driver-panel-title">
          <Icon name="near_me" size={18} style={{ color: 'var(--teal-500)' }} />
          Position du chauffeur
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {liveLabel && (
            <span className={`cm-driver-panel-live${stale ? ' cm-driver-panel-live--stale' : ''}`}>
              <span className="cm-driver-panel-live-dot" />
              {liveLabel}
            </span>
          )}
          <IconButton
            icon="refresh"
            size="sm"
            variant="ghost"
            onClick={onRefresh}
            disabled={refreshing || state.kind === 'finished'}
            aria-label="Actualiser la position GPS"
          />
        </div>
      </header>

      {driver && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px 0' }}>
          <Avatar name={driver.name ?? driver.fullName ?? 'Chauffeur'} src={driver.profilePhoto ?? undefined} size="md" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'var(--text-strong)' }}>
              {driver.name ?? driver.fullName ?? 'Chauffeur'}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
              {[driver.vehicleType, Number(driver.rating ?? 0) > 0 ? `${Number(driver.rating).toFixed(1)} ★` : ''].filter(Boolean).join(' · ')}
            </div>
          </div>
          {driver.isVerified && <Badge tone="green" icon="verified">Vérifié</Badge>}
        </div>
      )}

      {state.kind === 'finished' && (
        <p className="cm-driver-panel-empty">
          Livraison terminée — plus de suivi de position active.
        </p>
      )}

      {state.kind === 'unavailable' && (
        <p className="cm-driver-panel-empty">
          Position du chauffeur indisponible pour le moment.
        </p>
      )}

      {state.kind === 'waiting' && (
        <p className="cm-driver-panel-empty">
          En attente de position GPS…
        </p>
      )}

      {live && liveLocation && (
        <div className="cm-driver-panel-body">
          <TrackingMap
            driver={driverPoint}
            accuracy={accuracy}
            departure={departurePoint}
            destination={destinationPoint}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--fs-sm)', color: 'var(--text-body)' }}>
            <Icon name="two_wheeler" size={18} style={{ color: 'var(--teal-500)' }} />
            <span style={{ fontWeight: 700 }}>Chauffeur</span>
            <span style={{ color: 'var(--text-muted)' }}>
              {state.kind === 'stale'
                ? `Dernière position connue ${formatTimeAgo(liveLocation.updatedAt)}`
                : `Dernière position reçue : ${formatTimeAgo(liveLocation.updatedAt)}`}
            </span>
          </div>
          {driverPoint && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 12, color: 'var(--text-muted)' }}>
              <span style={{ fontFamily: 'var(--font-mono)' }}>
                GPS : {driverPoint.lat.toFixed(5)}, {driverPoint.lng.toFixed(5)}
              </span>
              {typeof accuracy === 'number' && Number.isFinite(accuracy) && accuracy >= 0 && (
                <span>Précision : ± {Math.round(accuracy)} m</span>
              )}
            </div>
          )}
          {driverPoint && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${driverPoint.lat},${driverPoint.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: 'var(--teal-600)',
                fontSize: 'var(--fs-sm)',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <Icon name="open_in_new" size={16} />
              Ouvrir cette position dans Maps
            </a>
          )}
        </div>
      )}
    </section>
  )
}
