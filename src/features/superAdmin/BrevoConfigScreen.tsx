import { useState } from 'react'
import { Button, Card, Input, Toast } from '@/ds'
import { Panel } from '@/components/Panel'
import { getBrevoConfig, updateBrevoConfig, testBrevoConnection, type BrevoConfig } from '@/lib/api/brevo'
import { ApiError } from '@/lib/api/client'
import { ManualMessagePanel } from './ManualMessagePanel'

export function BrevoConfigScreen() {
  const [config, setConfig] = useState<BrevoConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [useServerKey, setUseServerKey] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const keyConfigured = config?.apiKeyConfigured ?? Boolean(config?.apiKey)

  const [form, setForm] = useState({
    apiKey: '',
    senderEmail: '',
    senderName: '',
    smsSender: '',
  })

  const load = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const c = await getBrevoConfig()
      setConfig(c)
      if (c) {
        setUseServerKey(false)
        setForm({
          // Le champ ne contient qu'une nouvelle saisie, jamais le masque retourne.
          apiKey: '',
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
    // Un champ vide conserve seulement une cle deja enregistree. Il ne peut
    // pas configurer Brevo lors de la premiere saisie ou apres son retrait.
    if (!keyConfigured && !form.apiKey.trim() && !useServerKey) {
      setMessage({ tone: 'error', text: 'Renseignez une clé API Brevo avant d’enregistrer la configuration.' })
      return
    }
    // Une erreur sur le nom SMS ne doit pas masquer la cause du refus de
    // sauvegarde de la cle. Le meme plafond est applique par l'API.
    if (form.smsSender.trim().length > 11) {
      setMessage({ tone: 'error', text: 'L’expéditeur SMS doit contenir au maximum 11 caractères. Utilisez par exemple ProColis.' })
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      // Champ vide = conserver la cle. Seul le choix explicite du serveur
      // envoie une valeur vide pour retirer la surcharge stockee en base.
      const updated = await updateBrevoConfig({
        ...(useServerKey ? { apiKey: '' } : form.apiKey.trim() ? { apiKey: form.apiKey.trim() } : {}),
        senderEmail: form.senderEmail.trim(),
        senderName: form.senderName,
        smsSender: form.smsSender.trim(),
      })
      setConfig(updated)
      setUseServerKey(false)
      setForm({ apiKey: '', senderEmail: updated.senderEmail, senderName: updated.senderName, smsSender: updated.smsSender })
      setMessage((updated.apiKeyConfigured ?? Boolean(updated.apiKey))
        ? { tone: 'success', text: 'Configuration Brevo enregistrée. Testez l’envoi pour vérifier son fonctionnement.' }
        : { tone: 'error', text: 'Paramètres enregistrés, mais aucune clé API Brevo n’est configurée. Les envois sont indisponibles.' })
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
      <ManualMessagePanel />
      <Panel title="Configuration Brevo (Email & SMS)">
        <p style={{ margin: '0 0 20px', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
          Brevo (ex-SendinBlue) est le fournisseur d'emails transactionnels et de SMS.
          Vous pouvez enregistrer la clé ici ou utiliser celle configurée sur le serveur.
          La clé enregistrée ici est prioritaire.
        </p>

        {!config && !loading && (
          <Button icon="refresh" onClick={load}>
            Charger la configuration
          </Button>
        )}

        {loading && <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>Chargement...</p>}

        {config && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p role="status" style={{ margin: 0, fontSize: 'var(--fs-sm)' }}>
              {config.apiKeySource === 'database' ? 'Clé enregistrée dans l’administration (prioritaire).'
                : config.apiKeySource === 'environment' ? 'Clé configurée sur le serveur.'
                  : (config.apiKeyConfigured ?? Boolean(config.apiKey)) ? 'Une clé est configurée.' : 'Aucune clé API configurée.'}
            </p>
            <Input
              label="Nouvelle clé API Brevo"
              type="password"
              autoComplete="new-password"
              spellCheck={false}
              placeholder={keyConfigured ? 'Laisser vide pour conserver la clé actuelle' : 'Renseigner la clé API Brevo'}
              value={form.apiKey}
              onChange={(e) => { setUseServerKey(false); setForm((f) => ({ ...f, apiKey: e.target.value })) }}
            />
            {config.apiKeySource === 'database' && (
              <Button variant="ghost" disabled={!config.environmentApiKeyConfigured} onClick={() => { setUseServerKey(true); setForm((f) => ({ ...f, apiKey: '' })) }}>
                Utiliser la clé du serveur
              </Button>
            )}
            {config.apiKeySource === 'database' && !config.environmentApiKeyConfigured && <p style={{ margin: 0, fontSize: 'var(--fs-sm)' }}>
              Aucune clé serveur disponible. La clé enregistrée dans l’administration est conservée.
            </p>}
            {useServerKey && <p style={{ margin: 0, fontSize: 'var(--fs-sm)' }}>
              Après enregistrement, la clé du serveur sera utilisée.
              {!config.environmentApiKeyConfigured && ' Aucune clé serveur n’est actuellement configurée : les envois seront indisponibles.'}
            </p>}
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
              placeholder="ProColis"
              error={form.smsSender.trim().length > 11 ? 'Maximum 11 caractères, par exemple ProColis.' : undefined}
              value={form.smsSender}
              onChange={(e) => setForm((f) => ({ ...f, smsSender: e.target.value }))}
            />
            <div>
              <Button icon="save" loading={saving} disabled={!config} onClick={save}>
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
        {!keyConfigured && <p style={{ fontSize: 'var(--fs-sm)' }}>
          {config ? 'Enregistrez une clé API Brevo pour activer le test d’envoi.' : 'Chargez la configuration avant de tester l’envoi.'}
        </p>}

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <Input
            label="Adresse email de test"
            placeholder="support-technic@sendprocolis.com"
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            style={{ flex: 1 }}
          />
          <Button icon="send" loading={testing} disabled={!testEmail || !keyConfigured || saving} onClick={test}>
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
