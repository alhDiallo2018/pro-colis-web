import { useState } from 'react'
import { Avatar, Badge, Button, Dialog, Icon, Select, Toast } from '@/ds'
import { QueryState } from '@/components/QueryState'
import { NegotiationChat } from '@/components/NegotiationChat'
import { NegotiationTurn } from '@/components/NegotiationTurn'
import { useAcceptBid, useReceivedBids } from './hooks'
import { ApiError } from '@/lib/api/client'
import { formatFcfa } from '@/lib/format'
import type { Bid } from '@/lib/api/types'

const STATUS_META: Record<string, { label: string; tone: 'amber' | 'primary' | 'green' | 'red' | 'neutral' }> = {
  pending: { label: 'En attente', tone: 'amber' },
  countered: { label: 'Contre-offre', tone: 'primary' },
  accepted: { label: 'Acceptée', tone: 'green' },
  rejected: { label: 'Refusée', tone: 'red' },
}

const AVAILABILITY_LABELS: Record<string, string> = {
  available: 'disponible',
  busy: 'occupé',
  offline: 'hors ligne',
}

export function OffresRecuesScreen() {
  const query = useReceivedBids()
  const [parcelFilter, setParcelFilter] = useState('')
  const [sort, setSort] = useState('recent')
  const allBids = query.data ?? []
  const parcels = [...new Map(allBids.map(b => [b.parcelId, b.parcel?.trackingNumber ?? b.parcelId])).entries()]
  const bids = allBids
    .filter(b => !parcelFilter || b.parcelId === parcelFilter)
    .sort((a, b) => sort === 'price'
      ? Number(a.lastPrice ?? a.price) - Number(b.lastPrice ?? b.price)
      : Date.parse(b.lastMessageAt ?? b.updatedAt ?? b.createdAt ?? '') - Date.parse(a.lastMessageAt ?? a.updatedAt ?? a.createdAt ?? ''))
  const [chatTarget, setChatTarget] = useState<Bid | null>(null)

  const pending = allBids.filter(b => b.status === 'pending' || b.status === 'countered').length

  return (
    <div className="cm-detail-page" style={{ maxWidth: 760 }}>
      <div className="cm-page-head">
        <div className="cm-page-head-body">
          <h1>Offres reçues</h1>
          <p className="cm-page-head-sub">
            Comparez les offres de chauffeurs pour vos colis
            {pending > 0 && <> · <strong>{pending}</strong> en attente de réponse</>}
          </p>
        </div>
      </div>

      <div className="cm-filter-box">
        <Select
          aria-label="Colis à comparer"
          icon="package_2"
          value={parcelFilter}
          onChange={e => setParcelFilter(e.target.value)}
          options={[{ value: '', label: 'Tous mes colis' }, ...parcels.map(([value, label]) => ({ value, label }))]}
        />
        <Select
          aria-label="Trier les offres"
          icon="sort"
          value={sort}
          onChange={e => setSort(e.target.value)}
          options={[
            { value: 'recent', label: 'Dernière réponse' },
            { value: 'price', label: 'Prix croissant' },
          ]}
        />
      </div>

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
            <BidCard key={bid.id} bid={bid} onNegotiate={() => setChatTarget(bid)} />
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
  const handleAccept = (_price: number, _message?: string) => { acceptBid.mutate(bid.id) }

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
          parcelInfo={bid.parcel ? { trackingNumber: bid.parcel.trackingNumber, receiverName: bid.parcel.receiverName } : undefined}
          onAcceptBid={handleAccept}
          isOwner
          canAccept={bid.canClientAccept ?? bid.lastOfferBy !== 'client'}
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
            borderRadius: 14,
            borderTopLeftRadius: isLeft ? 4 : 14,
            borderTopRightRadius: isLeft ? 14 : 4,
            background: isLeft ? 'var(--surface-sunken)' : 'var(--teal-600)',
            color: isLeft ? 'var(--text-body)' : '#fff',
            fontSize: 'var(--fs-sm)',
            lineHeight: 1.5,
          }}
        >
          {text}
        </div>
      </div>
    </div>
  )
}

function BidCard({ bid, onNegotiate }: { bid: Bid; onNegotiate: () => void }) {
  const accept = useAcceptBid(bid.parcelId)
  const status = STATUS_META[bid.status] ?? STATUS_META.pending
  const isActive = bid.status === 'pending' || bid.status === 'countered'
  const error = accept.error instanceof ApiError ? accept.error.message : null

  const lastOfferBy = bid.lastOfferBy ?? 'driver'
  const lastPrice = bid.lastPrice ?? bid.price
  const lastMessage = bid.lastMessage ?? bid.responseMessage ?? bid.message
  const canAccept = bid.canClientAccept ?? lastOfferBy === 'driver'

  const availabilityLabel = AVAILABILITY_LABELS[bid.driverAvailability ?? ''] ?? 'à confirmer'
  const responseDate = bid.lastMessageAt || bid.respondedAt || bid.createdAt
  const responseText = responseDate ? new Date(responseDate).toLocaleString('fr-FR') : 'non renseignée'

  return (
    <section className="cm-bid-card">
      <header className="cm-bid-card-head">
        <Avatar name={bid.driverName ?? 'Chauffeur'} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="cm-bid-card-name">{bid.driverName ?? 'Chauffeur'}</p>
          {bid.parcel?.trackingNumber && (
            <p className="cm-bid-card-sub">
              {bid.parcel.trackingNumber}
              {bid.parcel.receiverName ? ` · ${bid.parcel.receiverName}` : ''}
            </p>
          )}
        </div>
        <Badge tone={status.tone}>{status.label}</Badge>
      </header>

      <div className="cm-bid-card-price-row">
        <span className="cm-bid-card-price-label">
          {bid.status === 'countered' ? 'Dernier prix' : 'Proposition'}
        </span>
        <span className="cm-bid-card-price">{formatFcfa(lastPrice)}</span>
      </div>

      <div className="cm-bid-card-meta">
        <strong>Véhicule :</strong> {bid.driverVehicleType ?? 'à confirmer'}
        {' · '}
        <strong>Disponibilité :</strong> {availabilityLabel}
        {bid.driverRating != null && <> · <strong>Note :</strong> {bid.driverRating}/5</>}
        <br />
        <strong>Dernière réponse :</strong> {responseText}
      </div>

      {lastMessage && (
        <div style={{ padding: '0 18px 12px' }}>
          <Bubble
            side={lastOfferBy === 'client' ? 'right' : 'left'}
            who={lastOfferBy === 'client' ? 'Vous (contre-proposition)' : (bid.driverName ?? 'Chauffeur')}
            text={lastMessage}
          />
        </div>
      )}

      {bid.audioUrl && (
        <div style={{ padding: '0 18px 12px' }}>
          <audio controls src={bid.audioUrl} style={{ width: '100%', maxWidth: 320, height: 38 }} />
        </div>
      )}

      {error && (
        <div style={{ padding: '0 18px 12px' }}>
          <Toast tone="error" message={error} />
        </div>
      )}

      {isActive ? (
        <div className="cm-bid-card-actions">
          <Button variant="secondary" size="sm" icon="forum" onClick={onNegotiate}>
            Négocier
          </Button>
          {canAccept ? (
            <div className="cm-bid-card-actions-grow">
              <Button block size="sm" icon="check" loading={accept.isPending} onClick={() => accept.mutate(bid.id)}>
                Accepter {formatFcfa(lastPrice)}
              </Button>
            </div>
          ) : (
            <NegotiationTurn waitingFor="driver" />
          )}
        </div>
      ) : bid.status === 'accepted' ? (
        <div className="cm-bid-card-closed cm-bid-card-closed--ok">
          <Icon name="check_circle" size={18} />
          Vous avez accepté cette offre.
        </div>
      ) : (
        <div className="cm-bid-card-closed">
          <Icon name="cancel" size={16} />
          Offre refusée.
        </div>
      )}
    </section>
  )
}
