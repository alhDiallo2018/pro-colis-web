import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Badge, Button, Card, Icon } from '@/ds'
import { QueryState } from '@/components/QueryState'
import * as notificationsApi from '@/lib/api/notifications'
import type { AppNotification } from '@/lib/api/notifications'
import { formatDateTime, formatFcfa } from '@/lib/format'
import { useAuthStore } from '@/store/auth'
import { notificationAction } from '@/lib/notification-links'

const TYPE_ICONS: Record<string, { icon: string; tone: string }> = {
  bid_received: { icon: 'gavel', tone: 'var(--amber-500)' },
  bid_accepted: { icon: 'check_circle', tone: 'var(--green-500)' },
  bid_rejected: { icon: 'cancel', tone: 'var(--red-500)' },
  parcel_created: { icon: 'add_box', tone: 'var(--teal-500)' },
  parcel_delivered: { icon: 'task_alt', tone: 'var(--green-500)' },
  parcel_in_transit: { icon: 'local_shipping', tone: 'var(--teal-500)' },
  driver_assigned: { icon: 'person_add', tone: 'var(--teal-500)' },
  payment_confirmed: { icon: 'payments', tone: 'var(--green-500)' },
  welcome: { icon: 'waving_hand', tone: 'var(--amber-500)' },
}

function getIconInfo(type: string) {
  return TYPE_ICONS[type] ?? { icon: 'notifications', tone: 'var(--text-muted)' }
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  picked_up: 'Ramassé',
  in_transit: 'En transit',
  arrived: 'Arrivé',
  out_for_delivery: 'En livraison',
  delivered: 'Livré',
  cancelled: 'Annulé',
  completed: 'Terminé',
  failed: 'Échoué',
}

interface NotificationDetail {
  label: string
  value: string
}

/**
 * Transforme uniquement les métadonnées métier utiles du JSON de l'API.
 * Les identifiants techniques restent masqués pour garder le détail lisible.
 */
function notificationDetails(notification: AppNotification): NotificationDetail[] {
  const data = notification.data ?? {}
  const details: NotificationDetail[] = []
  const add = (label: string, value: unknown) => {
    if (typeof value === 'string' && value.trim()) details.push({ label, value })
    else if (typeof value === 'number' && Number.isFinite(value)) details.push({ label, value: String(value) })
  }

  add('Expéditeur', notification.senderName)
  add('Numéro de suivi', data.trackingNumber)
  if (typeof data.status === 'string') {
    add('Statut du colis', STATUS_LABELS[data.status] ?? data.status)
  }

  const amount = data.amount ?? data.price ?? data.bidPrice ?? data.earning
  if ((typeof amount === 'number' || typeof amount === 'string') && Number.isFinite(Number(amount))) {
    details.push({ label: 'Montant', value: formatFcfa(Number(amount)) })
  }
  add('Référence', data.reference)
  add('Mode de paiement', data.method)
  add('Motif', data.reason)

  return details
}

export function NotificationsScreen() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const role = useAuthStore((state) => state.user?.role)
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedId = searchParams.get('notification')
  const query = useQuery({
    queryKey: ['notifications', 'all'],
    queryFn: () => notificationsApi.list(50),
    refetchInterval: 15000,
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onMutate: (id) => {
      // Le statut visuel passe immédiatement à « lu » ; la liste précédente
      // permet de restaurer l'état si l'API refuse exceptionnellement l'appel.
      const previous = qc.getQueryData<AppNotification[]>(['notifications', 'all'])
      qc.setQueryData<AppNotification[]>(['notifications', 'all'], (current) =>
        current?.map((notification) =>
          notification.id === id ? { ...notification, isRead: true } : notification,
        ),
      )
      return { previous }
    },
    onError: (_error, _id, context) => {
      if (context?.previous) qc.setQueryData(['notifications', 'all'], context.previous)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const notifications = query.data ?? []

  const openNotification = (notification: AppNotification) => {
    const next = new URLSearchParams(searchParams)
    if (selectedId === notification.id) next.delete('notification')
    else next.set('notification', notification.id)
    setSearchParams(next, { replace: true })
    if (!notification.isRead) markReadMutation.mutate(notification.id)
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h2)', color: 'var(--text-strong)' }}>
          Notifications
        </h2>
        {notifications.some((n) => !n.isRead) && (
          <Button
            variant="secondary"
            size="sm"
            icon="done_all"
            loading={markAllMutation.isPending}
            onClick={() => markAllMutation.mutate()}
          >
            Tout marquer comme lu
          </Button>
        )}
      </div>

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        isEmpty={notifications.length === 0}
        emptyTitle="Aucune notification"
        emptyMessage="Vous serez notifié ici des mises à jour de vos colis."
        onRetry={() => query.refetch()}
      >
        {notifications.map((n) => {
          const { icon, tone } = getIconInfo(n.type)
          const isOpen = selectedId === n.id
          const details = notificationDetails(n)
          const action = notificationAction(n, role)
          return (
            <Card
              key={n.id}
              padding="none"
              style={{
                overflow: 'hidden',
                borderColor: isOpen ? 'var(--teal-300)' : 'var(--border-subtle)',
                boxShadow: isOpen ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
            >
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`notification-detail-${n.id}`}
                onClick={() => openNotification(n)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  width: '100%',
                  padding: 16,
                  border: 0,
                  background: !n.isRead || isOpen ? 'var(--teal-50)' : 'var(--surface-card)',
                  color: 'inherit',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: 'var(--radius-md)',
                    background: `${tone}15`,
                    color: tone,
                    flex: 'none',
                    marginTop: 2,
                  }}
                >
                  <Icon name={icon} size={22} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text-strong)' }}>
                      {n.title}
                    </div>
                    {!n.isRead && <Badge tone="primary">Non lue</Badge>}
                  </div>
                  <div
                    style={{
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: 2,
                      overflow: 'hidden',
                      fontSize: 13,
                      color: 'var(--text-muted)',
                      marginTop: 3,
                      lineHeight: 1.45,
                    }}
                  >
                    {n.body}
                  </div>
                  {n.createdAt && (
                    <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 6 }}>
                      {formatDateTime(n.createdAt)}
                    </div>
                  )}
                </div>
                <Icon
                  name={isOpen ? 'expand_less' : 'expand_more'}
                  size={20}
                  style={{ color: 'var(--text-faint)', marginTop: 10, flex: 'none' }}
                />
              </button>

              {isOpen && (
                <div
                  id={`notification-detail-${n.id}`}
                  role="region"
                  aria-label={`Détail de la notification ${n.title}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    padding: '18px clamp(16px, 3vw, 20px) 20px clamp(16px, 10vw, 74px)',
                    borderTop: '1px solid var(--border-subtle)',
                    background: 'var(--surface-card)',
                  }}
                >
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                      Message complet
                    </div>
                    <div style={{ maxWidth: '70ch', whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.65, color: 'var(--text-body)' }}>
                      {n.body}
                    </div>
                  </div>

                  {details.length > 0 && (
                    <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, margin: 0 }}>
                      {details.map((detail) => (
                        <div key={`${detail.label}-${detail.value}`} style={{ minWidth: 0 }}>
                          <dt style={{ fontSize: 11.5, color: 'var(--text-faint)', marginBottom: 3 }}>{detail.label}</dt>
                          <dd style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: 'var(--text-strong)', overflowWrap: 'anywhere' }}>
                            {detail.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-faint)' }}>
                      <Icon name="done" size={16} />
                      Notification lue
                    </span>
                    {action && (
                      <Button
                        size="sm"
                        iconTrailing="arrow_forward"
                        onClick={() => navigate(action.to)}
                      >
                        {action.label}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </QueryState>
    </div>
  )
}
