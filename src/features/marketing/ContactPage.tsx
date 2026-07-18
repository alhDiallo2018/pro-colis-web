import { useState } from 'react'
import { Button, Input, Textarea, Toast } from '@/ds'
import type { ToastTone } from '@/ds'
import { MarketingHeader } from './MarketingHeader'
import { sendSupportMessage, checkSupportRateLimit, recordSupportSend, formatWait, SUPPORT_EMAIL } from '@/lib/api/support'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface ContactErrors {
  name?: string
  email?: string
  subject?: string
  message?: string
}

export function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<ContactErrors>({})
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState<{ tone: ToastTone; message: string } | null>(null)

  const validate = (): boolean => {
    const next: ContactErrors = {}
    if (!name.trim()) next.name = 'Veuillez indiquer votre nom.'
    if (!email.trim()) next.email = 'Veuillez indiquer votre email.'
    else if (!EMAIL_RE.test(email.trim())) next.email = 'Adresse email invalide.'
    if (!subject.trim()) next.subject = 'Veuillez indiquer un sujet.'
    if (!message.trim()) next.message = 'Veuillez écrire votre message.'
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
        message: `Pour éviter les abus, l'envoi est limité. Veuillez patienter ${formatWait(limit.waitSeconds)} avant de renvoyer un message.`,
      })
      return
    }
    setSending(true)
    const fullSubject = `[Contact] ${subject.trim()}`
    const fullMessage = `Nom : ${name.trim()}\nEmail : ${email.trim()}\n\n${message.trim()}`
    try {
      await sendSupportMessage({ subject: fullSubject, message: fullMessage, name: name.trim(), email: email.trim() })
      recordSupportSend()
      setFeedback({ tone: 'success', message: 'Message envoyé ! Notre équipe vous répondra sous 24h ouvrées.' })
      setName('')
      setEmail('')
      setSubject('')
      setMessage('')
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
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: 'var(--text-strong)', marginBottom: 24 }}>CONTACT — SENDPROCOLIS</h1>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>Nous contacter</h2>
      <p>
        Notre équipe est à votre écoute pour toute question, suggestion ou assistance. N'hésitez pas à nous
        joindre par l'un des moyens suivants.
      </p>

      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 24, margin: '24px 0' }}>
        <div style={{ marginBottom: 16 }}>
          <strong>Email :</strong>{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: 'var(--color-primary)' }}>{SUPPORT_EMAIL}</a>
        </div>
        <div style={{ marginBottom: 16 }}>
          <strong>Téléphone :</strong> +221 76 516 27 96
        </div>
        <div style={{ marginBottom: 16 }}>
          <strong>Adresse :</strong> Dakar, Sénégal
        </div>
        <div>
          <strong>Heures d'ouverture :</strong><br />
          Lundi au Vendredi : 8h00 – 18h00<br />
          Samedi : 9h00 – 13h00<br />
          Dimanche : Fermé
        </div>
      </div>

      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', marginTop: 32, marginBottom: 12 }}>Formulaire de contact</h2>
      <p>
        Vous pouvez également utiliser le formulaire ci-dessous pour nous envoyer un message.
      </p>

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
          label="Sujet"
          icon="subject"
          placeholder="Sujet de votre message"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          error={errors.subject}
        />
        <Textarea
          label="Message"
          placeholder="Votre message..."
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          error={errors.message}
        />
        {feedback && <Toast tone={feedback.tone} message={feedback.message} onClose={() => setFeedback(null)} />}
        <div>
          <Button type="submit" variant="primary" iconTrailing="send" loading={sending}>
            Envoyer le message
          </Button>
        </div>
      </form>
    </div>
  )
}
