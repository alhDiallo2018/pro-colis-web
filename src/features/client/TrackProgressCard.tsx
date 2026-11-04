import { useMemo } from 'react'
import { Card, DataQualityTag, StopList } from '@/ds'
import type { Parcel } from '@/lib/api/types'
import { formatTimeAgo } from '@/lib/format'
import { getDriverLocationState } from './tracking'
import '@/features/transport/transit.css'

interface Point { lat: number; lng: number }

/**
 * Progression Citymapper-style : barre horizontale départ → arrivée,
 * puce bus positionnée selon la distance parcourue vs restante,
 * liste des 3 points clés (départ, position, destination).
 * Les données sont taguées : position = Direct/Estimé, étapes = Horaire/Estimé.
 */
export function TrackProgressCard({ parcel }: { parcel: Parcel }) {
  const state = getDriverLocationState(parcel)
  const departure: Point | null = pickPoint(parcel.departureLatitude, parcel.departureLongitude)
    ?? pickZonePoint(parcel.departureZone)
  const destination: Point | null = pickPoint(parcel.arrivalLatitude, parcel.arrivalLongitude)
    ?? pickZonePoint(parcel.arrivalZone)
  const driverLive = state.kind === 'active' ? state.location : state.kind === 'stale' ? state.location : null
  const driver: Point | null = driverLive && driverLive.latitude != null && driverLive.longitude != null
    ? { lat: driverLive.latitude, lng: driverLive.longitude }
    : null

  const progress = useMemo(() => {
    if (!departure || !destination) return 0
    if (!driver) return 0
    const total = distance(departure, destination)
    if (total === 0) return 0
    const done = distance(departure, driver)
    return Math.max(0, Math.min(100, (done / total) * 100))
  }, [departure, destination, driver])

  const quality: 'live' | 'estimated' | 'scheduled' | 'unavailable' =
    state.kind === 'active' ? 'live'
    : state.kind === 'stale' ? 'estimated'
    : state.kind === 'finished' ? 'scheduled'
    : 'unavailable'

  const freshness = state.kind === 'active' && state.location.updatedAt
    ? Math.round((Date.now() - new Date(state.location.updatedAt).getTime()) / 1000)
    : undefined

  return (
    <Card>
      <div className="transit-track-head">
        <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)', color: 'var(--text-strong)' }}>
          Progression
        </h3>
        <DataQualityTag quality={quality} freshnessSeconds={freshness} />
      </div>

      <div className="transit-track-progress">
        <div className="transit-track-progress-labels">
          <span>{parcel.departureCity ?? parcel.departureZoneName ?? 'Départ'}</span>
          <span>{parcel.arrivalCity ?? parcel.arrivalZoneName ?? 'Arrivée'}</span>
        </div>
        <div className="transit-track-bar">
          <div className="transit-track-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
          {progress > 0 && progress < 100
            ? `~ ${Math.round(progress)}% du trajet parcouru (estimation à vol d'oiseau)`
            : progress >= 100
              ? 'Colis arrivé à destination'
              : 'En attente du départ'}
        </div>
      </div>

      <StopList
        style={{ marginTop: 16 }}
        items={[
          {
            key: 'origin',
            label: parcel.departureCity ?? parcel.departureZoneName ?? 'Point de départ',
            tone: 'origin',
            meta: <DataQualityTag quality="scheduled" label="Départ" />,
          },
          ...(driver && driverLive
            ? [{
                key: 'driver',
                label: 'Position du véhicule',
                tone: 'current' as const,
                meta: state.kind === 'active'
                  ? <DataQualityTag quality="live" freshnessSeconds={freshness} />
                  : driverLive.updatedAt
                    ? <span style={{ fontSize: 12 }}>{formatTimeAgo(driverLive.updatedAt)}</span>
                    : <DataQualityTag quality="estimated" />,
              }]
            : [{
                key: 'driver',
                label: 'Position du véhicule',
                tone: 'pending' as const,
                meta: <DataQualityTag quality="unavailable" />,
              }]),
          {
            key: 'destination',
            label: parcel.arrivalCity ?? parcel.arrivalZoneName ?? 'Destination',
            tone: 'destination',
            meta: <DataQualityTag quality="scheduled" label="Arrivée" />,
          },
        ]}
      />
    </Card>
  )
}

function pickPoint(lat: number | null | undefined, lng: number | null | undefined): Point | null {
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat: Number(lat), lng: Number(lng) }
}
function pickZonePoint(zone: Parcel['departureZone']): Point | null {
  if (!zone || zone.latitude == null || zone.longitude == null) return null
  return { lat: zone.latitude, lng: zone.longitude }
}

// Distance euclidienne suffit pour un indicateur grossier de progression ;
// la vraie distance routière n'est pas disponible côté client.
function distance(a: Point, b: Point) {
  const dx = a.lat - b.lat, dy = a.lng - b.lng
  return Math.sqrt(dx * dx + dy * dy)
}
