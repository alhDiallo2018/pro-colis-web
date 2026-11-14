import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Dialog, Input, Toast } from '@/ds'
import { ApiError } from '@/lib/api/client'
import {
  cancelHandover,
  initiateHandover,
  listHandovers,
  type InitiatedHandover,
  type ParcelHandover,
} from '@/lib/api/handovers'
import type { Parcel } from '@/lib/api/types'

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/

interface Props {
  parcel: Parcel
  onClose: () => void
}

export function HandoverInitiateDialog({ parcel, onClose }: Props) {
  const qc = useQueryClient()
  const [toDriverId, setToDriverId] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [issued, setIssued] = useState<InitiatedHandover | null>(null)
  const [error, setError] = useState('')

  const list = useQuery({
    queryKey: ['handovers', parcel.id],
    queryFn: () => listHandovers(parcel.id),
  })

  const mutation = useMutation({
    mutationFn: () => {
      const payload: Parameters<typeof initiateHandover>[1] = { toDriverId: toDriverId.trim() }
      const lat = latitude.trim() ? Number(latitude) : undefined
      const lng = longitude.trim() ? Number(longitude) : undefined
      if (Number.isFinite(lat as number)) payload.latitude = lat
      if (Number.isFinite(lng as number)) payload.longitude = lng
      return initiateHandover(parcel.id, payload)
    },
    onSuccess: result => {
      setIssued(result)
      setError('')
      qc.invalidateQueries({ queryKey: ['handovers', parcel.id] })
    },
    onError: cause => {
      setError(cause instanceof ApiError ? cause.message : cause instanceof Error ? cause.message : 'Transfert impossible')
    },
  })

  const cancel = useMutation({
    mutationFn: (handoverId: string) => cancelHandover(parcel.id, handoverId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['handovers', parcel.id] })
    },
  })

  const pending = list.data?.filter(h => h.status === 'pending_pickup') ?? []
  const uuidValid = UUID_REGEX.test(toDriverId.trim())
  const latValid = !latitude.trim() || Number.isFinite(Number(latitude))
  const lngValid = !longitude.trim() || Number.isFinite(Number(longitude))
  const canSubmit = uuidValid && latValid && lngValid && !mutation.isPending && !issued

  const copy = (value: string) => {
    if (navigator.clipboard?.writeText) void navigator.clipboard.writeText(value)
  }

  return (
    <Dialog
      open
      onClose={onClose}
      icon="swap_horiz"
      iconTone="primary"
      size="lg"
      title={`Transférer le colis ${parcel.trackingNumber}`}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            Fermer
          </Button>
          {!issued && (
            <Button
              icon="send"
              disabled={!canSubmit}
              loading={mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              Lancer le transfert
            </Button>
          )}
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {!issued && (
          <>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13.5 }}>
              Saisissez l'identifiant du chauffeur destinataire (UUID). Les coordonnées GPS sont
              optionnelles et servent à tracer le point de remise. Un code PIN et un jeton QR
              seront générés pour sceller la remise — <strong>visibles une seule fois</strong>.
            </p>
            <Input
              label="Identifiant du chauffeur destinataire (UUID)"
              icon="fingerprint"
              mono
              placeholder="00000000-0000-0000-0000-000000000000"
              value={toDriverId}
              maxLength={36}
              onChange={event => setToDriverId(event.target.value.trim())}
              error={toDriverId && !uuidValid ? 'Format UUID invalide' : undefined}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Input
                label="Latitude (optionnel)"
                inputMode="decimal"
                placeholder="14.6928"
                value={latitude}
                onChange={event => setLatitude(event.target.value)}
                error={latitude && !latValid ? 'Nombre invalide' : undefined}
              />
              <Input
                label="Longitude (optionnel)"
                inputMode="decimal"
                placeholder="-17.4467"
                value={longitude}
                onChange={event => setLongitude(event.target.value)}
                error={longitude && !lngValid ? 'Nombre invalide' : undefined}
              />
            </div>
            {error && <Toast tone="error" message={error} />}
          </>
        )}

        {issued && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              padding: 16,
              borderRadius: 12,
              background: 'var(--amber-50)',
              border: '1px solid var(--amber-200, rgba(0,0,0,0.08))',
            }}
          >
            <strong style={{ color: 'var(--amber-700, var(--text-strong))' }}>
              Transfert initié. Communiquez ces secrets au chauffeur destinataire — ils ne
              seront plus réaffichés.
            </strong>
            <div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 4 }}>
                Code PIN (6 chiffres)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 32,
                    letterSpacing: 6,
                    fontWeight: 700,
                  }}
                >
                  {issued.pickupPin}
                </span>
                <Button size="sm" variant="ghost" icon="content_copy" onClick={() => copy(issued.pickupPin)}>
                  Copier
                </Button>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 4 }}>
                Jeton QR
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <code
                  style={{
                    flex: '1 1 240px',
                    padding: '8px 10px',
                    background: 'var(--surface-sunken, rgba(0,0,0,0.04))',
                    borderRadius: 6,
                    wordBreak: 'break-all',
                    fontSize: 12,
                  }}
                >
                  {issued.pickupQrToken}
                </code>
                <Button size="sm" variant="ghost" icon="content_copy" onClick={() => copy(issued.pickupQrToken)}>
                  Copier
                </Button>
              </div>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
              ID du transfert : <code style={{ fontFamily: 'var(--font-mono)' }}>{issued.handover.id}</code>
            </div>
          </div>
        )}

        {!!pending.length && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <strong>Transferts en attente</strong>
            {pending.map(h => (
              <PendingHandoverRow
                key={h.id}
                handover={h}
                onCancel={() => cancel.mutate(h.id)}
                busy={cancel.isPending && cancel.variables === h.id}
              />
            ))}
          </div>
        )}
      </div>
    </Dialog>
  )
}

function PendingHandoverRow({
  handover,
  onCancel,
  busy,
}: {
  handover: ParcelHandover
  onCancel: () => void
  busy: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: 10,
        borderRadius: 8,
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ flex: '1 1 auto', fontSize: 13, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-mono)', overflowWrap: 'anywhere' }}>
          {handover.id}
        </div>
        <div style={{ color: 'var(--text-muted)' }}>
          Vers {handover.toDriverId.slice(0, 8)}… ·{' '}
          {new Date(handover.initiatedAt).toLocaleString()}
        </div>
      </div>
      <Button size="sm" variant="danger" icon="cancel" loading={busy} onClick={onCancel}>
        Annuler
      </Button>
    </div>
  )
}
