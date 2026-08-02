import { Avatar, Badge, type AvatarStatus } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import { useAdminDrivers } from './hooks'

const AVATAR_STATUS: Record<string, AvatarStatus> = { available: 'online', busy: 'busy', offline: 'offline' }
const STATUS_LABEL: Record<string, { label: string; tone: 'green' | 'amber' | 'neutral' }> = {
  available: { label: 'Disponible', tone: 'green' },
  busy: { label: 'Occupé', tone: 'amber' },
  offline: { label: 'Hors ligne', tone: 'neutral' },
}

export function ChauffeursPage() {
  const query = useAdminDrivers()
  const drivers = query.data ?? []

  return (
    <Panel title={`Chauffeurs · ${drivers.length}`} flush>
      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        isEmpty={drivers.length === 0}
        emptyTitle="Aucun chauffeur"
        emptyMessage="Aucun chauffeur enregistré pour le moment."
        onRetry={() => query.refetch()}
      >
        {drivers.map((d) => {
          const st = STATUS_LABEL[d.driverStatus ?? 'offline'] ?? STATUS_LABEL.offline
          return (
            <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: '1px solid var(--slate-100)' }}>
              <Avatar name={d.fullName} src={d.profilePhoto ?? undefined} status={AVATAR_STATUS[d.driverStatus ?? 'offline'] ?? 'offline'} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14.5, color: 'var(--text-strong)' }}>{d.fullName}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                  {d.city ?? d.zoneName ?? '—'} · {d.phone}
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 12.5, color: 'var(--text-muted)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-body)' }}>{d.rating ?? '—'} ★</div>
                <div>{d.completedDeliveries ?? 0} livraisons</div>
              </div>
              <Badge tone={st.tone}>{st.label}</Badge>
            </div>
          )
        })}
      </QueryState>
    </Panel>
  )
}
