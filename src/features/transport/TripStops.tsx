import { useEffect, useMemo, useRef, useState } from 'react'
import { loadGoogleMaps } from '@/components/LocationInput'
import { StopList, DataQualityTag, LineBadge, type TransitOperator } from '@/ds'
import type { Advertisement } from '@/lib/api/advertisements'
import './transport.css'
import './transit.css'

interface Point { lat: number; lng: number }

/**
 * Carte Citymapper-style : polyline reliant les arrêts + marqueurs numérotés,
 * à côté d'une liste verticale d'arrêts. Les horaires sont tagués "Horaire"
 * (scheduled) ou "Estimé" (offset seulement), jamais mélangés.
 */
export function TripStops({ ad }: { ad: Advertisement }) {
  const itinerary = ad.itinerary
  const transitMeta = (ad as unknown as {
    transitLine?: { operator: TransitOperator; number: string }
  }).transitLine
  const stops = itinerary?.stops ?? []

  // Coordonnées : on ne trace la polyline que si assez de points géolocalisés.
  const points = useMemo<Point[]>(() => {
    return stops
      .map((s) => {
        const lat = (s as unknown as { latitude?: number }).latitude
        const lng = (s as unknown as { longitude?: number }).longitude
        return lat && lng ? { lat: Number(lat), lng: Number(lng) } : null
      })
      .filter((p): p is Point => !!p)
  }, [stops])

  if (!itinerary) return null

  return (
    <section className="transit-panel">
      <div className="transit-panel-head">
        {transitMeta && <LineBadge operator={transitMeta.operator} number={transitMeta.number} size="md" />}
        <h3 className="transit-panel-title">
          {itinerary.serviceType === 'gp'
            ? 'Voyage GP'
            : itinerary.serviceType === 'shuttle'
              ? itinerary.lineNumber
                ? `Ligne ${itinerary.lineNumber}`
                : 'Navette'
              : 'Trajet'}
          {ad.transport?.reference ? (
            <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: 14 }}>
              {' · '}véhicule {ad.transport.reference}
            </span>
          ) : null}
        </h3>
      </div>

      <div className="transit-map-split">
        <TripStopsMap points={points} />
        <div className="transit-stops-rail">
          <StopList
            items={stops.map((s, i) => {
              const scheduled = (s as unknown as { scheduledAt?: string | null }).scheduledAt
              const label = s.name || `Arrêt ${i + 1}`
              return {
                key: `${s.zoneId}-${i}`,
                label,
                tone: i === 0 ? 'origin' : i === stops.length - 1 ? 'destination' : 'default',
                meta: scheduled ? (
                  <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                    <DataQualityTag quality="scheduled" />
                    {new Date(scheduled).toLocaleTimeString('fr-SN', {
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                ) : (
                  <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                    <DataQualityTag quality="estimated" label={`+${s.offsetMinutes} min`} />
                  </span>
                ),
              }
            })}
          />
        </div>
      </div>

      <p className="transit-note">
        Prise en charge et remise possibles aux arrêts indiqués, dans le sens du trajet et selon la
        capacité disponible. Les horaires marqués « estimé » ne proviennent pas de l'opérateur.
      </p>
    </section>
  )
}

function TripStopsMap({ points }: { points: Point[] }) {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<google.maps.Map | null>(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadGoogleMaps()
      .then(() => {
        if (cancelled || !window.google?.maps || !container.current) { setFailed(true); return }
        map.current = new google.maps.Map(container.current, {
          center: points[0] ?? { lat: 14.7167, lng: -17.4677 },
          zoom: 12,
          gestureHandling: 'cooperative',
          mapTypeControl: false,
          streetViewControl: false,
          styles: CITYMAPPER_STYLE,
        })
        setReady(true)
      })
      .catch(() => !cancelled && setFailed(true))
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!ready || !map.current) return
    const markers = points.map((p, i) => new google.maps.Marker({
      map: map.current,
      position: p,
      label: { text: String(i + 1), color: '#fff', fontWeight: '700', fontSize: '12px' },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: i === 0 ? '#10B981' : i === points.length - 1 ? '#EF4444' : '#018982',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 2,
      },
    }))
    const polyline = points.length >= 2
      ? new google.maps.Polyline({
          map: map.current,
          path: points,
          strokeColor: '#018982',
          strokeOpacity: 0.9,
          strokeWeight: 4,
        })
      : null
    if (points.length >= 1) {
      const bounds = new google.maps.LatLngBounds()
      points.forEach((p) => bounds.extend(p))
      map.current.fitBounds(bounds, 48)
      if (points.length === 1) map.current.setZoom(14)
    }
    return () => {
      markers.forEach((m) => m.setMap(null))
      polyline?.setMap(null)
    }
  }, [points, ready])

  if (!points.length) {
    return (
      <div className="transit-map" style={{
        display: 'grid', placeItems: 'center',
        color: 'var(--text-muted)', fontSize: 13,
      }}>
        Arrêts sans coordonnées — la carte n'est pas disponible pour ce trajet.
      </div>
    )
  }
  if (failed) {
    return <p role="status" className="transit-note">Carte indisponible. Reportez-vous à la liste.</p>
  }
  return <div className="transit-map" ref={container} aria-label="Carte de la ligne" />
}

// Style de carte sobre, inspiré Citymapper : moins de bruit visuel, lignes claires.
const CITYMAPPER_STYLE: google.maps.MapTypeStyle[] = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit.station.bus', stylers: [{ visibility: 'on' }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
]
