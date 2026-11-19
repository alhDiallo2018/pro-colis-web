import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge, Button, Dialog, SegmentedControl, Tabs, Textarea, Toast } from '@/ds'
import { QueryState } from '@/components/QueryState'
import {
  fetchFraudAlerts,
  fetchFraudScores,
  getIntegrationsHealth,
  getRecentHandovers,
  getRecentStopEvents,
  getRecentWebhooks,
  refreshFraudAlerts,
  resolveFraudAlert,
  type FraudAlert,
  type FraudLevel,
  type FraudScore,
  type HandoverRow,
  type IntegrationsHealth,
  type StopEventRow,
  type WebhookDeliveryRow,
} from '@/lib/api/admin-operations'
import { formatDateTime } from '@/lib/format'

type TabKey = 'integrations' | 'webhooks' | 'stops' | 'handovers' | 'fraud'

const TAB_ITEMS = [
  { value: 'integrations', label: 'Intégrations' },
  { value: 'webhooks', label: 'Webhooks récents' },
  { value: 'stops', label: 'Arrêts GPS' },
  { value: 'handovers', label: 'Transferts' },
  { value: 'fraud', label: 'Fraude' },
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
        {tab === 'fraud' && <FraudTab />}
      </div>
    </div>
  )
}

/** Mapping niveau fraude → tonalité Badge. */
function levelTone(level: FraudLevel): 'green' | 'amber' | 'red' | 'neutral' {
  if (level === 'high') return 'red'
  if (level === 'medium') return 'amber'
  if (level === 'low') return 'neutral'
  return 'green'
}

type FraudView = 'scores' | 'open' | 'resolved'

const FRAUD_VIEWS: { value: FraudView; label: string }[] = [
  { value: 'scores', label: 'Scores live' },
  { value: 'open', label: 'Alertes ouvertes' },
  { value: 'resolved', label: 'Alertes résolues' },
]

/**
 * Onglet Fraude — bascule entre scoring live (calcul à la volée) et le
 * journal persistant (alertes ouvertes/résolues). Un bouton global déclenche
 * le recalcul puis invalide les trois caches.
 */
function FraudTab() {
  const qc = useQueryClient()
  const [view, setView] = useState<FraudView>('scores')
  const [toast, setToast] = useState<{ tone: 'ok' | 'error'; message: string } | null>(null)
  const [resolving, setResolving] = useState<FraudAlert | null>(null)
  const [notes, setNotes] = useState('')

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['admin', 'operations', 'fraud-scores'] })
    void qc.invalidateQueries({ queryKey: ['admin', 'operations', 'fraud-alerts', 'open'] })
    void qc.invalidateQueries({ queryKey: ['admin', 'operations', 'fraud-alerts', 'resolved'] })
  }

  const refreshMutation = useMutation({
    mutationFn: refreshFraudAlerts,
    onSuccess: (data) => {
      invalidate()
      setToast({ tone: 'ok', message: `Scan : ${data.scanned}, créées : ${data.created}, ignorées : ${data.skipped}` })
    },
    onError: (err: Error) => setToast({ tone: 'error', message: err.message || 'Rafraîchissement impossible' }),
  })

  const resolveMutation = useMutation({
    mutationFn: ({ id, notes: n }: { id: string; notes: string }) => resolveFraudAlert(id, n),
    onSuccess: () => {
      invalidate()
      setResolving(null)
      setNotes('')
      setToast({ tone: 'ok', message: 'Alerte résolue' })
    },
    onError: (err: Error) => setToast({ tone: 'error', message: err.message || 'Résolution impossible' }),
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <SegmentedControl options={FRAUD_VIEWS} value={view} onChange={(v) => setView(v as FraudView)} />
        <div style={{ flex: 1 }} />
        <Button
          variant="secondary"
          size="sm"
          icon="refresh"
          loading={refreshMutation.isPending}
          onClick={() => refreshMutation.mutate()}
        >
          Rafraîchir les alertes
        </Button>
      </div>

      {toast && <Toast tone={toast.tone === 'error' ? 'error' : 'success'} message={toast.message} />}

      {view === 'scores' && <FraudScoresView />}
      {view === 'open' && <FraudAlertsView status="open" onResolve={(a) => { setResolving(a); setNotes('') }} />}
      {view === 'resolved' && <FraudAlertsView status="resolved" onResolve={null} />}

      {resolving && (
        <Dialog
          open
          title="Résoudre l'alerte"
          icon="verified_user"
          iconTone="green"
          onClose={() => { setResolving(null); setNotes('') }}
          actions={
            <>
              <Button variant="ghost" onClick={() => { setResolving(null); setNotes('') }}>Annuler</Button>
              <Button
                variant="primary"
                loading={resolveMutation.isPending}
                onClick={() => resolveMutation.mutate({ id: resolving.id, notes })}
              >
                Confirmer
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
              Utilisateur : <strong>{resolving.user?.fullName ?? resolving.userId}</strong>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Badge tone={levelTone(resolving.level)}>{resolving.level}</Badge>
              <span style={{ fontSize: 'var(--fs-sm)' }}>Score : {resolving.score}</span>
            </div>
            <Textarea
              label="Notes de résolution"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Contexte de la décision, action entreprise…"
            />
          </div>
        </Dialog>
      )}
    </div>
  )
}

function FraudScoresView() {
  const query = useQuery({
    queryKey: ['admin', 'operations', 'fraud-scores'],
    queryFn: () => fetchFraudScores(),
    refetchInterval: 60_000,
  })
  const rows = query.data ?? []
  return (
    <QueryState
      isLoading={query.isLoading}
      isError={query.isError}
      error={query.error}
      isEmpty={rows.length === 0}
      emptyTitle="Aucun utilisateur actif récemment"
      onRetry={() => query.refetch()}
    >
      <OperationsTable
        columns={[
          { header: 'Utilisateur', render: (r: FraudScore) => <strong>{r.name || r.phone}</strong> },
          { header: 'Score', render: (r) => <Badge tone={levelTone(r.level)}>{r.score} · {r.level}</Badge> },
          {
            header: 'Flags',
            render: (r) => (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {r.flags.length === 0 ? <span style={{ color: 'var(--text-muted)' }}>—</span> : null}
                {r.flags.map((f) => (
                  <Badge key={f} tone="neutral">{f}</Badge>
                ))}
              </div>
            ),
          },
          { header: 'Contact', render: (r) => <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{r.phone}{r.email ? ` · ${r.email}` : ''}</span> },
        ]}
        rows={rows}
        keyFn={(r) => r.userId}
      />
    </QueryState>
  )
}

function FraudAlertsView({ status, onResolve }: { status: 'open' | 'resolved'; onResolve: ((a: FraudAlert) => void) | null }) {
  const query = useQuery({
    queryKey: ['admin', 'operations', 'fraud-alerts', status],
    queryFn: () => fetchFraudAlerts(status),
    refetchInterval: 60_000,
  })
  const rows = query.data ?? []
  const columns: Column<FraudAlert>[] = [
    { header: 'Utilisateur', render: (a) => <strong>{a.user?.fullName ?? a.userId.slice(0, 8)}</strong> },
    { header: 'Score', render: (a) => <Badge tone={levelTone(a.level)}>{a.score} · {a.level}</Badge> },
    {
      header: 'Flags',
      render: (a) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {a.flags.length === 0 ? <span style={{ color: 'var(--text-muted)' }}>—</span> : null}
          {a.flags.map((f) => (
            <Badge key={f} tone="neutral">{f}</Badge>
          ))}
        </div>
      ),
    },
    { header: 'Créée', render: (a) => formatDateTime(a.createdAt) },
  ]
  if (status === 'resolved') {
    columns.push({ header: 'Résolue', render: (a) => formatDateTime(a.resolvedAt) })
    columns.push({ header: 'Notes', render: (a) => <span style={{ fontSize: 'var(--fs-xs)' }}>{a.notes ?? '—'}</span> })
  } else if (onResolve) {
    columns.push({
      header: 'Action',
      render: (a) => (
        <Button variant="secondary" size="sm" icon="verified_user" onClick={() => onResolve(a)}>
          Résoudre
        </Button>
      ),
    })
  }
  return (
    <QueryState
      isLoading={query.isLoading}
      isError={query.isError}
      error={query.error}
      isEmpty={rows.length === 0}
      emptyTitle={status === 'open' ? 'Aucune alerte ouverte' : 'Aucune alerte résolue'}
      onRetry={() => query.refetch()}
    >
      <OperationsTable columns={columns} rows={rows} keyFn={(r) => r.id} />
    </QueryState>
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
