import type { ReactNode } from 'react'

interface AuthShellProps {
  /** Content of the left brand (gradient) panel. */
  brand: ReactNode
  /** The form column. */
  children: ReactNode
  brandWidth?: number
  /** Max width of the centred form content. */
  formMaxWidth?: number
}

/** Full-page split-screen auth: brand gradient panel + form column. */
export function AuthShell({ brand, children, brandWidth = 480, formMaxWidth = 440 }: AuthShellProps) {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', background: 'var(--surface-card)', fontFamily: 'var(--font-body)' }}>
      <div
        className="pc-auth-brand"
        style={{
          position: 'relative',
          width: brandWidth,
          flex: 'none',
          background: 'var(--gradient-brand)',
          color: '#fff',
          padding: '56px 56px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', right: -120, top: -100, width: 460, height: 460, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ position: 'absolute', left: -80, bottom: -120, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, position: 'relative' }}>
          <img src="/logo-procolis.png" alt="" style={{ width: 38, height: 38, objectFit: 'contain' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 21 }}>PRO COLIS</span>
        </div>
        <div style={{ marginTop: 'auto', position: 'relative', maxWidth: 380 }}>{brand}</div>
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '48px 24px' }}>
        <div style={{ width: '100%', maxWidth: formMaxWidth }}>{children}</div>
      </div>

      <style>{`@media (max-width: 820px){ .pc-auth-brand{ display:none !important; } }`}</style>
    </div>
  )
}
