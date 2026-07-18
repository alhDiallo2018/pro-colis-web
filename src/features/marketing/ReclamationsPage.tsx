import { useState } from 'react'
import { Button, Input, Select, Textarea, Toast } from '@/ds'
import type { ToastTone } from '@/ds'
import { MarketingHeader } from './MarketingHeader'
import { sendSupportMessage, checkSupportRateLimit, recordSupportSend, formatWait, SUPPORT_EMAIL } from '@/lib/api/support'

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

export function ReclamationsPage() {
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
    try {
      await sendSupportMessage({ subject: fullSubject, message: fullMessage, name: name.trim(), email: email.trim() })
      recordSupportSend()
      setFeedback({ tone: 'success', message: 'Réclamation envoyée ! Un accusé de réception vous sera adressé sous 48h ouvrées.' })
      setName('')
      setEmail('')
      setTracking('')
      setType('')
      setDescription('')
    } catch {
      setFeedback({
        tone: 'error',
        message: `L'envoi a échoué. Veuillez réessayer dans quelques instants ou nous écrire à ${SUPPORT_EMAIL}.`,
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px', fontFamily: 'var(--font-body)', color: 'var(--text-body)', lineHeight: 1.7 }}>
      <MarketingHeader />
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: 'var(--text-strong)', marginBottom: 24 }}>RÉCLAMATIONS — SENDPROCOLIS</h1>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>1. Comment déposer une réclamation</h2>
      <p>
        Vous pouvez déposer une réclamation via le formulaire ci-dessous ou en nous écrivant à l'adresse suivante :{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: 'var(--color-primary)' }}>{SUPPORT_EMAIL}</a>.
      </p>
      <p>
        Nous vous recommandons de fournir le maximum d'informations pour nous permettre de traiter votre
        demande dans les meilleurs délais.
      </p>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>2. Informations à fournir</h2>
      <p>
        Afin de faciliter le traitement de votre réclamation, merci de fournir les informations suivantes :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li>votre <strong>numéro de suivi</strong> (exemple : PC-7F3K-2291) ;</li>
        <li>la <strong>date et l'heure</strong> de l'expédition ;</li>
        <li>une <strong>description détaillée</strong> du problème rencontré ;</li>
        <li>des <strong>photos</strong> du colis si celui-ci est endommagé ;</li>
        <li>vos coordonnées complètes (nom, téléphone, email).</li>
      </ul>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>3. Formulaire de réclamation</h2>
      <form onSubmit={onSubmit} noValidate style={{ maxWidth: 500, marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
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
        {feedback && <Toast tone={feedback.tone} message={feedback.message} onClose={() => setFeedback(null)} />}
        <div>
          <Button type="submit" variant="primary" iconTrailing="send" loading={sending}>
            Envoyer la réclamation
          </Button>
        </div>
      </form>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>4. Délais de traitement</h2>
      <p>
        Notre équipe s'engage à traiter votre réclamation dans les meilleurs délais :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li><strong>Accusé de réception :</strong> sous 48 heures ouvrées ;</li>
        <li><strong>Analyse et résolution :</strong> sous 7 jours ouvrés ;</li>
        <li><strong>Cas complexes :</strong> un délai supplémentaire peut être nécessaire, auquel cas vous serez informé.</li>
      </ul>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>5. Types de réclamations traitées</h2>
      <p>
        Nous traitons les types de réclamations suivants :
      </p>
      <ul style={{ paddingLeft: 24 }}>
        <li>
          <strong>Retard de livraison :</strong> si la livraison n'a pas été effectuée dans les délais
          convenus avec le chauffeur ;
        </li>
        <li>
          <strong>Colis endommagé :</strong> si le colis présente des dommages à la livraison (photos
          requises) ;
        </li>
        <li>
          <strong>Colis perdu :</strong> si le colis n'a jamais été livré et que le chauffeur ne peut
          en justifier la livraison ;
        </li>
        <li>
          <strong>Problème de paiement :</strong> débit non autorisé, montant incorrect, non-versement
          au chauffeur ;
        </li>
        <li>
          <strong>Comportement inapproprié :</strong> signalement d'un comportement abusif ou non
          professionnel d'un utilisateur.
        </li>
      </ul>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>6. Escalade</h2>
      <p>
        Si vous n'êtes pas satisfait de la réponse apportée à votre réclamation, vous pouvez demander une
        escalade de votre dossier. Votre demande sera examinée par un responsable hiérarchique qui
        réévaluera la situation et vous apportera une réponse définitive sous 14 jours ouvrés.
      </p>
      <p>
        En dernier recours, vous pouvez saisir les autorités compétentes au Sénégal ou les juridictions
        de Dakar pour tout litige non résolu.
      </p>
    </div>
  )
}
