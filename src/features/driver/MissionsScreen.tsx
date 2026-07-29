import { useState } from 'react'
import { Button, Dialog, Input, StatusBadge, Textarea, Toast } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import { ParcelMedia } from '@/components/ParcelMedia'
import { ParcelDetailDialog } from '@/components/ParcelDetailDialog'
import { PayCommissionDialog } from './PayCommissionDialog'
import { useAdvanceParcel, useDeliverParcel, useDriverParcels } from './hooks'
import { ApiError } from '@/lib/api/client'
import { formatFcfa, toStatusKey } from '@/lib/format'
import type { ApiParcelStatus, Parcel } from '@/lib/api/types'
import type { DriverStep } from '@/lib/api/roles'

/** The next lifecycle action for a parcel in the driver's hands. */
const NEXT_STEP: Partial<Record<ApiParcelStatus, { step: DriverStep; label: string; icon: string }>> = {
  pending: { step: 'confirm', label: 'Confirmer la prise en charge', icon: 'check_circle' },
  confirmed: { step: 'pickup', label: 'Marquer ramassé', icon: 'package_2' },
  picked_up: { step: 'transit', label: 'Marquer en transit', icon: 'local_shipping' },
  in_transit: { step: 'arrived', label: 'Marquer arrivé', icon: 'pin_drop' },
  arrived: { step: 'out-for-delivery', label: 'En livraison', icon: 'moving' },
  out_for_delivery: { step: 'deliver', label: 'Confirmer livraison', icon: 'task_alt' },
}

export function MissionsScreen() {
  const query = useDriverParcels()
  const advance = useAdvanceParcel()
  const [deliverTarget, setDeliverTarget] = useState<Parcel | null>(null)
  const [detailTarget, setDetailTarget] = useState<Parcel | null>(null)
  const [commissionTarget, setCommissionTarget] = useState<Parcel | null>(null)
  const parcels = (query.data?.parcels ?? []).filter((p) => p.status !== 'cancelled')

  return (
    <div style={{ maxWidth: 920, margin: '0 auto' }}>
      <Panel title="Mes missions" flush>
        <QueryState
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          isEmpty={parcels.length === 0}
          emptyTitle="Aucune mission"
          emptyMessage="Vos colis assignés apparaîtront ici une fois vos offres acceptées."
          onRetry={() => query.refetch()}
        >
          {parcels.map((p) => {
            const next = NEXT_STEP[p.status]
            const hasMedia = Boolean(p.photoUrls?.length || p.videoUrls?.length || p.audioUrls?.length)
            return (
              <div key={p.id} style={{ padding: '14px 18px', borderBottom: '1px solid var(--slate-100)', cursor: 'pointer' }} onClick={() => setDetailTarget(p)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-strong)' }}>
                    {p.departureCity ?? p.departureGarageName ?? '—'}
                    <span className="material-symbols-rounded" style={{ fontSize: 16, color: 'var(--text-faint)' }}>
                      arrow_right_alt
                    </span>
                    {p.arrivalCity ?? p.arrivalGarageName ?? '—'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{p.trackingNumber}</span> · {p.receiverName}
                    {p.price != null && ` · ${formatFcfa(p.price)}`}
                  </div>
                </div>
                <StatusBadge status={toStatusKey(p.status)} size="sm" />
                {next ? (
                  <Button
                    size="sm"
                    icon={next.icon}
                    loading={advance.isPending && advance.variables?.parcelId === p.id}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation()
                      if (next.step === 'deliver') setDeliverTarget(p)
                      else advance.mutate({ parcelId: p.id, step: next.step })
                    }}
                  >
                    {next.label}
                  </Button>
                ) : (
                  <span style={{ fontSize: 12.5, color: 'var(--text-faint)', fontStyle: 'italic', minWidth: 96, textAlign: 'right' }}>
                    {p.status === 'delivered' ? 'Terminé' : '—'}
                  </span>
                )}
                </div>
                {hasMedia && (
                  <div style={{ marginTop: 12 }}>
                    <ParcelMedia parcel={p} size={72} />
                  </div>
                )}
              </div>
            )
          })}
        </QueryState>
      </Panel>

      <DeliveryDialog
        parcel={deliverTarget}
        onClose={() => setDeliverTarget(null)}
        onDelivered={(p) => {
          setDeliverTarget(null)
          if (p.paymentMethod === 'cash' && p.price && p.price > 0) {
            setCommissionTarget(p)
          }
        }}
      />
      <ParcelDetailDialog parcel={detailTarget} onClose={() => setDetailTarget(null)} />
      <PayCommissionDialog parcel={commissionTarget} onClose={() => setCommissionTarget(null)} />
    </div>
  )
}

/** Driver confirms delivery by entering the recipient's OTP code (proof of receipt). */
function DeliveryDialog({ parcel, onClose, onDelivered }: { parcel: Parcel | null; onClose: () => void; onDelivered?: (p: Parcel) => void }) {
  const deliver = useDeliverParcel()
  const [otp, setOtp] = useState('')
  const [note, setNote] = useState('')

  if (!parcel) return null

  const valid = otp.trim().length >= 4
  const error = deliver.error instanceof ApiError ? deliver.error.message : null

  const submit = () => {
    deliver.mutate(
      { parcelId: parcel.id, otp: otp.trim(), recipientNote: note.trim() || undefined },
      {
        onSuccess: (result) => {
          setOtp('')
          setNote('')
          onClose()
          onDelivered?.(result)
        },
      },
    )
  }

  return (
    <Dialog
      open
      onClose={onClose}
      icon="task_alt"
      iconTone="primary"
      title="Confirmer la livraison"
      actions={
        <>
          <Button variant="secondary" block onClick={onClose}>
            Annuler
          </Button>
          <Button block icon="check" loading={deliver.isPending} disabled={!valid} onClick={submit}>
            Confirmer la réception
          </Button>
        </>
      }
    >
      <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-muted)' }}>
          Demandez à <strong style={{ color: 'var(--text-strong)' }}>{parcel.receiverName}</strong> son code de livraison à 4 chiffres
          (visible sur son suivi de colis) pour valider l’accusé de réception.
        </p>
        <Input
          label="Code de livraison (OTP)"
          icon="password"
          inputMode="numeric"
          maxLength={6}
          mono
          placeholder="Ex : 4821"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
        />
        <Textarea
          label="Accusé de réception (optionnel)"
          placeholder="Ex : Remis en main propre au destinataire."
          maxLength={200}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        {error && <Toast tone="error" message={error} />}
      </div>
    </Dialog>
  )
}
