import { useState } from 'react'
import { Button, Dialog, Select, Toast } from '@/ds'
import { useDriverCancelParcel } from './hooks'
import { usePublicConfig } from '@/lib/usePublicConfig'
import { formatFcfa } from '@/lib/format'
import {
  cancellationErrorMessage,
  hasPenalty,
  refundStatusLabel,
  responsibilityLabel,
} from '@/lib/cancellation'
import type { CancellationResult } from '@/lib/api/cancellation'
import type { Parcel } from '@/lib/api/types'

interface DriverCancelDialogProps {
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
 * Annulation d'une mission par le chauffeur.
 *
 * Le backend reste l'unique source de vérité : responsabilité, pénalité,
 * remboursement et impact wallet/points/dette sont calculés côté serveur. Le
 * frontend ne transmet que le motif choisi et affiche exclusivement les
 * conséquences retournées par l'API.
 */
export function DriverCancelDialog({ parcel, onClose }: DriverCancelDialogProps) {
  const cancel = useDriverCancelParcel(parcel?.id ?? '')
  const publicConfig = usePublicConfig()
  const [reason, setReason] = useState('')
  const [result, setResult] = useState<CancellationResult | null>(null)

  if (!parcel) return null

  const reasons = publicConfig.data?.cancellation?.reasons ?? []
  const outcome = result
  const error = cancel.error

  const submit = () => {
    if (cancel.isPending || cancel.isSuccess) return
    cancel.mutate({ reason: reason.trim() || undefined }, { onSuccess: (res) => setResult(res) })
  }

  const done = cancel.isSuccess && result
  const reasonRequired = !!reason && reasons.length > 0

  return (
    <Dialog
      open
      onClose={onClose}
      icon="cancel"
      iconTone="danger"
      title={done ? 'Mission annulée' : 'Annuler la mission'}
      actions={
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
              Annuler la mission
            </Button>
          )}
        </>
      }
    >
      <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {!done && (
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-muted)' }}>
            Vous êtes sur le point d'annuler la mission du colis{' '}
            <strong style={{ color: 'var(--text-strong)' }}>{parcel.trackingNumber}</strong>.
            Une pénalité peut s'appliquer selon les règles de la plateforme.
          </p>
        )}

        {outcome && (
          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0 12px 4px' }}>
            <Row label="Responsabilité" value={responsibilityLabel(outcome.responsibility)} />
            {hasPenalty(outcome) && outcome.penalty != null && <Row label="Pénalité" value={`- ${formatFcfa(outcome.penalty)}`} />}
            {outcome.driver && (
              <>
                {(outcome.driver.walletDeduction ?? 0) > 0 && <Row label="Prélèvement wallet" value={`- ${formatFcfa(outcome.driver.walletDeduction)}`} />}
                {(outcome.driver.pointsDeduction ?? 0) > 0 && <Row label="Prélèvement points" value={`- ${outcome.driver.pointsDeduction} pts`} />}
                {(outcome.driver.debtAmount ?? 0) > 0 && <Row label="Dette créée" value={formatFcfa(outcome.driver.debtAmount)} />}
              </>
            )}
            {outcome.refundStatus != null && <Row label="Statut remboursement" value={refundStatusLabel(outcome.refundStatus)} />}
          </div>
        )}

        {outcome?.message && (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--amber-700)', background: 'var(--amber-50)', border: '1px solid var(--amber-100)', borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
            {outcome.message}
          </p>
        )}

        {!done &&
          (reasons.length > 0 ? (
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
        {done && <Toast tone="success" title="Mission annulée" message={outcome?.message ?? 'Votre annulation a bien été prise en compte.'} />}
      </div>
    </Dialog>
  )
}
