import { useEffect, useRef, useState } from 'react'
import { Button, Dialog } from '@/ds'
import { useCreateBid, useRespondToBid } from './hooks'
import { NegotiationChat } from '@/components/NegotiationChat'
import type { Parcel } from '@/lib/api/types'

interface OfferDialogProps {
  parcel: Parcel | null
  onClose: () => void
  onSuccess?: () => void
  existingBidId?: string | null
}

export function OfferDialog({ parcel, onClose, onSuccess, existingBidId }: OfferDialogProps) {
  const createBid = useCreateBid()
  const respondToBid = useRespondToBid()
  const [bidId, setBidId] = useState<string | null>(existingBidId ?? null)
  const [audioUrl] = useState<string | null>(null)
  const bidCreatedRef = useRef(false)

  useEffect(() => {
    setBidId(existingBidId ?? null)
    bidCreatedRef.current = false
  }, [existingBidId, parcel?.id])

  if (!parcel) return null

  const handleFirstOffer = async (price: number, message?: string) => {
    if (bidId || bidCreatedRef.current) return
    bidCreatedRef.current = true
    createBid.mutate(
      { parcelId: parcel.id, price, message, audioUrl: audioUrl ?? undefined },
      {
        onSuccess: (bid: { id: string }) => {
          setBidId(bid.id)
          onSuccess?.()
        },
      },
    )
  }

  const handleAcceptBid = (price: number, message?: string) => {
    if (!bidId) return
    respondToBid.mutate(
      { bidId, action: 'accept', price, message },
      { onSuccess: () => onSuccess?.() },
    )
  }

  return (
    <Dialog
      open
      onClose={onClose}
      icon="forum"
      iconTone="primary"
      title={`Negocier — ${parcel.senderName || 'le client'}`}
      style={{ maxWidth: 640 }}
      actions={
        <Button variant="secondary" block onClick={onClose}>
          Fermer
        </Button>
      }
    >
      <div style={{ height: 'min(70vh, 520px)', display: 'flex', flexDirection: 'column' }}>
        <NegotiationChat
        peerId={parcel.senderId ?? ''}
        peerName={parcel.senderName || 'Client'}
        parcelId={parcel.id}
        bidId={bidId ?? undefined}
        parcelInfo={{
          trackingNumber: parcel.trackingNumber,
          departureCity: parcel.departureCity,
          arrivalCity: parcel.arrivalCity,
          description: parcel.description,
          receiverName: parcel.receiverName,
          receiverPhone: parcel.receiverPhone,
          receiverAddress: parcel.receiverAddress,
          weight: parcel.weight != null ? String(parcel.weight) : undefined,
          type: parcel.type ?? undefined,
          status: parcel.status,
          photoUrls: parcel.photoUrls,
          videoUrls: parcel.videoUrls,
          audioUrls: parcel.audioUrls,
        }}
          onCreateBid={!existingBidId ? handleFirstOffer : undefined}
          onAcceptBid={existingBidId || bidId ? handleAcceptBid : undefined}
        />
      </div>
    </Dialog>
  )
}
