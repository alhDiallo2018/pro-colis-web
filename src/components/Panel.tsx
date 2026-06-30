import type { CSSProperties, ReactNode } from 'react'

interface PanelProps {
  title?: ReactNode
  action?: ReactNode
  children: ReactNode
  /** Remove inner body padding (e.g. for full-bleed tables/lists). */
  flush?: boolean
  style?: CSSProperties
}

/** White dashboard surface card with an optional header (title + action). */
export function Panel({ title, action, children, flush = false, style }: PanelProps) {
  return (
    <section
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-xs)',
        overflow: 'hidden',
        ...style,
      }}
    >
      {(title || action) && (
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 18px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15.5, color: 'var(--text-strong)' }}>
            {title}
          </h3>
          {action}
        </header>
      )}
      <div style={flush ? undefined : { padding: 18 }}>{children}</div>
    </section>
  )
}
