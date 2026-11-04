import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Button, Icon } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import { getWallet } from '@/lib/api/score'
import { formatFcfa } from '@/lib/format'
import { useAuthStore } from '@/store/auth'

export function ClientWalletScreen() {
  const user = useAuthStore((s) => s.user)
  const wallet = useQuery({
    queryKey: ['client', 'wallet', user?.id],
    queryFn: getWallet,
    enabled: !!user?.id,
  })

  const balance = Number(wallet.data?.balance ?? user?.walletBalance ?? 0)
  const totalDeposited = Number(wallet.data?.totalDeposited ?? 0)
  const totalSpent = Number(wallet.data?.totalSpent ?? 0)
  const totalRefunded = Number(wallet.data?.totalRefunded ?? 0)

  return (
    <div className="cm-detail-page" style={{ maxWidth: 720 }}>
      <div className="cm-page-head">
        <div className="cm-page-head-body">
          <h1>Portefeuille</h1>
          <p className="cm-page-head-sub">Votre solde et l'historique de vos mouvements</p>
        </div>
      </div>
      <QueryState
        isLoading={wallet.isLoading}
        isError={wallet.isError}
        error={wallet.error}
        onRetry={() => wallet.refetch()}
      >
        <div className="cm-journey" style={{ background: 'linear-gradient(135deg, var(--deep-700) 0%, var(--teal-800) 100%)', color: '#fff', border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.18)' }}>
              <Icon name="account_balance_wallet" size={22} />
            </span>
            <div>
              <div style={{ fontSize: 11, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>Solde disponible</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, lineHeight: 1.1, letterSpacing: '-0.015em' }}>
                {formatFcfa(balance)}
              </div>
            </div>
          </div>
        </div>

        <Panel title="Récapitulatif">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, padding: 14 }}>
            <Stat label="Crédit total" value={formatFcfa(totalDeposited)} />
            <Stat label="Dépenses" value={formatFcfa(totalSpent)} />
            <Stat label="Remboursements" value={formatFcfa(totalRefunded)} />
          </div>
        </Panel>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/client/dettes" style={{ textDecoration: 'none' }}>
            <Button variant="secondary" icon="receipt_long">
              Mes dettes
            </Button>
          </Link>
          <Link to="/client/colis" style={{ textDecoration: 'none' }}>
            <Button variant="secondary" icon="package_2">
              Historique des colis
            </Button>
          </Link>
        </div>
      </QueryState>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, marginTop: 4 }}>{value}</div>
    </div>
  )
}
