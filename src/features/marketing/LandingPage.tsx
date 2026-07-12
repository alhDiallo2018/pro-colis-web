import { useNavigate } from 'react-router-dom'
import { Button, ParcelCard, StatusBadge } from '@/ds'

const NAV_ITEMS = [
  { label: 'Comment ça marche', action: 'scroll', target: 'how-it-works' },
  { label: 'Tarifs', action: 'navigate', to: '/register' },
  { label: 'Devenir chauffeur', action: 'navigate', to: '/register' },
  { label: 'Aide', action: 'scroll', target: 'footer' },
] as const

const STATS = [
  { value: '14 régions', label: 'desservies au Sénégal', accent: false },
  { value: '1 200+', label: 'chauffeurs vérifiés', accent: false },
  { value: '45 min', label: 'délai moyen avant 1ʳᵉ offre', accent: true },
  { value: '98,4 %', label: 'colis livrés à temps', accent: false },
]

const STEPS = [
  {
    n: '01',
    icon: 'add_box',
    bg: 'var(--color-primary-soft)',
    fg: 'var(--color-primary)',
    title: 'Déclarez le colis',
    text: 'Trajet, destinataire, poids et prix souhaité. Ajoutez l’option express ou l’assurance.',
  },
  {
    n: '02',
    icon: 'sell',
    bg: '#E7EEFC',
    fg: '#2563EB',
    title: 'Recevez des offres',
    text: 'Les chauffeurs disponibles sur votre trajet enchérissent — prix, note vocale, message. Vous acceptez la meilleure.',
  },
  {
    n: '03',
    icon: 'local_shipping',
    bg: 'var(--green-50)',
    fg: 'var(--green-700)',
    title: 'Suivez la livraison',
    text: 'Statuts en temps réel, contact direct du chauffeur et preuve de livraison à l’arrivée.',
  },
]

export function LandingPage() {
  const navigate = useNavigate()

  const handleNav = (item: (typeof NAV_ITEMS)[number]) => {
    if (item.action === 'scroll') {
      document.getElementById(item.target)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate(item.to)
    }
  }

  return (
    <div style={{ background: 'var(--surface-card)', fontFamily: 'var(--font-body)' }}>
      {/* Top nav */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          height: 72,
          padding: '0 clamp(12px, 4vw, 40px)',
          borderBottom: '1px solid var(--border-subtle)',
          maxWidth: 1320,
          margin: '0 auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 'none', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <img src="/logo-procolis.png" alt="" style={{ width: 'clamp(28px, 7vw, 34px)', height: 'clamp(28px, 7vw, 34px)', objectFit: 'contain' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(16px, 4.5vw, 20px)', letterSpacing: '-0.01em', color: 'var(--slate-900)' }}>
            PRO<span style={{ color: 'var(--amber-400)' }}>COLIS</span>
          </span>
        </div>
        <div className="pc-landing-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 26, marginLeft: 18 }}>
          {NAV_ITEMS.map((item) => (
            <span key={item.label} style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--text-body)', cursor: 'pointer' }} onClick={() => handleNav(item)}>
              {item.label}
            </span>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="pc-hide-xs">
            <Button variant="ghost" onClick={() => navigate('/login')}>
              Se connecter
            </Button>
          </span>
          <Button icon="arrow_forward" onClick={() => navigate('/register')}>
            Créer un compte
          </Button>
        </div>
      </div>

      {/* Hero */}
      <div style={{ position: 'relative', background: 'var(--gradient-brand)', color: '#fff', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -80, top: -60, width: 420, height: 420, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', right: 120, bottom: -120, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div
          style={{
            display: 'flex',
            gap: 48,
            alignItems: 'center',
            position: 'relative',
            maxWidth: 1320,
            margin: '0 auto',
            padding: 'clamp(40px, 6vw, 64px) clamp(16px, 4vw, 40px) clamp(48px, 7vw, 72px)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: 260, maxWidth: 560 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '6px 13px',
                background: 'rgba(255,255,255,0.16)',
                borderRadius: 'var(--radius-pill)',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: 22,
              }}
            >
              <span style={{ fontWeight: 800, letterSpacing: '-1px', color: 'var(--amber-300)' }}>»</span> Livraison interurbaine
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(34px, 6vw, 52px)', lineHeight: 1.05, letterSpacing: '-0.025em', margin: '0 0 18px' }}>
              Vos colis,
              <br />
              de ville en ville.
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.55, opacity: 0.92, margin: '0 0 30px', maxWidth: 480 }}>
              Déclarez un colis, fixez votre trajet et votre prix, publiez-le en annonce et laissez nos chauffeurs vérifiés vous faire
              leurs meilleures offres. Suivi en temps réel jusqu’à la livraison.
            </p>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              <Button variant="amber" size="lg" icon="add_box" onClick={() => navigate('/register')}>
                Envoyer un colis
              </Button>
              <Button variant="secondary" size="lg" icon="local_shipping" onClick={() => navigate('/register')}>
                Devenir chauffeur
              </Button>
            </div>
          </div>

          {/* Tracking card */}
          <div
            style={{
              width: 'min(380px, 100%)',
              flex: 'none',
              background: 'var(--surface-card)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 24px 50px rgba(0,0,0,0.22)',
              padding: 24,
              color: 'var(--text-body)',
            }}
          >
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: 'var(--text-strong)', marginBottom: 4 }}>
              Suivez votre colis
            </div>
            <div style={{ fontSize: 13.5, color: 'var(--text-muted)', marginBottom: 16 }}>Entrez votre numéro de suivi.</div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                height: 50,
                padding: '0 14px',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 14,
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 20, color: 'var(--text-faint)' }}>
                qr_code_2
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 15, color: 'var(--text-strong)', letterSpacing: '0.02em' }}>
                PC-7F3K-2291
              </span>
            </div>
            <Button block size="lg" iconTrailing="arrow_forward" onClick={() => navigate('/login')}>
              Suivre
            </Button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 38,
                  height: 38,
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--green-50)',
                  color: 'var(--green-700)',
                }}
              >
                <span className="material-symbols-rounded fill" style={{ fontSize: 21 }}>
                  local_shipping
                </span>
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5, color: 'var(--text-strong)' }}>Dakar → Thiès</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>En transit · arrive dans ~4 h</div>
              </div>
              <StatusBadge status="transit" size="sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats band */}
      <div style={{ background: 'var(--slate-900)' }}>
        <div className="pc-landing-stats" style={{ maxWidth: 1320, margin: '0 auto' }}>
          {STATS.map((s, i) => (
            <div key={s.label} style={{ padding: 'clamp(20px, 4vw, 30px) clamp(18px, 4vw, 40px)', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: s.accent ? 'var(--amber-400)' : '#fff' }}>
                {s.value}
              </div>
              <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div id="how-it-works" style={{ maxWidth: 1320, margin: '0 auto', padding: 'clamp(44px, 6vw, 64px) clamp(16px, 4vw, 40px) clamp(40px, 5vw, 56px)' }}>
        <div style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto 44px' }}>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 12,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--color-primary)',
              marginBottom: 10,
            }}
          >
            Comment ça marche
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(26px, 5vw, 34px)', letterSpacing: '-0.02em', color: 'var(--text-strong)', margin: '0 0 12px' }}>
            Trois étapes, d’un quai à l’autre
          </h2>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', margin: 0, lineHeight: 1.55 }}>
            Pas d’intermédiaire opaque : vous gardez la main sur le prix et le chauffeur.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {STEPS.map((s) => (
            <div key={s.n} style={{ background: 'var(--surface-page)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 28 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 54,
                  height: 54,
                  borderRadius: 'var(--radius-md)',
                  background: s.bg,
                  color: s.fg,
                  marginBottom: 18,
                }}
              >
                <span className="material-symbols-rounded fill" style={{ fontSize: 28 }}>
                  {s.icon}
                </span>
              </span>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-faint)', fontWeight: 600, marginBottom: 4 }}>
                ÉTAPE {s.n}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--text-strong)', marginBottom: 8 }}>
                {s.title}
              </div>
              <p style={{ fontSize: 14.5, color: 'var(--text-muted)', lineHeight: 1.55, margin: 0 }}>{s.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Express callout */}
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(16px, 4vw, 40px) clamp(44px, 6vw, 64px)' }}>
        <div
          style={{
            background: 'var(--slate-900)',
            borderRadius: 'var(--radius-xl)',
            padding: 'clamp(28px, 5vw, 44px) clamp(22px, 4vw, 48px)',
            display: 'flex',
            alignItems: 'center',
            gap: 40,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: 260 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                color: 'var(--red-300)',
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: 13,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: 14,
              }}
            >
              <span style={{ fontSize: 22, letterSpacing: '-2px' }}>»»</span> Option express
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(24px, 5vw, 30px)', letterSpacing: '-0.02em', color: '#fff', margin: '0 0 12px', lineHeight: 1.15 }}>
              Un colis urgent ? Priorité haute, départ immédiat.
            </h2>
            <p style={{ fontSize: 15.5, color: 'rgba(255,255,255,0.7)', margin: '0 0 24px', maxWidth: 520, lineHeight: 1.55 }}>
              Votre annonce passe en tête des annonces et n’est proposée qu’aux chauffeurs déjà sur la route. Supplément à partir de 2 000 FCFA.
            </p>
            <Button variant="amber" size="lg" icon="bolt" onClick={() => navigate('/register')}>
              Envoyer en express
            </Button>
          </div>
          <div style={{ flex: 'none', width: 'min(300px, 100%)' }}>
            <ParcelCard
              parcel={{
                tracking: 'PC-5T8R-1190',
                from: 'Dakar',
                to: 'Thiès',
                status: 'pending',
                price: '14 500 FCFA',
                weight: '6 kg',
                type: 'Documents',
                express: true,
              }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div id="footer" style={{ background: 'var(--deep-800)', color: 'rgba(255,255,255,0.7)' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: 'clamp(28px, 5vw, 40px)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 40, flexWrap: 'wrap' }}>
          <div style={{ maxWidth: 300 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, cursor: 'pointer' }} onClick={() => navigate('/')}>
              <img src="/logo-procolis.png" alt="" style={{ width: 30, height: 30, objectFit: 'contain' }} />
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#fff' }}>
                PRO<span style={{ color: 'var(--amber-400)' }}>COLIS</span>
              </span>
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>
              La plateforme qui connecte expéditeurs et chauffeurs pour le transport de colis entre les villes du Sénégal.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 64, flexWrap: 'wrap' }}>
            <FooterCol title="Produit" links={['Envoyer un colis', 'Suivre un colis', 'Tarifs']} />
            <FooterCol title="Chauffeurs" links={['Devenir chauffeur', 'Zones partenaires', 'Annonces']} />
            <FooterCol title="Société" links={['À propos', 'Aide & support', 'Conditions']} />
          </div>
        </div>
      </div>
    </div>
  )
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: '#fff', marginBottom: 12 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: 13.5 }}>
        {links.map((l) => (
          <span key={l} style={{ cursor: 'pointer' }}>
            {l}
          </span>
        ))}
      </div>
    </div>
  )
}
