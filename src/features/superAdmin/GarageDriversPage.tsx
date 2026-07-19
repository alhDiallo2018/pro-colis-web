import { useParams, useNavigate } from 'react-router-dom'
import { Avatar, Badge, Button, Card, EmptyState } from '@/ds'
import { useAdminDrivers, useAdminGarages } from '@/features/superAdmin/hooks'
import type { DriverStatus } from '@/lib/api/types'

function driverStatusMeta(status: DriverStatus | null | undefined): { label: string; tone: 'green' | 'amber' | 'neutral' } {
  switch (status) {
    case 'available':
      return { label: 'Disponible', tone: 'green' }
    case 'busy':
      return { label: 'Occupé', tone: 'amber' }
    case 'offline':
    default:
      return { label: 'Hors ligne', tone: 'neutral' }
  }
}

export function GarageDriversPage() {
  const { garageId } = useParams<{ garageId: string }>()
  const navigate = useNavigate()
  const { data: garages = [] } = useAdminGarages()
  const { data: allDrivers = [], isLoading, refetch } = useAdminDrivers()

  const garage = garages.find((g) => g.id === garageId)
  const drivers = allDrivers.filter((d) => d.role === 'driver' && d.garageId === garageId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button variant="ghost" size="sm" icon="arrow_back_ios" onClick={() => navigate('/admin/garages')} />
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--text-strong)', margin: 0 }}>
            Chauffeurs
          </h2>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
            {garage?.name ?? 'Garage'} · {garage?.city ?? ''}
          </div>
        </div>
        <Button variant="ghost" size="sm" icon="refresh" onClick={() => refetch()} style={{ marginLeft: 'auto' }} />
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Chargement...</div>
      ) : drivers.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon="people_outline"
            title="Aucun chauffeur"
            message="Aucun chauffeur n'est actuellement rattaché à cette zone."
          />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: 'var(--text-muted)', marginBottom: 4 }}>
            Chauffeurs · {drivers.length}
          </div>
          {drivers.map((driver) => {
            const meta = driverStatusMeta(driver.driverStatus)
            return (
              <Card
                key={driver.id}
                padding="md"
                interactive
                onClick={() => navigate(`/admin/chauffeurs/${driver.id}`)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar name={driver.fullName} src={driver.profilePhoto ?? undefined} size="sm" status={driver.driverStatus === 'available' ? 'online' : driver.driverStatus === 'busy' ? 'busy' : 'offline'} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14.5, color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {driver.fullName}
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {[driver.city, driver.region, driver.phone].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, fontWeight: 600, color: 'var(--slate-700)' }}>
                      {driver.rating != null ? `${driver.rating.toFixed(1)} ★` : '—'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {driver.completedDeliveries ?? 0} livraisons
                    </div>
                  </div>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
