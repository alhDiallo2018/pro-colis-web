import { useState } from 'react'
import { Button, Input, Textarea, Toast } from '@/ds'
import type { ToastTone } from '@/ds'
import { MarketingHeader } from './MarketingHeader'
import { buildSupportMailto, sendSupportMessage, checkSupportRateLimit, recordSupportSend, formatWait, SUPPORT_EMAIL } from '@/lib/api/support'
import { useAuthStore } from '@/store/auth'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface ContactErrors {
  name?: string
  email?: string
  subject?: string
  message?: string
}

const CONTACT_INFO = {
  email: 'support-commercial@sendprocolis.com',
  phone1: '+221 76 516 27 96',
  phone2: '+221 76 590 17 79',
  phone3: '+221 77 889 12 30',
  address: 'Dakar, Sénégal'
}

export function ContactPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
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
      // ✅ Utiliser une variable pour waitSeconds
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
      window.location.href = buildSupportMailto(payload)
      setFeedback({ tone: 'warning', message: `Votre application email va s'ouvrir pour envoyer le message à ${SUPPORT_EMAIL}.` })
      setSending(false)
      return
    }

    try {
      await sendSupportMessage(payload)
      recordSupportSend()
      setFeedback({ tone: 'success', message: 'Message envoyé ! Notre équipe vous répondra sous 24h ouvrées.' })
      setName('')
      setEmail('')
      setSubject('')
      setMessage('')
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
            CONTACT
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
          background: 'var(--teal-50)',
          borderRadius: 16,
          padding: 24,
          marginBottom: 40,
          border: '1px solid var(--teal-200)',
          borderLeft: '4px solid var(--teal-500)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 28 }}>💬</span>
            <div>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 16,
                color: 'var(--teal-700)',
                margin: '0 0 4px 0'
              }}>
                Disponibles 24h/24, 7j/7
              </h3>
              <p style={{
                margin: 0,
                color: 'var(--teal-600)',
                fontSize: 14
              }}>
                Notre équipe est joignable à tout moment. Nous nous engageons à vous répondre dans les meilleurs délais.
              </p>
            </div>
          </div>
        </div>

        {/* Section 1 : Nous contacter */}
        <Section title="Nous contacter">
          <p>
            Notre équipe est à votre écoute pour toute question, suggestion ou assistance. N'hésitez pas à nous
            joindre par l'un des moyens suivants.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
            marginTop: 20,
            marginBottom: 20
          }}>
            {/* Email */}
            <div style={{
              padding: 18,
              background: 'var(--surface-page)',
              borderRadius: 12,
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📧</div>
              <div style={{
                fontWeight: 700,
                fontSize: 14,
                color: 'var(--text-strong)',
                marginBottom: 4
              }}>
                Email
              </div>
              <div style={{ fontSize: 13 }}>
                <a href={`mailto:${CONTACT_INFO.email}`} style={{ color: 'var(--color-primary)' }}>
                  {CONTACT_INFO.email}
                </a>
              </div>
            </div>

            {/* Téléphone */}
            <div style={{
              padding: 18,
              background: 'var(--surface-page)',
              borderRadius: 12,
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📞</div>
              <div style={{
                fontWeight: 700,
                fontSize: 14,
                color: 'var(--text-strong)',
                marginBottom: 4
              }}>
                Téléphone / WhatsApp
              </div>
              <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <a href={`tel:${CONTACT_INFO.phone1.replace(/\s/g, '')}`} style={{ color: 'var(--color-primary)' }}>
                  {CONTACT_INFO.phone1}
                </a>
                <a href={`tel:${CONTACT_INFO.phone2.replace(/\s/g, '')}`} style={{ color: 'var(--color-primary)' }}>
                  {CONTACT_INFO.phone2}
                </a>
                <a href={`tel:${CONTACT_INFO.phone3.replace(/\s/g, '')}`} style={{ color: 'var(--color-primary)' }}>
                  {CONTACT_INFO.phone3}
                </a>
              </div>
            </div>

            {/* Adresse */}
            <div style={{
              padding: 18,
              background: 'var(--surface-page)',
              borderRadius: 12,
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📍</div>
              <div style={{
                fontWeight: 700,
                fontSize: 14,
                color: 'var(--text-strong)',
                marginBottom: 4
              }}>
                Adresse
              </div>
              <div style={{ fontSize: 13 }}>
                {CONTACT_INFO.address}
              </div>
            </div>
          </div>

          {/* Horaires */}
          <div style={{
            padding: 20,
            background: 'var(--surface-page)',
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
              <span style={{ fontSize: 24 }}>🕐</span>
              <span style={{
                fontWeight: 800,
                fontSize: 18,
                color: 'var(--text-strong)'
              }}>
              Disponibles 24h/24, 7j/7
            </span>
            </div>
            <p style={{
              margin: 0,
              fontSize: 14,
              color: 'var(--text-muted)'
            }}>
              Notre équipe est joignable à tout moment, y compris les jours fériés et le week-end.
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
        </Section>

        {/* Section 2 : Formulaire de contact */}
        <Section title="Formulaire de contact">
          <p>
            Vous pouvez également utiliser le formulaire ci-dessous pour nous envoyer un message.
            Nous vous répondrons dans les plus brefs délais.
          </p>

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
                Envoyer le message
              </Button>
            </div>
          </form>
        </Section>

        {/* Footer */}
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
            Dakar, Sénégal ·{' '}
            <a href={`mailto:${CONTACT_INFO.email}`} style={{ color: 'var(--color-primary)' }}>
              {CONTACT_INFO.email}
            </a>
          </p>
        </div>
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
