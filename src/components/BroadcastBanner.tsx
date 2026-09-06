import { useActiveBroadcasts, dismissBroadcast, type Broadcast } from '@/lib/broadcasts'
import type { CSSProperties } from 'react'

const TYPE_STYLE: Record<Broadcast['type'], { bg: string; fg: string; icon: string; bd: string }> = {
  info: { bg: '#E7EEFC', fg: '#1D4ED8', icon: 'info', bd: '#BFDBFE' },
  warning: { bg: 'var(--amber-50)', fg: 'var(--amber-700)', icon: 'campaign', bd: '#FDE68A' },
  success: { bg: 'var(--green-50)', fg: 'var(--green-700)', icon: 'check_circle', bd: '#BBF7D0' },
  promo: { bg: 'var(--teal-50)', fg: 'var(--teal-700)', icon: 'sell', bd: '#BFE6E2' },
}

const marqueeKeyframes = `
@keyframes bcast-scroll {
  0%   { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
}
`

function MarqueeText({ text, fg }: { text: string; fg: string }) {
  const duration = Math.max(24, Math.round(text.length * 0.25))
  return (
    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', position: 'relative' }}>
      <div
        style={{
          display: 'inline-block',
          whiteSpace: 'nowrap',
          animation: `bcast-scroll ${duration}s linear infinite`,
          fontWeight: 600,
          color: fg,
        }}
      >
        {text}
        <span style={{ padding: '0 40px' }}>•</span>
        {text}
      </div>
    </div>
  )
}

export function BroadcastBanner() {
  const broadcasts = useActiveBroadcasts()
  if (broadcasts.length === 0) return null

  return (
    <div style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <style>{marqueeKeyframes}</style>
      {broadcasts.map((b) => {
        const s = TYPE_STYLE[b.type]
        const isPromo = b.type === 'promo'
        const hasImage = !!b.imageUrl

        const rowStyle: CSSProperties = {
          background: isPromo
            ? `linear-gradient(105deg, var(--teal-50) 0%, ${s.bd} 60%, #fff 100%)`
            : s.bg,
          borderBottom: `1px solid ${s.bd}`,
          display: 'flex',
          alignItems: 'center',
          gap: hasImage ? 14 : 10,
          padding: hasImage ? 0 : '9px 20px',
          overflow: 'hidden',
        }

        return (
          <div key={b.id} style={rowStyle}>
            {hasImage ? (
              <>
                <img
                  src={b.imageUrl}
                  alt={b.title || 'pub'}
                  style={{
                    width: 72,
                    height: 56,
                    objectFit: 'cover',
                    flex: 'none',
                    borderRight: `1px solid ${s.bd}`,
                  }}
                />
                {b.scroll ? (
                  <MarqueeText text={b.message} fg={s.fg} />
                ) : (
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: s.fg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>
                    {b.message}
                  </span>
                )}
                <button
                  onClick={() => dismissBroadcast(b.id)}
                  aria-label="Fermer"
                  style={{
                    flex: 'none', background: 'none', border: 'none', cursor: 'pointer',
                    color: s.fg, opacity: 0.5, padding: '0 12px 0 0',
                  }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 18 }}>close</span>
                </button>
              </>
            ) : (
              <>
                <span className="material-symbols-rounded" style={{ fontSize: 20, flex: 'none', color: s.fg }}>
                  {s.icon}
                </span>
                {b.scroll ? (
                  <MarqueeText text={b.message} fg={s.fg} />
                ) : (
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: s.fg }}>
                    {b.message}
                  </span>
                )}
                <button
                  onClick={() => dismissBroadcast(b.id)}
                  aria-label="Fermer"
                  style={{
                    flex: 'none', background: 'none', border: 'none', cursor: 'pointer',
                    color: s.fg, opacity: 0.5, padding: 2,
                  }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 18 }}>close</span>
                </button>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
