// ============================================================
// FILE: lib/screens/driver/MesAnnoncesScreen.tsx
// ============================================================

import { NegotiationChat } from '@/components/NegotiationChat'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import { Avatar, Badge, Button, Dialog, Icon } from '@/ds'
import type { Advertisement, AdvertisementOffer } from '@/lib/api/advertisements'
import * as adsApi from '@/lib/api/advertisements'
import { formatDate, formatFcfa, formatWeight } from '@/lib/format'
import { queryClient } from '@/lib/queryClient'
import { useAuthStore } from '@/store/auth'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMyAdvertisements } from './hooks'

const STATUS_META: Record<string, { label: string; tone: 'amber' | 'green' | 'red' | 'neutral' }> = {
  pending: { label: 'En attente', tone: 'amber' },
  countered: { label: 'Contre-offre', tone: 'amber' },
  accepted: { label: 'Acceptee', tone: 'green' },
  rejected: { label: 'Refusee', tone: 'red' },
}

export function MesAnnoncesScreen() {
  const navigate = useNavigate()
  const query = useMyAdvertisements()
  const ads = query.data ?? []
  const [chatTarget, setChatTarget] = useState<{ peerId: string; peerName: string; ad: Advertisement; parcelId?: string | null; offer?: AdvertisementOffer } | null>(null)

  const acceptOffer = useMutation({
    mutationFn: ({ adId, offerId }: { adId: string; offerId: string }) => adsApi.acceptOffer(adId, offerId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['driver', 'advertisements'] }),
  })
  const rejectOffer = useMutation({
    mutationFn: ({ adId, offerId }: { adId: string; offerId: string }) => adsApi.rejectOffer(adId, offerId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['driver', 'advertisements'] }),
  })

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--text-strong)', margin: 0 }}>
          Mes annonces
        </h2>
        <Button icon="add" onClick={() => navigate('/driver?annonce=1')}>
          Creer une annonce
        </Button>
      </div>

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        isEmpty={ads.length === 0}
        emptyTitle="Aucune annonce"
        emptyMessage="Vous n'avez pas encore cree d'annonce. Publiez un trajet pour recevoir des offres de clients."
        onRetry={() => query.refetch()}
      >
        {ads.map((ad) => (
          <Panel key={ad.id} title={<AdHeader ad={ad} />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 32, fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
                {ad.availableWeight != null && (
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--text-body)' }}>Poids dispo</span>
                    <br />
                    {formatWeight(ad.availableWeight)}
                  </div>
                )}
                {ad.proposedPrice != null && (
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--text-body)' }}>Prix propose</span>
                    <br />
                    {formatFcfa(ad.proposedPrice)}
                  </div>
                )}
                {ad.proposedPrice == null && (
                  <div style={{ color: 'var(--text-faint)', fontStyle: 'italic' }}>Prix a negocier</div>
                )}
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--text-body)' }}>Depart</span>
                  <br />
                  {ad.departureAt ? formatDate(ad.departureAt) : 'Flexible'}
                </div>
              </div>

              {ad.description && (
                <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-body)' }}>{ad.description}</div>
              )}

              {ad.offers && ad.offers.length > 0 ? (
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'var(--fs-sm)', color: 'var(--text-strong)', marginBottom: 10 }}>
                    Offres recues ({ad.offers.length})
                  </div>
                  {ad.offers.map((o) => (
                    <OfferRow
                      key={o.id}
                      offer={o}
                      adId={ad.id}
                      onAccept={(id) => acceptOffer.mutate({ adId: ad.id, offerId: id })}
                      onReject={(id) => rejectOffer.mutate({ adId: ad.id, offerId: id })}
                      accepting={acceptOffer.isPending}
                      rejecting={rejectOffer.isPending}
                      onChat={() => setChatTarget({ peerId: o.clientId, peerName: o.client?.fullName ?? 'Client', ad, parcelId: o.parcelId, offer: o })}
                    />
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-faint)', fontStyle: 'italic' }}>
                  Aucune offre recue pour cette annonce.
                </div>
              )}
            </div>
          </Panel>
        ))}
      </QueryState>

      {chatTarget && (
        <Dialog
          open
          onClose={() => setChatTarget(null)}
          icon="forum"
          iconTone="primary"
          title={`Negocier avec ${chatTarget.peerName}`}
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
              parcelInfo={{
                trackingNumber: chatTarget.offer?.parcel?.trackingNumber,
                departureCity: chatTarget.ad.departureCity,
                arrivalCity: chatTarget.ad.arrivalCity,
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

function AdHeader({ ad }: { ad: Advertisement }) {
  const status = ad.status || 'open'
  const labels: Record<string, { label: string; tone: 'green' | 'amber' | 'red' }> = {
    open: { label: 'Ouverte', tone: 'green' },
    closed: { label: 'Fermee', tone: 'red' },
    cancelled: { label: 'Annulee', tone: 'amber' },
  }
  const s = labels[status] ?? labels.open
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <span className="material-symbols-rounded" style={{ fontSize: 16, color: 'var(--text-muted)' }}>location_on</span>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--fs-body)' }}>
          {ad.departureCity ?? '—'}
          <span className="material-symbols-rounded" style={{ fontSize: 14, color: 'var(--text-faint)', verticalAlign: 'middle', margin: '0 2px' }}>arrow_right_alt</span>
          {ad.arrivalCity ?? '—'}
        </span>
      </span>
      <Badge tone={s.tone}>{s.label}</Badge>
    </div>
  )
}

function OfferRow({
  offer,
  onAccept,
  onReject,
  accepting,
  rejecting,
  onChat,
}: {
  offer: AdvertisementOffer
  adId: string
  onAccept: (id: string) => void
  onReject: (id: string) => void
  accepting: boolean
  rejecting: boolean
  onChat: () => void
}) {
  const currentUser = useAuthStore((state) => state.user)
  const status = STATUS_META[offer.status] ?? STATUS_META.pending
  const [showParcel, setShowParcel] = useState(false)

  // ✅ Vérifier si l'offre vient du client (pas du chauffeur connecté)
  const isFromClient = offer.clientId !== currentUser?.id

  // ✅ Le chauffeur peut accepter si :
  // 1. L'offre est en attente (pending) et vient du client
  // 2. OU c'est une contre-offre du client (status === 'countered' et c'est le client qui a fait la dernière offre)
  const canAccept = 
    (offer.status === 'pending' && isFromClient) ||
    (offer.status === 'countered' && isFromClient)

  // ✅ Le chauffeur a envoyé une contre-offre
  const isMyCounter = offer.status === 'countered' && !isFromClient

  return (
    <>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: '1px solid var(--slate-50)' }}>
      <Avatar name={offer.client?.fullName ?? 'Client'} src={offer.client?.profilePhoto ?? undefined} size="sm" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'var(--fs-sm)', color: 'var(--text-strong)' }}>
          {offer.client?.fullName ?? 'Client'}
        </div>
        {offer.parcel && (
          <div
            style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}
            onClick={() => setShowParcel(true)}
            title="Voir les infos du colis"
          >
            <span style={{ color: 'var(--text-link)', fontWeight: 600 }}>{offer.parcel.trackingNumber}</span>
            {offer.parcel.weight != null && <> · {offer.parcel.weight} kg</>}
            {offer.parcel.receiverName && <> · {offer.parcel.receiverName}</>}
          </div>
        )}
        {(offer.message || offer.responseMessage) && (
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {offer.responseMessage ?? offer.message}
          </div>
        )}
        {/* ✅ Afficher qui a fait la dernière offre */}
        {offer.status === 'countered' && (
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--primary)', fontWeight: 600 }}>
            {isFromClient ? '📩 Nouvelle contre-offre du client' : '📤 Contre-offre envoyée'}
          </div>
        )}
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 'var(--fs-sm)', color: 'var(--teal-600)', whiteSpace: 'nowrap' }}>
        {formatFcfa(offer.price)}
      </span>
      <Badge tone={status.tone}>{status.label}</Badge>

      {/* ✅ Gestion des actions selon le statut et l'expéditeur */}
      {offer.status === 'accepted' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--green-700)', fontWeight: 600, fontSize: 'var(--fs-sm)' }}>
          <Icon name="check_circle" size={16} /> Acceptée
        </div>
      ) : offer.status === 'rejected' ? (
        <div style={{ color: 'var(--text-faint)', fontStyle: 'italic', fontSize: 'var(--fs-xs)' }}>Refusée</div>
      ) : isMyCounter ? (
        // ✅ Chauffeur a envoyé une contre-offre → attend la réponse du client
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          ⏳ En attente réponse client
        </div>
      ) : canAccept ? (
        // ✅ Le chauffeur peut accepter l'offre du client
        <div style={{ display: 'flex', gap: 4 }}>
          <Button size="sm" variant="secondary" icon="forum" onClick={onChat}>
            Chat
          </Button>
          <Button size="sm" variant="ghost" icon="close" onClick={() => onReject(offer.id)} disabled={rejecting}>
            Refuser
          </Button>
          <Button size="sm" icon="check" onClick={() => onAccept(offer.id)} disabled={accepting}>
            Accepter
          </Button>
        </div>
      ) : offer.status === 'pending' && !isFromClient ? (
        // ✅ Le chauffeur ne peut pas accepter sa propre offre
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-faint)', fontStyle: 'italic' }}>
          Votre offre
        </div>
      ) : offer.status === 'countered' && !isFromClient ? (
        // ✅ Le chauffeur attend la réponse du client
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          ⏳ En attente réponse client
        </div>
      ) : null}
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
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-body)', background: 'var(--slate-50)', padding: '10px 14px', borderRadius: 'var(--radius-md)' }}>
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
              <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
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
              <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
                Messages vocaux
              </div>
              {offer.parcel.audioUrls!.map((url, i) => (
                <audio key={i} controls src={url} style={{ width: '100%', height: 32, maxWidth: 320 }} />
              ))}
            </div>
          )}

          {(offer.parcel.videoUrls?.length ?? 0) > 0 && (
            <div>
              <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
                Videos ({offer.parcel.videoUrls!.length})
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