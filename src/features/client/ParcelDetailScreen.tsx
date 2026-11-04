import { ParcelExperience } from '@/features/experience/ParcelExperience'
import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Avatar, Badge, Button, Card, Icon, IconButton, Stepper, Tag, Textarea, Toast } from '@/ds'
import { PARCEL_STATUS } from '@/ds'
import { QueryState } from '@/components/QueryState'
import { ParcelMedia } from '@/components/ParcelMedia'
import { QrCode } from '@/components/QrCode'
import { useCreateRating, useDeliveryCode, useParcel } from './hooks'
import { EditParcelDialog } from './EditParcelDialog'
import { CancellationDialog } from '@/components/CancellationDialog'
import { ProposalStatusCard } from './ProposalStatusCard'
import { isParcelEditable } from './parcelEditable'
import { createPaydunyaPayment } from '@/lib/api/paydunya'
import { estimate } from '@/lib/api/commission'
import { buildSteps } from './parcelSteps'
import { formatDate, formatFcfa, formatWeight, toStatusKey } from '@/lib/format'

// Statuses where the parcel is in a driver's hands and the recipient may be asked for the code.
const IN_TRANSIT_STATUSES = ['confirmed', 'picked_up', 'in_transit', 'arrived', 'out_for_delivery']

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
  const [cancelling, setCancelling] = useState(false)
  const cancellable = !!parcel && parcel.status !== 'delivered' && parcel.status !== 'cancelled'

  useEffect(() => {
    const paymentStatus = searchParams.get('payment')
    if (paymentStatus === 'success' || paymentStatus === 'cancelled') {
      refetch()
    }
  }, [refetch, searchParams])

  const statusKey = parcel ? toStatusKey(parcel.status) : null
  const statusMeta = statusKey ? PARCEL_STATUS[statusKey] : null

  return (
    <div className="cm-detail-page">
      <div className="cm-detail-head">
        <IconButton icon="arrow_back" aria-label="Retour" onClick={() => navigate(-1)} />
        <h1>Suivi du colis</h1>
        <div className="cm-detail-head-actions">
          {parcel && isParcelEditable(parcel) && (
            <Button size="sm" variant="secondary" icon="edit" onClick={() => setEditing(true)}>
              Modifier
            </Button>
          )}
          {cancellable && (
            <Button size="sm" variant="secondary" tone="danger" icon="cancel" onClick={() => setCancelling(true)}>
              Annuler
            </Button>
          )}
        </div>
      </div>

      <EditParcelDialog parcel={editing ? (parcel ?? null) : null} onClose={() => setEditing(false)} />
      <CancellationDialog parcel={cancelling ? (parcel ?? null) : null} onClose={() => setCancelling(false)} />

      <QueryState isLoading={query.isLoading} isError={query.isError} error={query.error} onRetry={() => query.refetch()}>
        {parcel && (
          <>
            {/* ---- Hero journey ---- */}
            <section className="cm-journey-hero" aria-label="Résumé du colis">
              <div className="cm-journey-hero-top">
                <span className="cm-journey-hero-track">
                  <Icon name="qr_code_2" size={14} /> {parcel.trackingNumber}
                </span>
                {statusMeta && (
                  <span className="cm-journey-hero-status">
                    <Icon name={statusMeta.icon} size={14} />
                    {statusMeta.label}
                  </span>
                )}
              </div>

              <div className="cm-journey-hero-od">
                <div>
                  <div className="cm-journey-hero-city-label">Départ</div>
                  <div className="cm-journey-hero-city">
                    {parcel.departureCity ?? parcel.departureZoneName ?? '—'}
                  </div>
                </div>
                <div className="cm-journey-hero-separator">
                  <Icon name="local_shipping" size={20} />
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="cm-journey-hero-city-label">Arrivée</div>
                  <div className="cm-journey-hero-city">
                    {parcel.arrivalCity ?? parcel.arrivalZoneName ?? '—'}
                  </div>
                </div>
              </div>

              <div className="cm-journey-hero-meta">
                {parcel.weight != null && (
                  <span><Icon name="scale" size={14} /> {formatWeight(parcel.weight)}</span>
                )}
                {parcel.price != null && (
                  <span><Icon name="payments" size={14} /> {formatFcfa(parcel.price)}</span>
                )}
                {parcel.receiverName && (
                  <span><Icon name="person" size={14} /> {parcel.receiverName}</span>
                )}
                {parcel.estimatedDeliveryDate && (
                  <span><Icon name="schedule" size={14} /> ETA · {formatDate(parcel.estimatedDeliveryDate)}</span>
                )}
              </div>

              {(parcel.isUrgent || parcel.type || parcel.isInsured) && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {parcel.isUrgent && <Tag express />}
                  {parcel.type && <Tag icon="category">{parcel.type}</Tag>}
                  {parcel.isInsured && <Tag tone="primary" icon="verified_user">Assuré</Tag>}
                </div>
              )}
            </section>

            {/* ---- QR partage ---- */}
            <div className="cm-qr-card">
              <QrCode
                value={`${window.location.origin}/track/${parcel.trackingNumber}`}
                size={150}
                caption="Scanner pour suivre ce colis"
              />
            </div>

            <ParcelExperience key={`${parcel.id}-${parcel.status}`} parcelId={parcel.id} />

            {parcel.price && parcel.price > 0 && parcel.paymentStatus !== 'completed' && (
              <PaydunyaPayCard parcelId={parcel.id} amount={parcel.price} trackingNumber={parcel.trackingNumber} />
            )}

            {showCode && (
              <section className="cm-receive-code" aria-label="Code de réception">
                <div className="cm-receive-code-row">
                  <span className="cm-receive-code-icon">
                    <Icon name="verified_user" size={22} />
                  </span>
                  <div className="cm-receive-code-body">
                    <p className="cm-receive-code-title">Code de réception</p>
                    <p className="cm-receive-code-sub">
                      Communiquez ce code au livreur à la remise pour confirmer votre accusé de réception.
                    </p>
                  </div>
                  <span className="cm-receive-code-value">
                    {deliveryCode.data ?? '••••'}
                  </span>
                </div>
                {deliveryCode.data && (
                  <div className="cm-receive-code-qr">
                    <QrCode value={deliveryCode.data} size={140} caption="À faire scanner par le livreur" />
                  </div>
                )}
              </section>
            )}

            {parcel.proposal && <ProposalStatusCard parcel={parcel} />}

            {(parcel.driverName || parcel.driver) && (
              <>
                <section className="cm-driver-hero" aria-label="Chauffeur attribué">
                  <Avatar
                    name={parcel.driverName ?? parcel.driver?.fullName ?? ''}
                    src={parcel.driver?.profilePhoto ?? undefined}
                    size="lg"
                  />
                  <div className="cm-driver-hero-body">
                    <p className="cm-driver-hero-name">
                      {parcel.driverName ?? parcel.driver?.fullName}
                    </p>
                    {(parcel.driverPhone ?? parcel.driver?.phone) && (
                      <p className="cm-driver-hero-sub" style={{ fontFamily: 'var(--font-mono)' }}>
                        {parcel.driverPhone ?? parcel.driver?.phone}
                      </p>
                    )}
                  </div>
                  {parcel.status === 'pending' ? (
                    <Badge tone="amber" icon="schedule">En attente de confirmation</Badge>
                  ) : (
                    <Badge tone="green" icon="check_circle">Prise en charge confirmée</Badge>
                  )}
                </section>

                {parcel.status === 'delivered' && (
                  <StarRatingPanel parcelId={parcel.id} driverId={parcel.driverId ?? parcel.driver?.id} />
                )}
              </>
            )}

            {((parcel.photoUrls?.length ?? 0) > 0 ||
              (parcel.videoUrls?.length ?? 0) > 0 ||
              (parcel.audioUrls?.length ?? 0) > 0) && (
              <Card>
                <h2 style={{ margin: '0 0 12px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--fs-h3)', color: 'var(--text-strong)' }}>
                  Photos & note vocale
                </h2>
                <ParcelMedia parcel={parcel} />
              </Card>
            )}

            <Card>
              <h2 style={{ margin: '0 0 12px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--fs-h3)', color: 'var(--text-strong)' }}>
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
      <h2 style={{ margin: '0 0 8px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--fs-h3)', color: 'var(--text-strong)' }}>
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
          <span style={{ fontWeight: 700, color: 'var(--text-strong)' }}>Merci pour votre évaluation !</span>
        </div>
      </Card>
    )
  }

  const stars = [1, 2, 3, 4, 5]
  const active = hover || rating

  return (
    <Card>
      <h2 style={{ margin: '0 0 8px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--fs-h3)', color: 'var(--text-strong)' }}>
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
