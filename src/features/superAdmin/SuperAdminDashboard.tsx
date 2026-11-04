import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Avatar, Badge, Button, Icon, StatBox, type AvatarStatus } from '@/ds'
import { Panel } from '@/components/Panel'
import { BarChart } from '@/components/BarChart'
import { ParcelsTable } from '@/components/ParcelsTable'
import * as roles from '@/lib/api/roles'
import { usePlatformStats } from '@/features/shared/profile/hooks'
import { useAuthStore } from '@/store/auth'
import { formatFcfa } from '@/lib/format'

const AVATAR_STATUS: Record<string, AvatarStatus> = { available: 'online', busy: 'busy', offline: 'offline' }

const STATUS_ORDER = ['pending', 'free', 'negotiating', 'confirmed', 'picked_up', 'in_transit', 'arrived', 'out_for_delivery', 'delivered', 'cancelled']
const STATUS_SHORT: Record<string, string> = {
  pending: 'Att.',
  free: 'Libre',
  negotiating: 'Nég.',
  confirmed: 'Conf.',
  picked_up: 'Ram.',
  in_transit: 'Tran.',
  arrived: 'Arr.',
  out_for_delivery: 'Liv.',
  delivered: 'Livrés',
  cancelled: 'Ann.',
}

export function SuperAdminDashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const parcels = useQuery({ queryKey: ['admin', 'parcels'], queryFn: () => roles.adminParcels() })
  const zones = useQuery({ queryKey: ['admin', 'zones'], queryFn: () => roles.adminZones() })
  const drivers = useQuery({ queryKey: ['admin', 'drivers'], queryFn: () => roles.searchDrivers() })
  const statsQ = usePlatformStats()

  const stats = statsQ.data
  const allParcels = parcels.data?.parcels ?? []
  const zoneList = zones.data ?? []
  const driverList = drivers.data ?? []
  const availableDrivers = driverList.filter((d) => d.driverStatus === 'available').length

  // Répartition réelle des colis chargés (l'API ne renvoie pas d'historique mensuel).
  const byStatus = STATUS_ORDER.map((status) => ({
    status,
    count: allParcels.filter((p) => p.status === status).length,
  })).filter((row) => row.count > 0)

  return (
    <div className="cm-page">
      <section className="cm-hero" aria-label="Super admin">
        <p className="cm-hero-eyebrow">Super admin · {user?.fullName?.split(' ')[0] ?? ''}</p>
        <h1 className="cm-hero-greeting">
          {stats ? (
            <><span className="cm-hero-greeting-accent">{stats.totalUsers}</span> comptes<br />sur {stats.totalZones} zones</>
          ) : (
            'Chargement…'
          )}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginTop: 4 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.14)', padding: '8px 14px', borderRadius: 999 }}>
            <Icon name="payments" size={16} />
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 15 }}>{stats ? formatFcfa(stats.totalRevenue) : '—'}</span>
            <span style={{ fontSize: 12, opacity: 0.85 }}>encaissés (total)</span>
          </span>
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
        <StatBox icon="package_2" tone="primary" value={stats?.totalParcels ?? parcels.data?.pagination?.total ?? allParcels.length} label="Colis" />
        <StatBox icon="local_shipping" tone="teal" value={stats?.parcelsInTransit ?? '—'} label="En transit" />
        <StatBox icon="task_alt" tone="green" value={stats?.parcelsDeliveredToday ?? '—'} label="Livrés aujourd'hui" />
        <StatBox icon="hourglass_top" tone="amber" value={stats?.parcelsPending ?? '—'} label="En attente" />
        <StatBox icon="group" tone="neutral" value={stats?.totalUsers ?? '—'} label="Utilisateurs" />
        <StatBox icon="directions_car" tone="neutral" value={`${availableDrivers}/${stats?.totalDrivers ?? driverList.length}`} label="Chauffeurs dispo" />
      </div>

      <div className="pc-split">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Panel
            title="Colis récents"
            flush
            action={
              <Button size="sm" variant="secondary" iconTrailing="chevron_right" onClick={() => navigate('/admin/colis')}>
                Tout voir
              </Button>
            }
          >
            <ParcelsTable parcels={allParcels.slice(0, 6)} loading={!parcels.data} emptyHint="Aucun colis enregistré." />
          </Panel>

          {byStatus.length > 0 && (
            <Panel
              title="Répartition des colis par statut"
              action={<Badge tone="primary">{allParcels.length} chargés</Badge>}
            >
              <BarChart bars={byStatus.map((s) => s.count)} labels={byStatus.map((s) => STATUS_SHORT[s.status] ?? s.status)} height={120} />
            </Panel>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Panel title="Répartition des comptes">
            <div style={{ display: 'grid', gap: 12 }}>
              <AccountRow icon="person" label="Clients" value={stats?.totalClients ?? '—'} />
              <AccountRow icon="local_shipping" label="Chauffeurs" value={stats?.totalDrivers ?? '—'} />
              <AccountRow icon="garage" label="Zones" value={stats?.totalZones ?? zoneList.length} />
              <AccountRow icon="directions_car" label="Véhicules" value={stats?.totalVehicles ?? '—'} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <Button size="sm" variant="secondary" block icon="group" onClick={() => navigate('/admin/users')}>
                Utilisateurs
              </Button>
              <Button size="sm" variant="ghost" block icon="monitoring" onClick={() => navigate('/admin/stats')}>
                Statistiques
              </Button>
            </div>
          </Panel>

          <Panel
            title="Chauffeurs"
            flush
            action={availableDrivers > 0 ? <Badge tone="green">{availableDrivers} dispo</Badge> : undefined}
          >
            {driverList.length === 0 ? (
              <div style={{ padding: 18, fontSize: 13.5, color: 'var(--text-muted)' }}>Aucun chauffeur.</div>
            ) : (
              driverList.slice(0, 5).map((d) => (
                <div
                  key={d.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: '1px solid var(--slate-100)', cursor: 'pointer' }}
                  onClick={() => navigate(`/admin/chauffeurs/${d.id}`)}
                >
                  <Avatar name={d.fullName} src={d.profilePhoto ?? undefined} size="sm" status={AVATAR_STATUS[d.driverStatus ?? 'offline'] ?? 'offline'} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5, color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.fullName}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                      {d.city ?? d.zoneName ?? '—'} · {d.rating ?? '—'} ★
                    </div>
                  </div>
                </div>
              ))
            )}
          </Panel>

          <Panel
            title="Zones"
            flush
            action={
              <Button size="sm" variant="ghost" iconTrailing="chevron_right" onClick={() => navigate('/admin/zones')}>
                Tout voir
              </Button>
            }
          >
            {zoneList.length === 0 ? (
              <div style={{ padding: 18, fontSize: 13.5, color: 'var(--text-muted)' }}>Aucune zone.</div>
            ) : (
              zoneList.slice(0, 5).map((z) => (
                <div key={z.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: '1px solid var(--slate-100)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'var(--surface-sunken)', color: 'var(--text-muted)', flex: 'none' }}>
                    <Icon name="garage" size={20} fill />
                  </span>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-strong)' }}>{z.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{z.city ?? '—'}</div>
                  </div>
                  {z.isActive === false && <Badge tone="neutral">Inactive</Badge>}
                </div>
              ))
            )}
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
