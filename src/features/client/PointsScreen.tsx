import { Button } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import { useScoreBalance, useScoreHistory } from './hooks'
import { formatDateTime, formatPoints } from '@/lib/format'

export function PointsScreen() {
  const balance = useScoreBalance()
  const history = useScoreHistory()
  const txns = history.data ?? []

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Balance card */}
      <div style={{ background: 'var(--gradient-brand)', borderRadius: 'var(--radius-lg)', padding: 24, color: '#fff', boxShadow: 'var(--shadow-brand)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.18)' }}>
            <span className="material-symbols-rounded fill" style={{ fontSize: 28 }}>account_balance_wallet</span>
          </span>
          <div>
            <div style={{ fontSize: 12, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Solde de points</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 32 }}>
              {balance.data ?? '—'}
              <span style={{ fontSize: 15, opacity: 0.8 }}> pts</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18, maxWidth: 320 }}>
          <Button variant="amber" block icon="add">Recharger</Button>
          <Button variant="secondary" block icon="redeem">Utiliser</Button>
        </div>
      </div>

      <Panel title="Historique des points" flush>
        <QueryState
          isLoading={history.isLoading}
          isError={history.isError}
          error={history.error}
          isEmpty={txns.length === 0}
          emptyTitle="Aucun mouvement"
          emptyMessage="Vos crédits et débits de points apparaîtront ici."
          onRetry={() => history.refetch()}
        >
          {txns.map((t) => {
            const positive = (t.amount ?? 0) >= 0
            return (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px', borderBottom: '1px solid var(--slate-100)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 'var(--radius-sm)', background: positive ? 'var(--green-50)' : 'var(--red-50)', color: positive ? 'var(--green-700)' : 'var(--red-500)', flex: 'none' }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 20 }}>{positive ? 'trending_up' : 'trending_down'}</span>
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13.5, color: 'var(--text-strong)' }}>{t.description ?? t.type}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDateTime(t.timestamp ?? t.createdAt)}</div>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: positive ? 'var(--green-600)' : 'var(--red-500)' }}>
                  {formatPoints(t.amount)}
                </span>
              </div>
            )
          })}
        </QueryState>
      </Panel>
    </div>
  )
}
