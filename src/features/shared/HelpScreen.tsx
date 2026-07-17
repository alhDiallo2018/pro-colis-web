import { useState } from 'react'
import { Card } from '@/ds'

interface FaqItem {
  question: string
  answer: string
}

const FAQS: FaqItem[] = [
  {
    question: 'Comment fonctionne le libre service ?',
    answer: 'Vous publiez votre colis, des chauffeurs vérifiés font des offres, vous acceptez celle qui vous convient.',
  },
  {
    question: 'Que se passe-t-il à la livraison ?',
    answer: 'Le destinataire communique un code PIN au chauffeur pour confirmer la remise du colis.',
  },
  {
    question: 'Comment sont calculés les points ?',
    answer: 'Chaque colis livré crédite des points utilisables en réductions sur vos prochains envois.',
  },
  {
    question: 'Comment payer mes envois ?',
    answer: 'Vous pouvez payer par carte, Orange Money, Wave, Free Money ou en espèces. Le paiement est débité une fois le colis livré.',
  },
  {
    question: 'Comment suivre mon colis ?',
    answer: 'Connectez-vous à votre compte et allez dans "Suivi". Entrez votre numéro de suivi pour voir les statuts en temps réel.',
  },
  {
    question: 'Puis-je annuler un colis ?',
    answer: 'Oui, vous pouvez annuler un colis tant qu\'il n\'a pas encore été confirmé par un chauffeur. Au-delà, contactez notre support.',
  },
  {
    question: 'Comment devenir chauffeur ?',
    answer: 'Créez un compte en sélectionnant le rôle "Conduire", remplissez votre profil, ajoutez vos documents et votre véhicule. Notre équipe vérifiera vos informations.',
  },
  {
    question: 'Quels documents sont nécessaires pour les chauffeurs ?',
    answer: 'Permis de conduire, carte grise du véhicule, assurance, et pièce d\'identité (CNI ou passeport).',
  },
]

const TOPICS = [
  { icon: 'inventory_2', title: "Créer et envoyer un colis" },
  { icon: 'sell', title: 'Libre service et offres' },
  { icon: 'qr_code_2', title: 'Suivi et livraison' },
  { icon: 'account_balance_wallet', title: 'Points et paiements' },
  { icon: 'shield', title: 'Sécurité et litiges' },
  { icon: 'person', title: 'Mon compte' },
]

function FaqTile({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          padding: '14px 16px',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: 'var(--font-body)',
        }}
      >
        <span style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text-strong)' }}>
          {item.question}
        </span>
        <span
          className="material-symbols-rounded"
          style={{
            fontSize: 20,
            color: 'var(--text-muted)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.18s ease',
          }}
        >
          expand_more
        </span>
      </button>
      {open && (
        <div style={{ padding: '0 16px 14px', fontSize: 13.5, color: 'var(--slate-600)', lineHeight: 1.55 }}>
          {item.answer}
        </div>
      )}
    </div>
  )
}

export function HelpScreen() {
  const [query, setQuery] = useState('')

  const visibleFaqs = FAQS.filter(
    (f) =>
      f.question.toLowerCase().includes(query.toLowerCase()) ||
      f.answer.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px 64px' }}>
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            height: 48,
            padding: '0 14px',
            background: 'var(--surface-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            maxWidth: 440,
          }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 20, color: 'var(--text-faint)' }}>
            search
          </span>
          <input
            placeholder="Rechercher une question..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text-strong)',
            }}
          />
        </div>
      </div>

      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'var(--text-strong)', margin: '0 0 12px' }}>
        Catégories
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        {TOPICS.map((t) => (
          <Card key={t.title} padding="md">
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--teal-50)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10,
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 22, color: 'var(--color-primary)' }}>
                {t.icon}
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5, color: 'var(--text-strong)', lineHeight: 1.25 }}>
              {t.title}
            </div>
          </Card>
        ))}
      </div>

      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'var(--text-strong)', margin: '0 0 12px' }}>
        Questions fréquentes
      </h3>
      <Card padding="none" style={{ overflow: 'hidden' }}>
        {visibleFaqs.length === 0 ? (
          <div style={{ padding: 18, textAlign: 'center', color: 'var(--text-muted)' }}>
            Aucun résultat pour cette recherche.
          </div>
        ) : (
          visibleFaqs.map((f, i) => (
            <div key={f.question}>
              {i > 0 && <div style={{ height: 1, background: 'var(--border-subtle)' }} />}
              <FaqTile item={f} />
            </div>
          ))
        )}
      </Card>

      <Card
        padding="lg"
        style={{
          marginTop: 24,
          background: 'var(--teal-50)',
          border: '1px solid var(--teal-100)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-md)',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 28, color: 'var(--color-primary)' }}>
              support_agent
            </span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-strong)' }}>
              Besoin d'aide ?
            </div>
            <div style={{ fontSize: 13, color: 'var(--slate-600)', marginTop: 2 }}>
              Notre équipe répond 7j/7
            </div>
          </div>
          <div>
            <a href="mailto:support@sendprocolis.com" style={{ textDecoration: 'none', color: 'var(--color-primary)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>
              Contacter
            </a>
          </div>
        </div>
      </Card>
    </div>
  )
}
