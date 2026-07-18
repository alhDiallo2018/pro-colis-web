import { useState } from 'react'
import { Button, Card, Input, Toast } from '@/ds'
import { Panel } from '@/components/Panel'
import { getBrevoConfig, updateBrevoConfig, testBrevoConnection, type BrevoConfig } from '@/lib/api/brevo'
import { ApiError } from '@/lib/api/client'

export function BrevoConfigScreen() {
  const [config, setConfig] = useState<BrevoConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  const [form, setForm] = useState({
    apiKey: '',
    senderEmail: '',
    senderName: '',
    smsSender: '',
  })

  const load = async () => {
    setLoading(true)
    try {
      const c = await getBrevoConfig()
      setConfig(c)
      if (c) {
        setForm({
          apiKey: c.apiKey?.replace(/(.{4}).*(.{4})$/, '$1****$2') ?? '',
          senderEmail: c.senderEmail ?? '',
          senderName: c.senderName ?? '',
          smsSender: c.smsSender ?? '',
        })
      }
    } catch (e) {
      setMessage({ tone: 'error', text: e instanceof ApiError ? e.message : 'Impossible de charger la configuration.' })
    } finally {
      setLoading(false)
    }
  }

  const save = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const updated = await updateBrevoConfig({
        senderEmail: form.senderEmail,
        senderName: form.senderName,
        smsSender: form.smsSender,
      })
      setConfig(updated)
      setMessage({ tone: 'success', text: 'Configuration Brevo enregistrée.' })
    } catch (e) {
      setMessage({ tone: 'error', text: e instanceof ApiError ? e.message : 'Échec de la sauvegarde.' })
    } finally {
      setSaving(false)
    }
  }

  const test = async () => {
    if (!testEmail) return
    setTesting(true)
    setMessage(null)
    try {
      const result = await testBrevoConnection(testEmail)
      if (result.success) {
        setMessage({ tone: 'success', text: `Email de test envoyé avec succès à ${testEmail}. Vérifiez votre boîte de réception.` })
      } else {
        setMessage({ tone: 'error', text: result.error ?? 'Échec de l\'envoi du test.' })
      }
    } catch (e) {
      setMessage({ tone: 'error', text: e instanceof ApiError ? e.message : 'Échec du test de connexion.' })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Panel title="Configuration Brevo (Email & SMS)">
        <p style={{ margin: '0 0 20px', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
          Brevo (ex-SendinBlue) est le fournisseur d'emails transactionnels et de SMS.
          La clé API est configurée côté serveur (variable d'environnement <code>BREVO_API_KEY</code>).
        </p>

        {!config && !loading && (
          <Button icon="refresh" onClick={load}>
            Charger la configuration
          </Button>
        )}

        {loading && <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>Chargement...</p>}

        {(config || !config) && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input
              label="Email expéditeur"
              placeholder="no-reply@sendprocolis.com"
              value={form.senderEmail}
              onChange={(e) => setForm((f) => ({ ...f, senderEmail: e.target.value }))}
            />
            <Input
              label="Nom expéditeur"
              placeholder="SENDPROCOLIS"
              value={form.senderName}
              onChange={(e) => setForm((f) => ({ ...f, senderName: e.target.value }))}
            />
            <Input
              label="Expéditeur SMS (max 11 caractères)"
              placeholder="SENDPROCOLIS"
              value={form.smsSender}
              onChange={(e) => setForm((f) => ({ ...f, smsSender: e.target.value }))}
            />
            <div>
              <Button icon="save" loading={saving} onClick={save}>
                Enregistrer
              </Button>
            </div>
          </div>
        )}
      </Panel>

      <Card padding="lg">
        <h3 style={{ margin: '0 0 4px', fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)', color: 'var(--text-strong)' }}>
          Tester la connexion Brevo
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
          Envoyez un email de test pour vérifier que la configuration fonctionne.
        </p>

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <Input
            label="Adresse email de test"
            placeholder="support-technic@sendprocolis.com"
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            style={{ flex: 1 }}
          />
          <Button icon="send" loading={testing} disabled={!testEmail} onClick={test}>
            Tester
          </Button>
        </div>
      </Card>

      {message && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
          <Toast tone={message.tone} message={message.text} />
        </div>
      )}
    </div>
  )
}
