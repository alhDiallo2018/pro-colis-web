import type { ReactNode } from 'react'
import { MarketingTopbarAuth } from '@/features/marketing/MarketingLayout'
import { ShippingIcon } from '@/features/marketing/StoreBadges'
import '@/features/marketing/marketing.css'
import './auth-shell.css'

interface AuthShellProps {
  /** Content of the left brand (gradient) panel. */
  brand: ReactNode
  /** The form column. */
  children: ReactNode
  brandWidth?: number
  /** Max width of the centred form content. */
  formMaxWidth?: number
  /** Controls which "flip" button appears in the topbar. */
  mode?: 'login' | 'register' | 'forgot'
  /** Whether to render the delivery-van illustration (default true). */
  showVehicle?: boolean
}

/** Full-page auth: top navbar + split-screen (brand gradient + form). */
export function AuthShell({
  brand,
  children,
  brandWidth = 480,
  formMaxWidth = 440,
  mode = 'login',
  showVehicle = true,
}: AuthShellProps) {
  return (
    <div className="mkt-root auth-root">
      <MarketingTopbarAuth mode={mode} />
      <div className="auth-split">
        <aside
          className="auth-brand"
          style={{ ['--auth-brand-width' as string]: `${brandWidth}px` }}
        >
          <span className="auth-brand-shape auth-brand-shape--a" aria-hidden="true" />
          <span className="auth-brand-shape auth-brand-shape--b" aria-hidden="true" />
          <span className="auth-brand-shape auth-brand-shape--c" aria-hidden="true" />
          <div className="auth-brand-body">{brand}</div>
          {showVehicle && (
            <div className="auth-brand-vehicle" aria-hidden="true">
              <ShippingIcon size={300} />
            </div>
          )}
        </aside>
        <main className="auth-form">
          <div className="auth-form-inner" style={{ maxWidth: formMaxWidth }}>
            {showVehicle && (
              <div className="auth-mobile-vehicle" aria-hidden="true">
                <ShippingIcon size={160} />
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
