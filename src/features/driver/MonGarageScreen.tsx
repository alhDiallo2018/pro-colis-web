import { useQuery } from '@tanstack/react-query'
import { Avatar, EmptyState, type AvatarStatus } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import { useAuthStore } from '@/store/auth'
import * as roles from '@/lib/api/roles'
import * as zonesApi from '@/lib/api/zones'

const AVATAR_STATUS: Record<string, AvatarStatus> = { available: 'online', busy: 'busy', offline: 'offline' }

export function MonGarageScreen() {
  const user = useAuthStore((s) => s.user)
  const zoneId = user?.zoneId ?? undefined

  const zones = useQuery({ queryKey: ['zones', 'public'], queryFn: () => zonesApi.listPublic(), staleTime: 5 * 60_000 })
  const colleagues = useQuery({
    queryKey: ['driver', 'garage-colleagues', zoneId],
    queryFn: () => roles.garageColleagues(zoneId as string),
    enabled: !!zoneId,
  })

  if (!zoneId) {
    return (
      <EmptyState
        icon="garage"
        tone="primary"
        title="Aucune zone rattachée"
        message="Vous n'êtes rattaché à aucune zone. Contactez un administrateur pour en rejoindre une."
      />
    )
  }

  const zone = (zones.data ?? []).find((z) => z.id === zoneId)
  const team = (colleagues.data ?? []).filter((d) => d.id !== user?.id)

  return (
    <div className="cm-detail-page" style={{ maxWidth: 760 }}>
      <section className="cm-driver-hero" aria-label="Zone du chauffeur">
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, var(--teal-500), var(--teal-700))', color: '#fff', flex: 'none' }}>
          <span className="material-symbols-rounded fill" style={{ fontSize: 30 }}>garage</span>
        </span>
        <div className="cm-driver-hero-body">
          <p className="cm-driver-hero-name">{zone?.name ?? user?.zoneName ?? 'Ma zone'}</p>
          <p className="cm-driver-hero-sub">{[zone?.city, zone?.region].filter(Boolean).join(', ') || '—'}</p>
        </div>
      </section>

      <Panel title={`Chauffeurs de la zone · ${team.length}`} flush>
        <QueryState
          isLoading={colleagues.isLoading}
          isError={colleagues.isError}
          error={colleagues.error}
          isEmpty={team.length === 0}
          emptyTitle="Aucun collègue"
          emptyMessage="Vous êtes le seul chauffeur rattaché à cette zone pour le moment."
          onRetry={() => colleagues.refetch()}
        >
          {team.map((d) => (
            <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: '1px solid var(--slate-100)' }}>
              <Avatar name={d.fullName} src={d.profilePhoto ?? undefined} status={AVATAR_STATUS[d.driverStatus ?? 'offline'] ?? 'offline'} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text-strong)' }}>{d.fullName}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.rating ?? '—'} ★ · {d.completedDeliveries ?? 0} livraisons</div>
              </div>
            </div>
          ))}
        </QueryState>
      </Panel>
    </div>
  )
}
