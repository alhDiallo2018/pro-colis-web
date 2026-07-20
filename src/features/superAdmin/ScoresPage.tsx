import { useState } from 'react'
import { Avatar, Badge, Button, Input, Select, StatBox, Toast } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import {
  useReputationDashboard,
  useScores,
  useScore,
  useScoreHistory,
} from './hooks'
import { formatDate, formatDateTime, formatPoints } from '@/lib/format'
import { useIsMobile } from '@/lib/useMediaQuery'
import { AddPointsDialog } from './AddPointsDialog'
import { RemovePointsDialog } from './RemovePointsDialog'

const LEVEL_TONE: Record<string, 'primary' | 'amber' | 'green' | 'neutral'> = {
  ELITE: 'primary',
  PREMIUM: 'amber',
  STANDARD: 'green',
  NEW: 'neutral',
}

const TX_TONE: Record<string, 'green' | 'red' | 'neutral'> = {
  earn: 'green',
  bonus: 'green',
  spend: 'red',
  penalty: 'red',
}

const TX_LABEL: Record<string, string> = {
  earn: 'Gain',
  bonus: 'Bonus',
  spend: 'Dépense',
  penalty: 'Pénalité',
  adjustment: 'Ajustement',
}

const TX_FILTERS = [
  { value: '', label: 'Tous' },
  { value: 'earn', label: 'Gains' },
  { value: 'spend', label: 'Dépenses' },
  { value: 'bonus', label: 'Bonus' },
  { value: 'penalty', label: 'Pénalités' },
]

const GRID = 'minmax(160px, 1fr) 120px 120px 100px 90px 80px 150px'
const cell: React.CSSProperties = { display: 'flex', alignItems: 'center', minWidth: 0 }

/** Paire label/valeur d'une carte mobile. */
function MobileField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontSize: 12.5 }}>
      <span style={{ color: 'var(--text-muted)', flex: 'none' }}>{label}</span>
      <span style={{ minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', color: 'var(--text-body)' }}>{children}</span>
    </div>
  )
}

export function ScoresPage() {
  const isMobile = useIsMobile()
  const [view, setView] = useState<'list' | 'detail'>('list')
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [search, setSearch] = useState('')
  const [garage, setGarage] = useState('')
  const [region, setRegion] = useState('')
  const [level, setLevel] = useState('')

  const [addOpen, setAddOpen] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)
  const [errorToast, setErrorToast] = useState<string | null>(null)

  const [txFilter, setTxFilter] = useState('')

  const dashQuery = useReputationDashboard()
  const dash = dashQuery.data

  const listParams: Record<string, string | number | undefined> = {}
  if (search) listParams.search = search
  if (garage) listParams.garage = garage
  if (region) listParams.region = region
  if (level) listParams.level = level

  const scoresQuery = useScores(listParams)
  const scores = scoresQuery.data?.scores ?? []

  const scoreQuery = useScore(view === 'detail' ? selectedUserId : undefined)
  const historyQuery = useScoreHistory(view === 'detail' ? selectedUserId : undefined, txFilter ? { type: txFilter } : {})

  const scoreDetail = scoreQuery.data
  const transactions = historyQuery.data ?? []

  const openDetail = (userId: string) => {
    setSelectedUserId(userId)
    setView('detail')
  }

  const backToList = () => {
    setView('list')
    setSelectedUserId('')
    setErrorToast(null)
  }

  if (view === 'detail' && selectedUserId) {
    const user = scoreDetail
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {errorToast && (
          <Toast tone="error" message={errorToast} onClose={() => setErrorToast(null)} />
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button variant="ghost" icon="arrow_back" onClick={backToList}>
            Retour
          </Button>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--text-strong)' }}>
            {user?.driverName ?? 'Chauffeur'}
          </h2>
        </div>

        <QueryState
          isLoading={scoreQuery.isLoading}
          isError={scoreQuery.isError}
          error={scoreQuery.error}
          emptyTitle="Aucun score"
          emptyMessage="Ce chauffeur n'a pas de score."
          onRetry={() => scoreQuery.refetch()}
        >
          {user && (
            <>
              <Panel title="Informations">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Nom</div>
                    <div style={{ fontWeight: 700, color: 'var(--text-strong)' }}>{user.driverName ?? '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Zone</div>
                    <div style={{ fontWeight: 500, color: 'var(--text-body)' }}>{user.garageName ?? '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Région</div>
                    <div style={{ fontWeight: 500, color: 'var(--text-body)' }}>{user.region ?? '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Niveau</div>
                    <Badge tone={LEVEL_TONE[user.level] ?? 'neutral'}>{user.level}</Badge>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Note</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-body)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 16, color: 'var(--amber-400)' }}>star</span>
                      {user.rating?.toFixed(1) ?? '—'}
                    </div>
                  </div>
                </div>
              </Panel>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
                <StatBox icon="stars" tone="primary" value={user.points} label="Points actuels" />
                <StatBox icon="trending_up" tone="green" value={user.totalEarned} label="Total gagné" />
                <StatBox icon="trending_down" tone="red" value={user.totalSpent} label="Total dépensé" />
                <StatBox icon="military_tech" tone="amber" value={user.level} label="Niveau" />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <Button icon="add" variant="primary" onClick={() => setAddOpen(true)}>Ajouter points</Button>
                <Button icon="remove" variant="danger" onClick={() => setRemoveOpen(true)}>Retirer points</Button>
              </div>

              <Panel title="Historique des transactions" flush>
                <div style={{ display: 'flex', padding: '12px 18px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <Select
                    value={txFilter}
                    onChange={(e) => setTxFilter(e.target.value)}
                    options={TX_FILTERS}
                    placeholder="Type de transaction"
                    style={{ maxWidth: 200 }}
                  />
                </div>
                {isMobile ? (
                  <QueryState
                    isLoading={historyQuery.isLoading}
                    isError={historyQuery.isError}
                    error={historyQuery.error}
                    isEmpty={transactions.length === 0}
                    emptyTitle="Aucune transaction"
                    emptyMessage="Aucune transaction trouvée pour ce chauffeur."
                    onRetry={() => historyQuery.refetch()}
                  >
                    {transactions.map((tx) => (
                      <div key={tx.id} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '13px 16px', borderBottom: '1px solid var(--slate-100)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-body)' }}>{formatDateTime(tx.createdAt)}</span>
                          <Badge tone={TX_TONE[tx.type] ?? 'neutral'}>{TX_LABEL[tx.type] ?? tx.type}</Badge>
                        </div>
                        <MobileField label="Points">
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, color: tx.amount > 0 ? 'var(--green-600)' : 'var(--red-500)' }}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount} pts
                          </span>
                        </MobileField>
                        <MobileField label="Description">
                          <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description || '—'}</span>
                        </MobileField>
                      </div>
                    ))}
                  </QueryState>
                ) : (
                <div className="pc-table-scroll">
                  <div style={{ minWidth: 600 }}>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 100px 120px 1fr',
                        padding: '11px 18px',
                        borderBottom: '1px solid var(--border-subtle)',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 700,
                        fontSize: 11,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: 'var(--text-faint)',
                      }}
                    >
                      <span>Date</span>
                      <span>Type</span>
                      <span>Points</span>
                      <span>Description</span>
                    </div>
                    <QueryState
                      isLoading={historyQuery.isLoading}
                      isError={historyQuery.isError}
                      error={historyQuery.error}
                      isEmpty={transactions.length === 0}
                      emptyTitle="Aucune transaction"
                      emptyMessage="Aucune transaction trouvée pour ce chauffeur."
                      onRetry={() => historyQuery.refetch()}
                    >
                      {transactions.map((tx) => (
                        <div
                          key={tx.id}
                          style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px 1fr', alignItems: 'center', padding: '11px 18px', borderBottom: '1px solid var(--slate-100)' }}
                        >
                          <span style={{ ...cell, fontSize: 12.5, color: 'var(--text-body)' }}>{formatDateTime(tx.createdAt)}</span>
                          <span style={cell}>
                            <Badge tone={TX_TONE[tx.type] ?? 'neutral'}>{TX_LABEL[tx.type] ?? tx.type}</Badge>
                          </span>
                          <span style={{
                            ...cell,
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            fontSize: 13,
                            color: tx.amount > 0 ? 'var(--green-600)' : 'var(--red-500)',
                          }}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount} pts
                          </span>
                          <span style={{ ...cell, fontSize: 12.5, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                            {tx.description || '—'}
                          </span>
                        </div>
                      ))}
                    </QueryState>
                  </div>
                </div>
                )}
              </Panel>
            </>
          )}
        </QueryState>

        <AddPointsDialog
          userId={selectedUserId}
          open={addOpen}
          onClose={() => setAddOpen(false)}
        />
        <RemovePointsDialog
          userId={selectedUserId}
          open={removeOpen}
          onClose={() => setRemoveOpen(false)}
        />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <QueryState
        isLoading={dashQuery.isLoading}
        isError={dashQuery.isError}
        error={dashQuery.error}
        emptyTitle="Aucune donnée"
        emptyMessage="Les statistiques ne sont pas disponibles."
        onRetry={() => dashQuery.refetch()}
      >
        {dash && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
            <StatBox icon="social_leaderboard" tone="primary" value={dash.eliteCount} label="Élite" />
            <StatBox icon="workspace_premium" tone="amber" value={dash.premiumCount} label="Premium" />
            <StatBox icon="verified" tone="green" value={dash.standardCount} label="Standard" />
            <StatBox icon="person_add" tone="neutral" value={dash.newCount} label="Nouveaux" />
            <StatBox icon="star" tone="amber" value={dash.averageRating.toFixed(1)} label="Note moyenne" />
            <StatBox icon="group" tone="teal" value={dash.totalDrivers} label="Total" />
          </div>
        )}
      </QueryState>

      <Panel title={`Scores${scoresQuery.data?.pagination ? ` · ${scoresQuery.data.pagination.total}` : ''}`} flush>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
          <Input
            icon="search"
            placeholder="Rechercher un chauffeur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 180 }}
          />
          <Select
            value={garage}
            onChange={(e) => setGarage(e.target.value)}
            options={[]}
            placeholder="Zone"
            style={{ minWidth: 140 }}
          />
          <Select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            options={[]}
            placeholder="Région"
            style={{ minWidth: 130 }}
          />
          <Select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            options={[
              { value: '', label: 'Tous niveaux' },
              { value: 'NEW', label: 'Nouveau' },
              { value: 'STANDARD', label: 'Standard' },
              { value: 'PREMIUM', label: 'Premium' },
              { value: 'ELITE', label: 'Élite' },
            ]}
            style={{ minWidth: 150 }}
          />
        </div>

        {isMobile ? (
          <QueryState
            isLoading={scoresQuery.isLoading}
            isError={scoresQuery.isError}
            error={scoresQuery.error}
            isEmpty={scores.length === 0}
            emptyTitle="Aucun score"
            emptyMessage="Aucun chauffeur trouvé."
            onRetry={() => scoresQuery.refetch()}
          >
            {scores.map((s) => (
              <div
                key={s.userId}
                onClick={() => openDetail(s.userId)}
                style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '13px 16px', borderBottom: '1px solid var(--slate-100)', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar name={s.driverName ?? ''} size="xs" />
                  <span style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5, color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.driverName ?? '—'}
                  </span>
                  <Badge tone={LEVEL_TONE[s.level] ?? 'neutral'}>{s.level}</Badge>
                </div>
                <MobileField label="Zone">
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.garageName ?? '—'}</span>
                </MobileField>
                <MobileField label="Région">{s.region ?? '—'}</MobileField>
                <MobileField label="Score">
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, color: 'var(--color-primary)' }}>{formatPoints(s.points)}</span>
                </MobileField>
                <MobileField label="Note">
                  <span style={{ fontWeight: 600 }}>{s.rating?.toFixed(1) ?? '—'} ★</span>
                </MobileField>
                <MobileField label="Livraisons">
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{s.totalDeliveries ?? '—'}</span>
                </MobileField>
                <MobileField label="Mise à jour">
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(s.lastUpdated)}</span>
                </MobileField>
              </div>
            ))}
          </QueryState>
        ) : (
        <div className="pc-table-scroll">
          <div style={{ minWidth: 760 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: GRID,
                padding: '11px 18px',
                borderBottom: '1px solid var(--border-subtle)',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--text-faint)',
              }}
            >
              <span>Chauffeur</span>
              <span>Zone</span>
              <span>Région</span>
              <span style={{ justifyContent: 'flex-end', display: 'flex' }}>Score</span>
              <span>Niveau</span>
              <span>Note</span>
              <span style={{ justifyContent: 'flex-end', display: 'flex' }}>Livraisons</span>
              <span>Mise à jour</span>
            </div>

            <QueryState
              isLoading={scoresQuery.isLoading}
              isError={scoresQuery.isError}
              error={scoresQuery.error}
              isEmpty={scores.length === 0}
              emptyTitle="Aucun score"
              emptyMessage="Aucun chauffeur trouvé."
              onRetry={() => scoresQuery.refetch()}
            >
              {scores.map((s) => (
                <div
                  key={s.userId}
                  style={{ display: 'grid', gridTemplateColumns: GRID, alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid var(--slate-100)', cursor: 'pointer' }}
                  onClick={() => openDetail(s.userId)}
                >
                  <span style={{ ...cell, gap: 8 }}>
                    <Avatar name={s.driverName ?? ''} size="xs" />
                    <span style={{ fontSize: 13, color: 'var(--text-strong)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.driverName ?? '—'}
                    </span>
                  </span>
                  <span style={{ ...cell, fontSize: 12.5, color: 'var(--text-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                    {s.garageName ?? '—'}
                  </span>
                  <span style={{ ...cell, fontSize: 12.5, color: 'var(--text-body)' }}>{s.region ?? '—'}</span>
                  <span style={{ ...cell, fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13.5, color: 'var(--color-primary)', justifyContent: 'flex-end' }}>
                    {formatPoints(s.points)}
                  </span>
                  <span style={cell}>
                    <Badge tone={LEVEL_TONE[s.level] ?? 'neutral'}>{s.level}</Badge>
                  </span>
                  <span style={{ ...cell, fontSize: 13, color: 'var(--text-body)', fontWeight: 600 }}>{s.rating?.toFixed(1) ?? '—'} ★</span>
                  <span style={{ ...cell, fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 12.5, color: 'var(--text-body)', justifyContent: 'flex-end' }}>
                    {s.totalDeliveries ?? '—'}
                  </span>
                  <span style={{ ...cell, fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(s.lastUpdated)}</span>
                </div>
              ))}
            </QueryState>
          </div>
        </div>
        )}
      </Panel>
    </div>
  )
}
