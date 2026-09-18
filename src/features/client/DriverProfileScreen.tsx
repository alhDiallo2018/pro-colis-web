import { useNavigate, useParams } from 'react-router-dom'
import { Avatar, Badge, Button, Card, Icon, IconButton, StatBox } from '@/ds'
import { QueryState } from '@/components/QueryState'
import { useDriverRatings, usePublicDriver } from './hooks'
import { driverStatusLabel, isDriverSelectable, DRIVER_AVATAR_STATUS } from '@/lib/driverStatus'
import type { Rating } from '@/lib/api/ratings'

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderTop: '1px solid var(--border-subtle)' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>{label}</span>
      <span style={{ color: 'var(--text-strong)', fontSize: 'var(--fs-sm)', fontWeight: 600, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

/**
 * Fiche publique d'un chauffeur, consultée par un client avant de le choisir.
 *
 * N'affiche que les informations utiles à la mise en relation — identité,
 * localité, disponibilité, expérience, véhicule et avis — et rien d'autre.
 * Le « Choisir ce chauffeur » aboutit au flux de proposition directe existant
 * (création de colis avec `driverId`), sans système parallèle.
 */
export function DriverProfileScreen() {
  const { driverId } = useParams<{ driverId: string }>()
  const navigate = useNavigate()
  const query = usePublicDriver(driverId)
  const ratings = useDriverRatings(driverId)
  const driver = query.data

  const status = driver?.driverStatus ?? 'offline'
  const selectable = driver ? isDriverSelectable(driver.driverStatus) : false
  const rating = Number(driver?.rating ?? 0)
  const deliveries = driver?.completedDeliveries ?? 0

  const choose = () => {
    if (!driver) return
    navigate(`/client/nouveau?driver=${driver.id}`)
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconButton icon="arrow_back" aria-label="Retour" onClick={() => navigate(-1)} />
        <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)', color: 'var(--text-strong)' }}>
          Fiche chauffeur
        </h1>
      </div>

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        isEmpty={!driver && !query.isLoading && !query.isError}
        emptyTitle="Chauffeur introuvable"
        emptyMessage="Ce chauffeur n'existe pas ou n'est plus disponible."
        onRetry={() => query.refetch()}
      >
        {driver && (
          <>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Avatar
                  name={driver.fullName}
                  src={driver.profilePhoto ?? undefined}
                  size="xl"
                  status={DRIVER_AVATAR_STATUS[status as 'available' | 'busy' | 'offline']}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--fs-title)', color: 'var(--text-strong)' }}>
                    {driver.fullName}
                  </div>
                  <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)', marginTop: 2 }}>
                    {[driver.city, driver.region].filter(Boolean).join(' · ') || 'Localité non renseignée'}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <Badge tone={status === 'available' ? 'green' : status === 'busy' ? 'amber' : 'neutral'} icon={status === 'available' ? 'check_circle' : status === 'busy' ? 'schedule' : 'block'}>
                      {driverStatusLabel(status)}
                    </Badge>
                    {driver.isVerified && <Badge tone="green" icon="verified" style={{ marginLeft: 6 }}>Identité vérifiée</Badge>}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                {driver.phone && <Row label="Contact" value={driver.phone} />}
                {(driver.vehicleModel || driver.vehicleType) && <Row label="Véhicule" value={[driver.vehicleType, driver.vehicleModel].filter(Boolean).join(' — ')} />}
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
                <StatBox label="Note / 5" value={rating > 0 ? rating.toFixed(1) : '—'} icon="star" tone="amber" />
                <StatBox label="Livraisons" value={String(deliveries)} icon="task_alt" tone="green" />
                <StatBox label="Total courses" value={String(driver.totalDeliveries ?? 0)} icon="local_shipping" />
              </div>
            </Card>

            <Button
              block
              size="lg"
              icon="local_shipping"
              disabled={!selectable}
              onClick={choose}
            >
              {selectable ? 'Choisir ce chauffeur' : 'Chauffeur hors ligne'}
            </Button>
            {!selectable && (
              <p style={{ margin: 0, textAlign: 'center', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
                Ce chauffeur est hors ligne : vous ne pouvez pas lui envoyer de demande pour le moment.
              </p>
            )}

            <AvisSection ratings={ratings.data ?? []} isLoading={ratings.isLoading} />
          </>
        )}
      </QueryState>
    </div>
  )
}

function AvisSection({ ratings, isLoading }: { ratings: Rating[]; isLoading: boolean }) {
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Icon name="star" size={18} style={{ color: 'var(--amber-500)' }} />
        <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)', color: 'var(--text-strong)' }}>
          Avis clients
        </h2>
      </div>
      {isLoading ? (
        <p style={{ margin: 0, fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>Chargement…</p>
      ) : ratings.length === 0 ? (
        <p style={{ margin: 0, fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
          Aucun avis pour le moment.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ratings.map((r) => (
            <div key={r.id} style={{ padding: '10px 12px', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Icon
                    key={i}
                    name="star"
                    size={15}
                    style={{ color: i < r.rating ? 'var(--amber-500)' : 'var(--slate-300)' }}
                  />
                ))}
                <span style={{ marginLeft: 'auto', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                  {r.author?.fullName ?? 'Client'}
                </span>
              </div>
              {r.comment && <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-body)' }}>{r.comment}</div>}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
