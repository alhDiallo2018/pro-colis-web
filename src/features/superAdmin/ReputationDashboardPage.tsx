import { Avatar, Badge, StatBox } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import { useReputationDashboard, useDriverRanking } from './hooks'
import { formatPoints } from '@/lib/format'
import { useIsMobile } from '@/lib/useMediaQuery'

const LEVEL_TONE: Record<string, 'primary' | 'amber' | 'green' | 'neutral'> = {
  ELITE: 'primary',
  PREMIUM: 'amber',
  STANDARD: 'green',
  NEW: 'neutral',
}

const LEVEL_LABEL: Record<string, string> = {
  ELITE: 'Élite',
  PREMIUM: 'Premium',
  STANDARD: 'Standard',
  NEW: 'Nouveau',
}

export function ReputationDashboardPage() {
  const isMobile = useIsMobile()
  const dashQuery = useReputationDashboard()
  const rankQuery = useDriverRanking()
  const dash = dashQuery.data
  const rankings = rankQuery.data ?? []
  const top5 = rankings.slice(0, 5)

  const medalColor = (i: number) =>
    i === 0 ? 'var(--amber-600)' : i === 1 ? 'var(--slate-500)' : i === 2 ? 'var(--amber-700)' : 'var(--text-muted)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <QueryState
        isLoading={dashQuery.isLoading}
        isError={dashQuery.isError}
        error={dashQuery.error}
        emptyTitle="Aucune donnée"
        emptyMessage="Les statistiques de réputation ne sont pas disponibles."
        onRetry={() => dashQuery.refetch()}
      >
        {dash && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 20 }}>
            <StatBox icon="social_leaderboard" tone="primary" value={dash.eliteCount} label="Chauffeurs Élite" />
            <StatBox icon="workspace_premium" tone="amber" value={dash.premiumCount} label="Premium" />
            <StatBox icon="verified" tone="green" value={dash.standardCount} label="Standard" />
            <StatBox icon="person_add" tone="neutral" value={dash.newCount} label="Nouveaux" />
            <StatBox icon="star" tone="amber" value={dash.averageRating.toFixed(1)} label="Note moyenne" />
            <StatBox icon="group" tone="teal" value={dash.totalDrivers} label="Total chauffeurs" />
          </div>
        )}
      </QueryState>

      <Panel title="Top 5 · Classement réputation" flush>
        <QueryState
          isLoading={rankQuery.isLoading}
          isError={rankQuery.isError}
          error={rankQuery.error}
          isEmpty={top5.length === 0}
          emptyTitle="Aucun chauffeur classé"
          emptyMessage="Le classement n'est pas encore disponible."
          onRetry={() => rankQuery.refetch()}
        >
          {top5.map((d, i) =>
            isMobile ? (
              <div
                key={d.userId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px',
                  borderBottom: i < top5.length - 1 ? '1px solid var(--slate-100)' : 'none',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: 15,
                    color: medalColor(i),
                    width: 26,
                    flex: 'none',
                  }}
                >
                  #{d.rank}
                </span>
                <Avatar name={d.fullName} src={d.profilePhoto ?? undefined} size="sm" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5, color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {d.fullName}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{d.zoneName ?? '—'}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flex: 'none' }}>
                  <Badge tone={LEVEL_TONE[d.level] ?? 'neutral'}>{LEVEL_LABEL[d.level] ?? d.level}</Badge>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12.5, color: 'var(--text-strong)' }}>
                    {formatPoints(d.points)}
                  </span>
                </div>
              </div>
            ) : (
              <div
                key={d.userId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 18,
                  padding: '16px 20px',
                  borderBottom: i < top5.length - 1 ? '1px solid var(--slate-100)' : 'none',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: 17,
                    color: medalColor(i),
                    width: 34,
                    flex: 'none',
                  }}
                >
                  #{d.rank}
                </span>
                <Avatar name={d.fullName} src={d.profilePhoto ?? undefined} size="md" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14.5, color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {d.fullName}
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 1 }}>{d.zoneName ?? '—'}</div>
                </div>
                <Badge tone={LEVEL_TONE[d.level] ?? 'neutral'}>{LEVEL_LABEL[d.level] ?? d.level}</Badge>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: 'var(--text-strong)', flex: 'none', minWidth: 90, textAlign: 'right' }}>
                  {formatPoints(d.points)}
                </span>
              </div>
            ),
          )}
        </QueryState>
      </Panel>
    </div>
  )
}
