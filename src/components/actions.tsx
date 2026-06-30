import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Icon } from '@/ds'
import * as notificationsApi from '@/lib/api/notifications'
import type { AppNotification } from '@/lib/api/notifications'
import { useAuthStore } from '@/store/auth'

/** Topbar primary button that navigates to a route. */
export function NavButton({ to, icon, children }: { to: string; icon?: string; children: React.ReactNode }) {
  const navigate = useNavigate()
  return (
    <Button icon={icon} onClick={() => navigate(to)}>
      {children}
    </Button>
  )
}

const TYPE_ICON: Record<string, string> = {
  parcel_status: 'local_shipping',
  delivery_confirmed: 'task_alt',
  bid: 'gavel',
  bid_received: 'gavel',
  offer: 'gavel',
}

function relativeTime(iso?: string): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.round(diff / 60000)
  if (min < 1) return "à l'instant"
  if (min < 60) return `il y a ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `il y a ${h} h`
  const d = Math.round(h / 24)
  if (d < 7) return `il y a ${d} j`
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

/** Notifications bell with an unread badge and a dropdown panel. */
export function NotifButton() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const role = useAuthStore((s) => s.user?.role)
  const qc = useQueryClient()

  const unread = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: notificationsApi.unreadCount,
    refetchInterval: 30_000,
  })
  const list = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => notificationsApi.list(),
    enabled: open,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['notifications'] })
  const markRead = useMutation({ mutationFn: notificationsApi.markRead, onSuccess: invalidate })
  const markAll = useMutation({ mutationFn: notificationsApi.markAllRead, onSuccess: invalidate })

  const count = unread.data ?? 0
  const items = list.data ?? []

  const onOpen = (n: AppNotification) => {
    if (!n.isRead) markRead.mutate(n.id)
    if (n.parcelId && role === 'client') {
      setOpen(false)
      navigate(`/client/colis/${n.parcelId}`)
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        aria-label="Notifications"
        onClick={() => setOpen((o) => !o)}
        style={{
          position: 'relative',
          width: 42,
          height: 42,
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          background: open ? 'var(--surface-sunken)' : 'var(--surface-card)',
          color: 'var(--text-body)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <Icon name="notifications" size={22} />
        {count > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              minWidth: 17,
              height: 17,
              padding: '0 4px',
              borderRadius: 9,
              background: 'var(--color-danger)',
              color: '#fff',
              fontFamily: 'var(--font-display)',
              fontSize: 10.5,
              fontWeight: 700,
              lineHeight: '17px',
              textAlign: 'center',
              border: '2px solid var(--surface-card)',
            }}
          >
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: 360,
              maxWidth: 'calc(100vw - 32px)',
              maxHeight: 460,
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--surface-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg, 0 12px 32px rgba(15,23,42,0.18))',
              zIndex: 50,
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--fs-title)', color: 'var(--text-strong)' }}>Notifications</span>
              {count > 0 && (
                <button
                  onClick={() => markAll.mutate()}
                  disabled={markAll.isPending}
                  style={{ border: 'none', background: 'transparent', color: 'var(--text-link)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'var(--fs-sm)', cursor: 'pointer' }}
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>

            <div style={{ overflowY: 'auto' }}>
              {list.isLoading ? (
                <p style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>Chargement…</p>
              ) : items.length === 0 ? (
                <div style={{ padding: '32px 24px', textAlign: 'center' }}>
                  <Icon name="notifications_off" size={28} style={{ color: 'var(--text-faint)' }} />
                  <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>Aucune notification</p>
                </div>
              ) : (
                items.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => onOpen(n)}
                    style={{
                      display: 'flex',
                      gap: 12,
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 14px',
                      border: 'none',
                      borderBottom: '1px solid var(--border-subtle)',
                      background: n.isRead ? 'transparent' : 'var(--teal-50)',
                      cursor: 'pointer',
                    }}
                  >
                    <span
                      style={{
                        width: 36,
                        height: 36,
                        flex: 'none',
                        borderRadius: '50%',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--surface-sunken)',
                        color: 'var(--teal-600)',
                      }}
                    >
                      <Icon name={TYPE_ICON[n.type] ?? 'notifications'} size={20} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--fs-sm)', color: 'var(--text-strong)' }}>{n.title}</span>
                        {!n.isRead && <span style={{ width: 8, height: 8, flex: 'none', borderRadius: '50%', background: 'var(--teal-500)' }} />}
                      </div>
                      <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.body}</div>
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-faint)', marginTop: 3 }}>{relativeTime(n.createdAt)}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
