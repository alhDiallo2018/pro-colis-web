import type { ReactNode } from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/ds'
import { useAuthStore } from '@/store/auth'
import { homeForRole } from '@/routes/paths'
import { useSupportContact } from '@/lib/usePublicConfig'
import { StoreChip, StoreBadges } from './StoreBadges'
import './marketing.css'

const NAV_LINKS = [
  { label: 'À propos', to: '/a-propos' },
  { label: 'Aide', to: '/help' },
  { label: 'Contact', to: '/contact' },
] as const

const SOCIAL = [
  { name: 'Facebook', url: 'https://web.facebook.com/profile.php?id=61592124187728', svg: 'M24 12.07c0-6.63-5.37-12-12-12s-12 5.37-12 12c0 5.99 4.39 10.95 10.13 11.85v-8.39H7.08v-3.47h3.05V9.43c0-3.01 1.79-4.67 4.53-4.67 1.31 0 2.69.23 2.69.23v2.96H15.83c-1.49 0-1.96.92-1.96 1.87v2.25h3.33l-.53 3.47h-2.8v8.39C19.61 23.03 24 18.06 24 12.07z' },
  { name: 'Instagram', url: 'https://www.instagram.com/sendprocolis/', svg: 'M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.64-.07-4.85s.01-3.58.07-4.85c.15-3.23 1.66-4.77 4.92-4.92 1.27-.06 1.65-.07 4.85-.07zM12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98 1.28.06 1.69.07 4.95.07s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.2-4.35-2.62-6.78-6.98-6.98C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 100 12.32 6.16 6.16 0 000-12.32zM12 16a4 4 0 110-8 4 4 0 010 8zm6.41-11.85a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z' },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/company/135937717/admin/dashboard/', svg: 'M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.29zM5.34 7.43A2.07 2.07 0 013.27 5.37 2.07 2.07 0 015.34 3.3a2.07 2.07 0 110 4.13zm1.78 13.02H3.56V9h3.56v11.45zM22.23 0H1.77A1.77 1.77 0 000 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.23 0z' },
  { name: 'TikTok', url: 'https://www.tiktok.com/@ocass.store3', svg: 'M12.53.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z' },
] as const

export interface MarketingLayoutProps {
  children: ReactNode
  /** When true, use full-width layout (landing page). Defaults to narrow document width. */
  variant?: 'landing' | 'document'
  /** When true, renders only chrome + children; no inner container (landing uses section slabs). */
  bare?: boolean
}

export function MarketingLayout({ children, variant = 'document', bare = false }: MarketingLayoutProps) {
  return (
    <div className="mkt-root">
      <MarketingTopbar />
      {bare ? children : (
        <div className={`mkt-container${variant === 'document' ? ' mkt-container--narrow' : ''}`}>
          {children}
        </div>
      )}
      <MarketingFooter />
    </div>
  )
}

/** Topbar variant used on auth pages — no login/register buttons, adds a context CTA. */
export function MarketingTopbarAuth({ mode }: { mode: 'login' | 'register' | 'forgot' }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const alt = mode === 'login'
    ? { label: 'Créer un compte', to: '/register', icon: 'person_add' as const }
    : { label: 'Se connecter', to: '/login', icon: 'login' as const }

  return (
    <nav className="mkt-topbar">
      <div className="mkt-topbar-inner">
        <Brand />
        <div className="mkt-topbar-nav">
          {NAV_LINKS.map(l => (
            <Link key={l.to} to={l.to} className="mkt-topbar-link">{l.label}</Link>
          ))}
        </div>
        <div className="mkt-topbar-actions">
          <Button variant="ghost" size="sm" icon={alt.icon} onClick={() => navigate(alt.to)}>
            {alt.label}
          </Button>
          <StoreChip />
          <button
            type="button"
            className="mkt-topbar-burger"
            aria-expanded={open}
            aria-label="Ouvrir le menu"
            onClick={() => setOpen(v => !v)}
          >
            <span className="material-symbols-rounded" aria-hidden="true">{open ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>
      {open && (
        <div className="mkt-mobile-sheet">
          {NAV_LINKS.map(l => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)}>{l.label}</Link>
          ))}
          <div className="mkt-divider" />
          <button type="button" className="mkt-sheet-link" onClick={() => { setOpen(false); navigate(alt.to) }}>
            {alt.label}
          </button>
        </div>
      )}
    </nav>
  )
}

function Brand() {
  return (
    <Link to="/" aria-label="Retour à l'accueil SendProColis" className="mkt-brand">
      <img src="/logo-procolis.png" alt="" className="mkt-brand-logo" />
      <span className="mkt-brand-name">
        SEND<em>PRO</em>COLIS
      </span>
    </Link>
  )
}

function MarketingTopbar() {
  const navigate = useNavigate()
  const { user, clearSession } = useAuthStore()
  const [open, setOpen] = useState(false)

  const closeAnd = (fn: () => void) => () => { setOpen(false); fn() }
  const logout = () => { clearSession(); navigate('/') }

  return (
    <nav className="mkt-topbar">
      <div className="mkt-topbar-inner">
        <Brand />
        <div className="mkt-topbar-nav">
          {NAV_LINKS.map(l => (
            <Link key={l.to} to={l.to} className="mkt-topbar-link">{l.label}</Link>
          ))}
        </div>
        <div className="mkt-topbar-actions">
          {user ? (
            <>
              <Button variant="ghost" size="sm" icon="account_circle" onClick={() => navigate(homeForRole(user.role))}>
                Mon espace
              </Button>
              <Button variant="ghost" size="sm" icon="logout" onClick={logout} aria-label="Déconnexion" />
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')} aria-label="Connexion">
                Connexion
              </Button>
              <Button size="sm" icon="person_add" onClick={() => navigate('/register')}>
                S'inscrire
              </Button>
            </>
          )}
          <StoreChip />
          <button
            type="button"
            className="mkt-topbar-burger"
            aria-expanded={open}
            aria-label="Ouvrir le menu"
            onClick={() => setOpen(v => !v)}
          >
            <span className="material-symbols-rounded" aria-hidden="true">{open ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>
      {open && (
        <div className="mkt-mobile-sheet">
          {NAV_LINKS.map(l => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)}>{l.label}</Link>
          ))}
          <div className="mkt-divider" />
          {user ? (
            <>
              <button type="button" className="mkt-sheet-link" onClick={closeAnd(() => navigate(homeForRole(user.role)))}>
                Mon espace
              </button>
              <button type="button" className="mkt-sheet-link" onClick={closeAnd(logout)}>
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <button type="button" className="mkt-sheet-link" onClick={closeAnd(() => navigate('/login'))}>
                Connexion
              </button>
              <button type="button" className="mkt-sheet-link" onClick={closeAnd(() => navigate('/register'))}>
                Créer un compte
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  )
}

function MarketingFooter() {
  const navigate = useNavigate()
  const support = useSupportContact()
  const year = new Date().getFullYear()
  return (
    <footer className="mkt-footer">
      <div className="mkt-footer-inner">
        <div className="mkt-footer-grid">
          <div>
            <Brand />
            <p className="mkt-footer-brand-text">
              La plateforme qui connecte expéditeurs et chauffeurs vérifiés pour livrer vos colis
              au Sénégal, en Afrique et à l'international.
            </p>
            <div className="mkt-footer-chip-row">
              {support.technicalPhone && (
                <a className="mkt-footer-chip" href={`tel:${support.technicalPhone.replace(/\s/g, '')}`} aria-label="Appeler">
                  <span className="material-symbols-rounded" aria-hidden="true" style={{ fontSize: 18 }}>call</span>
                </a>
              )}
              {support.email && (
                <a className="mkt-footer-chip" href={`mailto:${support.email}`} aria-label="E-mail">
                  <span className="material-symbols-rounded" aria-hidden="true" style={{ fontSize: 18 }}>mail</span>
                </a>
              )}
              <a
                className="mkt-footer-chip"
                href="https://www.google.com/maps/search/?api=1&query=Dakar%2C%20S%C3%A9n%C3%A9gal"
                target="_blank" rel="noopener noreferrer" aria-label="Localisation"
              >
                <span className="material-symbols-rounded" aria-hidden="true" style={{ fontSize: 18 }}>location_on</span>
              </a>
              {SOCIAL.map(s => (
                <a key={s.name} className="mkt-footer-chip" href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.name}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d={s.svg} /></svg>
                </a>
              ))}
            </div>
            <div style={{ marginTop: 16 }}>
              <StoreBadges size="sm" only="both" />
            </div>
          </div>
          <FooterCol
            title="À propos"
            links={[
              { label: 'À propos de SendProColis', to: '/a-propos' },
              { label: 'Comment ça marche', to: '/help' },
              { label: 'Installer sur iPhone / iPad', to: '/installer' },
              { label: 'Contact', to: '/contact' },
            ]}
            onNavigate={navigate}
          />
          <FooterCol
            title="Légal"
            links={[
              { label: 'Mentions légales', to: '/mentions-legales' },
              { label: 'Confidentialité', to: '/confidentialite' },
              { label: 'CGU', to: '/cgu' },
              { label: 'Conditions de transport', to: '/conditions-transport' },
              { label: 'Paiement', to: '/paiement' },
              { label: 'Remboursement', to: '/remboursement' },
            ]}
            onNavigate={navigate}
          />
          <FooterCol
            title="Support"
            links={[
              { label: "Centre d'aide", to: '/help' },
              { label: 'Réclamations', to: '/reclamations' },
              { label: 'Colis interdits', to: '/colis-interdits' },
            ]}
            onNavigate={navigate}
          />
        </div>
        <div className="mkt-footer-bottom">
          <span>© {year} SendProColis. Tous droits réservés.</span>
          <span>Dakar, Sénégal · {support.email || 'contact@sendprocolis.com'}</span>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({
  title,
  links,
  onNavigate,
}: {
  title: string
  links: Array<{ label: string; to: string }>
  onNavigate: (to: string) => void
}) {
  return (
    <div className="mkt-footer-col">
      <div className="mkt-footer-col-title">{title}</div>
      <ul>
        {links.map(l => (
          <li key={l.to}>
            <button type="button" className="mkt-footer-link" onClick={() => onNavigate(l.to)}>{l.label}</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ============================================================
   Reusable marketing primitives (shared across sub-pages)
   ============================================================ */

export interface MarketingHeroProps {
  eyebrow?: string
  eyebrowIcon?: string
  title: ReactNode
  lead?: ReactNode
  chips?: Array<{ icon?: string; label: string }>
  actions?: ReactNode
  /** Last-updated date shown under the lead (ISO or FR string) */
  updated?: string
}

export function MarketingHero({ eyebrow, eyebrowIcon = 'bolt', title, lead, chips, actions, updated }: MarketingHeroProps) {
  return (
    <section className="mkt-hero">
      {eyebrow && (
        <div className="mkt-hero-eyebrow">
          <span className="material-symbols-rounded" aria-hidden="true">{eyebrowIcon}</span>
          {eyebrow}
        </div>
      )}
      <h1>{title}</h1>
      {lead && <p className="mkt-hero-lead">{lead}</p>}
      {chips && chips.length > 0 && (
        <div className="mkt-hero-meta">
          {chips.map((c, i) => (
            <span key={i} className="mkt-hero-chip">
              {c.icon && <span className="material-symbols-rounded" aria-hidden="true">{c.icon}</span>}
              {c.label}
            </span>
          ))}
        </div>
      )}
      {updated && (
        <div className="mkt-hero-meta">
          <span className="mkt-hero-chip">
            <span className="material-symbols-rounded" aria-hidden="true">update</span>
            Dernière mise à jour : {updated}
          </span>
        </div>
      )}
      {actions && <div className="mkt-hero-actions">{actions}</div>}
    </section>
  )
}

export interface MarketingSectionProps {
  title: ReactNode
  lead?: ReactNode
  icon?: string
  iconTone?: 'teal' | 'amber' | 'green' | 'rose' | 'indigo' | 'violet'
  children: ReactNode
}

export function MarketingSection({ title, lead, icon, iconTone = 'teal', children }: MarketingSectionProps) {
  return (
    <section className="mkt-section">
      <div className="mkt-section-head">
        {icon && (
          <div className={`mkt-section-icon mkt-section-icon--${iconTone}`}>
            <span className="material-symbols-rounded" aria-hidden="true">{icon}</span>
          </div>
        )}
        <div className="mkt-section-head-text">
          <h2>{title}</h2>
          {lead && <p className="mkt-section-lead">{lead}</p>}
        </div>
      </div>
      <div className="mkt-section-body">{children}</div>
    </section>
  )
}

export interface MarketingAlertProps {
  tone?: 'info' | 'amber' | 'success' | 'danger'
  icon?: string
  title?: ReactNode
  children: ReactNode
}

export function MarketingAlert({ tone = 'info', icon, title, children }: MarketingAlertProps) {
  const defaultIcon = tone === 'amber' ? 'warning' : tone === 'success' ? 'check_circle' : tone === 'danger' ? 'report' : 'info'
  return (
    <div className={`mkt-alert mkt-alert--${tone}`}>
      <div className="mkt-alert-icon">
        <span className="material-symbols-rounded" aria-hidden="true">{icon || defaultIcon}</span>
      </div>
      <div className="mkt-alert-body">
        {title && <div className="mkt-alert-title">{title}</div>}
        <p>{children}</p>
      </div>
    </div>
  )
}

export interface MarketingFeatureItem {
  icon: string
  tone?: 'teal' | 'amber' | 'green' | 'rose' | 'indigo'
  title: ReactNode
  text: ReactNode
}

export function MarketingFeatureGrid({ items }: { items: MarketingFeatureItem[] }) {
  return (
    <div className="mkt-grid">
      {items.map((it, i) => (
        <div key={i} className="mkt-feature">
          <div className={`mkt-feature-icon mkt-feature-icon--${it.tone || 'teal'}`}>
            <span className="material-symbols-rounded" aria-hidden="true">{it.icon}</span>
          </div>
          <div className="mkt-feature-title">{it.title}</div>
          <div className="mkt-feature-text">{it.text}</div>
        </div>
      ))}
    </div>
  )
}

export function MarketingBackBar({ to = '/' }: { to?: string }) {
  const navigate = useNavigate()
  return (
    <div className="mkt-back-bar">
      <nav aria-label="Fil d'Ariane" className="mkt-back-bar-crumbs">
        <Link to="/">Accueil</Link>
        <span className="material-symbols-rounded" aria-hidden="true">chevron_right</span>
        <span style={{ color: 'var(--text-body)', fontWeight: 600 }}>Page courante</span>
      </nav>
      <Button variant="ghost" size="sm" icon="arrow_back" onClick={() => navigate(to)}>
        Retour à l'accueil
      </Button>
    </div>
  )
}
