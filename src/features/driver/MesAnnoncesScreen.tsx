import { api } from '@/lib/api/client'
import { RoutePlanner } from '@/features/transport/RoutePlanner'
import { JourneySharing } from '@/features/transport/JourneySharing'
import { TripStops } from '@/features/transport/TripStops'
import { locationLabel } from '@/lib/api/advertisements'
import { NegotiationChat } from '@/components/NegotiationChat'
import { QueryState } from '@/components/QueryState'
import { Avatar, Badge, Button, Dialog, Icon, Toast } from '@/ds'
import type { Advertisement, AdvertisementOffer } from '@/lib/api/advertisements'
import * as adsApi from '@/lib/api/advertisements'
import { ApiError } from '@/lib/api/client'
import { isCommissionDebtError, commissionDebtMessage } from '@/lib/commissionDebt'
import { formatDate, formatFcfa, formatWeight } from '@/lib/format'
import { queryClient } from '@/lib/queryClient'
import { useAuthStore } from '@/store/auth'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDriverFinancialState, useMyAdvertisements } from './hooks'
import { CommissionDebtNotice } from './CommissionDebtNotice'

const STATUS_META: Record<string, { label: string; tone: 'amber' | 'green' | 'red' | 'neutral' }> = {
  pending: { label: 'En attente', tone: 'amber' },
  countered: { label: 'Contre-offre', tone: 'amber' },
  accepted: { label: 'Acceptée', tone: 'green' },
  rejected: { label: 'Refusée', tone: 'red' },
}

const AD_STATUS_LABELS: Record<string, { label: string; tone: 'green' | 'amber' | 'red' }> = {
  open: { label: 'Ouverte', tone: 'green' },
  closed: { label: 'Fermée', tone: 'red' },
  cancelled: { label: 'Annulée', tone: 'amber' },
}

export function MesAnnoncesScreen() {
  const navigate = useNavigate()
  const query = useMyAdvertisements()
  const fin = useDriverFinancialState()
  const ads = query.data ?? []
  const [chatTarget, setChatTarget] = useState<{ peerId: string; peerName: string; ad: Advertisement; parcelId?: string | null; offer?: AdvertisementOffer } | null>(null)

  const acceptOffer = useMutation({
    mutationFn: ({ adId, offerId }: { adId: string; offerId: string }) => adsApi.acceptOffer(adId, offerId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['driver', 'advertisements'] }),
    onError: (err) => {
      if (isCommissionDebtError(err)) {
        queryClient.invalidateQueries({ queryKey: ['driver', 'wallet'] })
      }
    },
  })
  const rejectOffer = useMutation({
    mutationFn: ({ adId, offerId }: { adId: string; offerId: string }) => adsApi.rejectOffer(adId, offerId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['driver', 'advertisements'] }),
  })

  const openCount = ads.filter(a => (a.status ?? 'open') === 'open').length

  return (
    <div className="cm-detail-page" style={{ maxWidth: 920 }}>
      <CommissionDebtNotice />

      <div className="cm-page-head">
        <div className="cm-page-head-body">
          <h1>Mes annonces</h1>
          <p className="cm-page-head-sub">
            Publiez vos trajets, recevez des offres et acceptez vos meilleures
            {ads.length > 0 && <> · <strong>{openCount}</strong> ouvertes sur <strong>{ads.length}</strong></>}
          </p>
        </div>
        <Button icon="add" onClick={() => navigate('/driver?annonce=1')}>
          Créer une annonce
        </Button>
      </div>

      <RoutePlanner />
      <JourneySharing />

      {acceptOffer.error instanceof ApiError && (
        <Toast tone="error" message={acceptOffer.error.message} />
      )}

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        isEmpty={ads.length === 0}
        emptyTitle="Aucune annonce"
        emptyMessage="Vous n'avez pas encore créé d'annonce. Publiez un trajet pour recevoir des offres de clients."
        emptyAction={<Button icon="add" onClick={() => navigate('/driver?annonce=1')}>Créer une annonce</Button>}
        onRetry={() => query.refetch()}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-card)' }}>
          {ads.map((ad) => (
            <AdCard
              key={ad.id}
              ad={ad}
              fin={fin}
              onAccept={(offerId) => acceptOffer.mutate({ adId: ad.id, offerId })}
              onReject={(offerId) => rejectOffer.mutate({ adId: ad.id, offerId })}
              accepting={acceptOffer.isPending}
              rejecting={rejectOffer.isPending}
              onChat={(o) => setChatTarget({ peerId: o.clientId, peerName: o.client?.fullName ?? 'Client', ad, parcelId: o.parcelId, offer: o })}
            />
          ))}
        </div>
      </QueryState>

      {chatTarget && (
        <Dialog
          open
          onClose={() => setChatTarget(null)}
          icon="forum"
          iconTone="primary"
          title={`Négocier avec ${chatTarget.peerName}`}
          style={{ maxWidth: 640 }}
          actions={
            <Button variant="secondary" block onClick={() => setChatTarget(null)}>
              Fermer
            </Button>
          }
        >
          <div style={{ height: 'min(70vh, 520px)', display: 'flex', flexDirection: 'column' }}>
            <NegotiationChat
              peerId={chatTarget.peerId}
              peerName={chatTarget.peerName}
              parcelId={chatTarget.parcelId ?? undefined}
              advertisementId={chatTarget.ad.id}
              offerId={chatTarget.offer?.id}
              isOwner
              acceptBlocked={!fin.canAcceptNewDeliveries}
              acceptBlockedLabel={fin.isLoading ? 'Chargement…' : fin.isError ? 'Indisponible' : 'Dette à régler'}
              parcelInfo={{
                trackingNumber: chatTarget.offer?.parcel?.trackingNumber,
                departureCity: locationLabel(chatTarget.ad, 'departure'),
                arrivalCity: locationLabel(chatTarget.ad, 'arrival'),
                receiverName: chatTarget.offer?.parcel?.receiverName,
                receiverPhone: chatTarget.offer?.parcel?.receiverPhone,
                receiverAddress: chatTarget.offer?.parcel?.receiverAddress,
                description: chatTarget.ad.description,
                weight: chatTarget.offer?.parcel?.weight ?? null,
                type: chatTarget.offer?.parcel?.type,
                status: chatTarget.offer?.parcel?.status,
                photoUrls: chatTarget.offer?.parcel?.photoUrls,
                videoUrls: chatTarget.offer?.parcel?.videoUrls,
                audioUrls: chatTarget.offer?.parcel?.audioUrls,
              }}
            />
          </div>
        </Dialog>
      )}
    </div>
  )
}

function AdCard({
  ad, fin, onAccept, onReject, accepting, rejecting, onChat,
}: {
  ad: Advertisement
  fin: ReturnType<typeof useDriverFinancialState>
  onAccept: (offerId: string) => void
  onReject: (offerId: string) => void
  accepting: boolean
  rejecting: boolean
  onChat: (offer: AdvertisementOffer) => void
}) {
  const status = ad.status || 'open'
  const s = AD_STATUS_LABELS[status] ?? AD_STATUS_LABELS.open

  return (
    <section className="cm-ad-card">
      <header className="cm-ad-card-head">
        <div className="cm-ad-card-route">
          <Icon name="location_on" size={18} style={{ color: 'var(--teal-600)' }} />
          {locationLabel(ad, 'departure')}
          <Icon name="arrow_right_alt" size={18} style={{ color: 'var(--text-faint)' }} />
          {locationLabel(ad, 'arrival')}
        </div>
        <Badge tone={s.tone}>{s.label}</Badge>
      </header>

      <div className="cm-ad-card-body">
        <TripStops ad={ad} />
        {ad.itinerary && <RememberRoute advertisementId={ad.id} />}
        {ad.itinerary && ad.status === 'open' && <JourneySharing advertisementId={ad.id} />}

        <div className="cm-ad-card-meta">
          {ad.availableWeight != null && (
            <div>
              <div className="cm-ad-card-meta-label">Poids dispo</div>
              <div className="cm-ad-card-meta-value">{formatWeight(ad.availableWeight)}</div>
            </div>
          )}
          <div>
            <div className="cm-ad-card-meta-label">Prix proposé</div>
            <div className="cm-ad-card-meta-value" style={{ color: ad.proposedPrice != null ? 'var(--teal-700)' : 'var(--text-faint)' }}>
              {ad.proposedPrice != null ? formatFcfa(ad.proposedPrice) : 'À négocier'}
            </div>
          </div>
          <div>
            <div className="cm-ad-card-meta-label">Départ</div>
            <div className="cm-ad-card-meta-value">{ad.departureAt ? formatDate(ad.departureAt) : 'Flexible'}</div>
          </div>
        </div>

        {ad.description && (
          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-body)', background: 'var(--surface-sunken)', padding: '10px 14px', borderRadius: 'var(--cm-radius-chip)' }}>
            {ad.description}
          </div>
        )}

        <div>
          <h3 className="cm-ad-card-section-title">
            Offres reçues
            {ad.offers && ad.offers.length > 0 && <span className="cm-ad-card-section-count">{ad.offers.length}</span>}
          </h3>
          {ad.offers && ad.offers.length > 0 ? (
            ad.offers.map((o) => (
              <OfferRow
                key={o.id}
                offer={o}
                onAccept={onAccept}
                onReject={onReject}
                accepting={accepting}
                rejecting={rejecting}
                acceptBlocked={!fin.canAcceptNewDeliveries}
                blockedLabel={fin.isLoading ? 'Chargement…' : fin.isError ? 'Indisponible' : 'Dette à régler'}
                blockedTitle={fin.hasDebt ? commissionDebtMessage(fin.commissionDebt, fin.debtLimit) : 'État financier indisponible'}
                onChat={() => onChat(o)}
              />
            ))
          ) : (
            <div className="cm-ad-card-no-offers">
              Aucune offre reçue pour cette annonce.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function OfferRow({
  offer, onAccept, onReject, accepting, rejecting, acceptBlocked = false, blockedLabel = 'Dette à régler', blockedTitle, onChat,
}: {
  offer: AdvertisementOffer
  onAccept: (id: string) => void
  onReject: (id: string) => void
  accepting: boolean
  rejecting: boolean
  acceptBlocked?: boolean
  blockedLabel?: string
  blockedTitle?: string
  onChat: () => void
}) {
  const currentUser = useAuthStore((state) => state.user)
  const status = STATUS_META[offer.status] ?? STATUS_META.pending
  const [showParcel, setShowParcel] = useState(false)

  const isFromClient = offer.clientId !== currentUser?.id
  const canAccept =
    (offer.status === 'pending' && isFromClient) ||
    (offer.status === 'countered' && isFromClient)
  const isMyCounter = offer.status === 'countered' && !isFromClient

  return (
    <>
      <div className="cm-offer-inline-row">
        <Avatar name={offer.client?.fullName ?? 'Client'} src={offer.client?.profilePhoto ?? undefined} size="sm" />
        <div className="cm-offer-inline-row-body">
          <p className="cm-offer-inline-row-name">{offer.client?.fullName ?? 'Client'}</p>
          {offer.parcel && (
            <p className="cm-offer-inline-row-sub">
              <a onClick={() => setShowParcel(true)} title="Voir les infos du colis">
                {offer.parcel.trackingNumber}
              </a>
              {offer.parcel.weight != null && <> · {offer.parcel.weight} kg</>}
              {offer.parcel.receiverName && <> · {offer.parcel.receiverName}</>}
            </p>
          )}
          {offer.journeySegment && (
            <p className="cm-offer-inline-row-sub">
              Retrait : {offer.journeySegment.pickup?.name} → Remise : {offer.journeySegment.dropoff?.name}
            </p>
          )}
          {(offer.message || offer.responseMessage) && (
            <p className="cm-offer-inline-row-sub" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {offer.responseMessage ?? offer.message}
            </p>
          )}
          {offer.status === 'countered' && (
            <p className="cm-offer-inline-row-sub" style={{ color: 'var(--teal-700)', fontWeight: 700 }}>
              {isFromClient ? 'Nouvelle contre-offre du client' : 'Contre-offre envoyée'}
            </p>
          )}
        </div>
        <span className="cm-offer-inline-row-price">{formatFcfa(offer.price)}</span>
        <Badge tone={status.tone}>{status.label}</Badge>

        <div className="cm-offer-inline-row-actions">
          {offer.status === 'accepted' ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--green-700)', fontWeight: 700, fontSize: 'var(--fs-sm)' }}>
              <Icon name="check_circle" size={16} /> Acceptée
            </span>
          ) : offer.status === 'rejected' ? (
            <span style={{ color: 'var(--text-faint)', fontStyle: 'italic', fontSize: 'var(--fs-xs)' }}>Refusée</span>
          ) : isMyCounter ? (
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              ⏳ En attente réponse client
            </span>
          ) : canAccept ? (
            <>
              <Button size="sm" variant="secondary" icon="forum" onClick={onChat}>
                Chat
              </Button>
              <Button size="sm" variant="ghost" icon="close" onClick={() => onReject(offer.id)} disabled={rejecting}>
                Refuser
              </Button>
              <Button
                size="sm"
                icon={acceptBlocked ? 'lock' : 'check'}
                onClick={() => onAccept(offer.id)}
                disabled={accepting || acceptBlocked}
                title={acceptBlocked ? blockedTitle : undefined}
              >
                {acceptBlocked ? blockedLabel : 'Accepter'}
              </Button>
            </>
          ) : offer.status === 'pending' && !isFromClient ? (
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-faint)', fontStyle: 'italic' }}>Votre offre</span>
          ) : offer.status === 'countered' && !isFromClient ? (
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              ⏳ En attente réponse client
            </span>
          ) : null}
        </div>
      </div>

      {showParcel && offer.parcel && (
        <Dialog
          open
          onClose={() => setShowParcel(false)}
          icon="package_2"
          iconTone="primary"
          title={`Colis — ${offer.parcel.trackingNumber}`}
          style={{ maxWidth: 480 }}
          actions={
            <Button variant="secondary" block onClick={() => setShowParcel(false)}>
              Fermer
            </Button>
          }
        >
          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {offer.parcel.description && (
              <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-body)', background: 'var(--surface-sunken)', padding: '10px 14px', borderRadius: 'var(--radius-md)' }}>
                {offer.parcel.description}
              </div>
            )}

            <div className="pc-field-pair" style={{ gap: '8px 16px', fontSize: 'var(--fs-sm)' }}>
              {offer.parcel.weight != null && (
                <div><span style={{ color: 'var(--text-muted)' }}>Poids</span><br /><strong>{offer.parcel.weight} kg</strong></div>
              )}
              {offer.parcel.type && (
                <div><span style={{ color: 'var(--text-muted)' }}>Type</span><br /><strong>{offer.parcel.type}</strong></div>
              )}
              <div><span style={{ color: 'var(--text-muted)' }}>Statut</span><br /><strong>{offer.parcel.status}</strong></div>
              {offer.parcel.receiverName && (
                <div><span style={{ color: 'var(--text-muted)' }}>Destinataire</span><br /><strong>{offer.parcel.receiverName}</strong></div>
              )}
              {offer.parcel.receiverPhone && (
                <div><span style={{ color: 'var(--text-muted)' }}>Tel destinataire</span><br /><strong style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xs)' }}>{offer.parcel.receiverPhone}</strong></div>
              )}
              {offer.parcel.receiverAddress && (
                <div style={{ gridColumn: 'span 2' }}><span style={{ color: 'var(--text-muted)' }}>Adresse</span><br /><strong>{offer.parcel.receiverAddress}</strong></div>
              )}
            </div>

            {(offer.parcel.photoUrls?.length ?? 0) > 0 && (
              <div>
                <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Photos ({offer.parcel.photoUrls!.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {offer.parcel.photoUrls!.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img src={url} alt={`Photo ${i + 1}`} style={{ width: 72, height: 72, borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '1px solid var(--border-subtle)' }} />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {(offer.parcel.audioUrls?.length ?? 0) > 0 && (
              <div>
                <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Messages vocaux
                </div>
                {offer.parcel.audioUrls!.map((url, i) => (
                  <audio key={i} controls src={url} style={{ width: '100%', height: 32, maxWidth: 320 }} />
                ))}
              </div>
            )}

            {(offer.parcel.videoUrls?.length ?? 0) > 0 && (
              <div>
                <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Vidéos ({offer.parcel.videoUrls!.length})
                </div>
                {offer.parcel.videoUrls!.map((url, i) => (
                  <video key={i} controls src={url} style={{ width: '100%', maxWidth: 320, borderRadius: 'var(--radius-sm)' }} />
                ))}
              </div>
            )}
          </div>
        </Dialog>
      )}
    </>
  )
}

function RememberRoute({ advertisementId }: { advertisementId: string }) {
  const [message, setMessage] = useState('')
  const save = useMutation({
    mutationFn: () => api.post('/driver/route-templates', { advertisementId }),
    onSuccess: () => { setMessage('Trajet disponible dans vos trajets habituels.'); void queryClient.invalidateQueries({ queryKey: ['route-templates'] }) },
    onError: e => setMessage(e.message),
  })
  return (
    <div>
      <Button variant="secondary" size="sm" icon="bookmark_add" loading={save.isPending} onClick={() => save.mutate()}>
        Réutiliser ce trajet
      </Button>
      {message && <p role="status" style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 6 }}>{message}</p>}
    </div>
  )
}
