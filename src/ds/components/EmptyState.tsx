import type { CSSProperties, ReactNode } from 'react'

export type EmptyStateTone = 'neutral' | 'primary' | 'amber'

export interface EmptyStateProps {
  icon?: string
  title?: ReactNode
  message?: ReactNode
  action?: ReactNode
  children?: ReactNode
  tone?: EmptyStateTone
  style?: CSSProperties
}

/** Empty / error / no-results state. Always offer a next action. */
export function EmptyState({ icon = 'inbox', title, message, action, children, tone = 'neutral', style }: EmptyStateProps) {
  const tones: Record<EmptyStateTone, [string, string]> = {
    neutral: ['var(--surface-sunken)', 'var(--text-faint)'],
    primary: ['var(--color-primary-soft)', 'var(--color-primary)'],
    amber: ['var(--amber-50)', 'var(--amber-500)'],
  }
  const [bg, fg] = tones[tone] || tones.neutral
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '40px 24px',
        gap: 6,
        ...style,
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: bg,
          color: fg,
          marginBottom: 8,
        }}
      >
        <span className="material-symbols-rounded" style={{ fontSize: 38 }}>
          {icon}
        </span>
      </span>
      {title && (
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--text-strong)' }}>{title}</div>
      )}
      {message && <div style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 280, lineHeight: 1.5 }}>{message}</div>}
      {action && <div style={{ marginTop: 14 }}>{action}</div>}
      {children && <div style={{ marginTop: 14 }}>{children}</div>}
    </div>
  )
}
