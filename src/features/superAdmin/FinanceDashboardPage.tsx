import { StatBox } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import { useFinanceDashboard } from './hooks'
import { formatFcfa } from '@/lib/format'

export function FinanceDashboardPage() {
  const query = useFinanceDashboard()
  const d = query.data

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <Panel title="Tableau de bord financier">
        <QueryState
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          isEmpty={!d}
          emptyTitle="Aucune donnée"
          emptyMessage="Les données financières ne sont pas disponibles."
          onRetry={() => query.refetch()}
        >
          {d && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
              <StatBox icon="wallet" tone="primary" value={d.totalWallets} label="Total Wallets" />
              <StatBox icon="account_balance_wallet" tone="green" value={formatFcfa(d.totalBalance)} label="Solde Total" />
              <StatBox icon="trending_up" tone="teal" value={formatFcfa(d.totalDeposited)} label="Total Rechargé" />
              <StatBox icon="percent" tone="amber" value={formatFcfa(d.commissionsMonth)} label="Commissions du mois" />
              <StatBox icon="add_card" tone="primary" value={formatFcfa(d.depositsMonth)} label="Recharges du mois" />
              <StatBox icon="warning" tone="red" value={d.walletsLow} label="Wallets faibles (&lt;500 FCFA)" />
              <StatBox icon="hourglass_disabled" tone="neutral" value={d.walletsInactive} label="Wallets inactifs" />
            </div>
          )}
        </QueryState>
      </Panel>
    </div>
  )
}
