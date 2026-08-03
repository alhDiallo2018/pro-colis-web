import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge, Button, Dialog, IconButton, Input, StatBox, Toast } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import * as systemApi from '@/lib/api/system'
import { BackupsPanel } from './BackupsPanel'
import { ApiError } from '@/lib/api/client'
import { formatDateTime } from '@/lib/format'

/** Événements que l'API sait pousser (alignés sur les types de notification). */
const EVENT_CHOICES = [
  'parcel.created',
  'parcel.status_changed',
  'parcel.delivered',
  'bid.received',
  'bid.accepted',
  'payment.completed',
  'withdrawal.requested',
]

function formatUptime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '—'
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (days > 0) return `${days} j ${hours} h`
  if (hours > 0) return `${hours} h ${minutes} min`
  return `${minutes} min`
}

/**
 * Santé applicative et abonnements sortants.
 *
 * La sonde `/super-admin/system/health` répond 503 quand la base est
 * injoignable : l'erreur de requête est donc elle-même l'information, on
 * l'affiche en dégradé plutôt qu'en écran d'erreur générique.
 */
export function SystemePage() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [events, setEvents] = useState<string[]>([])
  const [secret, setSecret] = useState('')
  const [deleting, setDeleting] = useState<systemApi.Webhook | null>(null)

  const health = useQuery({
    queryKey: ['admin', 'system', 'health'],
    queryFn: () => systemApi.systemHealth(),
    refetchInterval: 30_000,
    retry: false,
  })

  const webhooks = useQuery({
    queryKey: ['admin', 'webhooks'],
    queryFn: () => systemApi.listWebhooks(),
  })

  const create = useMutation({
    mutationFn: () => systemApi.createWebhook({ url: url.trim(), events, secret: secret.trim() || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'webhooks'] })
      setOpen(false)
      setUrl('')
      setEvents([])
      setSecret('')
    },
  })

  const remove = useMutation({
    mutationFn: (webhookId: string) => systemApi.deleteWebhook(webhookId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'webhooks'] })
      setDeleting(null)
    },
  })

  const degraded = health.isError || health.data?.status !== 'healthy'
  const createError = create.error instanceof ApiError ? create.error.message : null

  const toggleEvent = (event: string) =>
    setEvents((current) => (current.includes(event) ? current.filter((e) => e !== event) : [...current, event]))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Panel title="Santé de l'API">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
          <StatBox
            icon={degraded ? 'error' : 'check_circle'}
            tone={degraded ? 'red' : 'green'}
            value={degraded ? 'Dégradé' : 'Opérationnel'}
            label="État général"
          />
          <StatBox
            icon="database"
            tone={health.data?.database === 'connected' ? 'green' : 'red'}
            value={health.data?.database === 'connected' ? 'Connectée' : 'Injoignable'}
            label="Base de données"
          />
          <StatBox icon="schedule" tone="teal" value={formatUptime(health.data?.uptime ?? 0)} label="Uptime du process" />
          <StatBox
            icon="update"
            tone="neutral"
            value={health.data?.timestamp ? formatDateTime(health.data.timestamp) : '—'}
            label="Dernière sonde"
          />
        </div>
        {health.isError && (
          <Toast
            tone="error"
            message="L'API ne répond pas correctement à la sonde de santé."
            style={{ marginTop: 14 }}
          />
        )}
      </Panel>

      <BackupsPanel />

      <Panel
        title={`Webhooks${webhooks.data ? ` · ${webhooks.data.length}` : ''}`}
        action={
          <Button size="sm" icon="add" onClick={() => setOpen(true)}>
            Nouveau webhook
          </Button>
        }
        flush
      >
        <QueryState
          isLoading={webhooks.isLoading}
          isError={webhooks.isError}
          error={webhooks.error}
          isEmpty={(webhooks.data?.length ?? 0) === 0}
          emptyTitle="Aucun webhook"
          emptyMessage="Déclarez une URL pour recevoir les événements de la plateforme."
          onRetry={() => webhooks.refetch()}
        >
          {(webhooks.data ?? []).map((hook) => (
            <div
              key={hook.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 16px', borderBottom: '1px solid var(--slate-100)',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-strong)', overflowWrap: 'anywhere' }}>
                  {hook.url}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                  {hook.events.map((event) => (
                    <Badge key={event} tone="neutral">{event}</Badge>
                  ))}
                  {hook.hasSecret && <Badge tone="green">signé</Badge>}
                  {hook.isActive === false && <Badge tone="red">inactif</Badge>}
                </div>
              </div>
              <IconButton icon="delete" size="sm" variant="danger" title="Supprimer" onClick={() => setDeleting(hook)} />
            </div>
          ))}
        </QueryState>
      </Panel>

      {open && (
        <Dialog
          open
          onClose={() => setOpen(false)}
          icon="webhook"
          iconTone="primary"
          title="Nouveau webhook"
          style={{ maxWidth: 520 }}
          actions={
            <>
              <Button variant="secondary" block onClick={() => setOpen(false)}>Annuler</Button>
              <Button
                block
                loading={create.isPending}
                disabled={!/^https?:\/\/\S+$/i.test(url.trim()) || events.length === 0}
                onClick={() => create.mutate()}
              >
                Créer
              </Button>
            </>
          }
        >
          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input
              label="URL de destination"
              icon="link"
              placeholder="https://exemple.com/hooks/procolis"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <div>
              <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--text-strong)', marginBottom: 8 }}>
                Événements
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {EVENT_CHOICES.map((event) => {
                  const active = events.includes(event)
                  return (
                    <button
                      key={event}
                      type="button"
                      onClick={() => toggleEvent(event)}
                      style={{
                        padding: '6px 12px', borderRadius: 999, cursor: 'pointer',
                        fontFamily: 'var(--font-mono)', fontSize: 12,
                        border: `1px solid ${active ? 'var(--color-primary)' : 'var(--border-default)'}`,
                        background: active ? 'var(--teal-50)' : 'var(--surface-card)',
                        color: active ? 'var(--color-primary)' : 'var(--text-muted)',
                      }}
                    >
                      {event}
                    </button>
                  )
                })}
              </div>
            </div>
            <Input
              label="Secret de signature (optionnel)"
              icon="key"
              type="password"
              help="Conservez-le : il ne sera plus affiché après création."
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
            />
            {createError && <Toast tone="error" message={createError} />}
          </div>
        </Dialog>
      )}

      {deleting && (
        <Dialog
          open
          onClose={() => setDeleting(null)}
          icon="delete"
          iconTone="danger"
          title="Supprimer ce webhook ?"
          style={{ maxWidth: 420 }}
          actions={
            <>
              <Button variant="secondary" block onClick={() => setDeleting(null)}>Annuler</Button>
              <Button variant="danger" block loading={remove.isPending} onClick={() => remove.mutate(deleting.id)}>
                Supprimer
              </Button>
            </>
          }
        >
          <p style={{ margin: 0, fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
            Les événements ne seront plus poussés vers {deleting.url}.
          </p>
        </Dialog>
      )}
    </div>
  )
}
