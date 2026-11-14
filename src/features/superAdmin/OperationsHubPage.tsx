import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Badge, Button, Tabs } from '@/ds'
import { QueryState } from '@/components/QueryState'
import {
  getIntegrationsHealth,
  getRecentHandovers,
  getRecentStopEvents,
  getRecentWebhooks,
  type HandoverRow,
  type IntegrationsHealth,
  type StopEventRow,
  type WebhookDeliveryRow,
} from '@/lib/api/admin-operations'
import { formatDateTime } from '@/lib/format'

type TabKey = 'integrations' | 'webhooks' | 'stops' | 'handovers'

const TAB_ITEMS = [
  { value: 'integrations', label: 'Intégrations' },
  { value: 'webhooks', label: 'Webhooks récents' },
  { value: 'stops', label: 'Arrêts GPS' },
  { value: 'handovers', label: 'Transferts' },
]

export function OperationsHubPage() {
  const [tab, setTab] = useState<TabKey>('integrations')
  return (
    <div className="cm-detail-page" style={{ maxWidth: 1120 }}>
      <div className="cm-page-head">
        <div className="cm-page-head-body">
          <h1>Hub opérationnel</h1>
          <p className="cm-page-head-sub">
            Supervision temps réel des intégrations, livraisons webhook, arrêts GPS et transferts chauffeur.
          </p>
        </div>
      </div>

      <Tabs items={TAB_ITEMS} value={tab} onChange={(v) => setTab(v as TabKey)} />

      <div style={{ paddingTop: 16 }}>
        {tab === 'integrations' && <IntegrationsTab />}
        {tab === 'webhooks' && <WebhooksTab />}
        {tab === 'stops' && <StopEventsTab />}
        {tab === 'handovers' && <HandoversTab />}
      </div>
    </div>
  )
}

function statusTone(status: string): 'green' | 'amber' | 'red' | 'neutral' {
  const s = status.toLowerCase()
  if (['ok', 'healthy', 'delivered', 'completed', 'success'].includes(s)) return 'green'
  if (['degraded', 'pending', 'pending_pickup', 'queued', 'warning'].includes(s)) return 'amber'
  if (['fail', 'failed', 'error', 'cancelled', 'down'].includes(s)) return 'red'
  return 'neutral'
}

function IntegrationsTab() {
  const query = useQuery({
    queryKey: ['admin', 'operations', 'integrations'],
    queryFn: getIntegrationsHealth,
    refetchInterval: 60_000,
  })
  return (
    <QueryState isLoading={query.isLoading} isError={query.isError} error={query.error} onRetry={() => query.refetch()}>
      {query.data && <IntegrationsView data={query.data} refetching={query.isFetching} onRefresh={() => query.refetch()} />}
    </QueryState>
  )
}

function IntegrationsView({ data, refetching, onRefresh }: { data: IntegrationsHealth; refetching: boolean; onRefresh: () => void }) {
  const entries = Object.entries(data.integrations)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Badge tone={statusTone(data.status)}>{data.status}</Badge>
        <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>
          Vérifié : {formatDateTime(data.checkedAt)}
        </span>
        <div style={{ flex: 1 }} />
        <Button variant="secondary" size="sm" icon="refresh" onClick={onRefresh} loading={refetching}>
          Rafraîchir
        </Button>
      </div>
      {entries.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>Aucune intégration configurée.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
          {entries.map(([name, raw]) => {
            const info = (raw ?? {}) as Record<string, unknown>
            const status = (info.status as string) ?? 'unknown'
            const missing = Array.isArray(info.missing) ? (info.missing as string[]) : []
            return (
              <div
                key={name}
                style={{
                  padding: 12,
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <strong>{name}</strong>
                  <Badge tone={statusTone(status)}>{status}</Badge>
                </div>
                {missing.length > 0 && (
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--red-600)' }}>
                    Manquant : {missing.join(', ')}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function WebhooksTab() {
  const query = useQuery({
    queryKey: ['admin', 'operations', 'webhooks-recent'],
    queryFn: () => getRecentWebhooks(50),
    refetchInterval: 60_000,
  })
  const rows = query.data ?? []
  return (
    <QueryState
      isLoading={query.isLoading}
      isError={query.isError}
      error={query.error}
      isEmpty={rows.length === 0}
      emptyTitle="Aucune livraison récente"
      onRetry={() => query.refetch()}
    >
      <OperationsTable
        columns={[
          { header: 'Partenaire', render: (r: WebhookDeliveryRow) => r.partnerName },
          { header: 'Événement', render: (r) => <code style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xs)' }}>{r.eventType}</code> },
          { header: 'Statut', render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
          { header: 'Tentatives', render: (r) => r.attempts, align: 'right' },
          { header: 'HTTP', render: (r) => r.lastStatusCode ?? '—', align: 'right' },
          { header: 'Livré', render: (r) => formatDateTime(r.deliveredAt ?? r.createdAt) },
        ]}
        rows={rows}
        keyFn={(r) => r.id}
      />
    </QueryState>
  )
}

function StopEventsTab() {
  const query = useQuery({
    queryKey: ['admin', 'operations', 'stop-events-recent'],
    queryFn: () => getRecentStopEvents(50),
    refetchInterval: 60_000,
  })
  const rows = query.data ?? []
  return (
    <QueryState
      isLoading={query.isLoading}
      isError={query.isError}
      error={query.error}
      isEmpty={rows.length === 0}
      emptyTitle="Aucun arrêt récent"
      onRetry={() => query.refetch()}
    >
      <OperationsTable
        columns={[
          { header: 'Ordre', render: (r: StopEventRow) => `#${r.stopOrder}`, align: 'center' },
          { header: 'Arrêt', render: (r) => r.stopLabel ?? `Arrêt ${r.stopOrder}` },
          { header: 'Annonce', render: (r) => <code style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xs)' }}>{r.advertisementId.slice(0, 8)}</code> },
          { header: 'Distance', render: (r) => `${r.distanceMeters} m / ${r.radiusMeters} m`, align: 'right' },
          { header: 'Atteint à', render: (r) => formatDateTime(r.reachedAt) },
        ]}
        rows={rows}
        keyFn={(r) => r.id}
      />
    </QueryState>
  )
}

function HandoversTab() {
  const query = useQuery({
    queryKey: ['admin', 'operations', 'handovers-recent'],
    queryFn: () => getRecentHandovers(50),
    refetchInterval: 60_000,
  })
  const rows = query.data ?? []
  return (
    <QueryState
      isLoading={query.isLoading}
      isError={query.isError}
      error={query.error}
      isEmpty={rows.length === 0}
      emptyTitle="Aucun transfert récent"
      onRetry={() => query.refetch()}
    >
      <OperationsTable
        columns={[
          { header: 'Colis', render: (r: HandoverRow) => r.trackingNumber ?? <code style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xs)' }}>{r.parcelId.slice(0, 8)}</code> },
          { header: 'Statut', render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
          { header: 'De', render: (r) => <code style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xs)' }}>{r.fromDriverId.slice(0, 8)}</code> },
          { header: 'Vers', render: (r) => <code style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xs)' }}>{r.toDriverId.slice(0, 8)}</code> },
          { header: 'Raison', render: (r) => r.cancellationReason ?? '—' },
          { header: 'Initié à', render: (r) => formatDateTime(r.initiatedAt) },
        ]}
        rows={rows}
        keyFn={(r) => r.id}
      />
    </QueryState>
  )
}

interface Column<T> {
  header: string
  render: (row: T) => React.ReactNode
  align?: 'left' | 'center' | 'right'
}

function OperationsTable<T>({ columns, rows, keyFn }: { columns: Column<T>[]; rows: T[]; keyFn: (row: T) => string }) {
  return (
    <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--fs-sm)' }}>
        <thead>
          <tr style={{ background: 'var(--surface-sunken)' }}>
            {columns.map((col) => (
              <th
                key={col.header}
                style={{ padding: '10px 12px', textAlign: col.align ?? 'left', fontWeight: 700, color: 'var(--text-muted)', fontSize: 'var(--fs-xs)', textTransform: 'uppercase' }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={keyFn(row)} style={{ borderTop: '1px solid var(--border-subtle)' }}>
              {columns.map((col) => (
                <td key={col.header} style={{ padding: '10px 12px', textAlign: col.align ?? 'left' }}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
