import { useQuery } from '@tanstack/react-query'
import { Avatar, Card, EmptyState, type AvatarStatus } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import { useAuthStore } from '@/store/auth'
import * as roles from '@/lib/api/roles'
import * as garagesApi from '@/lib/api/garages'

const AVATAR_STATUS: Record<string, AvatarStatus> = { available: 'online', busy: 'busy', offline: 'offline' }

export function MonGarageScreen() {
  const user = useAuthStore((s) => s.user)
  const garageId = user?.garageId ?? undefined

  const garages = useQuery({ queryKey: ['garages', 'public'], queryFn: () => garagesApi.listPublic(), staleTime: 5 * 60_000 })
  const colleagues = useQuery({
    queryKey: ['driver', 'garage-colleagues', garageId],
    queryFn: () => roles.garageColleagues(garageId as string),
    enabled: !!garageId,
  })

  if (!garageId) {
    return (
      <EmptyState
        icon="garage"
        tone="primary"
        title="Aucun garage rattaché"
        message="Vous n'êtes rattaché à aucun garage. Contactez un administrateur pour en rejoindre un."
      />
    )
  }

  const garage = (garages.data ?? []).find((g) => g.id === garageId)
  const team = (colleagues.data ?? []).filter((d) => d.id !== user?.id)

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card padding="lg">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-soft)', color: 'var(--color-primary)', flex: 'none' }}>
            <span className="material-symbols-rounded fill" style={{ fontSize: 30 }}>garage</span>
          </span>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--fs-h2)', color: 'var(--text-strong)' }}>
              {garage?.name ?? user?.garageName ?? 'Mon garage'}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-sm)', marginTop: 2 }}>
              {[garage?.city, garage?.region].filter(Boolean).join(', ') || '—'}
              {garage?.phone && ` · ${garage.phone}`}
            </div>
          </div>
        </div>
      </Card>

      <Panel title={`Chauffeurs du garage · ${team.length}`} flush>
        <QueryState
          isLoading={colleagues.isLoading}
          isError={colleagues.isError}
          error={colleagues.error}
          isEmpty={team.length === 0}
          emptyTitle="Aucun collègue"
          emptyMessage="Vous êtes le seul chauffeur rattaché à ce garage pour le moment."
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
