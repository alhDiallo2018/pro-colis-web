import { Badge, Button, Dialog } from '@/ds'
import { DetailList, DetailRow, DetailSection, DetailText } from '@/components/DetailList'
import { formatDateTime } from '@/lib/format'
import type { ScoreTransaction } from '@/lib/api/admin-reputation'

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
  commission_debt: 'Dette de commission',
}

/** Fiche lecture seule d'une transaction de score — description complète,
 *  source, motif et métadonnées que la ligne du tableau tronque. */
export function ScoreTransactionDetailDialog({ tx, onClose }: { tx: ScoreTransaction | null; onClose: () => void }) {
  if (!tx) return null
  return (
    <Dialog open size="lg" title="Détail de la transaction" onClose={onClose} actions={<Button variant="ghost" onClick={onClose}>Fermer</Button>}>
      <div className="pc-form" style={{ gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 22, color: tx.amount > 0 ? 'var(--green-600)' : 'var(--red-500)' }}>
            {tx.amount > 0 ? '+' : ''}{tx.amount} pts
          </span>
          <Badge tone={TX_TONE[tx.type] ?? 'neutral'}>{TX_LABEL[tx.type] ?? tx.type}</Badge>
        </div>

        <DetailList>
          <DetailRow label="Type" always>{tx.type}</DetailRow>
          <DetailRow label="Statut">{tx.status}</DetailRow>
          <DetailRow label="Source">{tx.source}</DetailRow>
          <DetailRow label="Solde avant" mono>{tx.balanceBefore != null ? `${tx.balanceBefore} pts` : undefined}</DetailRow>
          <DetailRow label="Solde après" mono>{tx.balanceAfter != null ? `${tx.balanceAfter} pts` : undefined}</DetailRow>
          <DetailRow label="Accordé par">{tx.grantedBy?.fullName}</DetailRow>
          <DetailRow label="Colis lié" mono>{tx.parcelId}</DetailRow>
          <DetailRow label="Date" always>{formatDateTime(tx.createdAt)}</DetailRow>
          <DetailRow label="Identifiant" mono>{tx.id}</DetailRow>
        </DetailList>

        <DetailSection title="Motif">
          {tx.motif ? <DetailText>{tx.motif}</DetailText> : <span style={{ fontSize: 13, color: 'var(--text-faint)' }}>Aucun motif.</span>}
        </DetailSection>

        <DetailSection title="Description">
          {tx.description ? <DetailText>{tx.description}</DetailText> : <span style={{ fontSize: 13, color: 'var(--text-faint)' }}>Aucune description.</span>}
        </DetailSection>
      </div>
    </Dialog>
  )
}
