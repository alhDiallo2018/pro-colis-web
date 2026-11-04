import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input } from '@/ds'
import { useAuthStore } from '@/store/auth'
import { homeForRole } from '@/routes/paths'
import { MarketingLayout } from './MarketingLayout'
import { StoreBadges } from './StoreBadges'

const STATS = [
  { value: '14 régions', label: 'au Sénégal & international', icon: 'public' },
  { value: '1 200+', label: 'chauffeurs vérifiés', icon: 'verified_user' },
  { value: '45 min', label: 'délai avant 1ʳᵉ offre', icon: 'timer', highlight: true },
  { value: '98,4 %', label: 'colis livrés à temps', icon: 'check_circle' },
] as const

const STEPS = [
  {
    icon: 'edit_note',
    tone: 'teal' as const,
    title: 'Déclarez votre colis',
    text: 'Trajet, destinataire, poids, prix. Photo et note vocale pour plus de détails.',
  },
  {
    icon: 'gavel',
    tone: 'indigo' as const,
    title: 'Comparez les offres',
    text: 'Les chauffeurs vérifiés enchérissent. Vous comparez prix, notes, délais.',
  },
  {
    icon: 'local_shipping',
    tone: 'green' as const,
    title: 'Suivez en temps réel',
    text: 'Tracking live, contact direct avec le chauffeur, confirmation par code PIN.',
  },
]

const PERKS = [
  { icon: 'verified', text: 'Chauffeurs vérifiés' },
  { icon: 'shield', text: 'Paiement sécurisé' },
  { icon: 'speed', text: 'Livraison express' },
  { icon: 'support_agent', text: 'Support 6j/7' },
]

const CORRIDORS = [
  { from: 'Dakar', to: 'Thiès', price: 'dès 2 500 FCFA', eta: '2 h' },
  { from: 'Dakar', to: 'Saint-Louis', price: 'dès 5 000 FCFA', eta: '4 h' },
  { from: 'Dakar', to: 'Kaolack', price: 'dès 4 000 FCFA', eta: '3 h' },
  { from: 'Thiès', to: 'Touba', price: 'dès 3 500 FCFA', eta: '2 h' },
  { from: 'Dakar', to: 'Ziguinchor', price: 'dès 9 000 FCFA', eta: '10 h' },
  { from: 'Dakar', to: 'Banjul', price: 'dès 12 000 FCFA', eta: '8 h' },
]

const PRICING_CARDS = [
  {
    icon: 'tune',
    tone: 'teal',
    title: 'Prix libre',
    text: 'Vous fixez le prix de votre envoi. Les chauffeurs proposent, vous comparez.',
  },
  {
    icon: 'compare_arrows',
    tone: 'indigo',
    title: 'Mise en concurrence',
    text: 'Jusqu\'à 5 offres sur une même annonce. Prenez la meilleure.',
  },
  {
    icon: 'verified_user',
    tone: 'green',
    title: 'Paiement sécurisé',
    text: 'Payez à la réception. Argent protégé jusqu\'à la confirmation PIN.',
  },
] as const

const CARD_TONE: Record<string, { bg: string; fg: string }> = {
  teal:   { bg: 'var(--teal-50)',   fg: 'var(--teal-700)' },
  indigo: { bg: '#E7EEFC',          fg: '#3949AB' },
  green:  { bg: 'var(--green-50)',  fg: 'var(--green-700)' },
  amber:  { bg: 'var(--amber-50)',  fg: 'var(--amber-600)' },
  rose:   { bg: 'var(--red-50)',    fg: 'var(--red-400)' },
}

export function LandingPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [tracking, setTracking] = useState('')

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault()
    const t = tracking.trim()
    if (t) navigate(`/track/${encodeURIComponent(t.toUpperCase())}`)
  }

  return (
    <MarketingLayout variant="landing" bare>
      {/* ===== HERO ===== */}
      <section className="mkt-landing-hero">
        <span className="mkt-landing-hero-shape mkt-landing-hero-shape--a" />
        <span className="mkt-landing-hero-shape mkt-landing-hero-shape--b" />
        <span className="mkt-landing-hero-shape mkt-landing-hero-shape--c" />
        <div className="mkt-landing-hero-inner">
          <div style={{ minWidth: 0 }}>
            <span className="mkt-landing-hero-badge">
              <span className="material-symbols-rounded" aria-hidden="true">bolt</span>
              Livraison interurbaine & internationale
            </span>
            <h1>
              Envoyez vos colis,<br />
              <em>payez à la livraison</em>
            </h1>
            <p className="mkt-landing-hero-lead">
              La plateforme qui connecte expéditeurs et chauffeurs vérifiés pour des livraisons rapides et
              sécurisées — au Sénégal, en Afrique et à l'international.
            </p>
            <div className="mkt-landing-hero-actions">
              <Button
                variant="amber"
                size="lg"
                icon="add_box"
                onClick={() => navigate(user ? '/new-shipment' : '/register')}
                style={{ fontWeight: 800 }}
              >
                Publier un colis
              </Button>
              <Button
                variant="secondary"
                size="lg"
                icon="local_shipping"
                onClick={() => navigate(user ? '/become-driver' : '/register')}
              >
                Devenir chauffeur
              </Button>
            </div>
            <div className="mkt-landing-hero-perks">
              {PERKS.map(p => (
                <span key={p.icon} className="mkt-landing-hero-perk">
                  <span className="material-symbols-rounded" aria-hidden="true">{p.icon}</span>
                  {p.text}
                </span>
              ))}
            </div>
          </div>

          <JourneyCard tracking={tracking} setTracking={setTracking} onTrack={handleTrack} />
        </div>
      </section>

      {/* ===== STATS STRIP — sits on top of hero bottom edge ===== */}
      <div className="mkt-stats-wrap">
        <div className="mkt-stats">
          {STATS.map(s => (
            <div key={s.label} className={`mkt-stats-item${'highlight' in s && s.highlight ? ' mkt-stats-item--highlight' : ''}`}>
              <span className="material-symbols-rounded" aria-hidden="true">{s.icon}</span>
              <div className="mkt-stats-value">{s.value}</div>
              <div className="mkt-stats-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="mkt-slab">
        <div className="mkt-slab-inner">
          <div className="mkt-slab-head">
            <span className="mkt-slab-eyebrow">Simple et rapide</span>
            <h2>En trois étapes, votre colis arrive à bon port</h2>
            <p className="mkt-slab-lead">
              Pas d'intermédiaire opaque : vous fixez votre prix et choisissez votre chauffeur.
            </p>
          </div>
          <div className="mkt-how-grid">
            {STEPS.map((s, i) => {
              const tone = CARD_TONE[s.tone]
              return (
                <article key={s.title} className="mkt-how-card">
                  <div className="mkt-how-card-icon" style={{ background: tone.bg, color: tone.fg }}>
                    <span className="material-symbols-rounded" aria-hidden="true">{s.icon}</span>
                  </div>
                  <div className="mkt-how-card-num" style={{ background: tone.bg, color: tone.fg }}>
                    0{i + 1}
                  </div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== CORRIDORS (Citymapper-style lines) ===== */}
      <section className="mkt-slab mkt-slab--sunken">
        <div className="mkt-slab-inner">
          <div className="mkt-slab-head">
            <span className="mkt-slab-eyebrow">Trajets populaires</span>
            <h2>Des corridors couverts chaque jour</h2>
            <p className="mkt-slab-lead">
              Plus de 50 corridors actifs au Sénégal et à l'international. Départs toutes les heures sur les axes principaux.
            </p>
          </div>
          <div className="mkt-corridors">
            {CORRIDORS.map((c, i) => (
              <button
                key={`${c.from}-${c.to}`}
                type="button"
                className="mkt-corridor"
                onClick={() => navigate(user ? '/new-shipment' : '/register')}
              >
                <span className={`mkt-corridor-line mkt-corridor-line--${i % 4}`} aria-hidden="true" />
                <div className="mkt-corridor-body">
                  <div className="mkt-corridor-route">
                    <span>{c.from}</span>
                    <span className="material-symbols-rounded" aria-hidden="true">arrow_right_alt</span>
                    <span>{c.to}</span>
                  </div>
                  <div className="mkt-corridor-meta">
                    <span><span className="material-symbols-rounded" aria-hidden="true">schedule</span>{c.eta}</span>
                    <span className="mkt-corridor-price">{c.price}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FOR DRIVERS ===== */}
      <section id="for-drivers" className="mkt-slab">
        <div className="mkt-slab-inner">
          <div className="mkt-drivers-grid">
            <div>
              <span className="mkt-slab-eyebrow mkt-slab-eyebrow--amber">Opportunité</span>
              <h2 style={{ marginTop: 12 }}>Gagnez plus avec votre véhicule</h2>
              <p className="mkt-slab-lead" style={{ marginTop: 10, textAlign: 'left' }}>
                Vous voyagez entre les villes ? Transportez des colis et rentabilisez vos trajets.
              </p>
              <div className="mkt-drivers-list">
                {[
                  { icon: 'schedule', text: 'Travaillez quand vous voulez' },
                  { icon: 'payments', text: 'Paiement sécurisé après livraison' },
                  { icon: 'stars', text: 'Points & visibilité à la clé' },
                ].map(li => (
                  <div key={li.icon} className="mkt-drivers-list-item">
                    <span className="material-symbols-rounded" aria-hidden="true">{li.icon}</span>
                    <span>{li.text}</span>
                  </div>
                ))}
              </div>
              <Button
                variant="amber"
                size="lg"
                icon="local_shipping"
                onClick={() => navigate(user ? '/become-driver' : '/register')}
              >
                Devenir chauffeur
              </Button>
            </div>
            <div className="mkt-drivers-sim">
              <h3>Simulation de revenus</h3>
              {[
                { from: 'Dakar', to: 'Thiès', price: 7000, trips: 3 },
                { from: 'Dakar', to: 'Saint-Louis', price: 12000, trips: 1 },
                { from: 'Thiès', to: 'Kaolack', price: 8500, trips: 2 },
              ].map(trip => (
                <div key={trip.from + trip.to} className="mkt-drivers-sim-row">
                  <span className="material-symbols-rounded" aria-hidden="true">sync_alt</span>
                  <div className="mkt-drivers-sim-body">
                    <div className="mkt-drivers-sim-route">{trip.from} → {trip.to}</div>
                    <div className="mkt-drivers-sim-sub">{trip.trips} colis disponibles</div>
                  </div>
                  <div className="mkt-drivers-sim-price">{trip.price.toLocaleString('fr-FR')} FCFA</div>
                </div>
              ))}
              <div className="mkt-drivers-sim-total">
                <span>Potentiel cette semaine</span>
                <strong>49 000 FCFA</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="mkt-slab mkt-slab--sunken">
        <div className="mkt-slab-inner">
          <div className="mkt-slab-head">
            <span className="mkt-slab-eyebrow">Fonctionnement</span>
            <h2>C'est vous qui fixez les règles</h2>
            <p className="mkt-slab-lead">
              Vous fixez librement le prix. Les chauffeurs vous font des offres compétitives. Payez à la livraison.
            </p>
          </div>
          <div className="mkt-how-grid" style={{ maxWidth: 960, margin: '0 auto' }}>
            {PRICING_CARDS.map((p, i) => {
              const tone = CARD_TONE[p.tone]
              return (
                <article key={p.title} className="mkt-how-card">
                  <div className="mkt-how-card-icon" style={{ background: tone.bg, color: tone.fg }}>
                    <span className="material-symbols-rounded" aria-hidden="true">{p.icon}</span>
                  </div>
                  <div className="mkt-how-card-num" style={{ background: tone.bg, color: tone.fg }}>0{i + 1}</div>
                  <h3>{p.title}</h3>
                  <p>{p.text}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== CTA BANNER ===== */}
      <section style={{ padding: 'clamp(16px, 4vw, 40px) clamp(16px, 4vw, 40px) clamp(56px, 7vw, 80px)' }}>
        <div className="mkt-cta">
          <h2>Prêt à envoyer votre premier colis ?</h2>
          <p>
            Rejoignez des milliers d'utilisateurs qui font confiance à SendProColis pour leurs livraisons.
          </p>
          <div className="mkt-cta-actions">
            <Button
              variant="amber"
              size="lg"
              icon="add_box"
              onClick={() => navigate(user ? homeForRole(user.role) : '/register')}
            >
              {user ? 'Accéder à mon espace' : 'Créer un compte gratuit'}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              icon="play_circle"
              onClick={() => navigate('/help')}
            >
              En savoir plus
            </Button>
          </div>
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
            <StoreBadges size="md" only="both" className="mkt-store-badges--on-dark" />
          </div>
        </div>
      </section>
    </MarketingLayout>
  )
}

function JourneyCard({
  tracking, setTracking, onTrack,
}: {
  tracking: string
  setTracking: (v: string) => void
  onTrack: (e: React.FormEvent) => void
}) {
  return (
    <div className="mkt-journey-card">
      <div className="mkt-journey-head">
        <div className="mkt-journey-head-icon">
          <span className="material-symbols-rounded" aria-hidden="true">qr_code_2</span>
        </div>
        <div>
          <h3>Suivez votre colis</h3>
          <p>Entrez votre numéro pour voir où il se trouve.</p>
        </div>
      </div>
      <form onSubmit={onTrack} className="mkt-journey-track-form">
        <Input
          icon="qr_code_2"
          mono
          placeholder="PC-XXXX-XXXX"
          value={tracking}
          onChange={e => setTracking(e.target.value)}
          aria-label="Numéro de suivi"
        />
        <Button type="submit" size="lg" iconTrailing="arrow_forward" disabled={!tracking.trim()}>
          Suivre
        </Button>
      </form>

      <div className="cm-route" style={{ padding: 0 }}>
        <div className="cm-route-rail">
          <div className="cm-route-node cm-route-node--filled"><div className="cm-route-node-dot" /></div>
          <div className="cm-route-spacer" />
          <div className="cm-route-node"><div className="cm-route-node-dot" /></div>
        </div>
        <div>
          <div className="cm-route-step">
            <div className="cm-route-step-label">Dakar · Sandaga</div>
            <div className="cm-route-step-sub">Pris en charge · <strong>09:14</strong></div>
          </div>
          <div className="cm-route-step">
            <div className="cm-route-step-label">Saint-Louis · Guet-Ndar</div>
            <div className="cm-route-step-sub">Arrivée estimée · <strong>14:30</strong></div>
          </div>
        </div>
      </div>
    </div>
  )
}
