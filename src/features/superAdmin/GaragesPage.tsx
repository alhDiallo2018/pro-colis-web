import { Badge } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import { useAdminGarages } from './hooks'

export function GaragesPage() {
  const query = useAdminGarages()
  const garages = query.data ?? []

  return (
    <Panel title={`Zones · ${garages.length}`} flush>
      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        isEmpty={garages.length === 0}
        emptyTitle="Aucune zone"
        emptyMessage="Aucune zone enregistrée pour le moment."
        onRetry={() => query.refetch()}
      >
        {garages.map((g) => (
          <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: '1px solid var(--slate-100)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 42, height: 42, borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)', color: 'var(--text-muted)', flex: 'none' }}>
              <span className="material-symbols-rounded fill" style={{ fontSize: 23 }}>garage</span>
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14.5, color: 'var(--text-strong)' }}>{g.name}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                {[g.city, g.region].filter(Boolean).join(', ') || '—'}
                {g.phone && ` · ${g.phone}`}
              </div>
            </div>
            <Badge tone={g.isActive === false ? 'neutral' : 'green'}>{g.isActive === false ? 'Inactif' : 'Actif'}</Badge>
          </div>
        ))}
      </QueryState>
    </Panel>
  )
}
