import { useState } from 'react'
import { Button, Dialog, Icon, Input, StatusBadge, Textarea, Toast } from '@/ds'
import { QueryState } from '@/components/QueryState'
import { ParcelMedia } from '@/components/ParcelMedia'
import { ParcelDetailDialog } from '@/components/ParcelDetailDialog'
import { NegotiationChat } from '@/components/NegotiationChat'
import { NegotiationTurn } from '@/components/NegotiationTurn'
import { ProposalsPanel } from './ProposalsPanel'
import { PayCommissionDialog } from './PayCommissionDialog'
import { DeclareCashDialog } from './DeclareCashDialog'
import { DriverCancelDialog } from './DriverCancelDialog'
import { needsCashDeclaration } from './cashDeclaration'
import { useAdvanceParcel, useDeliverParcel, useDriverFinancialState, useDriverParcels, useRespondToBid } from './hooks'
import { CommissionDebtNotice } from './CommissionDebtNotice'
import { ApiError } from '@/lib/api/client'
import { commissionDebtMessage } from '@/lib/commissionDebt'
import { formatFcfa, toStatusKey } from '@/lib/format'
import { useAuthStore } from '@/store/auth'
import type { ApiParcelStatus, Parcel } from '@/lib/api/types'
import type { DriverStep } from '@/lib/api/roles'

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
  const respondToBid = useRespondToBid()
  const fin = useDriverFinancialState()
  const user = useAuthStore((s) => s.user)
  const driverId = user?.id
  const [deliverTarget, setDeliverTarget] = useState<Parcel | null>(null)
  const [detailTarget, setDetailTarget] = useState<Parcel | null>(null)
  const [commissionTarget, setCommissionTarget] = useState<Parcel | null>(null)
  const [cashTarget, setCashTarget] = useState<Parcel | null>(null)
  const [cancelTarget, setCancelTarget] = useState<Parcel | null>(null)
  const [negotiateTarget, setNegotiateTarget] = useState<{ parcel: Parcel; bidId: string; canAccept: boolean } | null>(null)
  const parcels = (query.data?.parcels ?? []).filter((p) => p.status !== 'cancelled')

  const activeCount = parcels.filter((p) => p.status !== 'delivered').length

  return (
    <div className="cm-detail-page" style={{ maxWidth: 960 }}>
      <CommissionDebtNotice />
      {respondToBid.error instanceof ApiError && (
        <Toast tone="error" message={respondToBid.error.message} />
      )}
      <ProposalsPanel />

      <div className="cm-page-head">
        <div className="cm-page-head-body">
          <h1>Mes missions</h1>
          <p className="cm-page-head-sub">
            Faites avancer vos courses étape par étape
            {parcels.length > 0 && <> · <strong>{activeCount}</strong> en cours sur <strong>{parcels.length}</strong></>}
          </p>
        </div>
      </div>

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        isEmpty={parcels.length === 0}
        emptyTitle="Aucune mission"
        emptyMessage="Vos colis assignés apparaîtront ici une fois vos offres acceptées."
        onRetry={() => query.refetch()}
      >
        <div className="cm-list-stack">
          {parcels.map((p) => {
            const next = NEXT_STEP[p.status]
            const hasMedia = Boolean(p.photoUrls?.length || p.videoUrls?.length || p.audioUrls?.length)
            const activeBid = p.bids?.find((b) => b.driverId === driverId && (b.status === 'pending' || b.status === 'negotiating' || b.status === 'countered'))
            const hasActiveBid = !p.driverId && !!activeBid

            return (
              <div key={p.id} className="cm-mission-row" onClick={() => setDetailTarget(p)}>
                <div className="cm-mission-row-top">
                  <div className="cm-mission-row-body">
                    <div className="cm-mission-row-route">
                      {p.departureCity ?? p.departureZoneName ?? '—'}
                      <Icon name="arrow_right_alt" size={16} style={{ color: 'var(--text-faint)' }} />
                      {p.arrivalCity ?? p.arrivalZoneName ?? '—'}
                    </div>
                    <div className="cm-mission-row-meta">
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{p.trackingNumber}</span>
                      {p.receiverName && <> · <strong>{p.receiverName}</strong></>}
                      {(activeBid?.lastPrice ?? p.price) != null && <> · {formatFcfa(activeBid?.lastPrice ?? p.price)}</>}
                    </div>
                  </div>

                  <StatusBadge status={toStatusKey(p.status)} size="sm" />

                  <div className="cm-mission-row-actions">
                    {p.status !== 'delivered' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        icon="cancel"
                        title="Annuler la mission"
                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); setCancelTarget(p) }}
                      >
                        Annuler
                      </Button>
                    )}
                    {needsCashDeclaration(p) && (
                      <Button
                        size="sm"
                        variant="amber"
                        icon="payments"
                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); setCashTarget(p) }}
                      >
                        Déclarer l'encaissement
                      </Button>
                    )}
                    {hasActiveBid && activeBid ? (
                      <>
                        <Button
                          size="sm"
                          icon="close"
                          variant="danger"
                          loading={respondToBid.isPending && respondToBid.variables?.action === 'reject' && respondToBid.variables?.bidId === activeBid.id}
                          onClick={(e: React.MouseEvent) => { e.stopPropagation(); respondToBid.mutate({ bidId: activeBid.id, action: 'reject' }) }}
                        >
                          Refuser
                        </Button>
                        <Button
                          size="sm"
                          icon="forum"
                          variant="amber"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation()
                            setNegotiateTarget({
                              parcel: p,
                              bidId: activeBid.id,
                              canAccept: activeBid.canDriverAccept ?? activeBid.lastOfferBy === 'client',
                            })
                          }}
                        >
                          Négocier
                        </Button>
                        {(activeBid.canDriverAccept ?? activeBid.lastOfferBy === 'client') ? (
                          !fin.canAcceptNewDeliveries ? (
                            <Button
                              size="sm"
                              icon="lock"
                              variant="secondary"
                              disabled
                              title={fin.hasDebt ? commissionDebtMessage(fin.commissionDebt, fin.debtLimit) : fin.isError ? 'État financier indisponible' : 'Chargement…'}
                            >
                              {fin.isLoading ? 'Chargement…' : fin.isError ? 'Indisponible' : 'Dette à régler'}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              icon="check"
                              variant="primary"
                              loading={respondToBid.isPending && respondToBid.variables?.action === 'accept' && respondToBid.variables?.bidId === activeBid.id}
                              onClick={(e: React.MouseEvent) => { e.stopPropagation(); respondToBid.mutate({ bidId: activeBid.id, action: 'accept' }) }}
                            >
                              Accepter
                            </Button>
                          )
                        ) : (
                          <NegotiationTurn waitingFor="client" />
                        )}
                      </>
                    ) : next ? (
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
                </div>
                {hasMedia && (
                  <div>
                    <ParcelMedia parcel={p} size={72} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </QueryState>

      <DeliveryDialog
        parcel={deliverTarget}
        onClose={() => setDeliverTarget(null)}
        onDelivered={(p) => {
          setDeliverTarget(null)
          if (needsCashDeclaration(p)) setCashTarget(p)
          else if (p.paymentMethod === 'cash' && p.price && p.price > 0) setCommissionTarget(p)
        }}
      />
      <ParcelDetailDialog parcel={detailTarget} onClose={() => setDetailTarget(null)} />
      <DriverCancelDialog parcel={cancelTarget} onClose={() => setCancelTarget(null)} />
      <DeclareCashDialog
        parcel={cashTarget}
        onClose={() => setCashTarget(null)}
        onDeclared={(p) => {
          setCashTarget(null)
          setCommissionTarget(p)
        }}
      />
      <PayCommissionDialog parcel={commissionTarget} onClose={() => setCommissionTarget(null)} />

      {negotiateTarget && (
        <Dialog
          open
          onClose={() => setNegotiateTarget(null)}
          title={`Négociation - ${negotiateTarget.parcel.trackingNumber}`}
          style={{ maxWidth: 520, height: 520, display: 'flex', flexDirection: 'column' }}
        >
          <NegotiationChat
            peerId={negotiateTarget.parcel.senderId ?? ''}
            peerName={negotiateTarget.parcel.senderName ?? 'Client'}
            parcelId={negotiateTarget.parcel.id}
            bidId={negotiateTarget.bidId}
            canAccept={negotiateTarget.canAccept}
            acceptBlocked={!fin.canAcceptNewDeliveries}
            acceptBlockedLabel={fin.isLoading ? 'Chargement…' : fin.isError ? 'Indisponible' : 'Dette à régler'}
            parcelInfo={{
              trackingNumber: negotiateTarget.parcel.trackingNumber,
              departureCity: negotiateTarget.parcel.departureCity,
              arrivalCity: negotiateTarget.parcel.arrivalCity,
              description: negotiateTarget.parcel.description,
              receiverName: negotiateTarget.parcel.receiverName,
              receiverPhone: negotiateTarget.parcel.receiverPhone,
              weight: negotiateTarget.parcel.weight?.toString(),
              type: negotiateTarget.parcel.type ?? undefined,
              status: negotiateTarget.parcel.status,
            }}
          />
        </Dialog>
      )}
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
          (visible sur son suivi de colis) pour valider l'accusé de réception.
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
