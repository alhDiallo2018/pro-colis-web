import { useQuery } from '@tanstack/react-query'
import { StatBox } from '@/ds'
import { QueryState } from '@/components/QueryState'
import { getOverview } from '@/lib/api/shuttle-operator'

export function ShuttleOverviewPage() {
  const query = useQuery({
    queryKey: ['shuttle-operator', 'overview'],
    queryFn: getOverview,
    refetchInterval: 60_000,
  })
  const data = query.data

  return (
    <div className="cm-detail-page" style={{ maxWidth: 960 }}>
      <div className="cm-page-head">
        <div className="cm-page-head-body">
          <h1>Opérateur de transport</h1>
          <p className="cm-page-head-sub">
            Vue d&apos;ensemble de vos lignes, de votre flotte et de vos horaires actifs.
          </p>
        </div>
      </div>

      <QueryState isLoading={query.isLoading} isError={query.isError} error={query.error} onRetry={() => query.refetch()}>
        {data && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            <StatBox label="Lignes de transit" value={data.lineCount} icon="route" />
            <StatBox label="Véhicules (actifs)" value={data.vehicleCount} icon="directions_bus" />
            <StatBox label="Dispo immédiate" value={data.availableVehicleCount} icon="check_circle" tone="green" />
            <StatBox label="Horaires configurés" value={data.scheduleCount} icon="schedule" />
            <StatBox label="Horaires actifs" value={data.activeScheduleCount} icon="event_available" tone="green" />
          </div>
        )}
      </QueryState>
    </div>
  )
}
