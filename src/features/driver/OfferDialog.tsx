import { useState } from 'react'
import { Button, Dialog, Input, Textarea, Toast } from '@/ds'
import { useCreateBid } from './hooks'
import { ApiError } from '@/lib/api/client'
import type { Parcel } from '@/lib/api/types'
import { formatFcfa } from '@/lib/format'
import { ParcelMedia } from '@/components/ParcelMedia'
import { NegotiationChat } from '@/components/NegotiationChat'

interface OfferDialogProps {
  parcel: Parcel | null
  onClose: () => void
  onSuccess?: () => void
}

/** Modal for a driver to bid on a free-service parcel. */
export function OfferDialog({ parcel, onClose, onSuccess }: OfferDialogProps) {
  const createBid = useCreateBid()
  const [price, setPrice] = useState('')
  const [message, setMessage] = useState('')
  const [chatOpen, setChatOpen] = useState(false)

  if (!parcel) return null

  const priceNum = Number(price)
  const valid = price !== '' && priceNum > 0

  const submit = () => {
    createBid.mutate(
      { parcelId: parcel.id, price: priceNum, message: message.trim() || undefined },
      {
        onSuccess: () => {
          setPrice('')
          setMessage('')
          onSuccess?.()
          onClose()
        },
      },
    )
  }

  const error = createBid.error instanceof ApiError ? createBid.error.message : null

  return (
    <Dialog
      open
      onClose={onClose}
      icon="gavel"
      iconTone="primary"
      title="Faire une offre"
      actions={
        <>
          <Button variant="secondary" block onClick={onClose}>
            Annuler
          </Button>
          <Button block icon="send" loading={createBid.isPending} disabled={!valid} onClick={submit}>
            Envoyer l’offre
          </Button>
        </>
      }
    >
      <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 13.5, color: 'var(--text-muted)', textAlign: 'center' }}>
          {(parcel.departureCity ?? parcel.departureGarageName) || '—'} → {(parcel.arrivalCity ?? parcel.arrivalGarageName) || '—'}
          {parcel.price != null && ` · prix demandé ${formatFcfa(parcel.price)}`}
        </div>
        {parcel.description && (
          <div style={{ fontSize: 13.5, color: 'var(--text-body)' }}>{parcel.description}</div>
        )}
        <ParcelMedia parcel={parcel} size={84} />
        {parcel.senderId && (
          <Button variant="secondary" size="sm" icon="forum" onClick={() => setChatOpen(true)}>
            Négocier avec le client
          </Button>
        )}
        <Input
          label="Votre prix (FCFA)"
          icon="payments"
          type="number"
          inputMode="numeric"
          mono
          placeholder="Ex : 9 000"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <Textarea
          label="Message (optionnel)"
          placeholder="Ex : Je pars à 14h, place disponible."
          maxLength={200}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        {error && <Toast tone="error" message={error} />}
      </div>

      {chatOpen && parcel.senderId && (
        <Dialog
          open
          onClose={() => setChatOpen(false)}
          icon="forum"
          iconTone="primary"
          title={`Négocier avec ${parcel.senderName || 'le client'}`}
          style={{ width: 'min(560px, 94vw)' }}
          actions={
            <Button variant="secondary" block onClick={() => setChatOpen(false)}>
              Fermer
            </Button>
          }
        >
          <NegotiationChat peerId={parcel.senderId} peerName={parcel.senderName || 'Client'} parcelId={parcel.id} />
        </Dialog>
      )}
    </Dialog>
  )
}
