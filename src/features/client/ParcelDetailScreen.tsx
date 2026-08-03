import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Avatar, Badge, Button, Card, Icon, IconButton, Stepper, StatusBadge, Tag, Textarea, Toast } from '@/ds'
import { QueryState } from '@/components/QueryState'
import { ParcelMedia } from '@/components/ParcelMedia'
import { QrCode } from '@/components/QrCode'
import { useCreateRating, useDeliveryCode, useParcel } from './hooks'
import { EditParcelDialog } from './EditParcelDialog'
import { isParcelEditable } from './parcelEditable'
import { createPaydunyaPayment } from '@/lib/api/paydunya'
import { estimate } from '@/lib/api/commission'
import { buildSteps } from './parcelSteps'
import { formatFcfa, formatWeight, toStatusKey } from '@/lib/format'

// Statuses where the parcel is in a driver's hands and the recipient may be asked for the code.
const IN_TRANSIT_STATUSES = ['confirmed', 'picked_up', 'in_transit', 'arrived', 'out_for_delivery']

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderTop: '1px solid var(--border-subtle)' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>{label}</span>
      <span style={{ color: 'var(--text-strong)', fontSize: 'var(--fs-sm)', fontWeight: 600, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

export function ParcelDetailScreen() {
  const { parcelId } = useParams<{ parcelId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const query = useParcel(parcelId)
  const { refetch } = query
  const parcel = query.data
  const showCode = !!parcel && IN_TRANSIT_STATUSES.includes(parcel.status)
  const deliveryCode = useDeliveryCode(parcelId, showCode)
  const [editing, setEditing] = useState(false)

  // Refetch after returning from PayDunya payment
  useEffect(() => {
    const paymentStatus = searchParams.get('payment')
    if (paymentStatus === 'success' || paymentStatus === 'cancelled') {
      refetch()
    }
  }, [refetch, searchParams])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconButton icon="arrow_back" aria-label="Retour" onClick={() => navigate(-1)} />
        <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)', color: 'var(--text-strong)' }}>
          Suivi du colis
        </h1>
        {/* Corriger reste possible tant qu'aucun chauffeur ni paiement
            n'engage la course — au-delà, l'API refuse et l'action disparaît. */}
        {parcel && isParcelEditable(parcel) && (
          <Button size="sm" variant="secondary" icon="edit" style={{ marginLeft: 'auto' }} onClick={() => setEditing(true)}>
            Modifier
          </Button>
        )}
      </div>

      <EditParcelDialog parcel={editing ? (parcel ?? null) : null} onClose={() => setEditing(false)} />

      <QueryState isLoading={query.isLoading} isError={query.isError} error={query.error} onRetry={() => query.refetch()}>
        {parcel && (
          <>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-body)' }}>
                  {parcel.trackingNumber}
                </span>
                <StatusBadge status={toStatusKey(parcel.status)} />
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                {parcel.isUrgent && <Tag express />}
                {parcel.type && <Tag icon="category">{parcel.type}</Tag>}
                {parcel.isInsured && <Tag tone="primary" icon="verified_user">Assuré</Tag>}
              </div>
              <Row label="Départ" value={parcel.departureCity ?? parcel.departureZoneName ?? '—'} />
              <Row label="Arrivée" value={parcel.arrivalCity ?? parcel.arrivalZoneName ?? '—'} />
              <Row label="Destinataire" value={parcel.receiverName} />
              <Row label="Poids" value={parcel.weight != null ? formatWeight(parcel.weight) : '—'} />
              <Row label="Prix" value={formatFcfa(parcel.price)} />
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 14, borderTop: '1px solid var(--border-subtle)', marginTop: 8 }}>
                <QrCode value={`${window.location.origin}/track/${parcel.trackingNumber}`} size={150} caption="Scanner pour suivre ce colis" />
              </div>
            </Card>

            {parcel.price && parcel.price > 0 && parcel.paymentStatus !== 'completed' && (
              <PaydunyaPayCard parcelId={parcel.id} amount={parcel.price} trackingNumber={parcel.trackingNumber} />
            )}

            {showCode && (
              <Card style={{ background: 'var(--teal-50)', border: '1px solid var(--teal-100)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span
                    style={{
                      width: 44,
                      height: 44,
                      flex: 'none',
                      borderRadius: '50%',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'var(--teal-500)',
                      color: '#fff',
                    }}
                  >
                    <Icon name="verified_user" size={22} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-strong)' }}>Code de réception</div>
                    <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
                      Communiquez ce code au livreur à la réception pour confirmer votre accusé de réception.
                    </div>
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      fontSize: 26,
                      letterSpacing: '0.18em',
                      color: 'var(--teal-700)',
                    }}
                  >
                    {deliveryCode.data ?? '••••'}
                  </span>
                </div>
                {deliveryCode.data && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
                    <QrCode value={deliveryCode.data} size={140} caption="À faire scanner par le livreur" />
                  </div>
                )}
              </Card>
            )}

            {(parcel.driverName || parcel.driver) && (
              <>
                <Card>
                  <h2 style={{ margin: '0 0 12px', fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)', color: 'var(--text-strong)' }}>
                    Chauffeur
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar name={parcel.driverName ?? parcel.driver?.fullName ?? ''} src={parcel.driver?.profilePhoto ?? undefined} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-strong)' }}>
                        {parcel.driverName ?? parcel.driver?.fullName}
                      </div>
                      {(parcel.driverPhone ?? parcel.driver?.phone) && (
                        <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {parcel.driverPhone ?? parcel.driver?.phone}
                        </div>
                      )}
                    </div>
                    {parcel.status === 'pending' ? (
                      <Badge tone="amber" icon="schedule">En attente de confirmation</Badge>
                    ) : (
                      <Badge tone="green" icon="check_circle">Prise en charge confirmée</Badge>
                    )}
                  </div>
                </Card>

                {parcel.status === 'delivered' && (
                  <StarRatingPanel parcelId={parcel.id} driverId={parcel.driverId ?? parcel.driver?.id} />
                )}
              </>
            )}

            {((parcel.photoUrls?.length ?? 0) > 0 ||
              (parcel.videoUrls?.length ?? 0) > 0 ||
              (parcel.audioUrls?.length ?? 0) > 0) && (
              <Card>
                <h2 style={{ margin: '0 0 12px', fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)', color: 'var(--text-strong)' }}>
                  Photos & note vocale
                </h2>
                <ParcelMedia parcel={parcel} />
              </Card>
            )}

            <Card>
              <h2 style={{ margin: '0 0 12px', fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)', color: 'var(--text-strong)' }}>
                Historique
              </h2>
              <Stepper steps={buildSteps(parcel)} />
            </Card>
          </>
        )}
      </QueryState>
    </div>
  )
}

function PaydunyaPayCard({ parcelId, amount, trackingNumber }: { parcelId: string; amount: number; trackingNumber: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [commissionInfo, setCommissionInfo] = useState<{ commission: number; netAmount: number; percentage: number } | null>(null)

  useEffect(() => {
    if (amount > 0) {
      estimate(amount).then((e) => setCommissionInfo({ commission: e.commission, netAmount: e.netAmount, percentage: e.percentage })).catch(() => {})
    }
  }, [amount])

  const pay = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await createPaydunyaPayment('parcel', { parcelId, amount })
      window.location.href = result.paymentUrl
    } catch (e) {
      setError((e as Error)?.message ?? 'Erreur lors de la création du paiement')
      setLoading(false)
    }
  }

  return (
    <Card>
      <h2 style={{ margin: '0 0 8px', fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)', color: 'var(--text-strong)' }}>
        Paiement
      </h2>
      <p style={{ margin: '0 0 14px', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)', wordBreak: 'break-word' }}>
        Paiement de {formatFcfa(amount)} pour le colis {trackingNumber}
      </p>

      {commissionInfo && (
        <div
          style={{
            background: 'var(--amber-50)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            border: '1px solid var(--amber-100)',
            marginBottom: 14,
            fontSize: 13,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: 'var(--text-muted)' }}>Commission plateforme ({commissionInfo.percentage}%)</span>
            <span style={{ fontWeight: 700, color: 'var(--red-600)' }}>- {formatFcfa(commissionInfo.commission)}</span>
          </div>
          <div style={{ borderTop: '1px solid var(--amber-200)', paddingTop: 4, marginTop: 2, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Montant reversé au chauffeur</span>
            <span style={{ fontWeight: 700, color: 'var(--green-700)' }}>{formatFcfa(commissionInfo.netAmount)}</span>
          </div>
        </div>
      )}

      {error && <Toast tone="error" message={error} />}

      <Button icon="payments" loading={loading} onClick={pay} style={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        Payer {formatFcfa(amount)} avec PayDunya
      </Button>
    </Card>
  )
}

function StarRatingPanel({ parcelId, driverId }: { parcelId: string; driverId?: string | null }) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const mutation = useCreateRating()

  if (submitted) {
    return (
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="check_circle" size={24} style={{ color: 'var(--teal-600)' }} />
          <span style={{ fontWeight: 600, color: 'var(--text-strong)' }}>Merci pour votre évaluation !</span>
        </div>
      </Card>
    )
  }

  const stars = [1, 2, 3, 4, 5]
  const active = hover || rating

  return (
    <Card>
      <h2 style={{ margin: '0 0 8px', fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)', color: 'var(--text-strong)' }}>
        Évaluer le chauffeur
      </h2>
      <p style={{ margin: '0 0 14px', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
        Votre colis a été livré. Donnez une note au chauffeur.
      </p>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {stars.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setRating(s)}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              fontSize: 32,
              lineHeight: 1,
              color: s <= active ? 'var(--amber-500)' : 'var(--border-strong)',
              transition: 'color 0.15s',
            }}
          >
            ★
          </button>
        ))}
      </div>

      <Textarea
        label="Commentaire (optionnel)"
        value={comment}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
        placeholder="Partagez votre expérience…"
        style={{ marginBottom: 14 }}
      />

      {mutation.isError && (
        <Toast tone="error" message={(mutation.error as Error)?.message ?? 'Erreur lors de l\'envoi'} />
      )}

      <Button
        icon="star"
        loading={mutation.isPending}
        disabled={rating === 0}
        onClick={() => {
          mutation.mutate(
            { driverId: driverId ?? '', parcelId, rating, comment: comment || null },
            { onSuccess: () => setSubmitted(true) }
          )
        }}
      >
        Envoyer la note
      </Button>
    </Card>
  )
}
