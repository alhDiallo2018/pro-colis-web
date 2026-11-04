import { useState } from 'react'
import { Button, Input, Select, Textarea, Toast } from '@/ds'
import type { ToastTone } from '@/ds'
import { MarketingLayout, MarketingHero, MarketingSection, MarketingAlert, MarketingFeatureGrid } from './MarketingLayout'
import type { MarketingFeatureItem } from './MarketingLayout'
import { useSupportContact } from '@/lib/usePublicConfig'
import { buildSupportMailto, sendSupportMessage, checkSupportRateLimit, recordSupportSend, formatWait } from '@/lib/api/support'
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

const INFO_REQUIRED: MarketingFeatureItem[] = [
  { icon: 'qr_code_2', tone: 'teal', title: 'Numéro de suivi', text: 'exemple : PC-7F3K-2291' },
  { icon: 'event', tone: 'teal', title: 'Date et heure', text: 'de l\'expédition' },
  { icon: 'description', tone: 'teal', title: 'Description détaillée', text: 'du problème rencontré' },
  { icon: 'photo_camera', tone: 'amber', title: 'Photos', text: 'du colis si endommagé' },
  { icon: 'contact_page', tone: 'teal', title: 'Coordonnées', text: 'nom, téléphone, email' }
]

const PROCESSING_DELAYS: MarketingFeatureItem[] = [
  { icon: 'mark_email_read', tone: 'teal', title: 'Accusé de réception', text: 'sous 48 heures ouvrées' },
  { icon: 'search', tone: 'teal', title: 'Analyse et résolution', text: 'sous 7 jours ouvrés' },
  { icon: 'hourglass_empty', tone: 'amber', title: 'Cas complexes', text: 'délai supplémentaire possible, vous serez informé' }
]

const RECLAMATION_CATEGORIES: MarketingFeatureItem[] = [
  { icon: 'schedule', tone: 'amber', title: 'Retard de livraison', text: 'livraison non effectuée dans les délais convenus' },
  { icon: 'package_2', tone: 'rose', title: 'Colis endommagé', text: 'dommages constatés à la livraison (photos requises)' },
  { icon: 'help', tone: 'rose', title: 'Colis perdu', text: 'colis jamais livré, sans justification du chauffeur' },
  { icon: 'credit_card', tone: 'rose', title: 'Problème de paiement', text: 'débit non autorisé, montant incorrect, non-versement' },
  { icon: 'block', tone: 'rose', title: 'Comportement inapproprié', text: 'comportement abusif ou non professionnel' }
]

interface ReclamationErrors {
  name?: string
  email?: string
  type?: string
  description?: string
}

export function ReclamationsPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const support = useSupportContact()
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
      window.location.href = buildSupportMailto(payload, support.email)
      setFeedback({ tone: 'warning', message: `Votre application email va s'ouvrir pour envoyer la réclamation à ${support.email}.` })
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
      window.location.href = buildSupportMailto(payload, support.email)
      setFeedback({
        tone: 'warning',
        message: `L'API est indisponible : votre application email va s'ouvrir pour écrire à ${support.email}.`,
      })
    } finally {
      setSending(false)
    }
  }

  return (
      <MarketingLayout>
        <MarketingHero
            eyebrow="Support"
            eyebrowIcon="report"
            title={<>RÉCLAMATIONS</>}
            lead="SendProColis — Nous sommes à votre écoute"
            updated="17 juillet 2026"
        />
        <div className="mkt-sections">
          <MarketingAlert tone="amber" title="Besoin d'aide ?">
            Nous traitons toutes les réclamations avec sérieux. Fournissez-nous un maximum d'informations pour un traitement rapide.
          </MarketingAlert>

          <MarketingSection title="1. Comment déposer une réclamation" icon="report" iconTone="rose">
            <p>
              Vous pouvez déposer une réclamation via le formulaire ci-dessous ou en nous écrivant à l'adresse suivante :{' '}
              <EmailLink email={support.email} />.
            </p>
            <p>
              Nous vous recommandons de fournir le maximum d'informations pour nous permettre de traiter votre
              demande dans les meilleurs délais.
            </p>
          </MarketingSection>

          <MarketingSection title="2. Informations à fournir" icon="description" iconTone="teal">
            <p>Afin de faciliter le traitement de votre réclamation, merci de fournir les informations suivantes :</p>
            <MarketingFeatureGrid items={INFO_REQUIRED} />
          </MarketingSection>

          <MarketingSection title="3. Formulaire de réclamation" icon="edit_note" iconTone="indigo">
            <form onSubmit={onSubmit} noValidate className="mkt-form-grid" style={{ marginTop: 16 }}>
              <div className="mkt-form-field">
                <Input
                    label="Nom complet"
                    icon="person"
                    placeholder="Votre nom"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    error={errors.name}
                    autoComplete="name"
                />
              </div>
              <div className="mkt-form-field">
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
              </div>
              <div className="mkt-form-field">
                <Input
                    label="Numéro de suivi (optionnel)"
                    icon="qr_code_2"
                    mono
                    placeholder="PC-XXXX-XXXX"
                    value={tracking}
                    onChange={(e) => setTracking(e.target.value)}
                />
              </div>
              <div className="mkt-form-field">
                <Select
                    label="Type de réclamation"
                    icon="report"
                    placeholder="Choisir un type"
                    options={RECLAMATION_TYPES}
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    error={errors.type}
                />
              </div>
              <div className="mkt-form-field mkt-form-field--full">
                <Textarea
                    label="Description du problème"
                    placeholder="Décrivez le problème rencontré (dates, lieux, montants...)"
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    error={errors.description}
                />
              </div>
              {feedback && (
                  <div className="mkt-form-field mkt-form-field--full">
                    <Toast tone={feedback.tone} message={feedback.message} onClose={() => setFeedback(null)} />
                  </div>
              )}
              <div className="mkt-form-field mkt-form-field--full mkt-form-row">
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
          </MarketingSection>

          <MarketingSection title="4. Délais de traitement" icon="schedule" iconTone="teal">
            <p>Notre équipe s'engage à traiter votre réclamation dans les meilleurs délais :</p>
            <MarketingFeatureGrid items={PROCESSING_DELAYS} />
          </MarketingSection>

          <MarketingSection title="5. Types de réclamations traitées" icon="category" iconTone="amber">
            <p>Nous traitons les types de réclamations suivants :</p>
            <MarketingFeatureGrid items={RECLAMATION_CATEGORIES} />
          </MarketingSection>

          <MarketingSection title="6. Escalade" icon="trending_up" iconTone="indigo">
            <p>
              Si vous n'êtes pas satisfait de la réponse apportée à votre réclamation, vous pouvez demander une
              escalade de votre dossier.
            </p>
            <ul>
              <li><strong>Escalade :</strong> examen par un responsable hiérarchique</li>
              <li><strong>Délai :</strong> réponse définitive sous 14 jours ouvrés</li>
              <li><strong>Dernier recours :</strong> saisie des autorités compétentes ou des juridictions de Dakar</li>
            </ul>
          </MarketingSection>
        </div>
      </MarketingLayout>
  )
}

function EmailLink({ email }: { email: string }) {
  return (
      <a href={`mailto:${email}`}>{email}</a>
  )
}
