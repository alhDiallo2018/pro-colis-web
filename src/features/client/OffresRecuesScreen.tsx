import { useState } from 'react'
import { Avatar, Badge, Button, Card, Dialog, Icon, Toast } from '@/ds'
import { QueryState } from '@/components/QueryState'
import { NegotiationChat } from '@/components/NegotiationChat'
import { useAcceptBid, useReceivedBids } from './hooks'
import { ApiError } from '@/lib/api/client'
import { formatFcfa } from '@/lib/format'
import type { Bid } from '@/lib/api/types'

const STATUS_META: Record<string, { label: string; tone: 'amber' | 'blue' | 'green' | 'red' | 'neutral' }> = {
  pending: { label: 'En attente', tone: 'amber' },
  countered: { label: 'Contre-offre', tone: 'blue' },
  accepted: { label: 'Acceptée', tone: 'green' },
  rejected: { label: 'Refusée', tone: 'red' },
}

export function OffresRecuesScreen() {
  const query = useReceivedBids()
  const bids = query.data ?? []
  const [chatTarget, setChatTarget] = useState<Bid | null>(null)

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        isEmpty={bids.length === 0}
        emptyTitle="Aucune offre"
        emptyMessage="Aucune offre reçue pour vos annonces."
        onRetry={() => query.refetch()}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-card)' }}>
          {bids.map((bid) => (
            <BidRow key={bid.id} bid={bid} onNegotiate={() => setChatTarget(bid)} />
          ))}
        </div>
      </QueryState>

      <ChatDialog bid={chatTarget} onClose={() => setChatTarget(null)} />
    </div>
  )
}

function ChatDialog({ bid, onClose }: { bid: Bid | null; onClose: () => void }) {
  const acceptBid = useAcceptBid(bid?.parcelId ?? '')

  if (!bid) return null
  const driverName = bid.driverName ?? 'Chauffeur'

  const handleAccept = (_price: number, _message?: string) => {
    acceptBid.mutate(bid.id)
  }

  return (
    <Dialog
      open
      onClose={onClose}
      icon="forum"
      iconTone="primary"
      title={`Négocier avec ${driverName}`}
      style={{ maxWidth: 640 }}
      actions={
        <Button variant="secondary" block onClick={onClose}>
          Fermer
        </Button>
      }
    >
      <div style={{ height: 'min(70vh, 520px)', display: 'flex', flexDirection: 'column' }}>
        <NegotiationChat
        peerId={bid.driverId}
        peerName={driverName}
        parcelId={bid.parcelId}
        bidId={bid.id}
        parcelInfo={
          bid.parcel
            ? {
                trackingNumber: bid.parcel.trackingNumber,
                receiverName: bid.parcel.receiverName,
              }
            : undefined
          }
          onAcceptBid={handleAccept}
        />
      </div>
    </Dialog>
  )
}

function Bubble({ side, who, text }: { side: 'left' | 'right'; who: string; text: string }) {
  const isLeft = side === 'left'
  return (
    <div style={{ display: 'flex', justifyContent: isLeft ? 'flex-start' : 'flex-end' }}>
      <div style={{ maxWidth: '80%' }}>
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-faint)', margin: isLeft ? '0 0 2px 4px' : '0 4px 2px 0', textAlign: isLeft ? 'left' : 'right' }}>{who}</div>
        <div
          style={{
            padding: '8px 12px',
            borderRadius: 12,
            borderTopLeftRadius: isLeft ? 3 : 12,
            borderTopRightRadius: isLeft ? 12 : 3,
            background: isLeft ? 'var(--surface-sunken)' : 'var(--teal-500)',
            color: isLeft ? 'var(--text-body)' : '#fff',
            fontSize: 'var(--fs-sm)',
          }}
        >
          {text}
        </div>
      </div>
    </div>
  )
}

function BidRow({ bid, onNegotiate }: { bid: Bid; onNegotiate: () => void }) {
  const accept = useAcceptBid(bid.parcelId)
  const status = STATUS_META[bid.status] ?? STATUS_META.pending
  const isActive = bid.status === 'pending' || bid.status === 'countered'
  const error = accept.error instanceof ApiError ? accept.error.message : null

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar name={bid.driverName ?? 'Chauffeur'} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-strong)' }}>{bid.driverName ?? 'Chauffeur'}</div>
          {bid.parcel?.trackingNumber && (
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {bid.parcel.trackingNumber}
              {bid.parcel.receiverName ? ` · ${bid.parcel.receiverName}` : ''}
            </div>
          )}
        </div>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 12 }}>
        <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>Proposition</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 20, color: 'var(--teal-600)' }}>{formatFcfa(bid.price)}</span>
      </div>

      {(bid.message || bid.responseMessage) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
          {bid.message && <Bubble side="left" who={bid.driverName ?? 'Chauffeur'} text={bid.message} />}
          {bid.responseMessage && <Bubble side="right" who="Vous (contre-proposition)" text={bid.responseMessage} />}
        </div>
      )}

      {bid.audioUrl && <audio controls src={bid.audioUrl} style={{ width: '100%', maxWidth: 320, height: 38, marginTop: 12 }} />}

      {error && (
        <div style={{ marginTop: 12 }}>
          <Toast tone="error" message={error} />
        </div>
      )}

      {isActive ? (
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <Button variant="secondary" size="sm" icon="forum" onClick={onNegotiate}>
            Négocier
          </Button>
          <Button block size="sm" icon="check" loading={accept.isPending} onClick={() => accept.mutate(bid.id)}>
            Accepter l’offre
          </Button>
        </div>
      ) : bid.status === 'accepted' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, color: 'var(--green-700)', fontWeight: 600, fontSize: 'var(--fs-sm)' }}>
          <Icon name="check_circle" size={18} />
          Vous avez accepté cette offre.
        </div>
      ) : (
        <div style={{ marginTop: 14, color: 'var(--text-faint)', fontStyle: 'italic', fontSize: 'var(--fs-sm)' }}>Offre refusée.</div>
      )}
    </Card>
  )
}

