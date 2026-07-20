import { useEffect, useState } from 'react'
import { Button, Input, Select, Toast } from '@/ds'
import { Panel } from '@/components/Panel'
import {
  getPaydunyaConfig,
  updatePaydunyaConfig,
  type PaydunyaConfig,
  type PaydunyaMode,
} from '@/lib/api/paydunya-config'
import { ApiError } from '@/lib/api/client'

export function PaydunyaConfigScreen() {
  const [config, setConfig] = useState<PaydunyaConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  const [form, setForm] = useState({
    masterKey: '',
    privateKey: '',
    token: '',
    mode: 'test' as PaydunyaMode,
    storeName: '',
  })

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const c = await getPaydunyaConfig()
        if (cancelled) return
        setConfig(c)
        if (c) {
          setForm({
            masterKey: '',
            privateKey: '',
            token: '',
            mode: c.mode === 'live' ? 'live' : 'test',
            storeName: c.storeName ?? '',
          })
        }
      } catch (e) {
        if (!cancelled) {
          setMessage({ tone: 'error', text: e instanceof ApiError ? e.message : 'Impossible de charger la configuration.' })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const save = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const updated = await updatePaydunyaConfig({
        // Les champs laissés vides ne sont pas envoyés : les clés existantes sont conservées.
        ...(form.masterKey ? { masterKey: form.masterKey } : {}),
        ...(form.privateKey ? { privateKey: form.privateKey } : {}),
        ...(form.token ? { token: form.token } : {}),
        mode: form.mode,
        storeName: form.storeName,
      })
      setConfig(updated)
      setForm((f) => ({ ...f, masterKey: '', privateKey: '', token: '' }))
      setMessage({ tone: 'success', text: 'Configuration PayDunya enregistrée.' })
    } catch (e) {
      setMessage({ tone: 'error', text: e instanceof ApiError ? e.message : 'Échec de la sauvegarde.' })
    } finally {
      setSaving(false)
    }
  }

  const configured = config?.configured ?? false

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Panel title="Configuration PayDunya">
        <p style={{ margin: '0 0 16px', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
          PayDunya est le fournisseur de paiement mobile (Orange Money, Wave, carte bancaire).
          Les clés sont stockées côté serveur et affichées masquées. Laissez un champ de clé vide
          pour conserver la valeur actuelle.
        </p>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 20,
            padding: '6px 12px',
            borderRadius: 'var(--radius-pill)',
            background: configured ? 'var(--color-success-soft)' : 'var(--color-danger-soft)',
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: configured ? 'var(--color-success)' : 'var(--color-danger)',
            }}
          />
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: configured ? 'var(--color-success)' : 'var(--color-danger)',
            }}
          >
            {configured ? 'Configuré' : 'Non configuré'}
          </span>
        </div>

        {loading ? (
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>Chargement...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input
              label="Master Key"
              type="password"
              placeholder={config?.masterKey || 'Master Key PayDunya'}
              value={form.masterKey}
              onChange={(e) => setForm((f) => ({ ...f, masterKey: e.target.value }))}
              autoComplete="off"
            />
            <Input
              label="Private Key"
              type="password"
              placeholder={config?.privateKey || 'Private Key PayDunya'}
              value={form.privateKey}
              onChange={(e) => setForm((f) => ({ ...f, privateKey: e.target.value }))}
              autoComplete="off"
            />
            <Input
              label="Token"
              type="password"
              placeholder={config?.token || 'Token PayDunya'}
              value={form.token}
              onChange={(e) => setForm((f) => ({ ...f, token: e.target.value }))}
              autoComplete="off"
            />
            <Select
              label="Mode"
              value={form.mode}
              onChange={(e) => setForm((f) => ({ ...f, mode: e.target.value as PaydunyaMode }))}
              options={[
                { value: 'test', label: 'Test (sandbox)' },
                { value: 'live', label: 'Live (production)' },
              ]}
            />
            <Input
              label="Nom de la boutique"
              placeholder="SENDPROCOLIS"
              value={form.storeName}
              onChange={(e) => setForm((f) => ({ ...f, storeName: e.target.value }))}
            />
            <div>
              <Button icon="save" loading={saving} onClick={save}>
                Enregistrer
              </Button>
            </div>
          </div>
        )}
      </Panel>

      {message && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
          <Toast tone={message.tone} message={message.text} />
        </div>
      )}
    </div>
  )
}
