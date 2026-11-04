import { useState } from 'react'
import { Button, Input, Textarea, Toast } from '@/ds'
import type { ToastTone } from '@/ds'
import { MarketingLayout, MarketingHero, MarketingSection, MarketingAlert } from './MarketingLayout'
import { useSupportContact, useLegalConfig } from '@/lib/usePublicConfig'
import { buildSupportMailto, sendSupportMessage, checkSupportRateLimit, recordSupportSend, formatWait } from '@/lib/api/support'
import { useAuthStore } from '@/store/auth'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface ContactErrors {
  name?: string
  email?: string
  subject?: string
  message?: string
}

export function ContactPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const support = useSupportContact()
  const legal = useLegalConfig()
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
      const waitSeconds = (limit as { allowed: false; waitSeconds: number }).waitSeconds
      setFeedback({
        tone: 'warning',
        message: `Pour éviter les abus, l'envoi est limité. Veuillez patienter ${formatWait(waitSeconds)} avant de renvoyer un message.`,
      })
      return
    }

    setSending(true)
    const fullSubject = `[Contact] ${subject.trim()}`
    const fullMessage = `Nom : ${name.trim()}\nEmail : ${email.trim()}\n\n${message.trim()}`
    const payload = { subject: fullSubject, message: fullMessage, name: name.trim(), email: email.trim() }

    if (!accessToken) {
      if (!support.email) {
        setFeedback({ tone: 'error', message: 'L’adresse email du support n’est pas encore configurée.' })
        setSending(false)
        return
      }
      window.location.href = buildSupportMailto(payload, support.email)
      setFeedback({ tone: 'warning', message: `Votre application email va s'ouvrir pour envoyer le message à ${support.email}.` })
      setSending(false)
      return
    }

    try {
      await sendSupportMessage(payload)
      recordSupportSend()
      setFeedback({ tone: 'success', message: support.responseTime
        ? `Message envoyé ! Délai de réponse annoncé : ${support.responseTime}.`
        : 'Message envoyé ! Notre équipe vous répondra dans les meilleurs délais.' })
      setName('')
      setEmail('')
      setSubject('')
      setMessage('')
    } catch {
      if (support.email) {
        window.location.href = buildSupportMailto(payload, support.email)
        setFeedback({
          tone: 'warning',
          message: `L'API est indisponible : votre application email va s'ouvrir pour écrire à ${support.email}.`,
        })
      } else {
        setFeedback({ tone: 'error', message: 'Le message n’a pas pu être envoyé et aucun email de secours n’est configuré.' })
      }
    } finally {
      setSending(false)
    }
  }

  return (
      <MarketingLayout>
        <MarketingHero
            eyebrow="Support"
            eyebrowIcon="support_agent"
            title={<>CONTACT</>}
            lead="SendProColis — Nous sommes à votre écoute"
            updated="17 juillet 2026"
        />
        <div className="mkt-sections">
          <MarketingAlert tone="info" title={support.availability || 'Disponibilité du support'}>
            {support.responseTime
                ? `Délai de réponse annoncé : ${support.responseTime}.`
                : 'Notre équipe vous répondra dans les meilleurs délais.'}
          </MarketingAlert>

          <MarketingSection title="Nous contacter" icon="support_agent" iconTone="teal">
            <p>
              Notre équipe est à votre écoute pour toute question, suggestion ou assistance. N'hésitez pas à nous
              joindre par l'un des moyens suivants.
            </p>

            <div className="mkt-grid">
              {support.email ? (
                  <a href={`mailto:${support.email}`} className="mkt-contact-card">
                    <div className="mkt-contact-card-icon"><span className="material-symbols-rounded">mail</span></div>
                    <div>
                      <div className="mkt-contact-card-label">Email</div>
                      <div className="mkt-contact-card-value">{support.email}</div>
                    </div>
                  </a>
              ) : (
                  <div className="mkt-contact-card">
                    <div className="mkt-contact-card-icon"><span className="material-symbols-rounded">mail</span></div>
                    <div>
                      <div className="mkt-contact-card-label">Email</div>
                      <div className="mkt-contact-card-value">À compléter</div>
                    </div>
                  </div>
              )}

              <div className="mkt-contact-card">
                <div className="mkt-contact-card-icon"><span className="material-symbols-rounded">call</span></div>
                <div>
                  <div className="mkt-contact-card-label">Téléphone / WhatsApp</div>
                  <div className="mkt-contact-card-value" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {support.technicalPhone && <a href={`tel:${support.technicalPhone.replace(/\s/g, '')}`}>{support.technicalPhone}</a>}
                    {support.phone && <a href={`tel:${support.phone.replace(/\s/g, '')}`}>{support.phone}</a>}
                    {!support.technicalPhone && !support.phone && 'À compléter'}
                  </div>
                </div>
              </div>

              <div className="mkt-contact-card">
                <div className="mkt-contact-card-icon"><span className="material-symbols-rounded">pin_drop</span></div>
                <div>
                  <div className="mkt-contact-card-label">Adresse</div>
                  <div className="mkt-contact-card-value">{legal.address || '[À COMPLÉTER]'}</div>
                </div>
              </div>
            </div>

            <div style={{
              marginTop: 16,
              padding: 20,
              background: 'var(--surface-sunken)',
              borderRadius: 12,
              border: '1px solid var(--border-subtle)',
              textAlign: 'center'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                marginBottom: 8
              }}>
                <span className="material-symbols-rounded" aria-hidden="true" style={{ fontSize: 24 }}>schedule</span>
                <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-strong)' }}>
                  {support.availability || 'Disponibilité à confirmer'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>
                {support.responseTime ? `Délai de réponse annoncé : ${support.responseTime}.` : 'Contactez-nous pour connaître les délais de réponse.'}
              </p>
              <div style={{
                marginTop: 12,
                display: 'flex',
                justifyContent: 'center',
                gap: 24,
                flexWrap: 'wrap',
                fontSize: 13
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: 'var(--green-500)' }}>●</span> Support client
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: 'var(--blue-500)' }}>●</span> Assistance technique
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: 'var(--amber-500)' }}>●</span> Réclamations
                </span>
              </div>
            </div>
          </MarketingSection>

          <MarketingSection title="Formulaire de contact" icon="mail" iconTone="indigo">
            <p>
              Vous pouvez également utiliser le formulaire ci-dessous pour nous envoyer un message.
              Nous vous répondrons dans les plus brefs délais.
            </p>
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
              <div className="mkt-form-field mkt-form-field--full">
                <Input
                    label="Sujet"
                    icon="subject"
                    placeholder="Sujet de votre message"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    error={errors.subject}
                />
              </div>
              <div className="mkt-form-field mkt-form-field--full">
                <Textarea
                    label="Message"
                    placeholder="Votre message..."
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    error={errors.message}
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
                  Envoyer le message
                </Button>
              </div>
            </form>
          </MarketingSection>
        </div>
      </MarketingLayout>
  )
}
