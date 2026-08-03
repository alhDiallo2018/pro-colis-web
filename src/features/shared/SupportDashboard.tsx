import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Avatar, Badge, Button, Icon, StatBox } from '@/ds'
import { Panel } from '@/components/Panel'
import * as messagesApi from '@/lib/api/messages'
import * as assistancesApi from '@/lib/api/assistances'
import { useAuthStore } from '@/store/auth'
import { usePlatformStats, useMyStats } from './profile/hooks'
import { SupportRoleSummary } from './supportRoles/SupportRoleSummary'
import { formatDateTime } from '@/lib/format'
import type { SupportConversation } from '@/lib/api/messages'

const ROLE_LABEL: Record<string, string> = {
  client: 'Client',
  driver: 'Chauffeur',
  admin: 'Admin zone',
  super_admin: 'Super admin',
}

/**
 * Accueil de l'espace support : ce que l'agent connecté doit traiter
 * (conversations en attente, assistances ouvertes) avant la liste complète.
 */
export function SupportDashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const usesPersonalInbox = user?.role === 'support_technique' || user?.role === 'support_commercial'
  const myStats = useMyStats()
  const platform = usePlatformStats()

  const conversations = useQuery({
    queryKey: ['admin', 'support', 'conversations', user?.role],
    queryFn: async (): Promise<SupportConversation[]> => {
      if (!usesPersonalInbox) return messagesApi.adminSupportConversations()

      // Les comptes support spécialisés ne sont pas acceptés par l'endpoint
      // agrégé historique. On adapte donc leur boîte personnelle au même modèle.
      const personal = await messagesApi.conversations()
      return personal.map((conversation) => ({
        id: conversation.id,
        body: conversation.body,
        isRead: (conversation.unreadCount ?? (conversation.isRead ? 0 : 1)) === 0,
        createdAt: conversation.createdAt,
        senderId: conversation.otherUser.id,
        receiverId: user?.id ?? '',
        messageCount: Math.max(conversation.unreadCount ?? 0, 1),
        user: {
          id: conversation.otherUser.id,
          fullName: conversation.otherUser.fullName,
          profilePhoto: conversation.otherUser.profilePhoto ?? null,
          role: conversation.otherUser.role,
        },
        supportUser: {
          id: user?.id ?? '',
          fullName: user?.fullName ?? 'Support',
        },
      }))
    },
    refetchInterval: 15_000,
  })

  const assistances = useQuery({
    queryKey: ['assistances', 'summary'],
    queryFn: () => assistancesApi.listAssistances({ limit: 5 }),
    retry: false,
  })

  const list = conversations.data ?? []
  const unread = list.filter((c) => c.isRead === false).length
  const handledByMe = list.filter((c) => c.agents?.some((a) => a.id === user?.id) || c.lastAgent?.id === user?.id).length
  const summary = assistances.data?.summary

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div
        style={{
          background: 'var(--gradient-brand)',
          borderRadius: 'var(--radius-lg)',
          padding: 20,
          color: '#fff',
          boxShadow: 'var(--shadow-brand)',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 46, height: 46, borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.18)', flex: 'none' }}>
          <Icon name="support_agent" size={24} fill />
        </span>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 11, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>
            Bonjour {user?.fullName?.split(' ')[0] ?? ''}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22 }}>
            {unread > 0 ? `${unread} conversation${unread > 1 ? 's' : ''} à traiter` : 'Aucune conversation en attente'}
          </div>
        </div>
        <Button variant="amber" icon="forum" onClick={() => navigate('/support-admin/conversations')}>
          Ouvrir le support
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
        <StatBox icon="forum" tone="primary" value={list.length} label="Conversations" />
        <StatBox icon="mark_email_unread" tone="amber" value={unread} label="Non lues" />
        <StatBox icon="how_to_reg" tone="teal" value={handledByMe} label="Traitées par moi" />
        <StatBox icon="contact_support" tone="neutral" value={summary?.open ?? '—'} label="Assistances ouvertes" />
        <StatBox icon="pending_actions" tone="amber" value={summary?.inProgress ?? '—'} label="En cours" />
        <StatBox icon="task_alt" tone="green" value={summary?.resolved ?? '—'} label="Résolues" />
      </div>

      {/* Bloc métier propre au mandat de l'agent (tickets ou pipeline). */}
      <SupportRoleSummary />

      <div className="pc-split">
        <Panel
          title="Dernières conversations"
          flush
          action={
            <Button size="sm" variant="secondary" iconTrailing="chevron_right" onClick={() => navigate('/support-admin/conversations')}>
              Tout voir
            </Button>
          }
        >
          {list.length === 0 ? (
            <div style={{ padding: 18, fontSize: 13.5, color: 'var(--text-muted)' }}>
              {conversations.isLoading ? 'Chargement…' : 'Aucune conversation pour le moment.'}
            </div>
          ) : (
            list.slice(0, 6).map((c) => (
              <div
                key={c.id}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: '1px solid var(--slate-100)', cursor: 'pointer' }}
                onClick={() => navigate('/support-admin/conversations')}
              >
                <Avatar name={c.user.fullName} src={c.user.profilePhoto ?? undefined} size="sm" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5, color: 'var(--text-strong)' }}>
                      {c.user.fullName}
                    </span>
                    <span style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{ROLE_LABEL[c.user.role] ?? c.user.role}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.body}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flex: 'none' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>{formatDateTime(c.createdAt)}</div>
                  {c.isRead === false && <Badge tone="amber">Non lue</Badge>}
                </div>
              </div>
            ))
          )}
        </Panel>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Panel
            title="Assistances récentes"
            flush
            action={
              <Button size="sm" variant="ghost" iconTrailing="chevron_right" onClick={() => navigate('/support-admin/assistances')}>
                Tout voir
              </Button>
            }
          >
            {!assistances.data || assistances.data.assistances.length === 0 ? (
              <div style={{ padding: 18, fontSize: 13.5, color: 'var(--text-muted)' }}>Aucune assistance enregistrée.</div>
            ) : (
              assistances.data.assistances.slice(0, 5).map((a) => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderBottom: '1px solid var(--slate-100)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5, color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.subject}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {a.code} · {a.user?.fullName ?? a.contactName ?? '—'}
                    </div>
                  </div>
                  <Badge tone={a.status === 'resolved' ? 'green' : a.status === 'in_progress' ? 'amber' : 'primary'}>
                    {a.status === 'resolved' ? 'Résolue' : a.status === 'in_progress' ? 'En cours' : 'Ouverte'}
                  </Badge>
                </div>
              ))
            )}
          </Panel>

          <Panel title="Mon compte">
            <div style={{ display: 'grid', gap: 12 }}>
              <AccountRow icon="badge" label="Rôle" value={user?.role === 'support_technique' ? 'Support technique' : user?.role === 'support_commercial' ? 'Support commercial' : user?.role === 'super_admin' ? 'Super admin' : 'Support'} />
              <AccountRow icon="notifications" label="Notifications non lues" value={myStats.data?.unreadNotifications ?? '—'} />
              <AccountRow icon="group" label="Comptes plateforme" value={platform.data?.totalUsers ?? '—'} />
              <AccountRow icon="package_2" label="Colis plateforme" value={platform.data?.totalParcels ?? '—'} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <Button size="sm" variant="secondary" block icon="person" onClick={() => navigate('/support-admin/profil')}>
                Mon profil
              </Button>
              <Button size="sm" variant="ghost" block icon="notifications" onClick={() => navigate('/support-admin/notifications')}>
                Notifications
              </Button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}

function AccountRow({ icon, label, value }: { icon: string; label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Icon name={icon} size={18} style={{ color: 'var(--text-faint)' }} />
      <span style={{ flex: 1, fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13, color: 'var(--text-strong)' }}>{value}</span>
    </div>
  )
}
