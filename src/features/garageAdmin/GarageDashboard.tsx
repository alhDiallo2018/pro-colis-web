import { useNavigate } from 'react-router-dom'
import { Avatar, Badge, Button, StatBox, type AvatarStatus } from '@/ds'
import { Panel } from '@/components/Panel'
import { ParcelsTable } from '@/components/ParcelsTable'
import { useGarageDrivers, useGarageParcels } from './hooks'

const AVATAR_STATUS: Record<string, AvatarStatus> = { available: 'online', busy: 'busy', offline: 'offline' }

export function GarageDashboard() {
  const navigate = useNavigate()
  const parcelsQ = useGarageParcels()
  const driversQ = useGarageDrivers()
  const parcels = parcelsQ.data?.parcels ?? []
  const drivers = driversQ.data ?? []

  const unassigned = parcels.filter((p) => !p.driverId && !['delivered', 'cancelled'].includes(p.status)).length
  const inTransit = parcels.filter((p) => p.status === 'in_transit').length
  const available = drivers.filter((d) => d.driverStatus === 'available').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
        <StatBox icon="package_2" tone="primary" value={parcelsQ.data?.pagination?.total ?? parcels.length} label="Colis du garage" />
        <StatBox icon="assignment_late" tone="amber" value={unassigned} label="À assigner" />
        <StatBox icon="local_shipping" tone="green" value={inTransit} label="En transit" />
        <StatBox icon="directions_car" tone="neutral" value={`${available}/${drivers.length}`} label="Chauffeurs dispo" />
      </div>

      <div className="pc-split">
        <Panel
          title="Colis récents"
          flush
          action={
            <Button size="sm" variant="secondary" iconTrailing="chevron_right" onClick={() => navigate('/garage/colis')}>
              Tout voir
            </Button>
          }
        >
          <ParcelsTable parcels={parcels.slice(0, 6)} loading={!parcelsQ.data} emptyHint="Aucun colis dans ce garage." />
        </Panel>

        <Panel title="Chauffeurs" flush action={available > 0 ? <Badge tone="green">{available} dispo</Badge> : undefined}>
          {drivers.length === 0 ? (
            <div style={{ padding: 18, fontSize: 13.5, color: 'var(--text-muted)' }}>Aucun chauffeur rattaché.</div>
          ) : (
            drivers.slice(0, 6).map((d) => (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: '1px solid var(--slate-100)' }}>
                <Avatar name={d.fullName} size="sm" status={AVATAR_STATUS[d.driverStatus ?? 'offline'] ?? 'offline'} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5, color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {d.fullName}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{d.rating ?? '—'} ★ · {d.completedDeliveries ?? 0} livraisons</div>
                </div>
              </div>
            ))
          )}
        </Panel>
      </div>
    </div>
  )
}
