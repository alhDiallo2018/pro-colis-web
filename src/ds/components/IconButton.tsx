import { useState } from 'react'
import type { ButtonHTMLAttributes, CSSProperties } from 'react'

export type IconButtonVariant = 'ghost' | 'solid' | 'soft' | 'danger'
export type IconButtonSize = 'sm' | 'md' | 'lg'

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  icon: string
  variant?: IconButtonVariant
  size?: IconButtonSize
  round?: boolean
  disabled?: boolean
  style?: CSSProperties
}

/** Square/round icon-only button. */
export function IconButton({
  icon,
  variant = 'ghost',
  size = 'md',
  round = false,
  disabled = false,
  onClick,
  style,
  ...rest
}: IconButtonProps) {
  const sizes: Record<IconButtonSize, { d: number; ic: number }> = {
    sm: { d: 34, ic: 18 },
    md: { d: 44, ic: 22 },
    lg: { d: 52, ic: 26 },
  }
  const s = sizes[size] || sizes.md
  const variants: Record<IconButtonVariant, { bg: string; fg: string; hb: string }> = {
    ghost: { bg: 'transparent', fg: 'var(--text-muted)', hb: 'var(--surface-sunken)' },
    solid: { bg: 'var(--color-primary)', fg: '#fff', hb: 'var(--color-primary-hover)' },
    soft: { bg: 'var(--color-primary-soft)', fg: 'var(--color-primary)', hb: 'var(--teal-100)' },
    danger: { bg: 'var(--color-danger-soft)', fg: 'var(--color-danger)', hb: 'var(--red-100)' },
  }
  const v = variants[variant] || variants.ghost
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: s.d,
        height: s.d,
        flex: 'none',
        color: disabled ? 'var(--text-faint)' : v.fg,
        background: disabled ? 'transparent' : hover ? v.hb : v.bg,
        border: 'none',
        borderRadius: round ? '50%' : 'var(--radius-sm)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background var(--dur-fast) var(--ease-standard)',
        ...style,
      }}
      {...rest}
    >
      <span className="material-symbols-rounded" style={{ fontSize: s.ic }}>
        {icon}
      </span>
    </button>
  )
}
