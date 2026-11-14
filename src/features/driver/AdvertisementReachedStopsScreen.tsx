import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { Button, Icon } from '@/ds'
import { QueryState } from '@/components/QueryState'
import { fetchReachedStops, type ReachedStopEvent } from '@/lib/api/advertisements'
import { formatDateTime } from '@/lib/format'

export function AdvertisementReachedStopsScreen() {
  const { advertisementId = '' } = useParams<{ advertisementId: string }>()
  const query = useQuery({
    queryKey: ['driver', 'advertisement', advertisementId, 'reached-stops'],
    queryFn: () => fetchReachedStops(advertisementId),
    enabled: Boolean(advertisementId),
  })
  const stops = query.data?.reachedStops ?? []

  return (
    <div className="cm-detail-page" style={{ maxWidth: 820 }}>
      <div className="cm-page-head">
        <div className="cm-page-head-body">
          <h1>Arrêts atteints</h1>
          <p className="cm-page-head-sub">
            Journal des arrêts validés par géofence GPS pour ce trajet navette.
          </p>
        </div>
        <Button variant="secondary" icon="refresh" onClick={() => query.refetch()} loading={query.isFetching && !query.isLoading}>
          Rafraîchir
        </Button>
      </div>

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        isEmpty={stops.length === 0}
        emptyTitle="Aucun arrêt atteint"
        emptyMessage="Aucun arrêt n'a encore été détecté sur ce trajet."
        onRetry={() => query.refetch()}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {stops.map((stop) => (
            <StopRow key={`${stop.stopOrder}-${stop.reachedAt ?? ''}`} stop={stop} />
          ))}
        </div>
      </QueryState>
    </div>
  )
}

function StopRow({ stop }: { stop: ReachedStopEvent }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '12px 14px',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--surface-card)',
      }}
    >
      <span
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'var(--teal-100)',
          color: 'var(--teal-800)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
        }}
      >
        {stop.stopOrder}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600 }}>{stop.stopLabel ?? `Arrêt ${stop.stopOrder}`}</div>
        <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
          {stop.distanceMeters} m du centre · rayon {stop.radiusMeters} m
          {stop.reachedAt && <> · {formatDateTime(stop.reachedAt)}</>}
        </div>
      </div>
      <Icon name="check_circle" size={20} style={{ color: 'var(--green-600)' }} />
    </div>
  )
}
