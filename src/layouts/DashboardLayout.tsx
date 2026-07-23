import { Avatar, Icon } from '@/ds'
import { useLogout } from '@/features/auth/useAuth'
import { useMediaQuery } from '@/lib/useMediaQuery'
import { useAuthStore } from '@/store/auth'
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { SupportFAB } from '@/components/SupportFAB'

export interface NavItem {
  label: string
  icon: string
  to: string
  end?: boolean
}

export interface NavSection {
  heading?: string
  items: NavItem[]
}

export interface DashboardLayoutProps {
  /** Sidebar nav, optionally grouped into labelled sections (super admin). */
  nav: NavSection[]
  /** Sub-label under the user name in the sidebar footer (e.g. "Client · Douala"). */
  roleLabel: string
  /** Topbar right-side actions. */
  actions?: ReactNode
  /** Topbar banner slot (broadcast, announcement…). */
  banner?: ReactNode
  /** When on the index route, greet the user instead of showing the page title. */
  greetOnIndex?: boolean
}

const LOGO = 'SEND'

export function DashboardLayout({ nav, roleLabel, actions, banner, greetOnIndex }: DashboardLayoutProps) {
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()
  const location = useLocation()
  const isMobile = useMediaQuery('(max-width: 900px)')
  const [open, setOpen] = useState(!isMobile)

  // Re-sync default open state when crossing the breakpoint…
  useEffect(() => setOpen(!isMobile), [isMobile])
  // …and close the drawer after navigating on mobile.
  useEffect(() => {
    if (isMobile) setOpen(false)
  }, [location.pathname, isMobile])

  const items = nav.flatMap((s) => s.items)
  const active = items.find((n) => location.pathname === n.to || (!n.end && location.pathname.startsWith(n.to + '/')))
  const onIndex = items[0] && location.pathname === items[0].to
  const firstName = user?.fullName?.split(' ')[0] ?? ''
  const title = greetOnIndex && onIndex ? `Bonjour, ${firstName}` : active?.label ?? roleLabel

  const asideStyle: CSSProperties = {
    width: 244,
    flex: 'none',
    background: 'var(--slate-900)',
    color: '#fff',
    flexDirection: 'column',
    padding: '18px 14px',
    ...(isMobile
      ? {
          display: 'flex',
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100dvh',
          zIndex: 45,
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s var(--ease-standard, ease)',
          boxShadow: open ? '2px 0 24px rgba(0,0,0,0.35)' : 'none',
        }
      : {
          display: open ? 'flex' : 'none',
          position: 'sticky',
          top: 0,
          height: '100dvh',
        }),
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', background: 'var(--surface-page)', fontFamily: 'var(--font-body)' }}>
      {/* Mobile drawer backdrop */}
      {isMobile && open && (
        <div
          onClick={() => setOpen(false)}
          aria-hidden
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 44 }}
        />
      )}

      {/* Sidebar */}
      <aside style={asideStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px 18px' }}>
          <span style={{ width: 40, height: 40, borderRadius: 10, background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <img src="/logo-procolis.png" alt="" style={{ width: 31, height: 31, objectFit: 'contain' }} />
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17 }}>
            {LOGO}
            <span style={{ color: 'var(--amber-400)' }}>PRO</span>
            <span style={{ color: 'var(--font-display)' }}>COLIS</span>
          </span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {nav.map((section, i) => (
            <div key={i}>
              {section.heading && (
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.32)',
                    padding: '14px 12px 6px',
                  }}
                >
                  {section.heading}
                </div>
              )}
              {section.items.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.end ?? n.to.split('/').length <= 2}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    height: 42,
                    padding: '0 12px',
                    marginBottom: 3,
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    fontSize: 14,
                    textDecoration: 'none',
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.66)',
                    background: isActive ? 'var(--teal-500)' : 'transparent',
                  })}
                >
                  {({ isActive }) => (
                    <>
                      <Icon name={n.icon} size={21} fill={isActive} />
                      {n.label}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 8px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Avatar name={user?.fullName ?? ''} src={user?.profilePhoto ?? undefined} size="sm" status="online" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 13.5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.fullName}
            </div>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)' }}>{roleLabel}</div>
          </div>
          <button
            onClick={logout}
            aria-label="Se déconnecter"
            style={{ border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: 4 }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 20 }}>
              logout
            </span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <header
          style={{
            height: 'var(--header-h)',
            flex: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? 10 : 16,
            padding: isMobile ? '0 14px' : '0 24px',
            background: 'var(--surface-card)',
            borderBottom: '1px solid var(--border-subtle)',
            position: 'sticky',
            top: 0,
            zIndex: 5,
          }}
        >
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Réduire le menu' : 'Ouvrir le menu'}
            aria-expanded={open}
            style={{
              flex: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--surface-card)',
              color: 'var(--text-body)',
              cursor: 'pointer',
            }}
          >
            <Icon name={open && !isMobile ? 'menu_open' : 'menu'} size={22} />
          </button>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: isMobile ? 17 : 20, color: 'var(--text-strong)', margin: 0 }}>
            {title}
          </h1>
          {actions && <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>{actions}</div>}
        </header>

        {banner}

        <main style={{ flex: 1, overflowY: 'auto', padding: isMobile ? 16 : 24 }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%' }}>
            <Outlet />
          </div>
        </main>

        <SupportFAB />
      </div>
    </div>
  )
}
