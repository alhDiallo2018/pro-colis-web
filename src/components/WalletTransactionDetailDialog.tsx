import { Badge, Button, Dialog } from '@/ds'
import { DetailList, DetailRow, DetailSection, DetailText } from '@/components/DetailList'
import { formatFcfa, formatDateTime } from '@/lib/format'
import type { WalletTransaction } from '@/lib/api/admin-finance'

const WALLET_TX_LABEL: Record<string, string> = {
  deposit: 'Rechargement',
  debit: 'Débit',
  refund: 'Remboursement',
  commission: 'Commission',
  payment: 'Paiement',
}

function isDebit(tx: WalletTransaction): boolean {
  return tx.type === 'debit' || tx.type === 'commission' || tx.amount < 0
}

/** Fiche lecture seule d'une transaction wallet — soldes avant/après, origine,
 *  admin et description complète que la ligne du tableau tronque. */
export function WalletTransactionDetailDialog({ tx, onClose }: { tx: WalletTransaction | null; onClose: () => void }) {
  if (!tx) return null
  const debit = isDebit(tx)
  return (
    <Dialog open size="lg" title="Détail de la transaction" onClose={onClose} actions={<Button variant="ghost" onClick={onClose}>Fermer</Button>}>
      <div className="pc-form" style={{ gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 22, color: debit ? 'var(--red-500)' : 'var(--green-600)' }}>
            {debit ? '-' : '+'}{formatFcfa(Math.abs(tx.amount))}
          </span>
          <Badge tone={debit ? 'red' : 'green'}>{WALLET_TX_LABEL[tx.type] ?? tx.type}</Badge>
        </div>

        <DetailList>
          <DetailRow label="Type" always>{tx.type}</DetailRow>
          <DetailRow label="Montant" mono always>{formatFcfa(tx.amount)}</DetailRow>
          <DetailRow label="Solde avant" mono>{formatFcfa(tx.balanceBefore)}</DetailRow>
          <DetailRow label="Solde après" mono>{formatFcfa(tx.balanceAfter)}</DetailRow>
          <DetailRow label="Statut">{tx.status}</DetailRow>
          <DetailRow label="Origine">{tx.origin}</DetailRow>
          <DetailRow label="Admin">{tx.admin?.fullName ?? tx.performedBy}</DetailRow>
          <DetailRow label="Colis lié" mono>{tx.parcelId}</DetailRow>
          <DetailRow label="Date" always>{formatDateTime(tx.createdAt)}</DetailRow>
          <DetailRow label="Identifiant" mono>{tx.id}</DetailRow>
        </DetailList>

        <DetailSection title="Description">
          {tx.description ? <DetailText>{tx.description}</DetailText> : <span style={{ fontSize: 13, color: 'var(--text-faint)' }}>Aucune description.</span>}
        </DetailSection>
      </div>
    </Dialog>
  )
}
