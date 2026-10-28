import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/ds'
import { freshJourney, type LiveJourney } from './domain'
import { TransportMap } from './TransportMap'
import { useFreshFeed } from './useFreshFeed'
export function LiveJourneys({ advertisementId }: { advertisementId?: string }) {
  const navigate = useNavigate(),
    [line, setLine] = useState(''),
    [direction, setDirection] = useState(''),
    [now, setNow] = useState(Date.now())
  const feed = useFreshFeed<{ journeys: LiveJourney[] }>('/client/journeys/live', {
    ...(advertisementId ? { advertisementId } : {}),
    ...(line.trim() ? { lineNumber: line.trim() } : {}),
  })
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  const fresh = useMemo(
    () => (feed.data?.journeys ?? []).filter((j) => freshJourney(j, now)),
    [feed.data, now],
  )
  const directions = [...new Set(fresh.map((j) => `${j.departure.name} → ${j.arrival.name}`))]
  const rows = fresh.filter(
    (j) => !direction || `${j.departure.name} → ${j.arrival.name}` === direction,
  )
  const points = useMemo(
    () =>
      rows.map((j) => ({
        id: j.advertisementId,
        lat: j.position.latitude,
        lng: j.position.longitude,
        label: `${j.lineNumber ?? 'Trajet'} · ${j.vehicleReference} · ${j.departure.name} → ${j.arrival.name}`,
      })),
    [rows],
  )
  return (
    <section className="transport-panel">
      <h2>Véhicules en direct</h2>
      <p className="transport-note">
        Chaque repère correspond à un véhicule et un départ précis. Les positions de plus d’une
        minute disparaissent.
      </p>
      {!advertisementId && (
        <div className="transport-fields">
          <Input
            label="Numéro de ligne"
            placeholder="Ex. 45"
            value={line}
            onChange={(e) => {
              setLine(e.target.value)
              setDirection('')
            }}
          />
          <label>
            Sens du trajet
            <select
              className="transport-choice"
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
            >
              <option value="">Tous les sens</option>
              {directions.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
        </div>
      )}
      <TransportMap points={points} onSelect={(id) => navigate(`/client/annonces/${id}`)} />
      {feed.error && <p role="alert">Suivi indisponible : {feed.error}</p>}
      {!rows.length && (
        <p role="status">Aucune position récente disponible pour cette recherche.</p>
      )}
      <div className="transport-choices">
        {rows.map((j) => (
          <button
            className="transport-choice"
            key={j.advertisementId}
            onClick={() => navigate(`/client/annonces/${j.advertisementId}`)}
          >
            <strong>
              {j.lineNumber ? `Ligne ${j.lineNumber} · ` : ''}
              {j.vehicleReference}
            </strong>
            <br />
            {j.departure.name} → {j.arrival.name}
            <br />
            {j.driverName} · {j.vehicleModel}
            <br />
            Départ : {new Date(j.departureAt).toLocaleString('fr-SN')}
            <br />
            GPS : {Math.max(0, Math.round((now - Date.parse(j.position.capturedAt)) / 1000))} s ·
            précision ±{Math.round(j.position.accuracyMeters)} m
          </button>
        ))}
      </div>
    </section>
  )
}
