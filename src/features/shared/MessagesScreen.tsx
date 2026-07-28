import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Avatar, Badge, Icon } from '@/ds'
import { Panel } from '@/components/Panel'
import { NegotiationChat } from '@/components/NegotiationChat'
import * as messagesApi from '@/lib/api/messages'
import type { ConversationSummary } from '@/lib/api/messages'
import { useIsMobile } from '@/lib/useMediaQuery'

interface Thread {
  key: string
  peerId: string
  peerName: string
  parcelId?: string | null
  trackingNumber?: string | null
  lastMessage: string
  lastAt: string
  unread: number
}

function previewText(msg: ConversationSummary): string {
  if (!msg.body) return ''
  if (msg.body.startsWith('__PRIX__')) {
    const parts = msg.body.split(':')
    const amount = Number(parts[1])
    if (!Number.isNaN(amount)) return `Proposition : ${new Intl.NumberFormat('fr-FR').format(amount)} FCFA`
  }
  return msg.body.slice(0, 80)
}

export function MessagesScreen() {
  const conv = useQuery({
    queryKey: ['messages', 'conversations'],
    queryFn: () => messagesApi.conversations(),
    refetchInterval: 8000,
  })
  const [activeThread, setActiveThread] = useState<Thread | null>(null)

  const threads = useMemo(() => {
    const msgs = conv.data ?? []
    const map = new Map<string, Thread>()

    for (const m of msgs) {
      const peer = m.otherUser
      if (!peer?.id) continue
      const key = `${peer.id}::${m.parcelId ?? '_'}`
      const peerName = peer.fullName?.trim() || 'Inconnu'

      const unread = !m.isRead ? 1 : 0

      const existing = map.get(key)
      if (existing) {
        if (unread) existing.unread += 1
        if (m.createdAt > existing.lastAt) {
          existing.lastMessage = previewText(m)
          existing.lastAt = m.createdAt
        }
      } else {
        map.set(key, {
          key,
          peerId: peer.id,
          peerName,
          parcelId: m.parcelId,
          trackingNumber: m.trackingNumber,
          lastMessage: previewText(m),
          lastAt: m.createdAt,
          unread,
        })
      }
    }
    return Array.from(map.values()).sort((a, b) => (b.lastAt ?? '').localeCompare(a.lastAt ?? ''))
  }, [conv.data])

  const selected = activeThread
  const isMobile = useIsMobile()
  const showList = !isMobile || !selected
  const showChat = !isMobile || Boolean(selected)

  const outerStyle: React.CSSProperties = isMobile
    ? { height: 'calc(100dvh - 150px)', minHeight: 420, display: 'flex', flexDirection: 'column' }
    : { display: 'grid', gridTemplateColumns: '320px minmax(0,1fr)', gap: 0, height: 'calc(100vh - 160px)', minHeight: 480 }

  return (
    <div style={outerStyle}>
      {/* Conversations list */}
      {showList && (
      <Panel flush style={isMobile ? { flex: 1, minHeight: 0 } : { borderRight: 'none', borderTopRightRadius: 0, borderBottomRightRadius: 0 }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text-strong)' }}>Messages</div>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {threads.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>
              <Icon name="forum" size={32} style={{ color: 'var(--text-faint)', marginBottom: 8 }} />
              <p>Aucune conversation pour le moment.</p>
              <p style={{ fontSize: 'var(--fs-xs)' }}>Negociez une offre pour demarrer un chat.</p>
            </div>
              ) : (
            threads.map((t) => (
              <div
                key={t.key}
                onClick={() => setActiveThread(t)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border-subtle)',
                  background: selected?.key === t.key ? 'var(--color-primary-soft)' : undefined,
                  transition: 'background 0.15s',
                }}
              >
                <Avatar name={t.peerName} size="md" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'var(--fs-sm)', color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.peerName}
                    </span>
                    {t.trackingNumber && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: 'var(--teal-600)', background: 'var(--teal-50)', padding: '2px 6px', borderRadius: 'var(--radius-pill)', whiteSpace: 'nowrap' }}>
                        {t.trackingNumber}
                      </span>
                    )}
                    {t.unread > 0 && <Badge tone="primary">{t.unread}</Badge>}
                  </div>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-faint)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.lastMessage}
                  </div>
                </div>
              </div>
            ))  
          )}
        </div>
      </Panel>
      )}

      {/* Chat area */}
      {showChat && (
      <Panel style={isMobile ? { flex: 1, minHeight: 0 } : { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}>
        {selected ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 0 14px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 12 }}>
              {isMobile && (
                <button
                  onClick={() => setActiveThread(null)}
                  aria-label="Retour"
                  style={{ flex: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, border: 'none', background: 'transparent', color: 'var(--text-body)', cursor: 'pointer' }}
                >
                  <Icon name="arrow_back" size={22} />
                </button>
              )}
              <Avatar name={selected.peerName} size="sm" />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--fs-body)', color: 'var(--text-strong)' }}>
                  {selected.peerName}
                </div>
              </div>
            </div>
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <NegotiationChat
                peerId={selected.peerId}
                peerName={selected.peerName}
                parcelId={selected.parcelId ?? undefined}
              />
            </div>
          </div>
        ) : (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: 12 }}>
            <Icon name="forum" size={48} style={{ color: 'var(--text-faint)' }} />
            <div style={{ fontSize: 'var(--fs-body)', fontWeight: 600 }}>Selectionnez une conversation</div>
            <div style={{ fontSize: 'var(--fs-sm)' }}>ou demarrez-en une depuis une offre.</div>
          </div>
        )}
      </Panel>
      )}
    </div>
  )
}
