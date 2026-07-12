import { Avatar, Badge, Card } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import { useDriverRanking } from './hooks'
import { formatFcfa, formatPoints } from '@/lib/format'
import type { DriverRanking } from '@/lib/api/admin-reputation'

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

const MEDAL_COLORS = ['var(--amber-400)', 'var(--slate-400)', 'var(--amber-700)']
const MEDAL_ICONS = ['trophy', 'trophy', 'trophy']
const MEDAL_ACCENTS = ['var(--amber-400)', 'var(--slate-400)', 'var(--amber-700)']

const GRID = '40px 44px 1fr 120px 100px 90px 70px 80px 140px 130px'
const cell: React.CSSProperties = { display: 'flex', alignItems: 'center', minWidth: 0 }

function getLevel(points: number): string {
  if (points >= 1000) return 'ELITE'
  if (points >= 500) return 'PREMIUM'
  if (points >= 100) return 'STANDARD'
  return 'NEW'
}

export function ClassementPage() {
  const query = useDriverRanking()
  const rankings = query.data ?? []
  const top3 = rankings.slice(0, 3)
  const rest = rankings.slice(3)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <Panel title="Classement des chauffeurs" flush>
        <QueryState
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          isEmpty={rankings.length === 0}
          emptyTitle="Aucun classement"
          emptyMessage="Le classement n'est pas encore disponible."
          onRetry={() => query.refetch()}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {top3.length > 0 && (
              <div style={{ padding: '20px 18px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {top3.map((d, i) => (
                  <Card
                    key={d.userId}
                    accent={MEDAL_ACCENTS[i]}
                    padding="md"
                    style={{ textAlign: 'center' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                      <span
                        className="material-symbols-rounded"
                        style={{ fontSize: 28, color: MEDAL_COLORS[i], fontVariationSettings: "'FILL' 1" }}
                      >
                        {MEDAL_ICONS[i]}
                      </span>
                    </div>
                    <Avatar name={d.fullName} src={d.profilePhoto ?? undefined} size="lg" style={{ marginBottom: 8 }} />
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'var(--text-strong)', marginBottom: 2 }}>
                      {d.fullName}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{d.garageName ?? '—'}</div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
                      <Badge tone={LEVEL_TONE[d.level] ?? 'neutral'}>{LEVEL_LABEL[d.level] ?? d.level}</Badge>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 20, color: 'var(--color-primary)', marginBottom: 4 }}>
                      {formatPoints(d.points)}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 14, color: 'var(--amber-400)' }}>star</span>
                      {d.rating?.toFixed(1) ?? '—'}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {rest.length > 0 && (
              <div className="pc-table-scroll">
                <div style={{ minWidth: 850 }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: GRID,
                      padding: '11px 18px',
                      borderTop: '1px solid var(--border-subtle)',
                      borderBottom: '1px solid var(--border-subtle)',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700,
                      fontSize: 11,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: 'var(--text-faint)',
                    }}
                  >
                    <span>#</span>
                    <span>Photo</span>
                    <span>Nom</span>
                    <span>Zone</span>
                    <span>Région</span>
                    <span style={{ justifyContent: 'flex-end', display: 'flex' }}>Score</span>
                    <span>Niveau</span>
                    <span style={{ justifyContent: 'flex-end', display: 'flex' }}>Note</span>
                    <span style={{ justifyContent: 'flex-end', display: 'flex' }}>Livraisons</span>
                    <span style={{ justifyContent: 'flex-end', display: 'flex' }}>Taux réussite</span>
                    <span style={{ justifyContent: 'flex-end', display: 'flex' }}>Solde</span>
                  </div>
                  {rest.map((d) => (
                    <div
                      key={d.userId}
                      style={{ display: 'grid', gridTemplateColumns: GRID, alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid var(--slate-100)' }}
                    >
                      <span style={{ ...cell, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--text-body)' }}>
                        {d.rank}
                      </span>
                      <span style={cell}>
                        <Avatar name={d.fullName} src={d.profilePhoto ?? undefined} size="xs" />
                      </span>
                      <span style={{ ...cell, fontSize: 13, color: 'var(--text-strong)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                        {d.fullName}
                      </span>
                      <span style={{ ...cell, fontSize: 12.5, color: 'var(--text-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                        {d.garageName ?? '—'}
                      </span>
                      <span style={{ ...cell, fontSize: 12.5, color: 'var(--text-body)' }}>{d.region ?? '—'}</span>
                      <span style={{ ...cell, fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, color: 'var(--color-primary)', justifyContent: 'flex-end' }}>
                        {formatPoints(d.points)}
                      </span>
                      <span style={cell}>
                        <Badge tone={LEVEL_TONE[d.level] ?? 'neutral'}>{LEVEL_LABEL[d.level] ?? d.level}</Badge>
                      </span>
                      <span style={{ ...cell, fontSize: 12.5, color: 'var(--text-body)', fontWeight: 600, justifyContent: 'flex-end', gap: 3 }}>
                        {d.rating?.toFixed(1) ?? '—'}
                        <span className="material-symbols-rounded" style={{ fontSize: 14, color: 'var(--amber-400)' }}>star</span>
                      </span>
                      <span style={{ ...cell, fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 12, color: 'var(--text-body)', justifyContent: 'flex-end' }}>
                        {d.totalDeliveries ?? '—'}
                      </span>
                      <span style={{ ...cell, fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 12, color: d.successRate != null && d.successRate >= 80 ? 'var(--green-600)' : 'var(--text-body)', justifyContent: 'flex-end' }}>
                        {d.successRate != null ? `${d.successRate}%` : '—'}
                      </span>
                      <span style={{ ...cell, fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12, color: 'var(--teal-600)', justifyContent: 'flex-end' }}>
                        {d.walletBalance != null ? formatFcfa(d.walletBalance) : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {rankings.length === 0 && top3.length === 0 && null}
          </div>
        </QueryState>
      </Panel>
    </div>
  )
}
