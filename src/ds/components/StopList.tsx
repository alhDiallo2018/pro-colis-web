import type { CSSProperties, ReactNode } from 'react'

export interface StopListItem {
  key: string
  label: string
  meta?: ReactNode
  tone?: 'origin' | 'destination' | 'current' | 'default' | 'pending'
  onClick?: () => void
}

export interface StopListProps {
  items: StopListItem[]
  currentIndex?: number
  color?: string
  compact?: boolean
  style?: CSSProperties
}

/**
 * Liste verticale d'arrêts inspirée de Transit / Citymapper :
 * pastille numérotée + segment coloré reliant chaque arrêt au suivant.
 * `currentIndex` met en avant la position du bus dans la ligne.
 */
export function StopList({ items, currentIndex, color = 'var(--teal-500)', compact, style }: StopListProps) {
  return (
    <ol style={{
      listStyle: 'none', margin: 0, padding: 0,
      display: 'grid', gap: 0, ...style,
    }}>
      {items.map((item, i) => {
        const isFirst = i === 0
        const isLast = i === items.length - 1
        const isCurrent = currentIndex === i
        const passed = typeof currentIndex === 'number' && i < currentIndex
        const dotBg =
          item.tone === 'origin' || item.tone === 'destination'
            ? color
            : isCurrent
              ? '#111'
              : passed
                ? color
                : '#FFFFFF'
        const dotBorder = `2px solid ${passed || isCurrent ? color : color}`
        const trackColor = passed ? color : `${color}33`
        return (
          <li
            key={item.key}
            onClick={item.onClick}
            style={{
              display: 'grid',
              gridTemplateColumns: '28px 1fr auto',
              gap: 12,
              alignItems: 'start',
              padding: compact ? '4px 0' : '8px 0',
              cursor: item.onClick ? 'pointer' : 'default',
              opacity: item.tone === 'pending' ? 0.7 : 1,
            }}
          >
            {/* colonne pastille + segments */}
            <div style={{ position: 'relative', height: '100%', minHeight: compact ? 24 : 36 }}>
              {/* segment haut */}
              <div style={{
                position: 'absolute', left: 13, top: 0, width: 2, bottom: '50%',
                background: isFirst ? 'transparent' : trackColor,
              }} />
              {/* segment bas */}
              <div style={{
                position: 'absolute', left: 13, top: '50%', width: 2, bottom: 0,
                background: isLast ? 'transparent' : (passed || isCurrent ? color : `${color}33`),
              }} />
              {/* pastille */}
              <div style={{
                position: 'absolute', left: 6, top: compact ? 4 : 10,
                width: 16, height: 16, borderRadius: 999,
                background: dotBg, border: dotBorder,
                boxShadow: isCurrent ? `0 0 0 3px ${color}33` : 'none',
              }} />
              {/* flèche position courante */}
              {isCurrent && (
                <div style={{
                  position: 'absolute', left: -8, top: compact ? 0 : 6, width: 10, height: 24,
                  display: 'flex', alignItems: 'center',
                }}>
                  <span style={{ fontSize: 18, color: '#111' }}>▶</span>
                </div>
              )}
            </div>
            {/* label */}
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontWeight: isFirst || isLast || isCurrent ? 700 : 500,
                fontSize: compact ? 13 : 15,
                color: isCurrent ? '#111' : 'var(--text-body)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{item.label}</div>
              {item.tone === 'pending' && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  position estimée
                </div>
              )}
            </div>
            {/* meta */}
            {item.meta && (
              <div style={{
                fontSize: compact ? 12 : 13, color: 'var(--text-muted)',
                fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
              }}>{item.meta}</div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
