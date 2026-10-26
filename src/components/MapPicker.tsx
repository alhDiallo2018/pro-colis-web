import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Icon } from '@/ds'
import { reversePlace } from '@/lib/api/places'
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
  onResolving?: (busy: boolean) => void
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
export function MapPicker({ value, onChange, height = 300, disabled = false, style, onResolving }: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const generationRef = useRef(0)
  const disabledRef = useRef(disabled)
  disabledRef.current = disabled
  const resolvingRef = useRef(onResolving)
  resolvingRef.current = onResolving
  const onChangeRef = useRef(onChange)
  // Un repositionnement venant de la carte ne doit pas déclencher un recentrage
  // qui ferait sauter la vue sous le doigt de l'utilisateur.
  const selfUpdateRef = useRef<{ lat: number; lng: number } | null>(null)

  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [geocoding, setGeocoding] = useState(false)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  /** Géocodage inverse puis remontée du point au parent. */
  const emit = async (lat: number, lng: number) => {
    if (disabledRef.current) return
    const generation = ++generationRef.current
    setGeocoding(true)
    resolvingRef.current?.(true)
    let details: PlaceDetails = { exactPoint: true }
    try {
      const first = await reversePlace(lat, lng)
      if (first) details = { ...extractPlaceDetails(first.address_components), exactPoint: true,
        placeId: first.place_id, formattedAddress: first.formatted_address }
    } catch {
      // Le point reste utilisable si l'utilisateur renseigne son nom lui-même.
    }
    if (generation !== generationRef.current) return
    selfUpdateRef.current = { lat, lng }
    setGeocoding(false)
    onChangeRef.current(lat, lng, details)
    resolvingRef.current?.(false)
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
        draggable: !disabledRef.current,
        visible: !!value,
      })
      markerRef.current = marker

      marker.addListener('dragend', () => {
        const p = marker.getPosition()
        if (p) void emit(p.lat(), p.lng())
      })

      map.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (disabledRef.current || !e.latLng) return
        marker.setPosition(e.latLng)
        marker.setVisible(true)
        void emit(e.latLng.lat(), e.latLng.lng())
      })

      setReady(true)
    }).catch(() => { if (!cancelled) setFailed(true) })
    return () => {
      cancelled = true
      generationRef.current++
      if (markerRef.current) { google.maps.event.clearInstanceListeners(markerRef.current); markerRef.current.setMap(null) }
      if (mapRef.current) google.maps.event.clearInstanceListeners(mapRef.current)
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
    const emitted = selfUpdateRef.current
    selfUpdateRef.current = null
    if (emitted && emitted.lat === value?.lat && emitted.lng === value?.lng) return
    if (!value) {
      marker.setVisible(false)
      return
    }
    // Une sélection externe invalide tout géocodage de carte en vol.
    generationRef.current++
    setGeocoding(false)
    marker.setPosition(value)
    marker.setVisible(true)
    map.panTo(value)
    if ((map.getZoom() ?? 0) < PICKED_ZOOM) map.setZoom(PICKED_ZOOM)
  }, [value?.lat, value?.lng, ready])

  useEffect(() => {
    markerRef.current?.setDraggable(!disabled)
  }, [disabled, ready])

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
            // L'aide reste hors de la carte pour laisser les crédits Google visibles.
            marginTop: 8,
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
