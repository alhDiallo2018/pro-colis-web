import type { CSSProperties, ReactNode } from 'react'

/**
 * Read-only label/value rows for the "Détails" dialogs (dépense, retrait,
 * assistance…). Rows are side-by-side on desktop and stack on phones — see
 * `.pc-detail-row` in `ds/tokens/responsive.css`.
 */
export function DetailList({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <dl className="pc-detail-list" style={style}>
      {children}
    </dl>
  )
}

export interface DetailRowProps {
  label: ReactNode
  children?: ReactNode
  /** Tabular values (montants, références) read better in the mono face. */
  mono?: boolean
  /** Keep the row even when the value is empty, showing an em dash. */
  always?: boolean
  valueStyle?: CSSProperties
}

/** One label/value pair. Renders nothing when the value is empty. */
export function DetailRow({ label, children, mono = false, always = false, valueStyle }: DetailRowProps) {
  const empty = children == null || children === '' || children === false
  if (empty && !always) return null
  return (
    <div className="pc-detail-row">
      <dt style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{label}</dt>
      <dd
        style={{
          fontSize: 13.5,
          color: 'var(--text-strong)',
          fontFamily: mono ? 'var(--font-mono)' : undefined,
          fontWeight: mono ? 600 : 500,
          ...valueStyle,
        }}
      >
        {empty ? '—' : children}
      </dd>
    </div>
  )
}

/** Titled block inside a detail dialog (e.g. "Suivi", "Justificatif"). */
export function DetailSection({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
      <h4
        style={{
          margin: 0,
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 11.5,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--text-faint)',
        }}
      >
        {title}
      </h4>
      {children}
    </section>
  )
}

/** Free-text block (description, notes) — wraps and preserves line breaks. */
export function DetailText({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        margin: 0,
        fontSize: 13.5,
        lineHeight: 1.55,
        color: 'var(--text-body)',
        whiteSpace: 'pre-wrap',
        overflowWrap: 'anywhere',
      }}
    >
      {children}
    </p>
  )
}
