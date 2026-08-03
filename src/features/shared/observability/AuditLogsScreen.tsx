import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Badge, Icon, Input, Select } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import type { AuditLogEntry } from '@/lib/api/observability'
import { formatDateTime } from '@/lib/format'
import { useIsMobile } from '@/lib/useMediaQuery'
import { useAuditLogs } from './hooks'
import { formatAuditAction, roleLabel, timeAgo } from './labels'

const PAGE_SIZE = 25

const ROLE_OPTIONS = [
  { value: '', label: 'Tous les auteurs' },
  { value: 'super_admin', label: 'Super admin' },
  { value: 'support', label: 'Support' },
  { value: 'support_technique', label: 'Support technique' },
  { value: 'support_commercial', label: 'Support commercial' },
  { value: 'admin', label: 'Admin zone' },
  { value: 'driver', label: 'Chauffeur' },
  { value: 'client', label: 'Client' },
]

/** Une action de suppression ou de rejet mérite d'être repérable d'un coup d'œil. */
function actionTone(action: string): 'red' | 'amber' | 'green' | 'neutral' {
  if (/delete|cancel|reject|suspend/.test(action)) return 'red'
  if (/update|reset|export/.test(action)) return 'amber'
  if (/create|approve|validate|accept/.test(action)) return 'green'
  return 'neutral'
}

const mono: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--text-faint)' }

function Snapshot({ label, data }: { label: string; data: Record<string, unknown> }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 10.5,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--text-faint)',
        }}
      >
        {label}
      </span>
      <pre
        style={{
          margin: 0,
          padding: 10,
          background: 'var(--surface-sunken)',
          borderRadius: 'var(--radius-sm)',
          fontFamily: 'var(--font-mono)',
          fontSize: 11.5,
          lineHeight: 1.55,
          color: 'var(--text-body)',
          overflowX: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          maxHeight: 260,
          overflowY: 'auto',
        }}
      >
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}

const GRID = '150px 1fr 190px 160px'

function AuditRow({ entry, compact }: { entry: AuditLogEntry; compact: boolean }) {
  const [open, setOpen] = useState(false)
  const before = entry.beforeData as Record<string, unknown> | null | undefined
  const after = entry.afterData as Record<string, unknown> | null | undefined
  const hasSnapshot = Boolean(before || after)

  const summary = compact ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Badge tone={actionTone(entry.action)}>{formatAuditAction(entry.action)}</Badge>
        <span style={{ marginLeft: 'auto', ...mono }}>{timeAgo(entry.createdAt)}</span>
      </div>
      <span style={{ fontSize: 13, color: 'var(--text-body)' }}>
        {entry.actor?.fullName ?? roleLabel(entry.actorRole)}
      </span>
      <span style={mono}>
        {entry.entityType}
        {entry.entityId ? ` · ${entry.entityId.slice(0, 8)}…` : ''}
      </span>
    </div>
  ) : (
    <div style={{ display: 'grid', gridTemplateColumns: GRID, alignItems: 'center', gap: 10, minWidth: 0 }}>
      <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{formatDateTime(entry.createdAt)}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <Badge tone={actionTone(entry.action)}>{formatAuditAction(entry.action)}</Badge>
      </span>
      <span
        style={{ fontSize: 13, color: 'var(--text-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      >
        {entry.actor?.fullName ?? '—'}
        <span style={{ color: 'var(--text-faint)' }}> · {roleLabel(entry.actorRole)}</span>
      </span>
      <span style={{ ...mono, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {entry.entityType}
      </span>
    </div>
  )

  return (
    <div style={{ borderBottom: '1px solid var(--slate-100)' }}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: compact ? 'flex-start' : 'center',
          gap: 10,
          width: '100%',
          padding: compact ? '13px 16px' : '11px 18px',
          border: 'none',
          background: open ? 'var(--surface-sunken)' : 'transparent',
          textAlign: 'left',
          cursor: 'pointer',
        }}
      >
        <Icon
          name="chevron_right"
          size={18}
          style={{ color: 'var(--text-faint)', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>{summary}</div>
      </button>

      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '4px 18px 18px 46px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <Detail label="Action">{entry.action}</Detail>
            <Detail label="Entité">{entry.entityType}</Detail>
            {entry.entityId && <Detail label="Identifiant">{entry.entityId}</Detail>}
            {entry.actor && <Detail label="Auteur">{`${entry.actor.fullName} (${roleLabel(entry.actor.role)})`}</Detail>}
            {entry.ipAddress && <Detail label="Adresse IP">{entry.ipAddress}</Detail>}
            {entry.requestId && <Detail label="Request ID">{entry.requestId}</Detail>}
            <Detail label="Horodatage">{formatDateTime(entry.createdAt)}</Detail>
          </div>

          {entry.userAgent && <Detail label="Client">{entry.userAgent}</Detail>}

          {hasSnapshot && (
            <div className="pc-duo" style={{ gap: 12 }}>
              {before && <Snapshot label="Avant" data={before} />}
              {after && <Snapshot label="Après" data={after} />}
            </div>
          )}

          {entry.redacted && entry.hasChangeSnapshot && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-muted)' }}>
              <Icon name="lock" size={15} />
              Le détail des valeurs modifiées est réservé au super administrateur.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 10.5,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--text-faint)',
        }}
      >
        {label}
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-body)', wordBreak: 'break-all' }}>
        {children}
      </span>
    </div>
  )
}

/**
 * Journal d'audit métier : qui a fait quoi, quand et depuis où. Complète les
 * journaux techniques, qui disent ce que la plateforme a subi.
 */
export function AuditLogsScreen() {
  const isMobile = useIsMobile()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [actorRole, setActorRole] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [search, actorRole, from, to])

  const query = useAuditLogs({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    actorRole: actorRole || undefined,
    // Les bornes du filtre date sont des jours : on prend la journée entière.
    from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
    to: to ? new Date(`${to}T23:59:59`).toISOString() : undefined,
  })

  const entries = query.data?.auditLogs ?? []
  const pagination = query.data?.pagination
  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / PAGE_SIZE)) : 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Panel title="Filtres">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="pc-field-pair" style={{ gap: 12 }}>
            <Input
              icon="search"
              placeholder="Rechercher une action ou une entité"
              value={searchInput}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value)}
            />
            <Select
              value={actorRole}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setActorRole(e.target.value)}
              options={ROLE_OPTIONS}
            />
          </div>
          <div className="pc-field-pair" style={{ gap: 12 }}>
            <Input
              type="date"
              label="Du"
              value={from}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFrom(e.target.value)}
            />
            <Input
              type="date"
              label="Au"
              value={to}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setTo(e.target.value)}
            />
          </div>
        </div>
      </Panel>

      <Panel title={`Journal d'audit${pagination ? ` · ${pagination.total}` : ''}`} flush>
        {!isMobile && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: GRID,
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
            <span>Date</span>
            <span>Action</span>
            <span>Auteur</span>
            <span>Entité</span>
          </div>
        )}

        <QueryState
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          isEmpty={entries.length === 0}
          emptyTitle="Aucune action enregistrée"
          emptyMessage="Aucune action ne correspond à ces filtres."
          onRetry={() => query.refetch()}
        >
          {entries.map((entry) => (
            <AuditRow key={entry.id} entry={entry} compact={isMobile} />
          ))}
        </QueryState>

        {pagination && totalPages > 1 && (
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
            <PagerButton disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
              Précédent
            </PagerButton>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Page {page} / {totalPages}
            </span>
            <PagerButton disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>
              Suivant
            </PagerButton>
          </div>
        )}
      </Panel>
    </div>
  )
}

function PagerButton({
  disabled,
  onClick,
  children,
}: {
  disabled: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        border: '1px solid var(--border-default)',
        background: 'var(--surface-card)',
        borderRadius: 'var(--radius-sm)',
        padding: '6px 14px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-display)',
        fontWeight: 600,
        fontSize: 13,
        color: disabled ? 'var(--text-faint)' : 'var(--text-body)',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  )
}
