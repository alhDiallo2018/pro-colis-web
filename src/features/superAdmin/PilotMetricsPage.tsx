import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Select, StatBox } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import { getPilotMetrics, type PilotMetrics } from '@/lib/api/pilot-metrics'

const WINDOW_OPTIONS = [
  { value: '7', label: '7 derniers jours' },
  { value: '14', label: '14 derniers jours' },
  { value: '30', label: '30 derniers jours' },
  { value: '90', label: '90 derniers jours' },
]

function sumValues(map: Record<string, number> | undefined): number {
  if (!map) return 0
  return Object.values(map).reduce((total, value) => total + (Number(value) || 0), 0)
}

function prettyKey(key: string): string {
  return key
    .replace(/[_-]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^\w/, c => c.toUpperCase())
}

function BreakdownPanel({ title, data, emptyLabel = 'Aucune donnée sur la période.' }: {
  title: string
  data: Record<string, number> | undefined
  emptyLabel?: string
}) {
  const entries = Object.entries(data ?? {}).filter(([, value]) => Number(value) > 0)
  return (
    <Panel title={title}>
      {entries.length === 0 ? (
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>{emptyLabel}</p>
      ) : (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 6 }}>
          {entries.map(([key, value]) => (
            <li
              key={key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 10px',
                background: 'var(--surface-sunken)',
                borderRadius: 6,
              }}
            >
              <span>{prettyKey(key)}</span>
              <strong>{value}</strong>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

export function PilotMetricsPage() {
  const [windowDays, setWindowDays] = useState<number>(14)
  const query = useQuery<PilotMetrics>({
    queryKey: ['super-admin', 'pilot-metrics', windowDays],
    queryFn: () => getPilotMetrics(windowDays),
    refetchInterval: 60_000,
    staleTime: 30_000,
  })

  const metrics = query.data
  const parcelsTotal = useMemo(() => sumValues(metrics?.parcels), [metrics])
  const handoversTotal = useMemo(() => sumValues(metrics?.handovers), [metrics])
  const webhooksTotal = useMemo(() => sumValues(metrics?.webhooks), [metrics])
  const batchesTotal = useMemo(() => sumValues(metrics?.shipmentBatches), [metrics])

  const from = metrics?.window?.from ? new Date(metrics.window.from).toLocaleString() : '—'
  const to = metrics?.window?.to ? new Date(metrics.window.to).toLocaleString() : '—'

  return (
    <div className="cm-detail-page">
      <div className="cm-page-head">
        <div className="cm-page-head-body">
          <h1>Métriques pilote</h1>
          <p className="cm-page-head-sub">
            Indicateurs opérationnels agrégés sur une fenêtre glissante.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <Select
          label="Fenêtre d'observation"
          value={String(windowDays)}
          options={WINDOW_OPTIONS}
          onChange={event => setWindowDays(Number(event.target.value))}
          style={{ maxWidth: 240 }}
        />
        {metrics && (
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Du {from} au {to}
          </span>
        )}
      </div>

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        isEmpty={!metrics}
        emptyTitle="Aucune donnée"
        emptyMessage="Les métriques ne sont pas encore disponibles."
        onRetry={() => query.refetch()}
      >
        {metrics && (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 16,
              }}
            >
              <StatBox
                icon="package_2"
                tone="primary"
                value={parcelsTotal}
                label="Colis créés"
              />
              <StatBox
                icon="task_alt"
                tone="green"
                value={metrics.parcels?.delivered ?? 0}
                label="Colis livrés"
              />
              <StatBox
                icon="swap_horiz"
                tone="teal"
                value={handoversTotal}
                label="Handovers initiés"
              />
              <StatBox
                icon="pin_drop"
                tone="amber"
                value={metrics.stopEvents}
                label="Arrêts GPS atteints"
              />
              <StatBox
                icon="handshake"
                tone="primary"
                value={metrics.offersAccepted}
                label="Offres acceptées"
              />
              <StatBox
                icon="webhook"
                tone="neutral"
                value={webhooksTotal}
                label="Webhooks envoyés"
              />
              <StatBox
                icon="inventory_2"
                tone="teal"
                value={batchesTotal}
                label="Lots d'expédition"
              />
              <StatBox
                icon="receipt_long"
                tone="neutral"
                value={metrics.customsSigned}
                label="Déclarations douanes signées"
              />
            </div>

            <div
              style={{
                display: 'grid',
                gap: 16,
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                marginTop: 16,
              }}
            >
              <BreakdownPanel title="Colis par statut" data={metrics.parcels} />
              <BreakdownPanel title="Handovers par statut" data={metrics.handovers} />
              <BreakdownPanel title="Webhooks par statut" data={metrics.webhooks} />
              <BreakdownPanel title="WhatsApp par statut" data={metrics.whatsapp} />
              <BreakdownPanel
                title="Anomalies par type"
                data={metrics.anomalies}
                emptyLabel="Aucune anomalie détectée sur la période."
              />
              <BreakdownPanel title="Lots d'expédition" data={metrics.shipmentBatches} />
            </div>
          </>
        )}
      </QueryState>
    </div>
  )
}
