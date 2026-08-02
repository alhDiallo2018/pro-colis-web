import { useNavigate } from 'react-router-dom'
import { Avatar, Badge, Button, Icon, StatBox, type AvatarStatus } from '@/ds'
import { Panel } from '@/components/Panel'
import { BarChart } from '@/components/BarChart'
import { ParcelsTable } from '@/components/ParcelsTable'
import { useGarageDrivers, useGarageParcels } from './hooks'
import { useMyGarageStats, useMyStats } from '@/features/shared/profile/hooks'
import { useAuthStore } from '@/store/auth'
import { formatFcfa } from '@/lib/format'

const AVATAR_STATUS: Record<string, AvatarStatus> = { available: 'online', busy: 'busy', offline: 'offline' }

const STATUS_ORDER = ['pending', 'free', 'confirmed', 'picked_up', 'in_transit', 'arrived', 'out_for_delivery', 'delivered', 'cancelled']
const STATUS_SHORT: Record<string, string> = {
  pending: 'Att.',
  free: 'Libre',
  confirmed: 'Conf.',
  picked_up: 'Ram.',
  in_transit: 'Tran.',
  arrived: 'Arr.',
  out_for_delivery: 'Liv.',
  delivered: 'Livrés',
  cancelled: 'Ann.',
}

export function GarageDashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const parcelsQ = useGarageParcels()
  const driversQ = useGarageDrivers()
  const statsQ = useMyGarageStats()
  const myStats = useMyStats()

  const parcels = parcelsQ.data?.parcels ?? []
  const drivers = driversQ.data ?? []
  const stats = statsQ.data

  const unassigned = parcels.filter((p) => !p.driverId && !['delivered', 'cancelled'].includes(p.status)).length
  const inTransit = parcels.filter((p) => p.status === 'in_transit').length
  const available = drivers.filter((d) => d.driverStatus === 'available').length

  const distribution = STATUS_ORDER.map((s) => ({ status: s, count: stats?.parcelsByStatus?.[s] ?? 0 })).filter(
    (row) => row.count > 0,
  )

  const topDrivers = [...drivers].sort((a, b) => (b.completedDeliveries ?? 0) - (a.completedDeliveries ?? 0))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Bandeau zone */}
      <div
        style={{
          background: 'var(--gradient-brand)',
          borderRadius: 'var(--radius-lg)',
          padding: 20,
          color: '#fff',
          boxShadow: 'var(--shadow-brand)',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 46, height: 46, borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.18)', flex: 'none' }}>
          <Icon name="garage" size={24} fill />
        </span>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 11, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>
            Bonjour {user?.fullName?.split(' ')[0] ?? ''} — zone gérée
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22 }}>
            {user?.zoneName ?? 'Zone non rattachée'}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Encaissé</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 20 }}>
            {stats ? formatFcfa(stats.revenue) : '—'}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
        <StatBox icon="package_2" tone="primary" value={stats?.totalParcels ?? parcelsQ.data?.pagination?.total ?? parcels.length} label="Colis de la zone" />
        <StatBox icon="pending_actions" tone="teal" value={stats?.activeParcels ?? '—'} label="En cours" />
        <StatBox icon="assignment_late" tone="amber" value={unassigned} label="À assigner" />
        <StatBox icon="local_shipping" tone="neutral" value={inTransit} label="En transit" />
        <StatBox icon="task_alt" tone="green" value={stats?.deliveredToday ?? '—'} label="Livrés aujourd'hui" />
        <StatBox icon="directions_car" tone="neutral" value={`${stats?.activeDrivers ?? available}/${drivers.length}`} label="Chauffeurs dispo" />
      </div>

      <div className="pc-split">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Panel
            title="Colis récents"
            flush
            action={
              <Button size="sm" variant="secondary" iconTrailing="chevron_right" onClick={() => navigate('/garage/colis')}>
                Tout voir
              </Button>
            }
          >
            <ParcelsTable
              parcels={parcels.slice(0, 6)}
              loading={!parcelsQ.data}
              onRowClick={(p) => navigate(`/garage/colis/${p.id}`)}
              emptyHint="Aucun colis dans cette zone."
            />
          </Panel>

          {distribution.length > 0 && (
            <Panel title="Répartition des colis par statut">
              <BarChart
                bars={distribution.map((d) => d.count)}
                labels={distribution.map((d) => STATUS_SHORT[d.status] ?? d.status)}
                height={120}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                {distribution.map((d) => (
                  <span
                    key={d.status}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '5px 10px',
                      borderRadius: 'var(--radius-pill)',
                      background: 'var(--surface-sunken)',
                      fontSize: 12,
                      color: 'var(--text-body)',
                    }}
                  >
                    {STATUS_SHORT[d.status] ?? d.status}
                    <b style={{ fontFamily: 'var(--font-mono)' }}>{d.count}</b>
                  </span>
                ))}
              </div>
            </Panel>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Panel
            title="Chauffeurs"
            flush
            action={
              <Button size="sm" variant="ghost" iconTrailing="chevron_right" onClick={() => navigate('/garage/chauffeurs')}>
                {available > 0 ? `${available} dispo` : 'Voir'}
              </Button>
            }
          >
            {drivers.length === 0 ? (
              <div style={{ padding: 18, fontSize: 13.5, color: 'var(--text-muted)' }}>Aucun chauffeur rattaché.</div>
            ) : (
              topDrivers.slice(0, 6).map((d) => (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: '1px solid var(--slate-100)' }}>
                  <Avatar name={d.fullName} src={d.profilePhoto ?? undefined} size="sm" status={AVATAR_STATUS[d.driverStatus ?? 'offline'] ?? 'offline'} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5, color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.fullName}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                      {d.rating ?? '—'} ★ · {d.completedDeliveries ?? 0} livraisons
                    </div>
                  </div>
                  {d.driverStatus === 'available' && <Badge tone="green">Dispo</Badge>}
                </div>
              ))
            )}
          </Panel>

          <Panel title="Mon compte">
            <div style={{ display: 'grid', gap: 12 }}>
              <AccountRow icon="badge" label="Rôle" value="Admin zone" />
              <AccountRow icon="garage" label="Zone" value={user?.zoneName ?? '—'} />
              <AccountRow icon="notifications" label="Notifications non lues" value={myStats.data?.unreadNotifications ?? '—'} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <Button size="sm" variant="secondary" block icon="person" onClick={() => navigate('/garage/profil')}>
                Mon profil
              </Button>
              <Button size="sm" variant="ghost" block icon="monitoring" onClick={() => navigate('/garage/rapports')}>
                Rapports
              </Button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}

function AccountRow({ icon, label, value }: { icon: string; label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Icon name={icon} size={18} style={{ color: 'var(--text-faint)' }} />
      <span style={{ flex: 1, fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13, color: 'var(--text-strong)' }}>{value}</span>
    </div>
  )
}
