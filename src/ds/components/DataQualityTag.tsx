import type { CSSProperties } from 'react'

export type DataQuality = 'live' | 'estimated' | 'scheduled' | 'unavailable'

const MAP: Record<DataQuality, { bg: string; fg: string; dot: string; label: string }> = {
  live:        { bg: '#DCFCE7', fg: '#065F46', dot: '#10B981', label: 'Direct' },
  scheduled:   { bg: '#DBEAFE', fg: '#1E40AF', dot: '#3B82F6', label: 'Horaire' },
  estimated:   { bg: '#FEF3C7', fg: '#92400E', dot: '#F59E0B', label: 'Estimé' },
  unavailable: { bg: '#FEE2E2', fg: '#991B1B', dot: '#EF4444', label: 'Indisponible' },
}

export interface DataQualityTagProps {
  quality: DataQuality
  label?: string
  freshnessSeconds?: number
  style?: CSSProperties
}

/**
 * Étiquette obligatoire quand une info de transport est affichée :
 * distingue une donnée réelle (GPS frais, horaire officiel) d'une estimation.
 * Convention : jamais afficher une position/horaire sans un de ces tags.
 */
export function DataQualityTag({ quality, label, freshnessSeconds, style }: DataQualityTagProps) {
  const cfg = MAP[quality]
  const text = label
    ?? (quality === 'live' && typeof freshnessSeconds === 'number'
         ? `Direct · ${freshnessSeconds}s`
         : cfg.label)
  const pulse = quality === 'live'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 8px', borderRadius: 999,
      background: cfg.bg, color: cfg.fg,
      fontFamily: 'var(--font-display)', fontWeight: 700,
      fontSize: 11, letterSpacing: '0.03em', textTransform: 'uppercase',
      ...style,
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: 999, background: cfg.dot,
        boxShadow: pulse ? `0 0 0 0 ${cfg.dot}66` : 'none',
        animation: pulse ? 'dqtag-pulse 1.6s ease-out infinite' : 'none',
      }} />
      {text}
      <style>{`
        @keyframes dqtag-pulse {
          0% { box-shadow: 0 0 0 0 ${cfg.dot}66; }
          70% { box-shadow: 0 0 0 6px ${cfg.dot}00; }
          100% { box-shadow: 0 0 0 0 ${cfg.dot}00; }
        }
      `}</style>
    </span>
  )
}
