import { useQuery } from '@tanstack/react-query'
import { Avatar, Badge, StatBox, type AvatarStatus } from '@/ds'
import { Panel } from '@/components/Panel'
import { BarChart } from '@/components/BarChart'
import { ParcelsTable } from '@/components/ParcelsTable'
import * as roles from '@/lib/api/roles'

const AVATAR_STATUS: Record<string, AvatarStatus> = { available: 'online', busy: 'busy', offline: 'offline' }

const VOLUME = [38, 44, 41, 52, 49, 61, 58, 67, 72, 70, 84, 100]
const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']

export function SuperAdminDashboard() {
  const parcels = useQuery({ queryKey: ['admin', 'parcels'], queryFn: () => roles.adminParcels() })
  const garages = useQuery({ queryKey: ['admin', 'garages'], queryFn: () => roles.adminGarages() })
  const drivers = useQuery({ queryKey: ['admin', 'drivers'], queryFn: () => roles.searchDrivers() })

  const allParcels = parcels.data?.parcels ?? []
  const garageList = garages.data ?? []
  const driverList = drivers.data ?? []
  const availableDrivers = driverList.filter((d) => d.driverStatus === 'available').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
        <StatBox icon="package_2" tone="primary" value={parcels.data?.pagination?.total ?? allParcels.length} label="Colis" delta={12} />
        <StatBox icon="local_shipping" tone="green" value={driverList.length} label="Chauffeurs" delta={4} />
        <StatBox icon="garage" tone="amber" value={garageList.length} label="Garages" delta={2} />
        <StatBox icon="account_balance_wallet" tone="neutral" value="—" label="FCFA encaissés" />
      </div>

      <div className="pc-split">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Panel title="Colis récents" flush>
            <ParcelsTable parcels={allParcels.slice(0, 6)} loading={!parcels.data} emptyHint="Aucun colis enregistré." />
          </Panel>

          <Panel title="Volume de colis · 12 mois" action={<Badge tone="primary">+12%</Badge>}>
            <BarChart bars={VOLUME} labels={MONTHS} height={120} />
          </Panel>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Panel
            title="Chauffeurs"
            flush
            action={availableDrivers > 0 ? <Badge tone="green">{availableDrivers} dispo</Badge> : undefined}
          >
            {driverList.length === 0 ? (
              <div style={{ padding: 18, fontSize: 13.5, color: 'var(--text-muted)' }}>Aucun chauffeur.</div>
            ) : (
              driverList.slice(0, 5).map((d) => (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: '1px solid var(--slate-100)' }}>
                  <Avatar name={d.fullName} size="sm" status={AVATAR_STATUS[d.driverStatus ?? 'offline'] ?? 'offline'} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5, color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.fullName}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{d.city ?? d.garageName ?? '—'} · {d.rating ?? '—'} ★</div>
                  </div>
                </div>
              ))
            )}
          </Panel>

          <Panel title="Garages" flush action={<span style={{ color: 'var(--text-link)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Tout voir</span>}>
            {garageList.length === 0 ? (
              <div style={{ padding: 18, fontSize: 13.5, color: 'var(--text-muted)' }}>Aucun garage.</div>
            ) : (
              garageList.slice(0, 5).map((g) => (
                <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: '1px solid var(--slate-100)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'var(--surface-sunken)', color: 'var(--text-muted)', flex: 'none' }}>
                    <span className="material-symbols-rounded fill" style={{ fontSize: 20 }}>
                      garage
                    </span>
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5, color: 'var(--text-strong)' }}>{g.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{g.city ?? '—'}</div>
                  </div>
                </div>
              ))
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}
