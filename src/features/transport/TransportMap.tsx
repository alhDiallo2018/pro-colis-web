import { useEffect, useRef, useState } from 'react'
import { loadGoogleMaps } from '@/components/LocationInput'
import './transport.css'
export interface MapPoint {
  id: string
  lat: number
  lng: number
  label: string
}
export function TransportMap({
  points,
  onSelect,
}: {
  points: MapPoint[]
  onSelect?: (id: string) => void
}) {
  const container = useRef<HTMLDivElement>(null),
    map = useRef<google.maps.Map | null>(null)
  const boundsKey = useRef('')
  const [ready, setReady] = useState(false),
    [failed, setFailed] = useState(false)
  const select = useRef(onSelect)
  select.current = onSelect
  useEffect(() => {
    let cancelled = false
    loadGoogleMaps()
      .then(() => {
        if (cancelled) return
        if (!window.google?.maps || !container.current) {
          setFailed(true)
          return
        }
        map.current = new google.maps.Map(container.current, {
          center: { lat: 14.7167, lng: -17.4677 },
          zoom: 11,
          gestureHandling: 'cooperative',
          mapTypeControl: false,
          streetViewControl: false,
        })
        setReady(true)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [])
  useEffect(() => {
    if (!ready || !map.current) return
    const markers = points.map((p) => {
      const marker = new google.maps.Marker({
        map: map.current,
        position: p,
        title: p.label,
      })
      marker.addListener('click', () => select.current?.(p.id))
      return marker
    })
    if (points.length && boundsKey.current !== points.map((p) => p.id).join(',')) {
      boundsKey.current = points.map((p) => p.id).join(',')
      const bounds = new google.maps.LatLngBounds()
      points.forEach((p) => bounds.extend(p))
      map.current.fitBounds(bounds, 50)
      if (points.length === 1) map.current.setZoom(14)
    }
    return () =>
      markers.forEach((m) => {
        google.maps.event.clearInstanceListeners(m)
        m.setMap(null)
      })
  }, [points, ready])
  return (
    <>
      {failed && <p role="status">Carte indisponible. Vous pouvez continuer avec la liste.</p>}
      <div
        className="transport-map"
        ref={container}
        aria-label="Carte des véhicules"
        hidden={failed}
      />
    </>
  )
}
