// SCP-006 — Supervision temps réel : trajets actifs sur les lignes de
// l'opérateur. Le backend ne renvoie que les JourneyLive non périmées
// (capturedAt > now - 60s). On rafraîchit toutes les 15s pour rester vivant
// sans écraser le réseau.

import { useQuery } from '@tanstack/react-query'
import { Badge, StatBox } from '@/ds'
import { QueryState } from '@/components/QueryState'
import { getLive, type ShuttleLiveJourney } from '@/lib/api/shuttle-operator'

export function ShuttleLivePage() {
  const query = useQuery({
    queryKey: ['shuttle-operator', 'live'],
    queryFn: getLive,
    refetchInterval: 15_000,
  })
  const data = query.data

  return (
    <div className="cm-detail-page" style={{ maxWidth: 1180 }}>
      <div className="cm-page-head">
        <div className="cm-page-head-body">
          <h1>Supervision temps réel</h1>
          <p className="cm-page-head-sub">
            Trajets actifs sur vos lignes, positions GPS récentes, confirmations d&apos;arrêt
            en cours. Rafraîchissement automatique toutes les 15 secondes.
          </p>
        </div>
      </div>

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => query.refetch()}
      >
        {data && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
              <StatBox label="Trajets en cours" value={data.activeJourneys.length} icon="directions_bus" tone={data.activeJourneys.length > 0 ? 'green' : undefined} />
              <StatBox label="Flotte disponible" value={data.fleet.available} icon="check_circle" tone="green" />
              <StatBox label="Maintenance" value={data.fleet.maintenance} icon="build" tone="amber" />
              <StatBox label="Retirés" value={data.fleet.retired} icon="block" />
            </div>

            <div style={{ marginTop: 18 }}>
              {data.activeJourneys.length === 0 ? (
                <div className="cm-empty-state" style={{ padding: 24, textAlign: 'center', color: 'var(--cm-text-muted, #666)' }}>
                  Aucun trajet actif en ce moment. Les trajets apparaissent dès qu&apos;un chauffeur
                  démarre le partage GPS sur une de vos lignes.
                </div>
              ) : (
                <JourneyTable journeys={data.activeJourneys} />
              )}
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--cm-text-muted, #777)' }}>
                Dernière mise à jour : {formatTimestamp(data.generatedAt)}
              </div>
            </div>
          </>
        )}
      </QueryState>
    </div>
  )
}

function JourneyTable({ journeys }: { journeys: ShuttleLiveJourney[] }) {
  return (
    <table className="cm-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={cellHead}>Ligne</th>
          <th style={cellHead}>Chauffeur</th>
          <th style={cellHead}>Position</th>
          <th style={cellHead}>Progression</th>
          <th style={cellHead}>Prise en charge</th>
          <th style={cellHead}>Remise</th>
        </tr>
      </thead>
      <tbody>
        {journeys.map((j) => (
          <JourneyRow key={j.advertisementId} journey={j} />
        ))}
      </tbody>
    </table>
  )
}

function JourneyRow({ journey }: { journey: ShuttleLiveJourney }) {
  const pickupLate = journey.confirmations.pickupTotal > 0 && journey.confirmations.pickupDone < journey.confirmations.pickupTotal
  const dropoffPartial = journey.confirmations.dropoffTotal > 0 && journey.confirmations.dropoffDone < journey.confirmations.dropoffTotal
  return (
    <tr>
      <td style={cell}>
        <strong>{journey.line?.number ?? '—'}</strong>
        <div style={{ fontSize: 12, color: 'var(--cm-text-muted, #666)' }}>
          {journey.line?.name ?? 'Ligne inconnue'} · {journey.line?.direction === 'retour' ? 'Retour' : 'Aller'}
        </div>
      </td>
      <td style={cell}>{journey.driver?.fullName ?? '—'}</td>
      <td style={cell}>
        {journey.position ? (
          <>
            <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
              {journey.position.latitude.toFixed(4)}, {journey.position.longitude.toFixed(4)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--cm-text-muted, #666)' }}>
              ±{Math.round(journey.position.accuracyMeters)} m · {formatTimestamp(journey.position.capturedAt)}
            </div>
          </>
        ) : (
          <Badge tone="red">GPS absent</Badge>
        )}
      </td>
      <td style={cell}>
        {journey.stopsReached} / {journey.stopsTotal}
        {journey.nextStop && (
          <div style={{ fontSize: 12, color: 'var(--cm-text-muted, #666)' }}>
            Prochain : {journey.nextStop.label}
          </div>
        )}
      </td>
      <td style={cell}>
        <Badge tone={pickupLate ? 'amber' : 'green'}>
          {journey.confirmations.pickupDone} / {journey.confirmations.pickupTotal}
        </Badge>
      </td>
      <td style={cell}>
        <Badge tone={dropoffPartial ? 'amber' : journey.confirmations.dropoffTotal === 0 ? undefined : 'green'}>
          {journey.confirmations.dropoffDone} / {journey.confirmations.dropoffTotal}
        </Badge>
      </td>
    </tr>
  )
}

const cellHead: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  borderBottom: '1px solid var(--cm-border, #e5e5e5)',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 0.4,
  color: 'var(--cm-text-muted, #666)',
}

const cell: React.CSSProperties = {
  padding: '12px',
  borderBottom: '1px solid var(--cm-border, #f0f0f0)',
  verticalAlign: 'top',
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  const hh = date.getHours().toString().padStart(2, '0')
  const mm = date.getMinutes().toString().padStart(2, '0')
  const ss = date.getSeconds().toString().padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}
