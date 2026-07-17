import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Card, EmptyState } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import * as notificationsApi from '@/lib/api/notifications'
import { formatDateTime } from '@/lib/format'

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

export function NotificationsScreen() {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: ['notifications', 'all'],
    queryFn: () => notificationsApi.list(50),
    refetchInterval: 15000,
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
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
          return (
            <Card
              key={n.id}
              style={{
                opacity: n.isRead ? 0.65 : 1,
                cursor: n.isRead ? 'default' : 'pointer',
                transition: 'opacity 0.2s',
              }}
              onClick={() => {
                if (!n.isRead) markReadMutation.mutate(n.id)
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
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
                  <span className="material-symbols-rounded" style={{ fontSize: 22 }}>
                    {icon}
                  </span>
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text-strong)' }}>
                    {n.title}
                    {!n.isRead && (
                      <span
                        style={{
                          display: 'inline-block',
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: 'var(--teal-500)',
                          marginLeft: 8,
                          verticalAlign: 'middle',
                        }}
                      />
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>
                    {n.body}
                  </div>
                  {n.createdAt && (
                    <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 6 }}>
                      {formatDateTime(n.createdAt)}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </QueryState>
    </div>
  )
}
