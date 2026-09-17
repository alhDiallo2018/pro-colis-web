import { Badge, Button, Dialog } from '@/ds'
import { DetailList, DetailRow, DetailSection } from '@/components/DetailList'
import { formatFcfa, formatDateTime } from '@/lib/format'
import type { AdminPayment } from '@/lib/api/admin-finance'

function statusBadgeTone(status: string): 'green' | 'amber' | 'red' | 'neutral' {
  switch (status) {
    case 'reussi':
    case 'completed':
    case 'success':
    case 'confirmed':
      return 'green'
    case 'en_attente':
    case 'pending':
      return 'amber'
    case 'echoue':
    case 'failed':
      return 'red'
    case 'rembourse':
    case 'refunded':
      return 'neutral'
    default:
      return 'neutral'
  }
}

/** Fiche lecture seule d'un paiement — identifiants, référence, colis lié et
 *  chronologie que les listes/feeds ne montrent pas en entier. */
export function PaymentDetailDialog({ payment, onClose }: { payment: AdminPayment | null; onClose: () => void }) {
  if (!payment) return null
  return (
    <Dialog open size="lg" title="Détail du paiement" onClose={onClose} actions={<Button variant="ghost" onClick={onClose}>Fermer</Button>}>
      <div className="pc-form" style={{ gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 22, color: 'var(--text-strong)' }}>
            {formatFcfa(payment.amount)}
          </span>
          <Badge tone={statusBadgeTone(payment.status)}>{payment.status}</Badge>
        </div>

        <DetailSection title="Paiement">
          <DetailList>
            <DetailRow label="Méthode" always>{payment.method}</DetailRow>
            <DetailRow label="Référence" mono>{payment.reference}</DetailRow>
            <DetailRow label="Transaction" mono>{payment.transactionId}</DetailRow>
            <DetailRow label="Devise">{payment.currency}</DetailRow>
            <DetailRow label="Numéro" mono>{payment.phoneNumber}</DetailRow>
          </DetailList>
        </DetailSection>

        <DetailSection title="Client">
          <DetailList>
            <DetailRow label="Nom" always>{payment.user?.fullName}</DetailRow>
            <DetailRow label="Téléphone" mono>{payment.user?.phone}</DetailRow>
            <DetailRow label="E-mail">{payment.user?.email}</DetailRow>
          </DetailList>
        </DetailSection>

        <DetailSection title="Colis lié">
          <DetailList>
            <DetailRow label="Numéro de suivi" mono>{payment.parcel?.trackingNumber}</DetailRow>
            <DetailRow label="Identifiant colis" mono>{payment.parcel?.id}</DetailRow>
          </DetailList>
        </DetailSection>

        <DetailSection title="Chronologie">
          <DetailList>
            <DetailRow label="Créé le" always>{formatDateTime(payment.createdAt)}</DetailRow>
            <DetailRow label="Complété le">{formatDateTime(payment.completedAt)}</DetailRow>
            <DetailRow label="Identifiant" mono>{payment.id}</DetailRow>
          </DetailList>
        </DetailSection>
      </div>
    </Dialog>
  )
}
