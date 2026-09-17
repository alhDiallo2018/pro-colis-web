import { useState } from 'react'
import { Button, Dialog, Select, Toast } from '@/ds'
import { useCancelParcel, useCancellationQuote } from '@/features/client/hooks'
import { formatFcfa } from '@/lib/format'
import {
  cancellationErrorMessage,
  hasPenalty,
  refundStatusLabel,
  responsibilityLabel,
} from '@/lib/cancellation'
import type { CancellationResult } from '@/lib/api/cancellation'
import type { Parcel } from '@/lib/api/types'

interface CancellationDialogProps {
  parcel: Parcel | null
  onClose: () => void
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderTop: '1px solid var(--border-subtle)' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>{label}</span>
      <span style={{ color: 'var(--text-strong)', fontSize: 'var(--fs-sm)', fontWeight: 600, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{value}</span>
    </div>
  )
}

/**
 * Confirmation d'annulation d'un colis client.
 *
 * Toutes les conséquences (montant payé, frais, pénalité, remboursement,
 * répartition, statut) proviennent exclusivement de l'API. Si le devis
 * d'annulation n'est pas encore exposé par le backend, la modale affiche une
 * confirmation neutre, sans montant inventé, et ne recalcule jamais de règle.
 */
export function CancellationDialog({ parcel, onClose }: CancellationDialogProps) {
  const quote = useCancellationQuote(parcel?.id, !!parcel)
  const cancel = useCancelParcel(parcel?.id ?? '')
  const [reason, setReason] = useState('')
  const [result, setResult] = useState<CancellationResult | null>(null)

  if (!parcel) return null

  const outcome = result ?? quote.data
  const reasons = outcome?.reasons ?? null
  const error = cancel.error

  const submit = () => {
    if (cancel.isPending || cancel.isSuccess) return
    cancel.mutate(
      { reason: reason.trim() || undefined },
      {
        onSuccess: (res) => setResult(res),
      }
    )
  }

  const done = cancel.isSuccess && result
  const reasonRequired = !!reason && (reasons?.length ?? 0) > 0

  const actions = (
    <>
      <Button variant="secondary" block onClick={onClose}>
        {done ? 'Fermer' : 'Retour'}
      </Button>
      {!done && (
        <Button
          variant="danger"
          block
          icon="cancel"
          loading={cancel.isPending}
          disabled={cancel.isPending || !reasonRequired}
          onClick={submit}
        >
          Annuler le colis
        </Button>
      )}
    </>
  )

  return (
    <Dialog
      open
      onClose={onClose}
      icon="cancel"
      iconTone="danger"
      title={done ? 'Colis annulé' : 'Annuler le colis'}
      actions={actions}
    >
      <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {!done && (
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-muted)' }}>
            Vous êtes sur le point d'annuler le colis{' '}
            <strong style={{ color: 'var(--text-strong)' }}>{parcel.trackingNumber}</strong>.
          </p>
        )}

        {/* Conséquences dynamiques : uniquement les valeurs retournées par l'API. */}
        {outcome && (
          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0 12px 4px' }}>
            <Row label="Responsabilité" value={responsibilityLabel(outcome.responsibility)} />
            {outcome.paidAmount != null && <Row label="Montant payé" value={formatFcfa(outcome.paidAmount)} />}
            {outcome.fees != null && <Row label="Frais" value={formatFcfa(outcome.fees)} />}
            {outcome.paydunyaFee != null && <Row label="Frais PayDunya" value={formatFcfa(outcome.paydunyaFee)} />}
            {outcome.technicalFee != null && <Row label="Frais techniques" value={formatFcfa(outcome.technicalFee)} />}
            {hasPenalty(outcome) && outcome.penalty != null && <Row label="Pénalité" value={`- ${formatFcfa(outcome.penalty)}`} />}
            {outcome.refund != null && <Row label="Remboursement" value={formatFcfa(outcome.refund)} />}
            {outcome.refundStatus != null && <Row label="Statut remboursement" value={refundStatusLabel(outcome.refundStatus)} />}
          </div>
        )}

        {quote.isLoading && (
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-faint)' }}>
            Calcul des conséquences…
          </p>
        )}

        {outcome?.message && (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--amber-700)', background: 'var(--amber-50)', border: '1px solid var(--amber-100)', borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
            {outcome.message}
          </p>
        )}

        {/* Motifs : fournis par l'API/configuration. La sélection est obligatoire :
            le backend refuse tout motif absent ou inconnu. */}
        {!done &&
          (reasons && reasons.length > 0 ? (
            <Select
              label="Motif d'annulation"
              placeholder="Sélectionnez un motif"
              options={reasons.map((r) => ({ value: r.value, label: r.label }))}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          ) : (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
              Aucun motif d'annulation disponible. Veuillez contacter le support.
            </p>
          ))}

        {error && <Toast tone="error" message={cancellationErrorMessage(error)} />}
        {done && <Toast tone="success" title="Colis annulé" message={outcome?.message ?? 'Votre annulation a bien été prise en compte.'} />}
      </div>
    </Dialog>
  )
}
