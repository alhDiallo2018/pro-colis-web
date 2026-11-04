import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { LineBadge, DataQualityTag, SegmentedControl, type TransitDirection } from '@/ds'
import { freshJourney, type LiveJourney } from './domain'
import { getTransitLineLive, type TransitLiveAdvertisement, type TransitLineSummary } from '@/lib/api/transit'
import { TransitLinePicker } from './TransitLinePicker'
import { TransportMap } from './TransportMap'
import { useFreshFeed } from './useFreshFeed'
import './transport.css'
import './transit.css'

interface Props { advertisementId?: string }

/**
 * Deux modes :
 *   1. advertisementId fourni → vue focalisée sur UN voyage (legacy, ne change pas).
 *   2. Sans ID → sélection par catalogue DDD/AFTU et affichage comparatif des N voyages
 *      actifs sur la ligne choisie.
 * Chaque donnée transport est accompagnée d'un DataQualityTag (live / scheduled / estimated),
 * conformément à la règle produit : jamais afficher une position ou un horaire
 * sans préciser sa provenance.
 */
export function LiveJourneys({ advertisementId }: Props) {
  const navigate = useNavigate()
  const [transitLine, setTransitLine] = useState<TransitLineSummary | null>(null)
  const [direction, setDirection] = useState<TransitDirection | null>(null)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  if (advertisementId) {
    return <LegacyAdFocused advertisementId={advertisementId} now={now} navigate={navigate} />
  }

  return (
    <section className="transit-panel">
      <div className="transit-panel-head">
        <h2 className="transit-panel-title">Suivre en direct</h2>
        {transitLine && <LineBadge operator={transitLine.operator} number={transitLine.number} />}
      </div>
      <p className="transit-note">
        Choisis une ligne pour voir tous les voyages actifs. Les positions marquées
        « Direct » datent de moins d'une minute ; les autres sont à titre indicatif.
      </p>

      <TransitLinePicker value={transitLine} onChange={(l) => { setTransitLine(l); setDirection(l?.direction ?? null) }} />

      {transitLine && (
        <>
          <SegmentedControl
            value={direction ?? transitLine.direction}
            onChange={(v) => setDirection(v as TransitDirection)}
            options={[
              { value: 'aller', label: 'Aller' },
              { value: 'retour', label: 'Retour' },
            ]}
          />
          <TransitLineLive
            line={transitLine}
            direction={direction ?? transitLine.direction}
            now={now}
            onOpen={(id) => navigate(`/client/annonces/${id}`)}
          />
        </>
      )}
    </section>
  )
}

function TransitLineLive({
  line, direction, now, onOpen,
}: { line: TransitLineSummary; direction: TransitDirection; now: number; onOpen: (id: string) => void }) {
  // Si l'utilisateur veut un sens non représenté par cette ligne (les retours peuvent
  // manquer du catalogue), on signale plutôt que de query avec un mauvais id.
  const mismatched = direction !== line.direction
  const query = useQuery({
    queryKey: ['transit-line-live', line.id],
    queryFn: () => getTransitLineLive(line.id),
    refetchInterval: 15000,
    enabled: !mismatched,
  })

  const ads = query.data?.advertisements ?? []
  const points = useMemo(
    () => ads
      .filter((a) => a.live)
      .map((a) => ({
        id: a.id,
        lat: a.live!.latitude,
        lng: a.live!.longitude,
        label: `${line.operator.toUpperCase()} ${line.number} · ${a.driverName}`,
      })),
    [ads, line],
  )

  if (mismatched) {
    return (
      <p className="transit-note transit-note-error">
        Sens retour non disponible côté catalogue pour cette ligne (données incomplètes).
      </p>
    )
  }

  return (
    <>
      <TransportMap points={points} onSelect={onOpen} />

      {query.isLoading && <p className="transit-note">Chargement des voyages actifs…</p>}
      {query.isError && (
        <p className="transit-note transit-note-error">Suivi indisponible — réessaie dans quelques secondes.</p>
      )}
      {query.data && !ads.length && (
        <p role="status" className="transit-note">
          Aucun voyage actif sur la ligne {line.number} pour l'instant.
        </p>
      )}

      <div className="transit-live-grid">
        {ads.map((a) => (
          <LiveCard key={a.id} ad={a} line={line} now={now} onOpen={() => onOpen(a.id)} />
        ))}
      </div>
    </>
  )
}

function LiveCard({
  ad, line, now, onOpen,
}: { ad: TransitLiveAdvertisement; line: TransitLineSummary; now: number; onOpen: () => void }) {
  const quality = (() => {
    if (!ad.live) return 'scheduled' as const
    const age = (now - Date.parse(ad.live.capturedAt)) / 1000
    return age < 60 ? ('live' as const) : ('estimated' as const)
  })()
  const freshness = ad.live
    ? Math.max(0, Math.round((now - Date.parse(ad.live.capturedAt)) / 1000))
    : undefined
  const departsIn = ad.departureAt
    ? Math.round((Date.parse(ad.departureAt) - now) / 60000)
    : null

  return (
    <button type="button" className="transit-live-card" onClick={onOpen}>
      <div className="transit-live-card-head">
        <div className="transit-live-card-head-left">
          <LineBadge operator={line.operator} number={line.number} size="sm" />
          <span className="transit-live-driver">{ad.driverName}</span>
        </div>
        <DataQualityTag quality={quality} freshnessSeconds={quality === 'live' ? freshness : undefined} />
      </div>

      <div className="transit-live-meta">
        {departsIn !== null && (
          <span>
            <strong>{departsIn > 0 ? `dans ${departsIn} min` : `${-departsIn} min écoulé`}</strong>{' '}
            · départ
          </span>
        )}
        {ad.availableWeight !== null && (
          <span><strong>{ad.availableWeight} kg</strong> · dispo</span>
        )}
        {ad.live && (
          <span>précision ±{Math.round(ad.live.accuracyMeters)} m</span>
        )}
      </div>

      <div className="transit-note" style={{ fontSize: 12 }}>
        {line.origin} → {line.destination}
      </div>
    </button>
  )
}

/* ─── Mode legacy : un advertisementId fourni directement ─────── */

function LegacyAdFocused({
  advertisementId, now, navigate,
}: { advertisementId: string; now: number; navigate: ReturnType<typeof useNavigate> }) {
  const feed = useFreshFeed<{ journeys: LiveJourney[] }>('/client/journeys/live', { advertisementId })
  const fresh = useMemo(
    () => (feed.data?.journeys ?? []).filter((j) => freshJourney(j, now)),
    [feed.data, now],
  )
  const points = useMemo(
    () => fresh.map((j) => ({
      id: j.advertisementId, lat: j.position.latitude, lng: j.position.longitude,
      label: `${j.lineNumber ?? 'Trajet'} · ${j.vehicleReference}`,
    })),
    [fresh],
  )
  return (
    <section className="transit-panel">
      <h2 className="transit-panel-title">Suivi du voyage</h2>
      <TransportMap points={points} onSelect={(id) => navigate(`/client/annonces/${id}`)} />
      {feed.error && <p role="alert" className="transit-note-error">Suivi indisponible : {feed.error}</p>}
      {!fresh.length && <p role="status" className="transit-note">Aucune position récente.</p>}
      {fresh.map((j) => (
        <div key={j.advertisementId} className="transit-live-card">
          <div className="transit-live-card-head">
            <span className="transit-live-driver">
              {j.lineNumber ? `Ligne ${j.lineNumber} · ` : ''}{j.driverName}
            </span>
            <DataQualityTag
              quality="live"
              freshnessSeconds={Math.max(0, Math.round((now - Date.parse(j.position.capturedAt)) / 1000))}
            />
          </div>
          <div className="transit-live-meta">
            <span>{j.departure.name} → {j.arrival.name}</span>
            <span>Départ {new Date(j.departureAt).toLocaleString('fr-SN')}</span>
            <span>précision ±{Math.round(j.position.accuracyMeters)} m</span>
          </div>
        </div>
      ))}
    </section>
  )
}
