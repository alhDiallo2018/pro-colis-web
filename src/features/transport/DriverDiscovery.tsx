import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Input } from '@/ds'
import type { User, Zone } from '@/lib/api/types'
import { vehicleTypes } from './domain'
import { TransportMap } from './TransportMap'
import { useFreshFeed } from './useFreshFeed'
export interface NearbyDriver extends User {
  distanceKm: number
  vehicleCapacity: number
  locationUpdatedAt: string
  mapPosition: { latitude: number; longitude: number }
}
interface Props {
  zone?: Zone
  weight?: number
  onWeight: (weight: number | undefined) => void
  value: string
  onChange: (driver: NearbyDriver | null) => void
  vehicleType: string
  onType: (type: string) => void
}
export function DriverDiscovery({ zone, weight, onWeight, value, onChange, vehicleType, onType }: Props) {
  const [gps, setGps] = useState<{
      latitude: number
      longitude: number
    } | null>(null),
    [radius, setRadius] = useState(10),
    [verified, setVerified] = useState(false),
    [error, setError] = useState(''),
    [now, setNow] = useState(Date.now())
  const callback = useRef(onChange)
  callback.current = onChange
  const latitude = gps?.latitude ?? zone?.latitude,
    longitude = gps?.longitude ?? zone?.longitude
  const enabled =
    latitude != null &&
    longitude != null &&
    Number.isFinite(Number(latitude)) &&
    Number.isFinite(Number(longitude))
  const feed = useFreshFeed<{
    drivers: NearbyDriver[]
    categories: { value: string; availableCount: number }[]
  }>(
    '/client/drivers/discovery',
    {
      latitude: Number(latitude),
      longitude: Number(longitude),
      radiusKm: radius,
      ...(vehicleType ? { vehicleType } : {}),
      ...(weight && weight > 0 ? { minCapacity: weight } : {}),
      verifiedOnly: verified ? 'true' : 'false',
    },
    enabled,
    15000,
  )
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  useEffect(() => setGps(null), [zone?.id])
  const drivers = useMemo(
    () => (feed.data?.drivers ?? []).filter((d) => now - Date.parse(d.locationUpdatedAt) < 600000),
    [feed.data, now],
  )
  // Une sélection disparue des résultats frais ne peut être confirmée comme disponible.
  useEffect(() => {
    if (value && !drivers.some((d) => d.id === value)) callback.current(null)
  }, [drivers, value])
  const points = useMemo(
    () =>
      drivers.map((d) => ({
        id: d.id,
        lat: d.mapPosition.latitude,
        lng: d.mapPosition.longitude,
        label: `${d.fullName} · ${d.distanceKm} km`,
      })),
    [drivers],
  )
  function locate() {
    if (!navigator.geolocation) {
      setError('Localisation non disponible. Choisissez le lieu de retrait.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setGps({ latitude: p.coords.latitude, longitude: p.coords.longitude })
        setError('')
      },
      () =>
        setError(
          'Localisation refusée ou indisponible. La recherche reste possible depuis votre lieu de retrait.',
        ),
      { maximumAge: 0, timeout: 15000 },
    )
  }
  return (
    <section className="transport-panel">
      <h3>Un chauffeur adapté, près du retrait</h3>
      <Button variant="secondary" onClick={locate}>
        Rechercher autour de ma position
      </Button>
      {gps && (
        <Button variant="secondary" onClick={() => setGps(null)}>
          Revenir au lieu de retrait
        </Button>
      )}
      <div className="transport-choices">
        {[{ value: '', label: 'Tous' }, ...vehicleTypes].map((t) => (
          <button
            type="button"
            className="transport-choice"
            aria-pressed={vehicleType === t.value}
            key={t.value}
            onClick={() => onType(t.value)}
          >
            {t.label}
            {t.value && feed.data
              ? ` (${feed.data.categories.find((c) => c.value === t.value)?.availableCount ?? 0})`
              : ''}
          </button>
        ))}
      </div>
      <div className="transport-fields">
        <Input label="Poids du colis (kg)" type="number" min={0.01} step="any" value={weight ? String(weight) : ''} onChange={e=>onWeight(e.target.value ? Number(e.target.value) : undefined)}/>
        <Input
          label="Rayon (km)"
          type="number"
          min={1}
          max={100}
          value={String(radius)}
          onChange={(e) => setRadius(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
        />
        <label>
          <input
            type="checkbox"
            checked={verified}
            onChange={(e) => setVerified(e.target.checked)}
          />{' '}
          Chauffeurs vérifiés uniquement
        </label>
      </div>
      <TransportMap
        points={points}
        onSelect={(id) => onChange(drivers.find((d) => d.id === id) ?? null)}
      />
      <p className="transport-note">
        Positions approximatives et distances à vol d’oiseau. Le chauffeur doit confirmer votre
        proposition.
      </p>
      {(!enabled || !drivers.length) && (
        <p>
          {!enabled
            ? 'Choisissez un lieu de retrait ou activez votre localisation.'
            : 'Aucun chauffeur localisé disponible avec ces critères. Vous pouvez aussi publier une annonce ouverte.'}
        </p>
      )}
      <div className="transport-choices">
        {drivers.map((d) => (
          <button
            type="button"
            className="transport-choice"
            key={d.id}
            aria-pressed={value === d.id}
            onClick={() => onChange(d)}
          >
            <strong>{d.fullName}</strong>
            <br />
            {vehicleTypes.find((t) => t.value === d.vehicleType)?.label} · {d.vehicleCapacity} kg
            <br />
            {d.distanceKm} km · {d.isVerified ? 'Vérifié' : 'Profil disponible'}
          </button>
        ))}
      </div>
      {(error || feed.error) && <p role="alert">{error || feed.error}</p>}
    </section>
  )
}
