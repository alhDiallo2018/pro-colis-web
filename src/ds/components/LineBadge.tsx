import type { CSSProperties } from 'react'

export type TransitOperator = 'ddd' | 'aftu'
export type TransitDirection = 'aller' | 'retour'

const OPERATOR_COLORS: Record<TransitOperator, { bg: string; fg: string; label: string }> = {
  ddd: { bg: '#E85D04', fg: '#FFFFFF', label: 'DDD' },
  aftu: { bg: '#1D4ED8', fg: '#FFFFFF', label: 'AFTU' },
}

export interface LineBadgeProps {
  operator: TransitOperator
  number: string
  size?: 'sm' | 'md' | 'lg'
  style?: CSSProperties
}

/**
 * Pastille Citymapper-style : couleur par opérateur, numéro de ligne gras.
 * Les valeurs sont pensées pour être repérables d'un coup d'œil.
 */
export function LineBadge({ operator, number, size = 'md', style }: LineBadgeProps) {
  const { bg, fg } = OPERATOR_COLORS[operator] ?? OPERATOR_COLORS.ddd
  const sizes: Record<string, CSSProperties> = {
    sm: { minWidth: 32, height: 28, fontSize: 13, padding: '0 8px', borderRadius: 8 },
    md: { minWidth: 44, height: 40, fontSize: 17, padding: '0 12px', borderRadius: 10 },
    lg: { minWidth: 56, height: 52, fontSize: 22, padding: '0 14px', borderRadius: 12 },
  }
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: bg, color: fg,
        fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '0.01em',
        boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
        ...sizes[size], ...style,
      }}
    >
      {number}
    </span>
  )
}

export function operatorColor(operator: TransitOperator) {
  return OPERATOR_COLORS[operator] ?? OPERATOR_COLORS.ddd
}
