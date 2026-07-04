import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Avatar, Badge, Icon } from '@/ds'
import { Panel } from '@/components/Panel'
import { NegotiationChat } from '@/components/NegotiationChat'
import * as messagesApi from '@/lib/api/messages'
import type { ConversationMessage } from '@/lib/api/messages'
import { useAuthStore } from '@/store/auth'

function extractParcel(p: NonNullable<ConversationMessage['parcel']>): NonNullable<ConversationMessage['parcel']> {
  return {
    id: p.id,
    trackingNumber: p.trackingNumber,
    description: p.description,
    weight: p.weight,
    type: p.type,
    status: p.status,
    receiverName: p.receiverName,
    receiverPhone: p.receiverPhone,
    receiverAddress: p.receiverAddress,
    photoUrls: (p as any).media?.filter((m: any) => m.mediaType === 'photo').map((m: any) => m.url) ?? [],
    videoUrls: (p as any).media?.filter((m: any) => m.mediaType === 'video').map((m: any) => m.url) ?? [],
    audioUrls: (p as any).media?.filter((m: any) => m.mediaType === 'audio').map((m: any) => m.url) ?? [],
  }
}

interface Thread {
  key: string
  peerId: string
  peerName: string
  parcelId?: string | null
  parcel?: ConversationMessage['parcel']
  trackingNumber?: string
  parcelDescription?: string
  lastMessage?: string
  lastAt?: string
  unread: number
}

function previewText(msg: ConversationMessage): string {
  if (msg.audioUrl && !msg.body) return 'Message vocal'
  if (msg.body.startsWith('__PRIX__')) {
    const parts = msg.body.split(':')
    const amount = Number(parts[1])
    if (!Number.isNaN(amount)) return `Proposition : ${new Intl.NumberFormat('fr-FR').format(amount)} FCFA`
  }
  return msg.body.slice(0, 80)
}

export function MessagesScreen() {
  const userId = useAuthStore((s) => s.user?.id)
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
      const other = m.senderId === userId ? m.receiver : m.sender
      if (!other) continue
      const key = `${other.id}::${m.parcelId ?? '_'}`

      const existing = map.get(key)
      const unread = !m.isRead && m.receiverId === userId ? 1 : 0
      if (existing) {
        if (unread) existing.unread += 1
        if (m.parcelId && m.parcel) {
          existing.parcelId = m.parcelId
          existing.trackingNumber = m.parcel.trackingNumber ?? existing.trackingNumber
          existing.parcelDescription = m.parcel.description ?? existing.parcelDescription
          if (!existing.parcel) existing.parcel = extractParcel(m.parcel)
        }
      } else {
        const parcel = m.parcelId && m.parcel ? extractParcel(m.parcel) : undefined
        map.set(key, {
          key,
          peerId: other.id,
          peerName: other.fullName ?? 'Inconnu',
          parcelId: m.parcelId,
          parcel,
          trackingNumber: m.parcel?.trackingNumber,
          parcelDescription: m.parcel?.description,
          lastMessage: previewText(m),
          lastAt: m.createdAt,
          unread,
        })
      }
    }
    return Array.from(map.values()).sort((a, b) => (b.lastAt ?? '').localeCompare(a.lastAt ?? ''))
  }, [conv.data, userId])

  const selected = activeThread

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px minmax(0,1fr)', gap: 0, height: 'calc(100vh - 160px)', minHeight: 480 }}>
      {/* Conversations list */}
      <Panel flush style={{ borderRight: 'none', borderTopRightRadius: 0, borderBottomRightRadius: 0 }}>
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
                    {t.unread > 0 && <Badge tone="primary">{t.unread}</Badge>}
                  </div>
                  {t.trackingNumber ? (
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--teal-600)', fontFamily: 'var(--font-mono)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.trackingNumber}
                    </div>
                  ) : (
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-faint)', fontStyle: 'italic', marginTop: 1 }}>
                      Sans colis
                    </div>
                  )}
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-faint)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.lastMessage}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Panel>

      {/* Chat area */}
      <Panel style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}>
        {selected ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 0 14px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 12 }}>
              <Avatar name={selected.peerName} size="sm" />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--fs-body)', color: 'var(--text-strong)' }}>
                  {selected.peerName}
                </div>
                {selected.trackingNumber && (
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {selected.trackingNumber}
                    {selected.parcelDescription ? ` · ${selected.parcelDescription.slice(0, 40)}` : ''}
                  </div>
                )}
              </div>
            </div>
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <NegotiationChat
                peerId={selected.peerId}
                peerName={selected.peerName}
                parcelId={selected.parcelId ?? undefined}
                parcelInfo={
                  selected.parcel
                    ? {
                        trackingNumber: selected.parcel.trackingNumber,
                        description: selected.parcel.description,
                        weight: selected.parcel.weight,
                        type: selected.parcel.type,
                        status: selected.parcel.status,
                        receiverName: selected.parcel.receiverName,
                        receiverPhone: selected.parcel.receiverPhone,
                        receiverAddress: selected.parcel.receiverAddress,
                        photoUrls: selected.parcel.photoUrls,
                        videoUrls: selected.parcel.videoUrls,
                        audioUrls: selected.parcel.audioUrls,
                      }
                    : undefined
                }
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
    </div>
  )
}
