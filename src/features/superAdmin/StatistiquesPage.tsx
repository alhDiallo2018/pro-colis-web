import { Badge, StatBox } from '@/ds'
import { Panel } from '@/components/Panel'
import { BarChart } from '@/components/BarChart'
import { useAdminDrivers, useAdminZones, useAdminParcels, useAdminStats } from './hooks'

const VOLUME = [38, 44, 41, 52, 49, 61, 58, 67, 72, 70, 84, 100]
const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
const REVENUE = [52, 60, 48, 71, 66, 80, 74, 88, 92, 85, 96, 100]

function prettyKey(k: string) {
  return k.replace(/[_-]/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^\w/, (c) => c.toUpperCase())
}

export function StatistiquesPage() {
  const parcels = useAdminParcels()
  const zones = useAdminZones()
  const drivers = useAdminDrivers()
  const stats = useAdminStats()

  // Surface any numeric/string scalars the backend exposes, beyond our derived counts.
  const extra = Object.entries(stats.data ?? {}).filter(
    ([, v]) => typeof v === 'number' || typeof v === 'string',
  ) as [string, number | string][]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
        <StatBox icon="package_2" tone="primary" value={parcels.data?.pagination?.total ?? parcels.data?.parcels.length ?? '—'} label="Colis au total" delta={12} />
        <StatBox icon="local_shipping" tone="green" value={drivers.data?.length ?? '—'} label="Chauffeurs" delta={4} />
        <StatBox icon="garage" tone="amber" value={zones.data?.length ?? '—'} label="Zones" delta={2} />
        <StatBox icon="task_alt" tone="neutral" value={(parcels.data?.parcels ?? []).filter((p) => p.status === 'delivered').length} label="Colis livrés" delta={9} />
      </div>

      <div className="pc-duo">
        <Panel title="Volume de colis · 12 mois" action={<Badge tone="primary">+12%</Badge>}>
          <BarChart bars={VOLUME} labels={MONTHS} height={140} />
        </Panel>
        <Panel title="Revenus · 12 mois" action={<Badge tone="green">+18%</Badge>}>
          <BarChart bars={REVENUE} labels={MONTHS} height={140} highlightLast />
        </Panel>
      </div>

      {extra.length > 0 && (
        <Panel title="Indicateurs détaillés">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
            {extra.map(([k, v]) => (
              <div key={k} style={{ padding: 14, background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)' }}>{String(v)}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>{prettyKey(k)}</div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  )
}
