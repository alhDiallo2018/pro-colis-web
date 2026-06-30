import { useNavigate, useParams } from 'react-router-dom'
import { Avatar, Badge, Card, Icon, IconButton, Stepper, StatusBadge, Tag } from '@/ds'
import { QueryState } from '@/components/QueryState'
import { ParcelMedia } from '@/components/ParcelMedia'
import { useDeliveryCode, useParcel } from './hooks'
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
  const navigate = useNavigate()
  const query = useParcel(parcelId)
  const parcel = query.data
  const showCode = !!parcel && IN_TRANSIT_STATUSES.includes(parcel.status)
  const deliveryCode = useDeliveryCode(parcelId, showCode)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconButton icon="arrow_back" aria-label="Retour" onClick={() => navigate(-1)} />
        <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)', color: 'var(--text-strong)' }}>
          Suivi du colis
        </h1>
      </div>

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
              <Row label="Départ" value={parcel.departureCity ?? parcel.departureGarageName ?? '—'} />
              <Row label="Arrivée" value={parcel.arrivalCity ?? parcel.arrivalGarageName ?? '—'} />
              <Row label="Destinataire" value={parcel.receiverName} />
              <Row label="Poids" value={parcel.weight != null ? formatWeight(parcel.weight) : '—'} />
              <Row label="Prix" value={formatFcfa(parcel.price)} />
            </Card>

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
              </Card>
            )}

            {(parcel.driverName || parcel.driver) && (
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
