import { Badge, Icon, StatBox } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import { useNetworkCoverage, useSupportCommercialStats } from './hooks'

/**
 * Couverture du réseau — pendant web de l'onglet « Couverture » du mobile.
 * L'API ne renvoie que les zones sous le seuil : la liste est une liste de
 * trous à combler, pas un annuaire des zones.
 */
export function CoverageScreen() {
  const query = useNetworkCoverage()
  const stats = useSupportCommercialStats()
  const coverage = query.data
  const gaps = coverage?.gaps ?? []
  const covered = coverage ? coverage.totalZones - gaps.length : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <StatBox icon="public" tone="primary" value={coverage?.totalZones ?? '—'} label="Zones du réseau" />
        <StatBox icon="check_circle" tone="green" value={covered ?? '—'} label="Zones couvertes" />
        <StatBox
          icon="warning"
          tone={gaps.length ? 'amber' : 'green'}
          value={coverage ? gaps.length : '—'}
          label="Zones à densifier"
        />
        <StatBox icon="add_business" tone="teal" value={stats.data?.newZonesSigned ?? '—'} label="Nouvelles zones signées" />
      </div>

      <Panel
        title="Zones à densifier"
        flush
        action={
          coverage ? (
            <Badge tone="neutral">Seuil : {coverage.thinThreshold} chauffeurs actifs</Badge>
          ) : undefined
        }
      >
        <QueryState
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          isEmpty={gaps.length === 0}
          emptyTitle="Réseau couvert"
          emptyMessage="Toutes les zones atteignent le seuil de chauffeurs actifs."
          onRetry={() => query.refetch()}
        >
          {gaps.map((gap) => (
            <div
              key={gap.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '13px 18px',
                borderBottom: '1px solid var(--slate-100)',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 38,
                  height: 38,
                  borderRadius: 'var(--radius-sm)',
                  background: gap.activeDrivers === 0 ? 'var(--red-50)' : 'var(--amber-50)',
                  color: gap.activeDrivers === 0 ? 'var(--red-500)' : 'var(--amber-700)',
                  flex: 'none',
                }}
              >
                <Icon name="warehouse" size={20} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text-strong)' }}>
                  {gap.name}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                  {[gap.city, gap.region].filter(Boolean).join(' · ') || 'Localisation non renseignée'}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>{gap.reason}</div>
              </div>
              <Badge tone={gap.activeDrivers === 0 ? 'red' : 'amber'}>
                {gap.activeDrivers} chauffeur{gap.activeDrivers > 1 ? 's' : ''}
              </Badge>
            </div>
          ))}
        </QueryState>
      </Panel>
    </div>
  )
}
