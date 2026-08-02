import { Avatar, Badge, StatBox } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import { useReputationDashboard, useDriverRanking } from './hooks'
import { formatPoints } from '@/lib/format'

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
  const dashQuery = useReputationDashboard()
  const rankQuery = useDriverRanking()
  const dash = dashQuery.data
  const rankings = rankQuery.data ?? []
  const top5 = rankings.slice(0, 5)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <QueryState
        isLoading={dashQuery.isLoading}
        isError={dashQuery.isError}
        error={dashQuery.error}
        emptyTitle="Aucune donnée"
        emptyMessage="Les statistiques de réputation ne sont pas disponibles."
        onRetry={() => dashQuery.refetch()}
      >
        {dash && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
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
          {top5.map((d, i) => (
            <div
              key={d.userId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 18px',
                borderBottom: i < top5.length - 1 ? '1px solid var(--slate-100)' : 'none',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: 16,
                  color: i === 0 ? 'var(--amber-600)' : i === 1 ? 'var(--slate-500)' : i === 2 ? 'var(--amber-700)' : 'var(--text-muted)',
                  width: 28,
                  flex: 'none',
                }}
              >
                #{d.rank}
              </span>
              <Avatar name={d.fullName} src={d.profilePhoto ?? undefined} size="sm" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {d.fullName}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.zoneName ?? '—'}</div>
              </div>
              <Badge tone={LEVEL_TONE[d.level] ?? 'neutral'}>{LEVEL_LABEL[d.level] ?? d.level}</Badge>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, color: 'var(--text-strong)', flex: 'none' }}>
                {formatPoints(d.points)}
              </span>
            </div>
          ))}
        </QueryState>
      </Panel>
    </div>
  )
}
