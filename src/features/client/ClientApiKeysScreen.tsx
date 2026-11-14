import { useState } from 'react'
import { Badge, Button, Checkbox, Dialog, Input, Toast } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import { useIsMobile } from '@/lib/useMediaQuery'
import { formatDateTime } from '@/lib/format'
import {
  useBusinessApiKeys,
  useCreateBusinessApiKey,
  useRotateBusinessApiKey,
  useDeactivateBusinessApiKey,
} from './hooks'
import {
  BUSINESS_API_KEY_SCOPES,
  type BusinessApiKey,
  type BusinessApiKeyScope,
  type BusinessApiKeyWithSecret,
} from '@/lib/api/business-api-keys'

const SCOPE_LABEL: Record<BusinessApiKeyScope, string> = {
  'parcel.read': 'Lecture colis',
  'parcel.write': 'Création colis',
  'webhook.receive': 'Réception webhook',
}

/**
 * Self-service des clés API pour un expéditeur professionnel.
 *
 * Reproduit le flux mobile `/business/api-keys` :
 * - affichage de la liste (keyId visible, secret jamais stocké) ;
 * - création d'une clé avec sélection des scopes et URL de webhook optionnelle ;
 * - rotation (nouveau secret montré une seule fois) ;
 * - désactivation (confirmation).
 *
 * Le secret en clair (`secretOnce` + `webhookSecretOnce`) n'apparaît que dans la
 * réponse de création/rotation : il est affiché dans une modale dédiée, puis
 * disparaît définitivement.
 */
export function ClientApiKeysScreen() {
  const isMobile = useIsMobile()
  const query = useBusinessApiKeys()
  const create = useCreateBusinessApiKey()
  const rotate = useRotateBusinessApiKey()
  const deactivate = useDeactivateBusinessApiKey()

  const [createOpen, setCreateOpen] = useState(false)
  const [rotateTarget, setRotateTarget] = useState<BusinessApiKey | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<BusinessApiKey | null>(null)
  const [secretReveal, setSecretReveal] = useState<BusinessApiKeyWithSecret | null>(null)

  const items = query.data ?? []

  return (
    <div className="cm-detail-page">
      <div className="cm-page-head">
        <div className="cm-page-head-body">
          <h1>Clés API</h1>
          <p className="cm-page-head-sub">
            Gérez vos accès pour l'intégration serveur-à-serveur. Le secret ne s'affiche qu'une seule fois.
          </p>
        </div>
      </div>

      <Panel
        title="Mes clés"
        action={<Button icon="add" size="sm" onClick={() => setCreateOpen(true)}>Nouvelle clé</Button>}
      >
        <QueryState
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          isEmpty={!query.isLoading && items.length === 0}
          emptyMessage="Aucune clé API. Créez-en une pour commencer."
          onRetry={() => query.refetch()}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map((key) => (
              <ApiKeyRow
                key={key.id}
                keyItem={key}
                isMobile={isMobile}
                onRotate={() => setRotateTarget(key)}
                onDeactivate={() => setDeactivateTarget(key)}
              />
            ))}
          </div>
        </QueryState>
      </Panel>

      {createOpen && (
        <CreateApiKeyDialog
          onClose={() => setCreateOpen(false)}
          onCreate={(payload) =>
            create.mutate(payload, {
              onSuccess: (key) => {
                setSecretReveal(key)
                setCreateOpen(false)
              },
            })
          }
          pending={create.isPending}
          error={create.isError ? (create.error as Error)?.message : null}
        />
      )}

      {rotateTarget && (
        <Dialog
          open
          icon="refresh"
          iconTone="amber"
          title="Régénérer le secret ?"
          onClose={() => setRotateTarget(null)}
          actions={
            <>
              <Button variant="ghost" onClick={() => setRotateTarget(null)}>Annuler</Button>
              <Button
                tone="danger"
                icon="refresh"
                loading={rotate.isPending}
                onClick={() =>
                  rotate.mutate(rotateTarget.id, {
                    onSuccess: (key) => {
                      setSecretReveal(key)
                      setRotateTarget(null)
                    },
                  })
                }
              >
                Régénérer
              </Button>
            </>
          }
        >
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-muted)' }}>
            L'ancien secret cesse immédiatement de fonctionner. Assurez-vous de pouvoir mettre à jour vos appels avant de confirmer.
          </p>
          {rotate.isError && (
            <Toast tone="error" message={(rotate.error as Error)?.message ?? 'Rotation impossible.'} />
          )}
        </Dialog>
      )}

      {deactivateTarget && (
        <Dialog
          open
          icon="block"
          iconTone="danger"
          title="Désactiver la clé ?"
          onClose={() => setDeactivateTarget(null)}
          actions={
            <>
              <Button variant="ghost" onClick={() => setDeactivateTarget(null)}>Annuler</Button>
              <Button
                tone="danger"
                icon="block"
                loading={deactivate.isPending}
                onClick={() =>
                  deactivate.mutate(deactivateTarget.id, {
                    onSuccess: () => setDeactivateTarget(null),
                  })
                }
              >
                Désactiver
              </Button>
            </>
          }
        >
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-muted)' }}>
            La clé « <strong>{deactivateTarget.partnerName}</strong> » cessera immédiatement d'authentifier vos requêtes. Vous pourrez la créer à nouveau sous un autre nom, mais pas réactiver celle-ci.
          </p>
          {deactivate.isError && (
            <Toast tone="error" message={(deactivate.error as Error)?.message ?? 'Désactivation impossible.'} />
          )}
        </Dialog>
      )}

      {secretReveal && (
        <SecretRevealDialog
          revealed={secretReveal}
          onClose={() => setSecretReveal(null)}
        />
      )}
    </div>
  )
}

function ApiKeyRow({
  keyItem,
  isMobile,
  onRotate,
  onDeactivate,
}: {
  keyItem: BusinessApiKey
  isMobile: boolean
  onRotate: () => void
  onDeactivate: () => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: 12,
        padding: 14,
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        background: keyItem.active ? 'var(--surface-card)' : 'var(--surface-sunken)',
        opacity: keyItem.active ? 1 : 0.85,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text-strong)' }}>
            {keyItem.partnerName}
          </span>
          <Badge tone={keyItem.active ? 'green' : 'neutral'}>
            {keyItem.active ? 'Active' : 'Désactivée'}
          </Badge>
          {keyItem.hasWebhookSecret && <Badge tone="teal">Webhook</Badge>}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', marginTop: 4, overflowWrap: 'anywhere' }}>
          {keyItem.keyId}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
          {keyItem.scopes.map((scope) => (
            <Badge key={scope} tone="primary">{SCOPE_LABEL[scope] ?? scope}</Badge>
          ))}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 6 }}>
          Créée le {formatDateTime(keyItem.createdAt) ?? '—'}
          {keyItem.lastUsedAt ? <> · Dernier appel {formatDateTime(keyItem.lastUsedAt)}</> : null}
          {keyItem.rotatedAt ? <> · Pivotée le {formatDateTime(keyItem.rotatedAt)}</> : null}
        </div>
        {keyItem.webhookUrl && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, overflowWrap: 'anywhere' }}>
            Webhook : <span style={{ fontFamily: 'var(--font-mono)' }}>{keyItem.webhookUrl}</span>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {keyItem.active && (
          <>
            <Button size="sm" variant="ghost" icon="refresh" onClick={onRotate}>Régénérer</Button>
            <Button size="sm" variant="ghost" tone="danger" icon="block" onClick={onDeactivate}>Désactiver</Button>
          </>
        )}
      </div>
    </div>
  )
}

function CreateApiKeyDialog({
  onClose,
  onCreate,
  pending,
  error,
}: {
  onClose: () => void
  onCreate: (payload: { partnerName: string; scopes: BusinessApiKeyScope[]; webhookUrl?: string; webhookSecret?: string }) => void
  pending: boolean
  error: string | null
}) {
  const [name, setName] = useState('')
  const [scopes, setScopes] = useState<BusinessApiKeyScope[]>(['parcel.read'])
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')

  const toggleScope = (scope: BusinessApiKeyScope) => {
    setScopes((prev) => (prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]))
  }

  const canSubmit = name.trim().length >= 2 && scopes.length > 0 && !pending

  return (
    <Dialog
      open
      title="Nouvelle clé API"
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button
            icon="check"
            loading={pending}
            disabled={!canSubmit}
            onClick={() =>
              onCreate({
                partnerName: name.trim(),
                scopes,
                webhookUrl: webhookUrl.trim() || undefined,
                webhookSecret: webhookSecret.trim() || undefined,
              })
            }
          >
            Créer la clé
          </Button>
        </>
      }
    >
      <div className="pc-form" style={{ gap: 12 }}>
        <Input
          label="Nom de l'intégration"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex : ERP commercial"
        />

        <div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-strong)', marginBottom: 6 }}>Scopes</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {BUSINESS_API_KEY_SCOPES.map((scope) => (
              <Checkbox
                key={scope}
                checked={scopes.includes(scope)}
                onChange={() => toggleScope(scope)}
                label={SCOPE_LABEL[scope]}
              />
            ))}
          </div>
        </div>

        <Input
          label="URL de webhook (optionnel)"
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          placeholder="https://exemple.com/webhooks/procolis"
        />

        <Input
          label="Secret de webhook (optionnel)"
          value={webhookSecret}
          onChange={(e) => setWebhookSecret(e.target.value)}
          placeholder="Généré automatiquement si vide"
        />

        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
          Le secret de la clé ne s'affichera qu'une seule fois après la création. Conservez-le en lieu sûr.
        </p>

        {error && <Toast tone="error" message={error} />}
      </div>
    </Dialog>
  )
}

function SecretRevealDialog({ revealed, onClose }: { revealed: BusinessApiKeyWithSecret; onClose: () => void }) {
  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      /* Clipboard indisponible : la valeur reste sélectionnable manuellement. */
    }
  }

  return (
    <Dialog
      open
      icon="vpn_key"
      iconTone="amber"
      title="Secret généré"
      onClose={onClose}
      actions={<Button onClick={onClose}>J'ai copié la clé</Button>}
    >
      <div className="pc-form" style={{ gap: 12 }}>
        <Toast
          tone="warning"
          title="Ce secret ne s'affichera plus jamais"
          message="Copiez-le maintenant. Si vous le perdez, régénérez la clé pour en obtenir un nouveau."
        />

        <SecretField label="Clé secrète" value={revealed.secretOnce ?? ''} onCopy={copy} />

        {revealed.webhookSecretOnce && (
          <SecretField label="Secret de webhook" value={revealed.webhookSecretOnce} onCopy={copy} />
        )}

        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Identifiant public : <span style={{ fontFamily: 'var(--font-mono)' }}>{revealed.keyId}</span>
        </div>
      </div>
    </Dialog>
  )
}

function SecretField({ label, value, onCopy }: { label: string; value: string; onCopy: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-strong)' }}>{label}</span>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 10px',
          background: 'var(--surface-sunken)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
        }}
      >
        <code
          style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--text-strong)', wordBreak: 'break-all' }}
        >
          {value}
        </code>
        <Button size="sm" variant="ghost" icon="content_copy" onClick={() => onCopy(value)} aria-label="Copier" title="Copier" />
      </div>
    </div>
  )
}
