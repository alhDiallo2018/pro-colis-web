import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Avatar, Badge, Icon } from '@/ds'
import { Panel } from '@/components/Panel'
import * as messagesApi from '@/lib/api/messages'
import type { ModerationConversation, ModerationMessage } from '@/lib/api/messages'
import { useIsMobile } from '@/lib/useMediaQuery'

function fmtTime(iso?: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function roleLabel(role?: string) {
  switch (role) {
    case 'client':
      return 'Client'
    case 'driver':
      return 'Chauffeur'
    case 'support':
      return 'Support'
    case 'support_technique':
      return 'Support technique'
    case 'support_commercial':
      return 'Support commercial'
    case 'super_admin':
      return 'Super admin'
    case 'admin':
      return 'Admin'
    default:
      return role ?? '—'
  }
}

export function ModerationScreen() {
  const qc = useQueryClient()
  const isMobile = useIsMobile()
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selected, setSelected] = useState<ModerationConversation | null>(null)

  const conversationsQuery = useQuery({
    queryKey: ['admin', 'moderation', 'conversations', search],
    queryFn: () => messagesApi.adminModerationConversations({ search, limit: 100 }),
  })

  const threadQuery = useQuery({
    queryKey: ['admin', 'moderation', 'thread', selected?.userA.id, selected?.userB.id],
    queryFn: async () => {
      if (!selected) return []
      return messagesApi.adminModerationThread(selected.userA.id, selected.userB.id)
    },
    enabled: Boolean(selected),
    refetchInterval: 5000,
  })

  const conversations = useMemo(
    () => conversationsQuery.data?.conversations ?? [],
    [conversationsQuery.data],
  )
  const messages = useMemo(
    () => (threadQuery.data ?? []) as ModerationMessage[],
    [threadQuery.data],
  )

  const invalidateThread = () => {
    if (!selected) return
    qc.invalidateQueries({ queryKey: ['admin', 'moderation', 'thread', selected.userA.id, selected.userB.id] })
    qc.invalidateQueries({ queryKey: ['admin', 'moderation', 'conversations'] })
  }

  const moderateMutation = useMutation({
    mutationFn: async ({ messageId, reason }: { messageId: string; reason?: string }) => {
      await messagesApi.moderateMessage(messageId, reason)
    },
    onSuccess: invalidateThread,
  })

  const restoreMutation = useMutation({
    mutationFn: async (messageId: string) => {
      await messagesApi.restoreMessage(messageId)
    },
    onSuccess: invalidateThread,
  })

  const handleModerate = (message: ModerationMessage) => {
    const reason = window.prompt('Motif de modération (facultatif)', '')?.trim()
    if (reason === null) return
    moderateMutation.mutate({ messageId: message.id, reason: reason || undefined })
  }

  const handleRestore = (messageId: string) => {
    restoreMutation.mutate(messageId)
  }

  const submitSearch = () => setSearch(searchInput.trim())

  const showList = !isMobile || !selected
  const showThread = !isMobile || Boolean(selected)

  const outerStyle: React.CSSProperties = isMobile
    ? { height: 'calc(100dvh - 150px)', minHeight: 420, display: 'flex', flexDirection: 'column' }
    : {
        display: 'grid',
        gridTemplateColumns: '340px minmax(0,1fr)',
        gap: 0,
        height: 'calc(100vh - 160px)',
        minHeight: 480,
      }

  return (
    <div style={outerStyle}>
      {showList && (
        <Panel
          flush
          style={
            isMobile
              ? { flex: 1, minHeight: 0 }
              : { borderRight: 'none', borderTopRightRadius: 0, borderBottomRightRadius: 0 }
          }
        >
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text-strong)' }}>
              Modération
            </div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginTop: 2 }}>
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitSearch()
                }}
                placeholder="Nom ou téléphone..."
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--fs-sm)',
                  fontFamily: 'var(--font-body)',
                  outline: 'none',
                  background: 'var(--surface-input)',
                  color: 'var(--text-body)',
                }}
              />
              <button
                onClick={submitSearch}
                style={{
                  flex: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 38,
                  height: 38,
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-primary)',
                  color: '#fff',
                  cursor: 'pointer',
                }}
                aria-label="Rechercher"
              >
                <Icon name="search" size={20} />
              </button>
            </div>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {conversationsQuery.isLoading ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Chargement...</div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>
                <Icon name="forum" size={32} style={{ color: 'var(--text-faint)', marginBottom: 8 }} />
                <p>Aucune conversation.</p>
              </div>
            ) : (
              conversations.map((c) => {
                const peer = c.userA
                const isSelected =
                  selected?.userA.id === c.userA.id && selected?.userB.id === c.userB.id
                return (
                  <div
                    key={`${c.userA.id}::${c.userB.id}`}
                    onClick={() => setSelected(c)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 16px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border-subtle)',
                      background: isSelected ? 'var(--color-primary-soft)' : undefined,
                    }}
                  >
                    <Avatar name={peer.fullName} size="md" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'var(--fs-sm)', color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {peer.fullName} <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>↔</span> {c.userB.fullName}
                      </div>
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-faint)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.body?.slice(0, 60) ?? 'Aucun message'}
                      </div>
                    </div>
                    <div style={{ flex: 'none', textAlign: 'right' }}>
                      <Badge tone="neutral">{c.messageCount}</Badge>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Panel>
      )}

      {showThread && (
        <Panel style={isMobile ? { flex: 1, minHeight: 0 } : { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}>
          {selected ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 0 12px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 12 }}>
                {isMobile && (
                  <button
                    onClick={() => setSelected(null)}
                    aria-label="Retour"
                    style={{ flex: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, border: 'none', background: 'transparent', color: 'var(--text-body)', cursor: 'pointer' }}
                  >
                    <Icon name="arrow_back" size={22} />
                  </button>
                )}
                <Avatar name={selected.userA.fullName} size="sm" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--fs-body)', color: 'var(--text-strong)' }}>
                    {selected.userA.fullName} ↔ {selected.userB.fullName}
                  </div>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                    {roleLabel(selected.userA.role)} · {roleLabel(selected.userB.role)}
                  </div>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '0 4px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {threadQuery.isLoading ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Chargement des messages...</div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Aucun message dans cette conversation.</div>
                ) : (
                  messages.map((m) => {
                    const isDeleted = Boolean(m.deletedAt)
                    return (
                      <div
                        key={m.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-end',
                          gap: 8,
                          flexDirection: m.senderId === selected.userA.id ? 'row' : 'row-reverse',
                        }}
                      >
                        <div
                          style={{
                            maxWidth: '75%',
                            padding: '10px 14px',
                            borderRadius: '16px',
                            background: isDeleted ? 'var(--color-danger-soft)' : 'var(--surface-raised)',
                            color: 'var(--text-body)',
                            fontSize: 'var(--fs-sm)',
                            lineHeight: 1.5,
                            wordBreak: 'break-word',
                            opacity: isDeleted ? 0.65 : 1,
                          }}
                        >
                          <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 600, opacity: 0.7, marginBottom: 2 }}>
                            {m.sender?.fullName ?? 'Utilisateur'}
                            {isDeleted && (
                              <span style={{ marginLeft: 8, color: 'var(--color-danger)' }}>
                                · masqué
                              </span>
                            )}
                          </div>
                          {m.body && <div style={{ whiteSpace: 'pre-wrap' }}>{m.body}</div>}
                          {m.audioUrl && <audio controls src={m.audioUrl} style={{ display: 'block', height: 36, maxWidth: 220, marginTop: m.body ? 6 : 0 }} />}
                          {m.photoUrl && (
                            <img
                              src={m.photoUrl}
                              alt="Photo"
                              style={{ display: 'block', maxWidth: 220, maxHeight: 260, borderRadius: 8, marginTop: m.body ? 6 : 0, cursor: 'pointer' }}
                              onClick={() => window.open(m.photoUrl!, '_blank')}
                            />
                          )}
                          {m.videoUrl && <video controls src={m.videoUrl} style={{ display: 'block', maxWidth: 220, maxHeight: 260, borderRadius: 8, marginTop: m.body ? 6 : 0 }} />}
                          {isDeleted && m.deletedReason && (
                            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-danger)', marginTop: 4 }}>
                              Motif : {m.deletedReason}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: 'none' }}>
                          <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>{fmtTime(m.createdAt)}</span>
                          {isDeleted ? (
                            <button
                              onClick={() => handleRestore(m.id)}
                              disabled={restoreMutation.isPending}
                              title="Restaurer ce message"
                              style={{ border: 'none', background: 'transparent', color: 'var(--teal-600)', cursor: 'pointer', padding: 2 }}
                            >
                              <Icon name="restore" size={18} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleModerate(m)}
                              disabled={moderateMutation.isPending}
                              title="Masquer ce message"
                              style={{ border: 'none', background: 'transparent', color: 'var(--color-danger)', cursor: 'pointer', padding: 2 }}
                            >
                              <Icon name="shield" size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: 12 }}>
              <Icon name="shield" size={48} style={{ color: 'var(--text-faint)' }} />
              <div style={{ fontSize: 'var(--fs-body)', fontWeight: 600 }}>Modération des échanges</div>
              <div style={{ fontSize: 'var(--fs-sm)' }}>Sélectionnez une conversation pour la consulter.</div>
            </div>
          )}
        </Panel>
      )}
    </div>
  )
}
