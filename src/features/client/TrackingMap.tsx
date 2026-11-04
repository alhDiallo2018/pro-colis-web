import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Icon } from '@/ds'
import { loadGoogleMaps } from '@/components/LocationInput'

export interface MapPoint {
  lat: number
  lng: number
}

export interface TrackingMapProps {
  /** Position réelle du chauffeur (se déplace à chaque nouvelle position). */
  driver?: MapPoint | null
  /** Précision horizontale GPS en mètres (cercle d'incertitude). */
  accuracy?: number | null
  /** Point de départ du colis. */
  departure?: MapPoint | null
  /** Point de destination du colis. */
  destination?: MapPoint | null
  height?: number
  style?: CSSProperties
}

// Couleurs de marqueurs (SVG embarqué : pas d'accès aux variables CSS).
const DRIVER_COLOR = '#0d9488'
const DEPARTURE_COLOR = '#10b981'
const DESTINATION_COLOR = '#ef4444'
const ROUTE_COLOR = '#14b8a6'

const DEFAULT_CENTER = { lat: 14.6928, lng: -17.4467 } // Dakar (fallback de cadrage)
const DEFAULT_ZOOM = 12

function svgIcon(svg: string, size: number, anchor: [number, number]): google.maps.Icon {
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(anchor[0], anchor[1]),
  }
}

function pinIcon(color: string): google.maps.Icon {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" fill="${color}" stroke="#ffffff" stroke-width="1.5"/></svg>`
  return svgIcon(svg, 34, [17, 34])
}

function dotIcon(color: string): google.maps.Icon {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="${color}" stroke="#ffffff" stroke-width="3"/></svg>`
  return svgIcon(svg, 26, [13, 13])
}

function fitPoints(map: google.maps.Map, points: MapPoint[]): void {
  if (points.length === 0) {
    map.setCenter(DEFAULT_CENTER)
    map.setZoom(DEFAULT_ZOOM)
    return
  }
  if (points.length === 1) {
    map.setCenter(points[0])
    map.setZoom(14)
    return
  }
  const bounds = new google.maps.LatLngBounds()
  for (const p of points) bounds.extend(p)
  map.fitBounds(bounds, 48)
}

/**
 * Carte de suivi en lecture seule : départ, destination et position réelle du
 * chauffeur. Réutilise le chargement Google Maps partagé (`loadGoogleMaps`).
 * Le marqueur chauffeur se déplace quand `driver` change, sans recréer la
 * carte, et la caméra suit automatiquement la nouvelle position (aligné sur
 * l'expérience mobile). Un cercle de précision matérialise honnêtement
 * l'incertitude du GPS, et une polyline relie départ → chauffeur → arrivée.
 */
export function TrackingMap({ driver, accuracy, departure, destination, height = 220, style }: TrackingMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const driverMarkerRef = useRef<google.maps.Marker | null>(null)
  const accuracyCircleRef = useRef<google.maps.Circle | null>(null)
  const routePolylineRef = useRef<google.maps.Polyline | null>(null)
  const readyRef = useRef(false)
  const firstFitDoneRef = useRef(false)
  const [failed, setFailed] = useState(false)

  // Création de la carte et des marqueurs statiques (départ / destination).
  useEffect(() => {
    let cancelled = false
    loadGoogleMaps().then(() => {
      if (cancelled || !containerRef.current) return
      if (!window.google?.maps) {
        setFailed(true)
        return
      }
      const map = new google.maps.Map(containerRef.current, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: 'greedy',
        clickableIcons: false,
      })
      mapRef.current = map

      if (departure) {
        new google.maps.Marker({ map, position: departure, icon: pinIcon(DEPARTURE_COLOR) })
      }
      if (destination) {
        new google.maps.Marker({ map, position: destination, icon: pinIcon(DESTINATION_COLOR) })
      }
      readyRef.current = true
      // La création des éléments dépendants du chauffeur (marker, cercle de
      // précision, polyline) est déléguée aux effets dédiés ci-dessous, pour
      // éviter la duplication et garantir que la première mise à jour profite
      // aussi du centrage initial.
    })
    return () => {
      cancelled = true
      readyRef.current = false
      firstFitDoneRef.current = false
      driverMarkerRef.current?.setMap(null)
      driverMarkerRef.current = null
      accuracyCircleRef.current?.setMap(null)
      accuracyCircleRef.current = null
      routePolylineRef.current?.setMap(null)
      routePolylineRef.current = null
    }
    // Monté une seule fois : le reste est suivi par les effets dédiés ci-dessous.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Déplacement du marqueur chauffeur + caméra suiveuse à chaque polling.
  useEffect(() => {
    if (!readyRef.current) return
    const map = mapRef.current
    if (!map) return
    if (!driver) {
      driverMarkerRef.current?.setMap(null)
      driverMarkerRef.current = null
      // Pas de chauffeur : on cadre au moins départ/destination.
      if (!firstFitDoneRef.current) {
        fitPoints(map, [departure, destination].filter((p): p is MapPoint => !!p))
        firstFitDoneRef.current = true
      }
      return
    }
    if (driverMarkerRef.current) {
      driverMarkerRef.current.setPosition(driver)
      // Caméra suiveuse : on recentre doucement sur la nouvelle position du
      // chauffeur, sans changer le niveau de zoom choisi par l'utilisateur.
      map.panTo(driver)
    } else {
      driverMarkerRef.current = new google.maps.Marker({
        map,
        position: driver,
        icon: dotIcon(DRIVER_COLOR),
        zIndex: 10,
      })
    }
    // Premier cadrage : englobe tous les points connus.
    if (!firstFitDoneRef.current) {
      fitPoints(map, [departure, destination, driver].filter((p): p is MapPoint => !!p))
      firstFitDoneRef.current = true
    }
  }, [driver, departure, destination])

  // Cercle de précision GPS : apparaît quand l'API expose `accuracy`, sinon
  // rien n'est affiché (on ne fabrique pas de rayon fictif).
  useEffect(() => {
    if (!readyRef.current) return
    const map = mapRef.current
    if (!map) return
    const validAccuracy = driver && typeof accuracy === 'number' && Number.isFinite(accuracy) && accuracy > 0
    if (!validAccuracy) {
      accuracyCircleRef.current?.setMap(null)
      accuracyCircleRef.current = null
      return
    }
    if (accuracyCircleRef.current) {
      accuracyCircleRef.current.setCenter(driver)
      accuracyCircleRef.current.setRadius(accuracy as number)
    } else {
      accuracyCircleRef.current = new google.maps.Circle({
        map,
        center: driver,
        radius: accuracy as number,
        strokeColor: DRIVER_COLOR,
        strokeOpacity: 0.45,
        strokeWeight: 1,
        fillColor: DRIVER_COLOR,
        fillOpacity: 0.12,
        clickable: false,
      })
    }
  }, [driver, accuracy])

  // Polyline départ → chauffeur → arrivée, redessinée à chaque mise à jour.
  useEffect(() => {
    if (!readyRef.current) return
    const map = mapRef.current
    if (!map) return
    const route = [departure, driver, destination].filter((p): p is MapPoint => !!p)
    if (route.length < 2) {
      routePolylineRef.current?.setMap(null)
      routePolylineRef.current = null
      return
    }
    if (routePolylineRef.current) {
      routePolylineRef.current.setPath(route)
    } else {
      routePolylineRef.current = new google.maps.Polyline({
        map,
        path: route,
        strokeColor: ROUTE_COLOR,
        strokeOpacity: 0.85,
        strokeWeight: 4,
        geodesic: true,
        clickable: false,
      })
    }
  }, [driver, departure, destination])

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
        Carte indisponible.
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{
        height,
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        border: '1px solid var(--border-default)',
        background: 'var(--surface-sunken)',
        ...style,
      }}
    />
  )
}
