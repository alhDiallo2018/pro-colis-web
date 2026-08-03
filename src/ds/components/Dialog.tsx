import type { CSSProperties, ReactNode } from 'react'

export type DialogIconTone = 'primary' | 'danger' | 'green' | 'amber'

/** Width steps. Anything wider than the viewport is clamped by `.pc-dialog`. */
export type DialogSize = 'sm' | 'md' | 'lg' | 'xl'

const SIZES: Record<DialogSize, number> = { sm: 360, md: 420, lg: 560, xl: 720 }

export interface DialogProps {
  open?: boolean
  title?: ReactNode
  icon?: string
  iconTone?: DialogIconTone
  /** Max width step. Prefer this over a hard `min-width` on the body, which
   *  overflows the dialog instead of widening it. */
  size?: DialogSize
  children?: ReactNode
  actions?: ReactNode
  onClose?: () => void
  style?: CSSProperties
}

const KEYFRAMES =
  '@keyframes pc-fade{from{opacity:0}to{opacity:1}}@keyframes pc-pop{from{opacity:0;transform:translateY(8px) scale(0.97)}to{opacity:1;transform:none}}'

export function Dialog({ open = true, title, icon, iconTone = 'primary', size = 'md', children, actions, onClose, style }: DialogProps) {
  if (!open) return null

  const tones: Record<DialogIconTone, [string, string]> = {
    primary: ['var(--color-primary-soft)', 'var(--color-primary)'],
    danger: ['var(--color-danger-soft)', 'var(--color-danger)'],
    green: ['var(--green-50)', 'var(--green-600)'],
    amber: ['var(--amber-50)', 'var(--amber-600)'],
  }
  const [bg, fg] = tones[iconTone] || tones.primary
  const hasHeader = Boolean(icon || title)
  const maxWidth = SIZES[size] ?? SIZES.md
  // Roomier dialogs get a taller cap too — a 720px form squeezed into 560px of
  // height scrolls for no reason on a desktop screen.
  const maxHeight = maxWidth > SIZES.md ? 'min(88vh, 760px)' : 'min(85vh, 560px)'

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'rgba(10,58,67,0.45)',
        backdropFilter: 'blur(2px)',
        animation: `pc-fade var(--dur-base) var(--ease-out)`,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        className="pc-dialog"
        style={{
          width: '100%',
          maxWidth,
          maxHeight,
          background: 'var(--surface-card)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: `pc-pop var(--dur-base) var(--ease-out)`,
          ...style,
        }}
      >
        {hasHeader && (
          <div
            className="pc-dialog-head"
            style={{
              flexShrink: 0,
              padding: 'var(--space-6) var(--space-6) 0',
              textAlign: 'center',
            }}
          >
            {icon && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: bg,
                  color: fg,
                  marginBottom: title ? 12 : 0,
                }}
              >
                <span
                  className="material-symbols-rounded"
                  style={{ fontSize: 28, fontVariationSettings: "'FILL' 1" }}
                >
                  {icon}
                </span>
              </span>
            )}
            {title && (
              <h3
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: 18,
                  color: 'var(--text-strong)',
                }}
              >
                {title}
              </h3>
            )}
            <div style={{ height: 'var(--space-4)' }} />
          </div>
        )}

        {children && (
          <div
            className="pc-dialog-body"
            style={{
              flex: '1 1 auto',
              minWidth: 0,
              minHeight: 0,
              overflowY: 'auto',
              overscrollBehavior: 'contain',
              padding: hasHeader ? '0 var(--space-6) var(--space-4)' : 'var(--space-6) var(--space-6) var(--space-4)',
            }}
          >
            {children}
          </div>
        )}

        {actions && (
          <div
            className="pc-dialog-actions"
            style={{
              flexShrink: 0,
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
              padding: 'var(--space-4) var(--space-6) var(--space-6)',
              borderTop: children ? '1px solid var(--border-subtle)' : 'none',
            }}
          >
            {actions}
          </div>
        )}
      </div>

      <style>{KEYFRAMES}</style>
    </div>
  )
}
