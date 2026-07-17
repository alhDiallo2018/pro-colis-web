import { useState } from 'react'
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'amber'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'style'> {
  children?: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: string
  iconTrailing?: string
  block?: boolean
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>['onClick']
  style?: CSSProperties
}

/** SendProcolis primary button. French imperative labels ("Créer le colis"). */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconTrailing,
  block = false,
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  style,
  ...rest
}: ButtonProps) {
  const sizes: Record<ButtonSize, { h: number; px: number; fs: number; ic: number; gap: number }> = {
    sm: { h: 36, px: 14, fs: 13, ic: 18, gap: 6 },
    md: { h: 46, px: 18, fs: 15, ic: 20, gap: 8 },
    lg: { h: 54, px: 22, fs: 16, ic: 22, gap: 8 },
  }
  const s = sizes[size] || sizes.md
  const variants: Record<ButtonVariant, { bg: string; fg: string; bd: string; sh: string; hb: string }> = {
    primary: { bg: 'var(--color-primary)', fg: '#fff', bd: 'transparent', sh: 'var(--shadow-brand)', hb: 'var(--color-primary-hover)' },
    amber: { bg: 'var(--color-accent)', fg: '#3a2600', bd: 'transparent', sh: 'var(--shadow-amber)', hb: 'var(--color-accent-hover)' },
    secondary: { bg: 'var(--surface-card)', fg: 'var(--text-strong)', bd: 'var(--border-default)', sh: 'var(--shadow-xs)', hb: 'var(--surface-sunken)' },
    ghost: { bg: 'transparent', fg: 'var(--color-primary)', bd: 'transparent', sh: 'none', hb: 'var(--color-primary-soft)' },
    danger: { bg: 'var(--color-danger)', fg: '#fff', bd: 'transparent', sh: 'none', hb: 'var(--red-500)' },
  }
  const v = variants[variant] || variants.primary
  const [hover, setHover] = useState(false)
  const [press, setPress] = useState(false)
  const isDisabled = disabled || loading
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false)
        setPress(false)
      }}
      onMouseDown={() => setPress(true)}
      onMouseUp={() => setPress(false)}
      style={{
        display: block ? 'flex' : 'inline-flex',
        width: block ? '100%' : 'auto',
        alignItems: 'center',
        justifyContent: 'center',
        gap: s.gap,
        height: s.h,
        padding: `0 ${s.px}px`,
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: s.fs,
        letterSpacing: '0.01em',
        color: isDisabled ? 'var(--text-faint)' : v.fg,
        background: isDisabled ? 'var(--slate-200)' : hover ? v.hb : v.bg,
        border: `1px solid ${isDisabled ? 'transparent' : v.bd}`,
        borderRadius: 'var(--radius-md)',
        boxShadow: isDisabled ? 'none' : press ? 'none' : v.sh,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        transform: press && !isDisabled ? 'scale(0.97)' : 'scale(1)',
        transition: 'background var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast)',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        ...style,
      }}
      {...rest}
    >
      {loading && (
        <span className="material-symbols-rounded" style={{ fontSize: s.ic, animation: 'pc-spin 0.7s linear infinite' }}>
          progress_activity
        </span>
      )}
      {!loading && icon && (
        <span className="material-symbols-rounded" style={{ fontSize: s.ic }}>
          {icon}
        </span>
      )}
      {children}
      {!loading && iconTrailing && (
        <span className="material-symbols-rounded" style={{ fontSize: s.ic }}>
          {iconTrailing}
        </span>
      )}
      <style>{`@keyframes pc-spin{to{transform:rotate(360deg)}}`}</style>
    </button>
  )
}
