import { TripStops } from '@/features/transport/TripStops'
import { LiveJourneys } from '@/features/transport/LiveJourneys'
import { locationLabel } from '@/lib/api/advertisements'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Avatar, Badge, Button, Card, Dialog, Icon, IconButton, Input, Select, Textarea, Toast } from '@/ds'
import { QueryState } from '@/components/QueryState'
import { NegotiationChat } from '@/components/NegotiationChat'
import { useAnnonce, useCreateAnnonceOffer, useMyParcels } from './hooks'
import { ApiError } from '@/lib/api/client'
import { useAuthStore } from '@/store/auth'
import { formatDate, formatFcfa, formatWeight } from '@/lib/format'

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
    <div className="cm-detail-page" style={{ maxWidth: 640 }}>
      <div className="cm-detail-head">
        <IconButton icon="arrow_back" aria-label="Retour" onClick={() => navigate(-1)} />
        <h1>Détail de l’annonce</h1>
      </div>

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        isEmpty={!ad && !query.isLoading && !query.isError}
        emptyTitle="Annonce introuvable"
        emptyMessage="Cette annonce n'existe pas ou n'est plus disponible."
        onRetry={() => query.refetch()}
      >
        {ad && (
          <>
            {/* ---- Driver hero ---- */}
            <section className="cm-driver-hero" aria-label="Chauffeur">
              <Avatar name={driverName} src={ad.driver?.profilePhoto ?? undefined} size="lg" />
              <div className="cm-driver-hero-body">
                <p className="cm-driver-hero-name">{driverName}</p>
                <p className="cm-driver-hero-sub">
                  {ad.driver?.zoneName ?? ad.driver?.city ?? 'Indépendant'}
                  {ad.driver?.phone && (
                    <>
                      {' · '}
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{ad.driver.phone}</span>
                    </>
                  )}
                </p>
              </div>
              {ad.driver?.rating != null && (
                <span className="cm-driver-hero-rating">
                  <Icon name="star" size={15} />
                  {Number(ad.driver.rating).toFixed(1)}
                </span>
              )}
            </section>

            {/* ---- Journey OD band ---- */}
            <section className="cm-od-band" aria-label="Trajet proposé">
              <div>
                <div className="cm-od-band-label">Départ</div>
                <div className="cm-od-band-city">{locationLabel(ad, 'departure')}</div>
              </div>
              <div className="cm-od-band-sep">
                <Icon name="local_shipping" size={18} />
              </div>
              <div>
                <div className="cm-od-band-label" style={{ textAlign: 'right' }}>Arrivée</div>
                <div className="cm-od-band-city cm-od-band-city--right">{locationLabel(ad, 'arrival')}</div>
              </div>
            </section>

            {/* ---- Meta ---- */}
            <Card>
              <div className="cm-meta-list">
                {ad.departureAt && (
                  <MetaRow icon="event" label="Départ prévu" value={formatDate(ad.departureAt)} />
                )}
                {ad.availableWeight != null && (
                  <MetaRow icon="scale" label="Capacité disponible" value={formatWeight(ad.availableWeight)} />
                )}
                <MetaRow
                  icon="payments"
                  label="Prix proposé"
                  value={ad.proposedPrice != null ? formatFcfa(ad.proposedPrice) : 'À négocier'}
                />
                <MetaRow icon="schedule" label="Annonce publiée" value={formatDate(ad.createdAt)} />
              </div>

              {ad.description && (
                <p style={{ margin: '14px 0 0', fontSize: 'var(--fs-sm)', color: 'var(--text-body)', whiteSpace: 'pre-wrap' }}>
                  {ad.description}
                </p>
              )}
              {ad.audioUrl && <audio controls src={ad.audioUrl} style={{ width: '100%', maxWidth: 360, height: 40, marginTop: 12 }} />}
            </Card>

            <TripStops ad={ad}/>
            {ad.itinerary && <LiveJourneys advertisementId={ad.id}/>}

            {myOffer ? (
              <section className="cm-offer-sent" aria-label="Votre offre">
                <div className="cm-offer-sent-head">
                  <span className="cm-offer-sent-icon">
                    <Icon name="check_circle" size={22} />
                  </span>
                  <div className="cm-offer-sent-body">
                    <p className="cm-offer-sent-title">Offre envoyée — {formatFcfa(myOffer.price)}</p>
                    {myOffer.message && <p className="cm-offer-sent-sub">{myOffer.message}</p>}
                  </div>
                  <Badge tone={myOffer.status === 'accepted' ? 'green' : myOffer.status === 'rejected' ? 'red' : 'amber'}>
                    {myOffer.status === 'accepted' ? 'Acceptée' : myOffer.status === 'rejected' ? 'Refusée' : 'En attente'}
                  </Badge>
                </div>
                {ad.driverId && (
                  <Button block size="lg" icon="forum" onClick={() => setChatOpen(true)}>
                    Suivi offre
                  </Button>
                )}
              </section>
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
                title={`Négocier avec ${driverName}`}
                style={{ maxWidth: 640 }}
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
                      departureCity: locationLabel(ad, 'departure'),
                      arrivalCity: locationLabel(ad, 'arrival'),
                      description: ad.description || `Annonce — ${formatFcfa(myOffer?.price)} proposé`,
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

function MetaRow({ icon, label, value }: { icon: string; label: string; value: React.ReactNode }) {
  return (
    <div className="cm-meta-row">
      <span className="cm-meta-row-label">
        <Icon name={icon} size={16} style={{ color: 'var(--text-faint)' }} />
        {label}
      </span>
      <span className="cm-meta-row-value">{value}</span>
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

  const detail = useAnnonce(advertisementId)
  if (!open) return null

  const priceNum = Number(price)
  const valid = price !== '' && priceNum > 0 && (!detail.data?.itinerary || !!parcelId)
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
    { value: '', label: detail.data?.itinerary ? 'Choisissez le colis à transporter' : 'Sans colis' },
    ...parcels.filter(p => {
      const stops=detail.data?.itinerary?.stops
      if(!stops)return true
      const from=stops.findIndex(s=>s.zoneId===p.departureZoneId),to=stops.findIndex(s=>s.zoneId===p.arrivalZoneId)
      return from>=0&&to>from&&Number(p.weight)>0&&new Date(stops[from].scheduledAt!).getTime()>Date.now()&&['pending','free','proposal_sent','negotiating'].includes(p.status)
    }).map((p) => ({
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
          Proposez votre prix à <strong style={{ color: 'var(--text-strong)' }}>{driverName}</strong>
          {proposedPrice != null ? ` (il propose ${formatFcfa(proposedPrice)})` : ''}.
        </p>
        {detail.data?.itinerary && parcelOptions.length===1 && <p>Aucun colis compatible. Créez un colis avec un retrait et une remise dans le sens de ce trajet.</p>}
        {(parcels.length > 0 || detail.data?.itinerary) && (
          <Select
            label="Colis concerné"
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
            Négocier avec {driverName}
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
          title={`Négocier avec ${driverName}`}
          style={{ maxWidth: 640 }}
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
                  : { description: proposedPrice != null ? `Prix proposé par le chauffeur : ${formatFcfa(proposedPrice)}` : 'Prix à négocier' }
              }
            />
          </div>
        </Dialog>
      )}
    </Dialog>
  )
}
