import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Avatar, Badge, Button, Card, Dialog, Icon, IconButton, Input, Select, Textarea, Toast } from '@/ds'
import { QueryState } from '@/components/QueryState'
import { NegotiationChat } from '@/components/NegotiationChat'
import { useAnnonce, useCreateAnnonceOffer, useMyParcels } from './hooks'
import { ApiError } from '@/lib/api/client'
import { useAuthStore } from '@/store/auth'
import { formatDate, formatFcfa, formatWeight } from '@/lib/format'

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderTop: '1px solid var(--border-subtle)' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>{label}</span>
      <span style={{ color: 'var(--text-strong)', fontSize: 'var(--fs-sm)', fontWeight: 600, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

export function AnnonceDetailScreen() {
  const { advertisementId } = useParams<{ advertisementId: string }>()
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.user?.id)
  const query = useAnnonce(advertisementId)
  const ad = query.data
  const [offering, setOffering] = useState(false)

  const myOffer = ad?.offers?.find((o) => o.clientId === userId)
  const driverName = ad?.driver?.fullName ?? ad?.driverName ?? 'Chauffeur'
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconButton icon="arrow_back" aria-label="Retour" onClick={() => navigate(-1)} />
        <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)', color: 'var(--text-strong)' }}>Détail de l’annonce</h1>
      </div>

      <QueryState isLoading={query.isLoading} isError={query.isError} error={query.error} onRetry={() => query.refetch()}>
        {ad && (
          <>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <Avatar name={driverName} src={ad.driver?.profilePhoto ?? undefined} size="lg" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--fs-title)', color: 'var(--text-strong)' }}>{driverName}</div>
                  <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>{ad.driver?.garageName ?? ad.driver?.city ?? 'Indépendant'}</div>
                  {ad.driver?.phone && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>{ad.driver.phone}</div>}
                </div>
                {ad.driver?.rating != null && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Icon name="star" size={18} style={{ color: 'var(--amber-500)' }} />
                    <span style={{ fontWeight: 700 }}>{Number(ad.driver.rating).toFixed(1)}</span>
                  </span>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  background: 'var(--teal-50)',
                  border: '1px solid var(--teal-100)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--teal-700)' }}>{ad.departureCity ?? '—'}</span>
                <span style={{ flex: 1, height: 0, borderTop: '2px dashed var(--teal-300)', maxWidth: 90 }} />
                <Icon name="local_shipping" size={18} style={{ color: 'var(--teal-500)' }} />
                <span style={{ flex: 1, height: 0, borderTop: '2px dashed var(--teal-300)', maxWidth: 90 }} />
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--teal-700)' }}>{ad.arrivalCity ?? '—'}</span>
              </div>

              <div style={{ marginTop: 12 }}>
                {ad.departureAt && <Row label="Départ prévu" value={formatDate(ad.departureAt)} />}
                {ad.availableWeight != null && <Row label="Capacité disponible" value={formatWeight(ad.availableWeight)} />}
                <Row label="Prix proposé" value={ad.proposedPrice != null ? formatFcfa(ad.proposedPrice) : 'À négocier'} />
                <Row label="Annonce publiée" value={formatDate(ad.createdAt)} />
              </div>

              {ad.description && (
                <p style={{ margin: '14px 0 0', fontSize: 'var(--fs-sm)', color: 'var(--text-body)', whiteSpace: 'pre-wrap' }}>{ad.description}</p>
              )}
              {ad.audioUrl && <audio controls src={ad.audioUrl} style={{ width: '100%', maxWidth: 360, height: 40, marginTop: 12 }} />}
            </Card>

            {myOffer ? (
              <Card style={{ background: 'var(--teal-50)', border: '1px solid var(--teal-100)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon name="check_circle" size={22} style={{ color: 'var(--teal-600)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-strong)' }}>Offre envoyee — {formatFcfa(myOffer.price)}</div>
                    {myOffer.message && <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>{myOffer.message}</div>}
                  </div>
                  <Badge tone={myOffer.status === 'accepted' ? 'green' : myOffer.status === 'rejected' ? 'red' : 'amber'}>
                    {myOffer.status === 'accepted' ? 'Acceptee' : myOffer.status === 'rejected' ? 'Refusee' : 'En attente'}
                  </Badge>
                </div>
                {ad.driverId && (
                  <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                    <Button size="sm" variant="secondary" icon="forum" onClick={() => setChatOpen(true)}>
                      Voir la discussion
                    </Button>
                  </div>
                )}
              </Card>
            ) : (
              <Button block size="lg" icon="gavel" onClick={() => setOffering(true)}>
                Faire une offre
              </Button>
            )}

            <OfferDialog
              advertisementId={ad.id}
              driverName={driverName}
              driverId={ad.driverId}
              proposedPrice={ad.proposedPrice}
              open={offering}
              onClose={() => setOffering(false)}
            />

            {chatOpen && ad.driverId && (
              <Dialog
                open
                onClose={() => setChatOpen(false)}
                icon="forum"
                iconTone="primary"
                title={`Negocier avec ${driverName}`}
                style={{ width: 'min(640px, 96vw)' }}
                actions={
                  <Button variant="secondary" block onClick={() => setChatOpen(false)}>
                    Fermer
                  </Button>
                }
              >
                <div style={{ height: 'min(70vh, 520px)', display: 'flex', flexDirection: 'column' }}>
                  <NegotiationChat
                    peerId={ad.driverId}
                    peerName={driverName}
                    parcelId={myOffer?.parcelId ?? undefined}
                  parcelInfo={{
                    trackingNumber: myOffer?.parcel?.trackingNumber,
                    departureCity: ad.departureCity,
                    arrivalCity: ad.arrivalCity,
                    description: ad.description || `Annonce — ${formatFcfa(myOffer?.price)} propose`,
                    weight: myOffer?.parcel?.weight ?? null,
                    type: myOffer?.parcel?.type,
                    photoUrls: myOffer?.parcel?.photoUrls,
                    videoUrls: myOffer?.parcel?.videoUrls,
                    audioUrls: myOffer?.parcel?.audioUrls,
                  }}
                  />
                </div>
              </Dialog>
            )}
          </>
        )}
      </QueryState>
    </div>
  )
}

function OfferDialog({
  advertisementId,
  driverName,
  driverId,
  proposedPrice,
  open,
  onClose,
}: {
  advertisementId: string
  driverName: string
  driverId?: string | null
  proposedPrice?: number | null
  open: boolean
  onClose: () => void
}) {
  const createOffer = useCreateAnnonceOffer(advertisementId)
  const myParcels = useMyParcels()
  const parcels = myParcels.data?.parcels ?? []
  const [price, setPrice] = useState('')
  const [message, setMessage] = useState('')
  const [parcelId, setParcelId] = useState('')
  const [chatOpen, setChatOpen] = useState(false)

  if (!open) return null

  const priceNum = Number(price)
  const valid = price !== '' && priceNum > 0
  const error = createOffer.error instanceof ApiError ? createOffer.error.message : null

  const submit = () => {
    createOffer.mutate(
      { price: priceNum, message: message.trim() || undefined, parcelId: parcelId || undefined },
      {
        onSuccess: () => {
          setPrice('')
          setMessage('')
          setParcelId('')
          onClose()
        },
      },
    )
  }

  const parcelOptions = [
    { value: '', label: 'Sans colis' },
    ...parcels.slice(0, 10).map((p) => ({
      value: p.id,
      label: `${p.trackingNumber} — ${p.receiverName || p.description?.slice(0, 25) || 'Colis'} (${p.status})`,
    })),
  ]

  const selectedParcel = parcels.find((p) => p.id === parcelId)

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
          <Button block icon="send" loading={createOffer.isPending} disabled={!valid} onClick={submit}>
            Envoyer l'offre
          </Button>
        </>
      }
    >
      <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-muted)' }}>
          Proposez votre prix a <strong style={{ color: 'var(--text-strong)' }}>{driverName}</strong>
          {proposedPrice != null ? ` (il propose ${formatFcfa(proposedPrice)})` : ''}.
        </p>
        {parcels.length > 0 && (
            <Select
            label="Colis concerne"
            options={parcelOptions}
            value={parcelId}
            onChange={(e) => setParcelId(e.target.value)}
          />
        )}
        <Input
          label="Votre prix (FCFA)"
          icon="payments"
          type="number"
          inputMode="numeric"
          mono
          placeholder="Ex : 3 500"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <Textarea
          label="Message (optionnel)"
          placeholder="Ex : J'ai un colis de 5 kg pour ce trajet."
          maxLength={200}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        {driverId && (
          <Button variant="secondary" size="sm" icon="forum" onClick={() => setChatOpen(true)}>
            Negocier avec {driverName}
          </Button>
        )}
        {error && <Toast tone="error" message={error} />}
      </div>

      {chatOpen && driverId && (
        <Dialog
          open
          onClose={() => setChatOpen(false)}
          icon="forum"
          iconTone="primary"
          title={`Negocier avec ${driverName}`}
          style={{ width: 'min(640px, 96vw)' }}
          actions={
            <Button variant="secondary" block onClick={() => setChatOpen(false)}>
              Fermer
            </Button>
          }
        >
          <div style={{ height: 'min(70vh, 520px)', display: 'flex', flexDirection: 'column' }}>
            <NegotiationChat
              peerId={driverId}
              peerName={driverName}
              parcelId={parcelId || undefined}
              parcelInfo={
                selectedParcel
                  ? {
                      trackingNumber: selectedParcel.trackingNumber,
                      description: selectedParcel.description,
                      receiverName: selectedParcel.receiverName,
                    }
                  : { description: proposedPrice != null ? `Prix propose par le chauffeur : ${formatFcfa(proposedPrice)}` : 'Prix a negocier' }
              }
            />
          </div>
        </Dialog>
      )}
    </Dialog>
  )
}
