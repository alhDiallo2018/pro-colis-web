import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Toast } from '@/ds'
import { QueryState } from '@/components/QueryState'
import { useDriverWallet } from './hooks'
import { PayDebtDialog } from './PayDebtDialog'
import { formatFcfa } from '@/lib/format'

/** Vue de la dette consolidée : les commissions et pénalités chauffeur sont
 * déjà agrégées par l'API. Aucun recalcul depuis l'historique des colis. */
export function DriverDebtsScreen() {
  const wallet = useDriverWallet()
  const navigate = useNavigate()
  const [pay, setPay] = useState(false)
  // Une ancienne réponse sans dette n'autorise pas à annoncer « à jour ».
  const incomplete = wallet.isSuccess && (
    typeof wallet.data.commissionDebt !== 'number' || !Number.isFinite(wallet.data.commissionDebt) ||
    wallet.data.commissionDebt < 0 || !Number.isFinite(wallet.data.balance)
  )
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-display)' }}>Mes dettes</h1>
        <Button variant="secondary" icon="refresh" loading={wallet.isFetching} onClick={() => wallet.refetch()}>Actualiser</Button>
      </div>
      <QueryState isLoading={wallet.isLoading} isError={wallet.isError || incomplete} error={wallet.error} onRetry={() => wallet.refetch()}>
        {wallet.data && !incomplete && <Card padding="lg">
          <p style={{ margin: '0 0 10px', fontSize: 12, letterSpacing: '0.08em', fontWeight: 700, color: 'var(--text-muted)' }}>TOTAL RESTANT À RÉGLER</p>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 700, color: Number(wallet.data.commissionDebt) > 0 ? 'var(--amber-700)' : 'var(--green-700)' }}>
            {formatFcfa(wallet.data.commissionDebt)}
          </div>
          <p style={{ color: 'var(--text-muted)' }}>{Number(wallet.data.commissionDebt) > 0 ? 'Commissions et pénalités encore dues.' : 'Vous êtes à jour.'}</p>
          {wallet.data.canAcceptNewDeliveries === false && <Toast tone="warning" message="Régularisez votre dette pour accepter de nouvelles livraisons. Les missions déjà acceptées restent disponibles." />}
          <p>Solde disponible : <strong>{formatFcfa(wallet.data.balance)}</strong></p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 20 }}>
            {Number(wallet.data.commissionDebt) > 0 && Number(wallet.data.balance) > 0 && <Button icon="payments" onClick={() => setPay(true)}>Régler ma dette</Button>}
            <Button variant="secondary" icon="account_balance_wallet" onClick={() => navigate('/driver/points')}>
              {Number(wallet.data.commissionDebt) > 0 && Number(wallet.data.balance) <= 0 ? 'Recharger pour régulariser' : 'Portefeuille et historique'}
            </Button>
          </div>
        </Card>}
      </QueryState>
      {pay && <PayDebtDialog open onClose={() => setPay(false)} onSuccess={() => { void wallet.refetch() }} />}
    </div>
  )
}
