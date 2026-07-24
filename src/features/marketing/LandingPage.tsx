import { Button, Input } from '@/ds'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const NAV_ITEMS = [
  { label: 'Comment ça marche', target: 'how-it-works' },
  { label: 'Pour les chauffeurs', target: 'for-drivers' },
  { label: 'Fonctionnement', target: 'pricing' },
] as const

const STATS = [
  { value: '14 régions', label: 'au Sénégal et à l’international', icon: 'public' },
  { value: '1 200+', label: 'chauffeurs vérifiés', icon: 'verified_user' },
  { value: '45 min', label: 'délai avant 1ʳᵉ offre', icon: 'timer', accent: true },
  { value: '98,4 %', label: 'colis livrés à temps', icon: 'check_circle' },
]

const STEPS = [
  {
    icon: 'edit_note',
    color: 'var(--color-primary)',
    bg: 'var(--color-primary-soft)',
    title: 'Déclarez votre colis',
    text: 'Renseignez le trajet, le destinataire, le poids et votre prix. Ajoutez une photo et une note vocale pour plus de détails.',
  },
  {
    icon: 'gavel',
    color: '#2563EB',
    bg: '#E7EEFC',
    title: 'Recevez les meilleures offres',
    text: 'Nos chauffeurs vérifiés enchérissent sur votre annonce. Comparez les prix, les notes et choisissez le meilleur.',
  },
  {
    icon: 'local_shipping',
    color: 'var(--green-700)',
    bg: 'var(--green-50)',
    title: 'Suivez la livraison en direct',
    text: 'Tracking en temps réel, contact direct avec le chauffeur et confirmation de livraison avec code PIN sécurisé.',
  },
]

const ADVANTAGES = [
  { icon: 'verified', title: 'Chauffeurs vérifiés', text: 'Tous nos chauffeurs sont validés et notés par la communauté.' },
  { icon: 'shield', title: 'Paiement sécurisé', text: 'Votre argent est protégé. Paiement déclenché à la livraison.' },
  { icon: 'support_agent', title: 'Support 6j/7', text: 'Une équipe réactive pour vous accompagner à chaque étape.' },
  { icon: 'speed', title: 'Livraison express', text: 'Option prioritaire pour vos colis urgents. Départ sous 2h.' },
]

// ============================================================
// RÉSEAUX SOCIAUX
// ============================================================
const SOCIAL_LINKS = [
  {
    name: 'Facebook',
    icon: 'facebook',
    url: 'https://web.facebook.com/profile.php?id=61592124187728',
    color: '#1877F2',
  },
  {
    name: 'Instagram',
    icon: 'instagram',
    url: 'https://www.instagram.com/sendprocolis/',
    color: '#E4405F',
  },
  {
    name: 'LinkedIn',
    icon: 'linkedin',
    url: 'https://www.linkedin.com/company/135937717/admin/dashboard/',
    color: '#0A66C2',
  },
  {
    name: 'TikTok',
    icon: 'tiktok',
    url: 'https://www.tiktok.com/@ocass.store3?_r=1&_t=ZS-98G1Vort7km',
    color: '#000000',
  },
]

function FloatingShapes() {
  return (
    <>
      <div style={{ position: 'absolute', right: '-5%', top: '10%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: '15%', bottom: '20%', width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: '25%', top: '60%', width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
    </>
  )
}

export function LandingPage() {
  const navigate = useNavigate()
  const [mobileMenu, setMobileMenu] = useState(false)
  const [trackingInput, setTrackingInput] = useState('')

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault()
    if (trackingInput.trim()) {
      navigate(`/client/suivi?tracking=${trackingInput.trim().toUpperCase()}`)
    }
  }

  // Fonction pour obtenir l'icône du réseau social
  const getSocialIcon = (iconName: string) => {
    switch (iconName) {
      case 'facebook':
        return (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        )
      case 'instagram':
        return (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
          </svg>
        )
      case 'linkedin':
        return (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        )
      case 'tiktok':
        return (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
          </svg>
        )
      default:
        return (
          <span className="material-symbols-rounded" style={{ fontSize: 20 }}>
            link
          </span>
        )
    }
  }

  return (
    <div style={{ background: 'var(--surface-card)', fontFamily: 'var(--font-body)', overflowX: 'hidden' }}>
      {/* ===== NAVBAR ===== */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', display: 'flex', alignItems: 'center', height: 68, padding: '0 clamp(16px, 4vw, 40px)', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flex: 'none' }} onClick={() => navigate('/')}>
            <img src="/logo-procolis.png" alt="" style={{ width: 'clamp(30px, 8vw, 38px)', height: 'clamp(30px, 8vw, 38px)', objectFit: 'contain', flex: 'none' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(15px, 4.4vw, 19px)', color: 'var(--slate-900)', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
              SEND<span style={{ color: 'var(--color-primary)' }}>PRO</span>COLIS
            </span>
          </div>

          <div className="pc-landing-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 28, marginLeft: 24 }}>
            {NAV_ITEMS.map((item) => (
              <span key={item.label} style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-body)', cursor: 'pointer', transition: 'color 0.15s' }}
                onClick={() => document.getElementById(item.target)?.scrollIntoView({ behavior: 'smooth' })}
                onMouseEnter={(e) => (e.target as HTMLElement).style.color = 'var(--color-primary)'}
                onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'var(--text-body)'}
              >
                {item.label}
              </span>
            ))}
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="pc-landing-signin">
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Se connecter</Button>
            </span>
            <Button size="sm" icon="person_add" onClick={() => navigate('/register')} className="pc-navbar-cta">
              <span className="pc-navbar-cta-full">Créer un compte</span>
              <span className="pc-navbar-cta-short">S'inscrire</span>
            </Button>
            <button className="pc-landing-burger" aria-label="Ouvrir le menu" aria-expanded={mobileMenu}
              onClick={() => setMobileMenu(!mobileMenu)}
              style={{ background: 'none', border: 'none', padding: 8, cursor: 'pointer', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 28, color: 'var(--text-strong)' }}>{mobileMenu ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>
        {mobileMenu && (
          <div className="pc-landing-mobile-menu" style={{ padding: '4px 20px 18px', display: 'flex', flexDirection: 'column', gap: 4, borderTop: '1px solid var(--border-subtle)' }}>
            {NAV_ITEMS.map((item) => (
              <span key={item.label} style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-body)', cursor: 'pointer', padding: '12px 4px', borderRadius: 10 }}
                onClick={() => { document.getElementById(item.target)?.scrollIntoView({ behavior: 'smooth' }); setMobileMenu(false) }}>
                {item.label}
              </span>
            ))}
            <div style={{ marginTop: 8 }}>
              <Button variant="ghost" size="md" block onClick={() => { navigate('/login'); setMobileMenu(false) }}>Se connecter</Button>
            </div>
          </div>
        )}
      </nav>

      {/* ===== HERO ===== */}
      <section style={{ position: 'relative', background: 'linear-gradient(135deg, #0d2818 0%, #0f766e 40%, #0d9488 100%)', color: '#fff', overflow: 'hidden' }}>
        <FloatingShapes />
        <div style={{ position: 'relative', maxWidth: 1320, margin: '0 auto', padding: 'clamp(48px, 7vw, 80px) clamp(16px, 4vw, 40px) clamp(56px, 8vw, 96px)' }}>
          <div style={{ gap: 'clamp(32px, 6vw, 64px)', alignItems: 'center' }}
            className="pc-landing-hero-grid">
            <div>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', background: 'rgba(255,255,255,0.12)',
                borderRadius: 'var(--radius-pill)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
                letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 28,
              }}>
                <span className="material-symbols-rounded" style={{ fontSize: 16, color: 'var(--amber-400)' }}>bolt</span>
                Livraison interurbaine & internationale
              </span>
              <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(28px, 6vw, 56px)', lineHeight: 1.1, letterSpacing: '-0.03em', margin: '0 0 20px' }}>
                Envoyez vos colis<br />de ville en ville,<br />
                <span style={{ color: 'var(--amber-400)' }}>partout en Afrique et au-delà</span>
              </h1>
              <p style={{ fontSize: 'clamp(15px, 1.6vw, 18px)', lineHeight: 1.6, opacity: 0.9, margin: '0 0 32px', maxWidth: 500 }}>
                La plateforme qui connecte expéditeurs et chauffeurs vérifiés pour des livraisons rapides,
                sécurisées et au meilleur prix — au Sénégal, en Afrique et à l'international.
                Publiez, comparez, envoyez — en toute confiance.
              </p>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <Button variant="amber" size="lg" icon="add_box" onClick={() => navigate('/register')}
                  style={{ fontSize: 15, padding: '14px 28px', borderRadius: 14, fontWeight: 800 }}>
                  Publier un colis
                </Button>
                <Button variant="secondary" size="lg" icon="local_shipping" onClick={() => navigate('/register')}
                  style={{ fontSize: 15, padding: '14px 28px', borderRadius: 14, fontWeight: 700 }}>
                  Devenir chauffeur
                </Button>
              </div>

              <div style={{ display: 'flex', gap: 24, marginTop: 36, flexWrap: 'wrap' }}>
                {ADVANTAGES.map((a) => (
                  <div key={a.icon} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 20, color: 'var(--amber-400)' }}>{a.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.85 }}>{a.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tracking Card */}
            <div style={{
              background: 'var(--surface-card)', borderRadius: 20, boxShadow: '0 32px 64px rgba(0,0,0,0.3), 0 8px 16px rgba(0,0,0,0.15)',
              padding: 28, color: 'var(--text-body)', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: 100, height: 4, background: 'var(--gradient-brand)', borderRadius: '0 0 0 8px' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span className="material-symbols-rounded" style={{ fontSize: 26, color: 'var(--color-primary)' }}>qr_code_2</span>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--text-strong)' }}>
                  Suivez votre colis
                </div>
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--text-muted)', margin: '0 0 18px' }}>
                Entrez votre numéro de suivi pour savoir où se trouve votre colis en temps réel.
              </p>
              <form onSubmit={handleTrack} className="pc-landing-track-form" style={{ display: 'flex', gap: 10 }}>
                <Input
                  icon="qr_code_2"
                  mono
                  placeholder="PC-XXXX-XXXX"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  style={{ flex: 1 }}
                />
                <Button type="submit" size="lg" iconTrailing="arrow_forward" disabled={!trackingInput.trim()}
                  className="pc-landing-track-btn">
                  Suivre
                </Button>
              </form>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--green-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                  <span className="material-symbols-rounded fill" style={{ fontSize: 22, color: 'var(--green-700)' }}>local_shipping</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text-strong)' }}>Dakar → Saint-Louis</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>En transit · 3 colis cette semaine</div>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, color: 'var(--green-700)', background: 'var(--green-50)', padding: '5px 12px', borderRadius: 'var(--radius-pill)' }}>
                  Livré
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section style={{ background: 'var(--slate-900)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, var(--color-primary), var(--amber-400))' }} />
        <div className="pc-landing-stats" style={{ maxWidth: 1320, margin: '0 auto' }}>
          {STATS.map((s) => (
            <div key={s.label} style={{
              padding: 'clamp(22px, 4vw, 36px) clamp(16px, 3vw, 36px)',
              display: 'flex', flexDirection: 'column', gap: 10, borderRight: '1px solid rgba(255,255,255,0.06)',
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 22, color: s.accent ? 'var(--amber-400)' : 'rgba(255,255,255,0.3)' }}>
                {s.icon}
              </span>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(24px, 3vw, 34px)', color: s.accent ? 'var(--amber-400)' : '#fff' }}>
                {s.value}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" style={{ padding: 'clamp(56px, 7vw, 80px) clamp(16px, 4vw, 40px)' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 56px' }}>
            <span style={{
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: 'var(--color-primary)',
              background: 'var(--color-primary-soft)', padding: '6px 16px', borderRadius: 'var(--radius-pill)',
            }}>
              Simple et rapide
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(28px, 4.5vw, 38px)', letterSpacing: '-0.03em', color: 'var(--text-strong)', margin: '20px 0 14px' }}>
              En trois étapes, votre colis arrive à bon port
            </h2>
            <p style={{ fontSize: 16, color: 'var(--text-muted)', margin: 0, lineHeight: 1.55 }}>
              Pas d'intermédiaire opaque : vous fixez votre prix et choisissez votre chauffeur.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {STEPS.map((s, i) => (
              <div key={s.title} style={{
                background: 'var(--surface-page)', border: '1px solid var(--border-subtle)', borderRadius: 20, padding: 32,
                position: 'relative', transition: 'transform 0.2s, box-shadow 0.2s',
              }}>
                {i < 2 && (
                  <div style={{
                    position: 'absolute', top: 36, right: -16, width: 48, height: 2,
                    background: 'linear-gradient(90deg, var(--border-subtle), transparent)',
                    transform: 'rotate(-15deg)',
                  }} className="pc-hide-sm" />
                )}
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 16, background: s.bg, color: s.color, marginBottom: 24 }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 32 }}>{s.icon}</span>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, background: s.bg, position: 'absolute', top: 28, right: 28 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 800, color: s.color }}>0{i + 1}</span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--text-strong)', margin: '0 0 10px' }}>
                  {s.title}
                </h3>
                <p style={{ fontSize: 14.5, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FOR DRIVERS ===== */}
      <section id="for-drivers" style={{ background: 'var(--surface-page)', padding: 'clamp(56px, 7vw, 80px) clamp(16px, 4vw, 40px)' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ gap: 'clamp(32px, 6vw, 64px)', alignItems: 'center' }}
            className="pc-landing-drivers-grid">
            <div>
              <span style={{
                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: 'var(--amber-600)', background: 'var(--amber-50)',
                padding: '6px 16px', borderRadius: 'var(--radius-pill)',
              }}>
                Opportunité
              </span>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(28px, 4.5vw, 38px)', letterSpacing: '-0.03em', color: 'var(--text-strong)', margin: '20px 0 14px' }}>
                Gagnez plus<br />avec votre véhicule
              </h2>
              <p style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 28px' }}>
                Vous voyagez entre les villes ? Transportez des colis et rentabilisez vos trajets.
                Définissez vos tarifs, acceptez les colis qui vous conviennent, et gagnez de l'argent.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
                {[
                  { icon: 'schedule', text: 'Travaillez quand vous voulez, où vous voulez' },
                  { icon: 'payments', text: 'Paiement sécurisé après chaque livraison' },
                  { icon: 'stars', text: 'Gagnez des points et améliorez votre visibilité' },
                ].map((item) => (
                  <div key={item.icon} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 22, color: 'var(--color-primary)' }}>{item.icon}</span>
                    <span style={{ fontSize: 14.5, color: 'var(--text-body)', fontWeight: 500 }}>{item.text}</span>
                  </div>
                ))}
              </div>
              <Button variant="amber" size="lg" icon="local_shipping" onClick={() => navigate('/register')}
                style={{ fontSize: 15, padding: '14px 28px', borderRadius: 14, fontWeight: 800 }}>
                Devenir chauffeur
              </Button>
            </div>
            <div style={{
              background: 'var(--gradient-brand)', borderRadius: 24, padding: 32, color: '#fff',
              boxShadow: 'var(--shadow-brand)',
            }} className="pc-hide-sm">
              <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 24 }}>Simulation de revenus</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { from: 'Dakar', to: 'Thiès', price: 7000, trips: 3 },
                  { from: 'Dakar', to: 'Saint-Louis', price: 12000, trips: 1 },
                  { from: 'Thiès', to: 'Kaolack', price: 8500, trips: 2 },
                ].map((trip) => (
                  <div key={trip.from + trip.to} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 20 }}>sync_alt</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>{trip.from} → {trip.to}</div>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>{trip.trips} colis disponibles</div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15 }}>{trip.price.toLocaleString('fr-FR')} FCFA</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.15)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, opacity: 0.7 }}>Potentiel cette semaine</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 20, color: 'var(--amber-400)' }}>49 000 FCFA</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRICING / CTA ===== */}
      <section id="pricing" style={{ padding: 'clamp(56px, 7vw, 80px) clamp(16px, 4vw, 40px)' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', textAlign: 'center' }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'var(--color-primary)', background: 'var(--color-primary-soft)',
            padding: '6px 16px', borderRadius: 'var(--radius-pill)',
          }}>
            Fonctionnement
          </span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(28px, 4.5vw, 38px)', letterSpacing: '-0.03em', color: 'var(--text-strong)', margin: '20px 0 14px' }}>
            C'est vous qui fixez les règles
          </h2>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', margin: '0 auto 56px', maxWidth: 560, lineHeight: 1.55 }}>
            Vous fixez librement le prix de votre envoi. Les chauffeurs vous font des offres compétitives. Payez uniquement à la livraison.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, maxWidth: 960, margin: '0 auto' }}>
            {[
              {
                icon: 'tune',
                color: 'var(--color-primary)',
                bg: 'var(--color-primary-soft)',
                title: 'Prix libre',
                text: 'C\'est vous qui fixez le prix de votre envoi. Les chauffeurs vous proposent leurs meilleures offres, vous comparez et choisissez.',
              },
              {
                icon: 'compare_arrows',
                color: '#2563EB',
                bg: '#E7EEFC',
                title: 'Mise en concurrence',
                text: 'Plusieurs chauffeurs enchérissent sur votre annonce. Recevez jusqu\'à 5 offres et prenez la meilleure.',
              },
              {
                icon: 'verified_user',
                color: 'var(--green-700)',
                bg: 'var(--green-50)',
                title: 'Paiement sécurisé',
                text: 'Ne payez qu\'à la réception du colis. Votre argent est protégé jusqu\'à la confirmation de livraison par code PIN.',
              },
            ].map((item, i) => (
              <div key={item.title} style={{
                background: 'var(--surface-page)', border: '1px solid var(--border-subtle)',
                borderRadius: 20, padding: 32, textAlign: 'center', position: 'relative',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 16, background: item.bg, color: item.color, marginBottom: 20 }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 32 }}>{item.icon}</span>
                </div>
                <div style={{ position: 'absolute', top: 28, right: 28, width: 32, height: 32, borderRadius: 8, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 800, color: item.color }}>0{i + 1}</span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--text-strong)', margin: '0 0 10px' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: 14.5, color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 24px' }}>{item.text}</p>
                {i === 0 && (
                  <Button variant="primary" block size="lg" icon="arrow_forward"
                    onClick={() => navigate('/register')}
                    style={{ fontWeight: 700 }}>
                    Publier un colis
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA BANNER ===== */}
      <section style={{ padding: '0 clamp(16px, 4vw, 40px) clamp(56px, 7vw, 80px)' }}>
        <div style={{
          maxWidth: 1320, margin: '0 auto', background: 'var(--gradient-brand)', borderRadius: 24,
          padding: 'clamp(36px, 5vw, 56px) clamp(24px, 4vw, 56px)', color: '#fff', textAlign: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', right: -60, top: -60, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          <div style={{ position: 'absolute', left: -40, bottom: -80, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(28px, 4.5vw, 38px)', letterSpacing: '-0.03em', margin: '0 0 14px', position: 'relative' }}>
            Prêt à envoyer votre premier colis ?
          </h2>
          <p style={{ fontSize: 16, opacity: 0.85, margin: '0 auto 28px', maxWidth: 480, position: 'relative', lineHeight: 1.5 }}>
            Rejoignez des milliers d'utilisateurs qui font confiance à SendProColis pour leurs livraisons au Sénégal, en Afrique et à l'international.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', position: 'relative' }}>
            <Button variant="amber" size="lg" icon="add_box" onClick={() => navigate('/register')}
              style={{ fontSize: 15, padding: '14px 32px', borderRadius: 14, fontWeight: 800 }}>
              Créer un compte gratuit
            </Button>
            <Button variant="secondary" size="lg" icon="play_circle" onClick={() => navigate('/help')}
              style={{ fontSize: 15, padding: '14px 32px', borderRadius: 14, fontWeight: 700 }}>
              En savoir plus
            </Button>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer id="footer" style={{ background: 'var(--deep-800)', color: 'rgba(255,255,255,0.65)', padding: 'clamp(40px, 6vw, 64px) 0 24px' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(16px, 4vw, 40px)' }}>
          <div style={{ gap: 'clamp(24px, 4vw, 48px)' }}
            className="pc-landing-footer-grid">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, cursor: 'pointer' }} onClick={() => navigate('/')}>
                <span style={{ width: 40, height: 40, borderRadius: 10, background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                  <img src="/logo-procolis.png" alt="" style={{ width: 31, height: 31, objectFit: 'contain' }} />
                </span>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: '#fff' }}>
                  SEND<span style={{ color: 'var(--color-primary)' }}>PRO</span>COLIS
                </span>
              </div>
              <p style={{ fontSize: 13.5, lineHeight: 1.65, margin: '0 0 20px', maxWidth: 300 }}>
                La plateforme qui connecte expéditeurs et chauffeurs pour le transport de colis au Sénégal, partout en Afrique et à l'international.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {/* Téléphone */}
                <a
                  href="tel:+221765162796"
                  aria-label="Appeler SendProColis"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                >
                  <span
                    className="material-symbols-rounded"
                    style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)' }}
                  >
                    call
                  </span>
                </a>

                {/* E-mail */}
                <a
                  href="mailto:support-commercial@sendprocolis.com"
                  aria-label="Envoyer un e-mail"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                >
                  <span
                    className="material-symbols-rounded"
                    style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)' }}
                  >
                    mail
                  </span>
                </a>

                {/* Localisation */}
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Dakar%2C%20S%C3%A9n%C3%A9gal"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Voir notre localisation"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                >
                  <span
                    className="material-symbols-rounded"
                    style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)' }}
                  >
                    location_on
                  </span>
                </a>

                {/* Séparateur */}
                <span style={{ width: 1, height: 30, background: 'rgba(255,255,255,0.08)', alignSelf: 'center' }} />

                {/* Réseaux sociaux */}
                {SOCIAL_LINKS.map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Suivez-nous sur ${social.name}`}
                    title={social.name}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      textDecoration: 'none',
                      transition: 'all 0.25s ease',
                      color: 'rgba(255,255,255,0.5)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = social.color
                      e.currentTarget.style.color = '#fff'
                      e.currentTarget.style.transform = 'scale(1.08)'
                      e.currentTarget.style.boxShadow = `0 4px 12px ${social.color}40`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                      e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
                      e.currentTarget.style.transform = 'scale(1)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    {getSocialIcon(social.icon)}
                  </a>
                ))}
              </div>
            </div>
            <FooterCol title="À propos" links={[
              { label: 'À propos de SendProColis', to: '/a-propos' },
              { label: 'Comment ça marche', to: '/help' },
              { label: 'Contact', to: '/contact' },
            ]} />
            <FooterCol title="Légal" links={[
              { label: 'Mentions légales', to: '/mentions-legales' },
              { label: 'Confidentialité', to: '/confidentialite' },
              { label: 'CGU', to: '/cgu' },
              { label: 'Conditions de transport', to: '/conditions-transport' },
              { label: 'Politique de paiement', to: '/paiement' },
              { label: 'Remboursement', to: '/remboursement' },
            ]} />
            <FooterCol title="Support" links={[
              { label: "Centre d'aide", to: '/help' },
              { label: 'Réclamations', to: '/reclamations' },
              { label: 'Colis interdits', to: '/colis-interdits' },
            ]} />
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 24, marginTop: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, fontSize: 12.5 }}>
            <span>© {new Date().getFullYear()} SendProColis. Tous droits réservés.</span>
            <span>Dakar, Sénégal · support-commercial@sendprocolis.com</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FooterCol({ title, links }: { title: string; links: Array<{ label: string; to: string }> }) {
  const navigate = useNavigate()
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: '#fff', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5 }}>
        {links.map((l) => (
          <span key={l.label} style={{ cursor: 'pointer', transition: 'color 0.15s', color: 'rgba(255,255,255,0.55)' }}
            onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#fff'}
            onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.55)'}
            onClick={() => navigate(l.to)}>
            {l.label}
          </span>
        ))}
      </div>
    </div>
  )
}