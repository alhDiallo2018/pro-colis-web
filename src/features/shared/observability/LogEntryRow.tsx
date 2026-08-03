import { useState } from 'react'
import { Badge, Icon } from '@/ds'
import type { LogEntry, LogLevel } from '@/lib/api/observability'
import { LEVEL_LABEL, LEVEL_TONE, sourceLabel } from './labels'

const timeFmt = new Intl.DateTimeFormat('fr-FR', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

const dayFmt = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' })

function logTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return { time: '—', day: '' }
  return { time: timeFmt.format(date), day: dayFmt.format(date) }
}

const mono: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11.5,
  color: 'var(--text-body)',
  wordBreak: 'break-all',
}

const fieldLabelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontWeight: 700,
  fontSize: 10.5,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--text-faint)',
}

function FieldLabel({ children }: { children: string }) {
  return <span style={fieldLabelStyle}>{children}</span>
}

/** Paire libellé / valeur du panneau déplié. */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
      <FieldLabel>{label}</FieldLabel>
      <span style={{ ...mono, fontSize: 12 }}>{children}</span>
    </div>
  )
}

/** Bloc pré-formaté à défilement propre (stack trace, contexte JSON). */
function CodeBlock({ children }: { children: string }) {
  return (
    <pre
      style={{
        margin: 0,
        padding: 12,
        background: 'var(--surface-sunken)',
        borderRadius: 'var(--radius-sm)',
        fontFamily: 'var(--font-mono)',
        fontSize: 11.5,
        lineHeight: 1.6,
        color: 'var(--text-body)',
        overflowX: 'auto',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        maxHeight: 320,
        overflowY: 'auto',
      }}
    >
      {children}
    </pre>
  )
}

export const LOG_GRID = '92px 96px 118px 1fr 150px'

interface LogEntryRowProps {
  entry: LogEntry
  compact: boolean
  /** Recherche par identifiant de requête depuis la ligne dépliée. */
  onFilterRequestId?: (requestId: string) => void
}

/**
 * Une entrée de journal. Repliée, elle tient sur une ligne ; dépliée, elle
 * montre la corrélation (requestId, route, statut) puis la stack et le contexte
 * en monospace, comme demandé par la spec d'observabilité.
 */
export function LogEntryRow({ entry, compact, onFilterRequestId }: LogEntryRowProps) {
  const [open, setOpen] = useState(false)
  const { time, day } = logTime(entry.timestamp)
  const level = entry.severity as LogLevel
  const tone = LEVEL_TONE[level] ?? 'neutral'
  const hasContext = entry.context && Object.keys(entry.context).length > 0

  const header = compact ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Badge tone={tone}>{LEVEL_LABEL[level] ?? entry.severity}</Badge>
        <Badge tone="neutral">{sourceLabel(entry.source)}</Badge>
        <span style={{ marginLeft: 'auto', ...mono, color: 'var(--text-faint)' }}>{time}</span>
      </div>
      <span style={{ fontSize: 13, color: 'var(--text-body)', minWidth: 0, wordBreak: 'break-word' }}>
        {entry.message}
      </span>
      {(entry.route || entry.statusCode) && (
        <span style={{ ...mono, color: 'var(--text-faint)' }}>
          {entry.method ? `${entry.method} ` : ''}
          {entry.route ?? ''}
          {entry.statusCode ? ` · ${entry.statusCode}` : ''}
        </span>
      )}
    </div>
  ) : (
    <div style={{ display: 'grid', gridTemplateColumns: LOG_GRID, alignItems: 'center', gap: 10, minWidth: 0 }}>
      <span style={{ ...mono, color: 'var(--text-faint)' }} title={`${day} ${time}`}>
        {time}
      </span>
      <span>
        <Badge tone={tone}>{LEVEL_LABEL[level] ?? entry.severity}</Badge>
      </span>
      <span style={{ fontSize: 12.5, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {sourceLabel(entry.source)}
      </span>
      <span
        style={{
          fontSize: 13,
          color: 'var(--text-body)',
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={entry.message}
      >
        {entry.message}
      </span>
      <span style={{ ...mono, color: 'var(--text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {entry.statusCode ? `${entry.statusCode} ` : ''}
        {entry.route ?? ''}
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
          padding: compact ? '13px 16px' : '10px 18px',
          border: 'none',
          background: open ? 'var(--surface-sunken)' : 'transparent',
          textAlign: 'left',
          cursor: 'pointer',
        }}
      >
        <Icon
          name="chevron_right"
          size={18}
          style={{ color: 'var(--text-faint)', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', marginTop: compact ? 2 : 0 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>{header}</div>
      </button>

      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '4px 18px 18px 46px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
            <Field label="Horodatage">{`${day} ${time}`}</Field>
            <Field label="Source">{sourceLabel(entry.source)}</Field>
            {entry.environment && <Field label="Environnement">{entry.environment}</Field>}
            {entry.method && <Field label="Méthode">{entry.method}</Field>}
            {entry.statusCode != null && <Field label="Statut HTTP">{entry.statusCode}</Field>}
            {entry.durationMs != null && <Field label="Durée">{`${entry.durationMs} ms`}</Field>}
            {entry.userId && <Field label="Utilisateur">{entry.userId}</Field>}
          </div>

          {entry.route && <Field label="Route">{entry.route}</Field>}

          {entry.requestId && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <Field label="Request ID">{entry.requestId}</Field>
              {onFilterRequestId && (
                <button
                  type="button"
                  onClick={() => onFilterRequestId(entry.requestId as string)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    border: '1px solid var(--border-default)',
                    background: 'var(--surface-card)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '5px 10px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    fontSize: 12,
                    color: 'var(--color-primary)',
                  }}
                >
                  <Icon name="filter_alt" size={15} />
                  Voir toute la requête
                </button>
              )}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Field label="Message">{entry.message}</Field>
          </div>

          {entry.error && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {entry.error.name && <Badge tone="red">{entry.error.name}</Badge>}
                {entry.error.code && <Badge tone="neutral">{entry.error.code}</Badge>}
              </div>
              {entry.error.message && <CodeBlock>{entry.error.message}</CodeBlock>}
              {entry.error.stack && <CodeBlock>{entry.error.stack}</CodeBlock>}
            </div>
          )}

          {hasContext && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <FieldLabel>Contexte</FieldLabel>
              <CodeBlock>{JSON.stringify(entry.context, null, 2)}</CodeBlock>
            </div>
          )}

          {entry.redacted && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-muted)' }}>
              <Icon name="lock" size={15} />
              Stack trace, contexte technique et utilisateur concerné sont réservés au super administrateur.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
