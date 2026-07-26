import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Icon } from '@/ds'
import { extractPlaceDetails, loadGoogleMaps, type PlaceDetails } from './LocationInput'

export interface MapPickerProps {
  /** Position du repère. `null` tant que l'utilisateur n'a rien choisi. */
  value: { lat: number; lng: number } | null
  /**
   * Émis à chaque repositionnement du repère (glisser ou clic sur la carte).
   * `details` provient du géocodage inverse et peut être absent si Google
   * n'a rien à renvoyer pour ce point (pleine mer, désert…).
   */
  onChange: (lat: number, lng: number, details?: PlaceDetails) => void
  height?: number
  disabled?: boolean
  style?: CSSProperties
}

const DEFAULT_CENTER = { lat: 14.6928, lng: -17.4467 } // Dakar
const DEFAULT_ZOOM = 6
const PICKED_ZOOM = 13

/**
 * Carte Google Maps avec repère déplaçable, pour situer un lieu absent de
 * l'autocomplétion (village, quartier, point de rendez-vous informel).
 */
export function MapPicker({ value, onChange, height = 240, disabled = false, style }: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const geocoderRef = useRef<google.maps.Geocoder | null>(null)
  const onChangeRef = useRef(onChange)
  // Un repositionnement venant de la carte ne doit pas déclencher un recentrage
  // qui ferait sauter la vue sous le doigt de l'utilisateur.
  const selfUpdateRef = useRef(false)

  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [geocoding, setGeocoding] = useState(false)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  /** Géocodage inverse puis remontée du point au parent. */
  const emit = async (lat: number, lng: number) => {
    selfUpdateRef.current = true
    setGeocoding(true)
    let details: PlaceDetails | undefined
    try {
      const geocoder = geocoderRef.current ?? new google.maps.Geocoder()
      geocoderRef.current = geocoder
      const res = await geocoder.geocode({ location: { lat, lng } })
      const first = res.results[0]
      if (first) {
        details = {
          ...extractPlaceDetails(first.address_components),
          placeId: first.place_id,
          formattedAddress: first.formatted_address,
        }
      }
    } catch {
      // Quota ou billing absent : on garde les coordonnées, sans libellé.
    } finally {
      setGeocoding(false)
    }
    onChangeRef.current(lat, lng, details)
  }

  useEffect(() => {
    let cancelled = false
    loadGoogleMaps().then(() => {
      if (cancelled || !containerRef.current) return
      if (!window.google?.maps) {
        setFailed(true)
        return
      }

      const map = new google.maps.Map(containerRef.current, {
        center: value ?? DEFAULT_CENTER,
        zoom: value ? PICKED_ZOOM : DEFAULT_ZOOM,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: 'greedy',
        clickableIcons: false,
      })
      mapRef.current = map

      const marker = new google.maps.Marker({
        map,
        position: value ?? undefined,
        draggable: true,
        visible: !!value,
      })
      markerRef.current = marker

      marker.addListener('dragend', () => {
        const p = marker.getPosition()
        if (p) void emit(p.lat(), p.lng())
      })

      map.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return
        marker.setPosition(e.latLng)
        marker.setVisible(true)
        void emit(e.latLng.lat(), e.latLng.lng())
      })

      setReady(true)
    })
    return () => {
      cancelled = true
    }
    // Monté une seule fois : les changements de `value` sont traités ci-dessous.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Synchronise le repère quand la position vient d'ailleurs (autocomplétion,
  // géolocalisation) plutôt que d'une interaction avec la carte.
  useEffect(() => {
    const map = mapRef.current
    const marker = markerRef.current
    if (!map || !marker) return
    if (selfUpdateRef.current) {
      selfUpdateRef.current = false
      return
    }
    if (!value) {
      marker.setVisible(false)
      return
    }
    marker.setPosition(value)
    marker.setVisible(true)
    map.panTo(value)
    if ((map.getZoom() ?? 0) < PICKED_ZOOM) map.setZoom(PICKED_ZOOM)
  }, [value])

  useEffect(() => {
    markerRef.current?.setDraggable(!disabled)
  }, [disabled])

  if (failed) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          borderRadius: 'var(--radius-md)',
          border: '1px dashed var(--border-default)',
          color: 'var(--text-muted)',
          fontSize: 'var(--fs-sm)',
          ...style,
        }}
      >
        <Icon name="map" size={18} />
        Carte indisponible — utilisez la recherche par nom.
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', ...style }}>
      <div
        ref={containerRef}
        style={{
          height,
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          border: '1px solid var(--border-default)',
          background: 'var(--surface-sunken)',
          pointerEvents: disabled ? 'none' : undefined,
          opacity: disabled ? 0.6 : 1,
        }}
      />
      {ready && (
        <div
          style={{
            position: 'absolute',
            left: 8,
            right: 8,
            bottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 10px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255,255,255,0.92)',
            boxShadow: 'var(--shadow-sm)',
            fontSize: 'var(--fs-xs)',
            color: 'var(--text-muted)',
            pointerEvents: 'none',
          }}
        >
          <Icon name={geocoding ? 'sync' : 'touch_app'} size={14} />
          {geocoding ? 'Lecture de l’adresse…' : 'Touchez la carte ou déplacez le repère pour ajuster.'}
        </div>
      )}
    </div>
  )
}
