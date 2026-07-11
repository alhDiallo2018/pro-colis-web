import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Avatar, Badge, Button, Dialog, Icon, StatusBadge, Stepper, Tag, Toast } from '@/ds'
import { ParcelMedia } from './ParcelMedia'
import { QueryState } from './QueryState'
import * as parcelsApi from '@/lib/api/parcels'
import { buildSteps } from '@/features/client/parcelSteps'
import { formatFcfa, formatWeight, formatDate, toStatusKey } from '@/lib/format'
import type { Parcel } from '@/lib/api/types'

interface ParcelDetailDialogProps {
  parcel: Parcel | null
  onClose: () => void
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderTop: '1px solid var(--border-subtle)' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>{label}</span>
      <span style={{ color: 'var(--text-strong)', fontSize: 'var(--fs-sm)', fontWeight: 600, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

export function ParcelDetailDialog({ parcel, onClose }: ParcelDetailDialogProps) {
  const [cashLoading, setCashLoading] = useState(false)
  const [cashError, setCashError] = useState<string | null>(null)

  if (!parcel) return null

  const hasMedia = Boolean(parcel.photoUrls?.length || parcel.videoUrls?.length || parcel.audioUrls?.length)
  const driverName = parcel.driverName ?? parcel.driver?.fullName
  const showCashButton = parcel.price && parcel.price > 0 && parcel.paymentStatus !== 'completed'

  const handleCashConfirm = async () => {
    setCashLoading(true)
    setCashError(null)
    try {
      await parcelsApi.confirmCash(parcel.id)
      onClose()
    } catch (e) {
      setCashError((e as Error)?.message ?? 'Erreur')
      setCashLoading(false)
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      icon="package_2"
      iconTone="primary"
      title={`Colis ${parcel.trackingNumber}`}
      style={{ width: 'min(560px, 96vw)', maxHeight: '90vh', overflow: 'auto' }}
      actions={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
          {showCashButton && (
            <Button variant="amber" block icon="payments" loading={cashLoading} onClick={handleCashConfirm}>
              Confirmer paiement en espèces ({formatFcfa(parcel.price ?? 0)})
            </Button>
          )}
          <Button variant="secondary" block onClick={onClose}>
            Fermer
          </Button>
        </div>
      }
    >
      <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {cashError && <Toast tone="error" message={cashError} />}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-body)' }}>
            {parcel.trackingNumber}
          </span>
          <StatusBadge status={toStatusKey(parcel.status)} />
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {parcel.isUrgent && <Tag express />}
          {parcel.type && <Tag icon="category">{parcel.type}</Tag>}
          {parcel.isInsured && <Tag tone="primary" icon="verified_user">Assuré</Tag>}
        </div>

        <Row label="Départ" value={parcel.departureCity ?? parcel.departureGarageName ?? '—'} />
        <Row label="Arrivée" value={parcel.arrivalCity ?? parcel.arrivalGarageName ?? '—'} />
        <Row label="Poids" value={parcel.weight != null ? formatWeight(parcel.weight) : '—'} />
        {parcel.price != null && <Row label="Prix" value={formatFcfa(parcel.price)} />}

        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 8 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
            Destinataire
          </div>
          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-strong)', fontWeight: 600 }}>{parcel.receiverName}</div>
          {parcel.receiverPhone && (
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{parcel.receiverPhone}</div>
          )}
          {parcel.receiverAddress && (
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{parcel.receiverAddress}</div>
          )}
        </div>

        {(parcel.senderName || parcel.senderPhone) && (
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 8 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
              Expéditeur
            </div>
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-strong)', fontWeight: 600 }}>{parcel.senderName}</div>
            {parcel.senderPhone && (
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{parcel.senderPhone}</div>
            )}
          </div>
        )}

        {parcel.description && (
          <div style={{ background: 'var(--slate-50)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: 'var(--fs-sm)', color: 'var(--text-body)', whiteSpace: 'pre-wrap' }}>
            {parcel.description}
          </div>
        )}

        {hasMedia && (
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
              Médias
            </div>
            <ParcelMedia parcel={parcel} size={80} />
          </div>
        )}

        {driverName && (
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 8 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
              Chauffeur assigné
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar name={driverName} src={parcel.driver?.profilePhoto ?? undefined} size="sm" />
              <div>
                <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--text-strong)' }}>{driverName}</div>
                {(parcel.driverPhone ?? parcel.driver?.phone) && (
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {parcel.driverPhone ?? parcel.driver?.phone}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {parcel.events && parcel.events.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 8 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
              Historique
            </div>
            <Stepper steps={buildSteps(parcel)} />
          </div>
        )}
      </div>
    </Dialog>
  )
}
