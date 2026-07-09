import { Badge, StatBox } from '@/ds'
import { Panel } from '@/components/Panel'
import { BarChart } from '@/components/BarChart'
import { PARCEL_STATUS, type ParcelStatus } from '@/ds'
import { useGarageParcels } from './hooks'
import { toStatusKey } from '@/lib/format'

const WEEK = [52, 60, 48, 71, 66, 80, 100]
const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export function GarageRapportsPage() {
  const query = useGarageParcels({ limit: 100 })
  const parcels = query.data?.parcels ?? []

  const delivered = parcels.filter((p) => p.status === 'delivered').length
  const cancelled = parcels.filter((p) => p.status === 'cancelled').length
  const rate = parcels.length ? Math.round((delivered / parcels.length) * 100) : 0

  // Breakdown by lifecycle status for the bar list.
  const counts = parcels.reduce<Record<string, number>>((acc, p) => {
    const k = toStatusKey(p.status)
    acc[k] = (acc[k] ?? 0) + 1
    return acc
  }, {})
  const maxCount = Math.max(1, ...Object.values(counts))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
        <StatBox icon="package_2" tone="primary" value={parcels.length} label="Colis traités" />
        <StatBox icon="task_alt" tone="green" value={delivered} label="Livrés" />
        <StatBox icon="cancel" tone="red" value={cancelled} label="Annulés" />
        <StatBox icon="verified" tone="amber" value={`${rate}%`} label="Taux de livraison" />
      </div>

      <div className="pc-duo">
        <Panel title="Activité · 7 jours" action={<Badge tone="green">+9%</Badge>}>
          <BarChart bars={WEEK} labels={DAYS} height={140} highlightLast />
        </Panel>

        <Panel title="Répartition par statut">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(counts).length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 13.5 }}>Aucune donnée.</div>}
            {Object.entries(counts).map(([k, n]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 110, fontSize: 13, color: 'var(--text-body)', fontWeight: 600 }}>{PARCEL_STATUS[k as ParcelStatus].label}</span>
                <div style={{ flex: 1, height: 10, background: 'var(--surface-sunken)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
                  <div style={{ width: `${(n / maxCount) * 100}%`, height: '100%', background: 'var(--color-primary)' }} />
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, color: 'var(--text-strong)', width: 28, textAlign: 'right' }}>{n}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}
