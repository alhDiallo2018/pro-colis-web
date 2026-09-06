import { useState } from 'react'
import { Button, Input, Select, Textarea, Toast } from '@/ds'
import type { ToastTone } from '@/ds'
import { MarketingHeader } from './MarketingHeader'
import { buildSupportMailto, sendSupportMessage, checkSupportRateLimit, recordSupportSend, formatWait, SUPPORT_EMAIL } from '@/lib/api/support'
import { useAuthStore } from '@/store/auth'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const RECLAMATION_TYPES = [
  'Retard de livraison',
  'Colis endommagé',
  'Colis perdu',
  'Problème de paiement',
  'Comportement inapproprié',
  'Autre',
]

interface ReclamationErrors {
  name?: string
  email?: string
  type?: string
  description?: string
}

const CONTACT_INFO = {
  email: 'support-commercial@sendprocolis.com',
  phone: '+221 76 516 27 96',
  address: 'Dakar, Sénégal'
}

export function ReclamationsPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [tracking, setTracking] = useState('')
  const [type, setType] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<ReclamationErrors>({})
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState<{ tone: ToastTone; message: string } | null>(null)

  const validate = (): boolean => {
    const next: ReclamationErrors = {}
    if (!name.trim()) next.name = 'Veuillez indiquer votre nom.'
    if (!email.trim()) next.email = 'Veuillez indiquer votre email.'
    else if (!EMAIL_RE.test(email.trim())) next.email = 'Adresse email invalide.'
    if (!type) next.type = 'Veuillez choisir un type de réclamation.'
    if (!description.trim()) next.description = 'Veuillez décrire le problème rencontré.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFeedback(null)
    if (!validate()) return
    const limit = checkSupportRateLimit()
    if (!limit.allowed) {
      setFeedback({
        tone: 'warning',
        message: `Pour éviter les abus, l'envoi est limité. Veuillez patienter ${formatWait(limit.waitSeconds)} avant de renvoyer une réclamation.`,
      })
      return
    }
    setSending(true)
    const trackingPart = tracking.trim() ? ` — ${tracking.trim().toUpperCase()}` : ''
    const fullSubject = `[Réclamation] ${type}${trackingPart}`
    const fullMessage = [
      `Nom : ${name.trim()}`,
      `Email : ${email.trim()}`,
      `Type : ${type}`,
      tracking.trim() ? `Numéro de suivi : ${tracking.trim().toUpperCase()}` : null,
      '',
      description.trim(),
    ]
        .filter((l) => l !== null)
        .join('\n')
    const payload = { subject: fullSubject, message: fullMessage, name: name.trim(), email: email.trim() }

    if (!accessToken) {
      window.location.href = buildSupportMailto(payload)
      setFeedback({ tone: 'warning', message: `Votre application email va s'ouvrir pour envoyer la réclamation à ${SUPPORT_EMAIL}.` })
      setSending(false)
      return
    }

    try {
      await sendSupportMessage(payload)
      recordSupportSend()
      setFeedback({ tone: 'success', message: 'Réclamation envoyée ! Un accusé de réception vous sera adressé sous 48h ouvrées.' })
      setName('')
      setEmail('')
      setTracking('')
      setType('')
      setDescription('')
    } catch {
      window.location.href = buildSupportMailto(payload)
      setFeedback({
        tone: 'warning',
        message: `L'API est indisponible : votre application email va s'ouvrir pour écrire à ${SUPPORT_EMAIL}.`,
      })
    } finally {
      setSending(false)
    }
  }

  return (
      <div style={{
        maxWidth: 900,
        margin: '0 auto',
        padding: '40px 20px 60px',
        fontFamily: 'var(--font-body)',
        color: 'var(--text-body)',
        lineHeight: 1.7
      }}>
        <MarketingHeader />

        {/* En-tête */}
        <div style={{
          textAlign: 'center',
          marginBottom: 48,
          paddingBottom: 32,
          borderBottom: '2px solid var(--border-subtle)'
        }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 'clamp(28px, 4vw, 36px)',
            color: 'var(--text-strong)',
            marginBottom: 8
          }}>
            RÉCLAMATIONS
          </h1>
          <p style={{
            fontSize: 16,
            color: 'var(--text-muted)',
            margin: 0
          }}>
            SendProColis — Nous sommes à votre écoute
          </p>
          <p style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            marginTop: 8,
            fontWeight: 500
          }}>
            Dernière mise à jour : 17 juillet 2026
          </p>
        </div>

        {/* Avertissement */}
        <div style={{
          background: 'var(--amber-50)',
          borderRadius: 16,
          padding: 24,
          marginBottom: 40,
          border: '1px solid var(--amber-200)',
          borderLeft: '4px solid var(--amber-500)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 28 }}>📋</span>
            <div>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 16,
                color: 'var(--amber-700)',
                margin: '0 0 4px 0'
              }}>
                Besoin d'aide ?
              </h3>
              <p style={{
                margin: 0,
                color: 'var(--amber-600)',
                fontSize: 14
              }}>
                Nous traitons toutes les réclamations avec sérieux. Fournissez-nous un maximum d'informations
                pour un traitement rapide.
              </p>
            </div>
          </div>
        </div>

        {/* Section 1 : Comment déposer une réclamation */}
        <Section title="1. Comment déposer une réclamation">
          <p>
            Vous pouvez déposer une réclamation via le formulaire ci-dessous ou en nous écrivant à l'adresse suivante :{' '}
            <EmailLink email={CONTACT_INFO.email} />.
          </p>
          <p style={{ marginTop: 8 }}>
            Nous vous recommandons de fournir le maximum d'informations pour nous permettre de traiter votre
            demande dans les meilleurs délais.
          </p>
        </Section>

        {/* Section 2 : Informations à fournir */}
        <Section title="2. Informations à fournir">
          <p>
            Afin de faciliter le traitement de votre réclamation, merci de fournir les informations suivantes :
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
            marginTop: 16
          }}>
            {[
              { icon: '🔢', label: 'Numéro de suivi', desc: 'exemple : PC-7F3K-2291' },
              { icon: '📅', label: 'Date et heure', desc: 'de l\'expédition' },
              { icon: '📝', label: 'Description détaillée', desc: 'du problème rencontré' },
              { icon: '📸', label: 'Photos', desc: 'du colis si endommagé' },
              { icon: '📇', label: 'Coordonnées', desc: 'nom, téléphone, email' }
            ].map((item, index) => (
                <div key={index} style={{
                  padding: 14,
                  background: 'var(--surface-page)',
                  borderRadius: 12,
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{item.icon}</div>
                  <div style={{
                    fontWeight: 700,
                    fontSize: 14,
                    color: 'var(--text-strong)'
                  }}>{item.label}</div>
                  <div style={{
                    fontSize: 12.5,
                    color: 'var(--text-muted)',
                    marginTop: 2
                  }}>{item.desc}</div>
                </div>
            ))}
          </div>
        </Section>

        {/* Section 3 : Formulaire */}
        <Section title="3. Formulaire de réclamation">
          <form onSubmit={onSubmit} noValidate style={{
            marginTop: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            maxWidth: 560
          }}>
            <Input
                label="Nom complet"
                icon="person"
                placeholder="Votre nom"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
                autoComplete="name"
            />
            <Input
                label="Email"
                icon="mail"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                autoComplete="email"
            />
            <Input
                label="Numéro de suivi (optionnel)"
                icon="qr_code_2"
                mono
                placeholder="PC-XXXX-XXXX"
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
            />
            <Select
                label="Type de réclamation"
                icon="report"
                placeholder="Choisir un type"
                options={RECLAMATION_TYPES}
                value={type}
                onChange={(e) => setType(e.target.value)}
                error={errors.type}
            />
            <Textarea
                label="Description du problème"
                placeholder="Décrivez le problème rencontré (dates, lieux, montants...)"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                error={errors.description}
            />
            {feedback && (
                <Toast tone={feedback.tone} message={feedback.message} onClose={() => setFeedback(null)} />
            )}
            <div>
              <Button
                  type="submit"
                  variant="primary"
                  iconTrailing="send"
                  loading={sending}
                  size="lg"
              >
                Envoyer la réclamation
              </Button>
            </div>
          </form>
        </Section>

        {/* Section 4 : Délais de traitement */}
        <Section title="4. Délais de traitement">
          <p>
            Notre équipe s'engage à traiter votre réclamation dans les meilleurs délais :
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
            marginTop: 16
          }}>
            {[
              { icon: '📩', label: 'Accusé de réception', desc: 'sous 48 heures ouvrées' },
              { icon: '🔍', label: 'Analyse et résolution', desc: 'sous 7 jours ouvrés' },
              { icon: '⏳', label: 'Cas complexes', desc: 'délai supplémentaire possible, vous serez informé' }
            ].map((item, index) => (
                <div key={index} style={{
                  padding: 14,
                  background: 'var(--surface-page)',
                  borderRadius: 12,
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{item.icon}</div>
                  <div style={{
                    fontWeight: 700,
                    fontSize: 14,
                    color: 'var(--text-strong)'
                  }}>{item.label}</div>
                  <div style={{
                    fontSize: 12.5,
                    color: 'var(--text-muted)',
                    marginTop: 2
                  }}>{item.desc}</div>
                </div>
            ))}
          </div>
        </Section>

        {/* Section 5 : Types de réclamations */}
        <Section title="5. Types de réclamations traitées">
          <p>
            Nous traitons les types de réclamations suivants :
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 12,
            marginTop: 16
          }}>
            {[
              { icon: '⏰', label: 'Retard de livraison', desc: 'livraison non effectuée dans les délais convenus' },
              { icon: '📦', label: 'Colis endommagé', desc: 'dommages constatés à la livraison (photos requises)' },
              { icon: '❓', label: 'Colis perdu', desc: 'colis jamais livré, sans justification du chauffeur' },
              { icon: '💳', label: 'Problème de paiement', desc: 'débit non autorisé, montant incorrect, non-versement' },
              { icon: '🚫', label: 'Comportement inapproprié', desc: 'comportement abusif ou non professionnel' }
            ].map((item, index) => (
                <div key={index} style={{
                  padding: 14,
                  background: 'var(--surface-page)',
                  borderRadius: 12,
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{item.icon}</div>
                  <div style={{
                    fontWeight: 700,
                    fontSize: 14,
                    color: 'var(--text-strong)'
                  }}>{item.label}</div>
                  <div style={{
                    fontSize: 12.5,
                    color: 'var(--text-muted)',
                    marginTop: 2
                  }}>{item.desc}</div>
                </div>
            ))}
          </div>
        </Section>

        {/* Section 6 : Escalade */}
        <Section title="6. Escalade">
          <div style={{
            padding: 20,
            background: 'var(--surface-page)',
            borderRadius: 12,
            border: '1px solid var(--border-subtle)'
          }}>
            <p style={{ margin: '0 0 12px 0' }}>
              Si vous n'êtes pas satisfait de la réponse apportée à votre réclamation, vous pouvez demander une
              escalade de votre dossier.
            </p>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>📈</span>
                <span>
                <strong>Escalade :</strong> examen par un responsable hiérarchique
              </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>⏱️</span>
                <span>
                <strong>Délai :</strong> réponse définitive sous 14 jours ouvrés
              </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>⚖️</span>
                <span>
                <strong>Dernier recours :</strong> saisie des autorités compétentes ou des juridictions de Dakar
              </span>
              </div>
            </div>
          </div>
        </Section>

        {/* Footer */}
        <FooterSection />
      </div>
  )
}

// ==================== COMPOSANTS ====================

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
      <div style={{ marginTop: 32 }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 'clamp(18px, 2vw, 21px)',
          color: 'var(--text-strong)',
          margin: '0 0 12px 0',
          paddingBottom: 8,
          borderBottom: '2px solid var(--color-primary-soft)'
        }}>
          {title}
        </h2>
        {children}
      </div>
  )
}

function EmailLink({ email }: { email: string }) {
  return (
      <a href={`mailto:${email}`} style={{ color: 'var(--color-primary)' }}>
        {email}
      </a>
  )
}

function FooterSection() {
  return (
      <div style={{
        marginTop: 48,
        paddingTop: 24,
        borderTop: '1px solid var(--border-subtle)',
        textAlign: 'center',
        fontSize: 13,
        color: 'var(--text-muted)'
      }}>
        <p style={{ margin: 0 }}>
          © {new Date().getFullYear()} SendProColis SARL — Tous droits réservés
        </p>
        <p style={{ margin: '4px 0 0' }}>
          Dakar, Sénégal · <EmailLink email={CONTACT_INFO.email} />
        </p>
      </div>
  )
}
