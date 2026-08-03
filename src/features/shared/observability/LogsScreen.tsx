import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Badge, Button, EmptyState, Icon, Input, SegmentedControl, Select, StatBox, Switch, Tabs } from '@/ds'
import { Panel } from '@/components/Panel'
import { ApiError } from '@/lib/api/client'
import {
  CRITICAL_LEVELS,
  LOG_SOURCES,
  downloadObservabilityExport,
  type ExportFormat,
  type LogEntry,
  type LogFilters,
  type LogLevel,
  type LogSource,
} from '@/lib/api/observability'
import { useIsMobile } from '@/lib/useMediaQuery'
import { useAuthStore } from '@/store/auth'
import { LogEntryRow, LOG_GRID } from './LogEntryRow'
import { ServiceHealthStrip } from './ServiceHealthStrip'
import { sourceLabel, timeAgo } from './labels'
import { useLogAnchor, useObservabilityLogs, useObservabilitySummary } from './hooks'

const HOUR_MS = 60 * 60 * 1000

const RANGES = [
  { value: '1h', label: '1 h', ms: HOUR_MS },
  { value: '6h', label: '6 h', ms: 6 * HOUR_MS },
  { value: '24h', label: '24 h', ms: 24 * HOUR_MS },
  { value: '7d', label: '7 j', ms: 7 * 24 * HOUR_MS },
]

/** L'export est plafonné à 24 h par le backend. */
const MAX_EXPORT_MS = 24 * HOUR_MS

const SOURCE_OPTIONS = [
  { value: '', label: 'Toutes les sources' },
  ...LOG_SOURCES.map((source) => ({ value: source, label: sourceLabel(source) })),
]

/** Regroupements de sévérité présentés en onglets. */
const LEVEL_GROUPS: { value: string; label: string; levels: LogLevel[] }[] = [
  { value: 'all', label: 'Tous', levels: [] },
  { value: 'errors', label: 'Erreurs', levels: [...CRITICAL_LEVELS] },
  { value: 'warning', label: 'Alertes', levels: ['warning'] },
  { value: 'info', label: 'Info', levels: ['info', 'notice'] },
  { value: 'debug', label: 'Debug', levels: ['debug'] },
]

function isUnavailable(error: unknown): boolean {
  return error instanceof ApiError && error.code === 'OBSERVABILITY_UNAVAILABLE'
}

/**
 * Journaux techniques de la plateforme (API, PostgreSQL, Caddy, web, infra).
 * Écran partagé entre le super admin et le support technique : le backend
 * renvoie aux rôles support des entrées sans stack ni contexte (`redacted`), et
 * l'export leur est fermé.
 */
export function LogsScreen() {
  const isMobile = useIsMobile()
  const role = useAuthStore((state) => state.user?.role)
  const canExport = role === 'super_admin'

  const [range, setRange] = useState('1h')
  const [source, setSource] = useState<LogSource | ''>('')
  const [group, setGroup] = useState('all')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [requestIdInput, setRequestIdInput] = useState('')
  const [requestId, setRequestId] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [cursors, setCursors] = useState<string[]>([])
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv')
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  // La recherche part au serveur après la frappe : chaque caractère
  // déclencherait sinon une requête Loki, limitée à 30 par minute.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    const timer = setTimeout(() => setRequestId(requestIdInput.trim()), 400)
    return () => clearTimeout(timer)
  }, [requestIdInput])

  const rangeMs = RANGES.find((item) => item.value === range)?.ms ?? HOUR_MS
  const paging = cursors.length > 0
  const { anchor, refresh } = useLogAnchor(autoRefresh, paging)

  // Tout changement de filtre invalide la pile de curseurs : un curseur ne vaut
  // que pour la fenêtre qui l'a produit.
  useEffect(() => {
    setCursors([])
  }, [range, source, group, search, requestId])

  const levels = LEVEL_GROUPS.find((item) => item.value === group)?.levels ?? []
  const from = useMemo(() => new Date(anchor - rangeMs).toISOString(), [anchor, rangeMs])

  const baseFilters: LogFilters = { source, q: search, requestId, from }
  const listFilters: LogFilters = { ...baseFilters, levels, limit: 50, cursor: cursors.at(-1) }

  const summaryQuery = useObservabilitySummary(baseFilters)
  const logsQuery = useObservabilityLogs(listFilters)

  const summary = summaryQuery.data
  const logs = logsQuery.data?.logs ?? []
  const page = logsQuery.data?.page
  const unavailable = isUnavailable(summaryQuery.error) || isUnavailable(logsQuery.error)

  const countFor = (item: (typeof LEVEL_GROUPS)[number]) => {
    if (!summary) return undefined
    if (item.levels.length === 0) return summary.total
    return item.levels.reduce((total, level) => total + (summary.byLevel[level] ?? 0), 0)
  }

  const errorCount = CRITICAL_LEVELS.reduce((total, level) => total + (summary?.byLevel[level] ?? 0), 0)
  const topSource = Object.entries(summary?.bySource ?? {}).sort((a, b) => b[1] - a[1])[0]
  const restricted = logs.some((entry) => entry.redacted)

  async function handleExport(format: ExportFormat) {
    setExporting(true)
    setExportError(null)
    try {
      // La période d'export est ramenée à 24 h quand l'écran montre 7 jours :
      // au-delà le backend refuse la demande. Le calcul part de maintenant et
      // non de l'ancre d'affichage, qui peut avoir vieilli si l'auto-refresh
      // est coupé — la borne haute vue par le serveur, elle, est toujours now.
      const exportFrom = new Date(Date.now() - Math.min(rangeMs, MAX_EXPORT_MS)).toISOString()
      await downloadObservabilityExport({ ...baseFilters, levels, from: exportFrom }, format)
    } catch (error) {
      setExportError(error instanceof ApiError ? error.message : "L'export a échoué.")
    } finally {
      setExporting(false)
    }
  }

  const filtersActive = Boolean(source || search || requestId || group !== 'all')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ServiceHealthStrip
        services={summary?.services ?? []}
        unavailable={unavailable}
        isLoading={summaryQuery.isLoading}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <StatBox icon="storage" tone="primary" value={summary?.total ?? '—'} label={`Événements · ${range}`} />
        <StatBox icon="error" tone={errorCount > 0 ? 'red' : 'green'} value={errorCount} label="Erreurs et incidents" />
        <StatBox
          icon="hub"
          tone="teal"
          value={topSource ? sourceLabel(topSource[0]) : '—'}
          label={topSource ? `Source la plus active · ${topSource[1]}` : 'Source la plus active'}
        />
        <StatBox icon="schedule" tone="amber" value={timeAgo(summary?.latestAt)} label="Dernière entrée" />
      </div>

      <Panel
        title="Filtres"
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Switch checked={autoRefresh} onChange={setAutoRefresh} label="Auto 30 s" />
            <Button
              variant="secondary"
              size="sm"
              icon="refresh"
              // Actualiser ramène au flux le plus récent : garder un curseur
              // de page ancienne le ferait sortir de la nouvelle fenêtre, que
              // le backend rejette en 400.
              onClick={() => {
                setCursors([])
                refresh()
              }}
              loading={logsQuery.isFetching}
            >
              Actualiser
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <SegmentedControl size="sm" options={RANGES} value={range} onChange={setRange} />
            <Select
              value={source}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setSource(e.target.value as LogSource | '')}
              options={SOURCE_OPTIONS}
              style={{ minWidth: 180 }}
            />
          </div>

          {/* Le gabarit de colonnes vient de la classe : le poser en inline
              écraserait la media query qui empile les champs sur mobile. */}
          <div className="pc-field-pair" style={{ gap: 12 }}>
            <Input
              icon="search"
              placeholder="Rechercher dans les messages (2 caractères min.)"
              value={searchInput}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value)}
            />
            <Input
              icon="tag"
              mono
              placeholder="Filtrer par request ID"
              value={requestIdInput}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setRequestIdInput(e.target.value)}
            />
          </div>

          {paging && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-muted)' }}>
              <Icon name="pause_circle" size={16} />
              Rafraîchissement en pause pendant la navigation dans les pages précédentes.
            </div>
          )}
        </div>
      </Panel>

      <Panel
        title="Journaux"
        flush
        action={
          canExport ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <SegmentedControl
                size="sm"
                options={[
                  { value: 'csv', label: 'CSV' },
                  { value: 'jsonl', label: 'JSONL' },
                ]}
                value={exportFormat}
                onChange={(value) => setExportFormat(value as ExportFormat)}
              />
              <Button
                variant="secondary"
                size="sm"
                icon="download"
                loading={exporting}
                onClick={() => handleExport(exportFormat)}
              >
                Exporter 24 h
              </Button>
            </div>
          ) : (
            <Badge tone="neutral" icon="lock">
              Vue support
            </Badge>
          )
        }
      >
        <div style={{ padding: '0 18px' }}>
          <Tabs
            items={LEVEL_GROUPS.map((item) => ({ value: item.value, label: item.label, count: countFor(item) }))}
            value={group}
            onChange={setGroup}
          />
        </div>

        {exportError && (
          <div style={{ padding: '10px 18px', color: 'var(--red-500)', fontSize: 12.5 }}>{exportError}</div>
        )}

        {restricted && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              background: 'var(--surface-sunken)',
              color: 'var(--text-muted)',
              fontSize: 12.5,
            }}
          >
            <Icon name="lock" size={16} />
            Vue restreinte : les stacks, le contexte technique et l'utilisateur concerné ne sont pas affichés.
          </div>
        )}

        {!isMobile && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: LOG_GRID,
              gap: 10,
              padding: '11px 18px 11px 46px',
              borderBottom: '1px solid var(--border-subtle)',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--text-faint)',
            }}
          >
            <span>Heure</span>
            <span>Niveau</span>
            <span>Source</span>
            <span>Message</span>
            <span>Route</span>
          </div>
        )}

        <LogListBody
          isLoading={logsQuery.isLoading}
          error={logsQuery.error}
          logs={logs}
          isMobile={isMobile}
          filtersActive={filtersActive}
          onRetry={() => logsQuery.refetch()}
          onFilterRequestId={(value) => {
            setRequestIdInput(value)
            setRequestId(value)
          }}
        />

        {(cursors.length > 0 || page?.hasMore) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '14px 18px',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <Button
              variant="secondary"
              size="sm"
              icon="chevron_left"
              disabled={cursors.length === 0}
              onClick={() => setCursors((stack) => stack.slice(0, -1))}
            >
              Plus récent
            </Button>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Page {cursors.length + 1}</span>
            <Button
              variant="secondary"
              size="sm"
              iconTrailing="chevron_right"
              disabled={!page?.hasMore || !page.nextCursor}
              onClick={() => setCursors((stack) => (page?.nextCursor ? [...stack, page.nextCursor] : stack))}
            >
              Plus ancien
            </Button>
          </div>
        )}
      </Panel>
    </div>
  )
}

interface LogListBodyProps {
  isLoading: boolean
  error: unknown
  logs: LogEntry[]
  isMobile: boolean
  filtersActive: boolean
  onRetry: () => void
  onFilterRequestId: (requestId: string) => void
}

/**
 * États de la liste. La panne d'observabilité a son propre message : ce n'est
 * pas une erreur de la plateforme mais de la chaîne de collecte, et l'action
 * utile n'est pas la même.
 */
function LogListBody({ isLoading, error, logs, isMobile, filtersActive, onRetry, onFilterRequestId }: LogListBodyProps) {
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)', color: 'var(--color-primary)' }}>
        <Icon name="progress_activity" size={32} style={{ animation: 'pc-spin 0.7s linear infinite' }} />
        <style>{`@keyframes pc-spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  if (error) {
    if (isUnavailable(error)) {
      return (
        <EmptyState
          icon="cloud_off"
          tone="amber"
          title="Observabilité indisponible"
          message="La collecte des journaux (Loki / Prometheus) ne répond pas. Les erreurs continuent d'être enregistrées et réapparaîtront dès le rétablissement du service."
          action={<Button variant="secondary" icon="refresh" onClick={onRetry}>Réessayer</Button>}
        />
      )
    }
    const message = error instanceof ApiError ? error.message : 'Une erreur est survenue. Réessayez.'
    return (
      <EmptyState
        icon="error"
        tone="amber"
        title="Impossible de charger les journaux"
        message={message}
        action={<Button variant="secondary" icon="refresh" onClick={onRetry}>Réessayer</Button>}
      />
    )
  }

  if (logs.length === 0) {
    return (
      <EmptyState
        icon="inbox"
        title="Aucune entrée"
        message={
          filtersActive
            ? 'Aucun journal ne correspond à ces filtres sur la période choisie.'
            : "Aucun événement n'a été enregistré sur cette période. C'est bon signe."
        }
      />
    )
  }

  return (
    <>
      {logs.map((entry) => (
        <LogEntryRow key={entry.id} entry={entry} compact={isMobile} onFilterRequestId={onFilterRequestId} />
      ))}
    </>
  )
}
