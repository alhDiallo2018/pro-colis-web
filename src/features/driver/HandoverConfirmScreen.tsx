import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Input, Toast } from '@/ds'
import { ApiError } from '@/lib/api/client'
import { confirmHandover, type ParcelHandover } from '@/lib/api/handovers'

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/

export function HandoverConfirmScreen() {
  const qc = useQueryClient()
  const [parcelId, setParcelId] = useState('')
  const [handoverId, setHandoverId] = useState('')
  const [pin, setPin] = useState('')
  const [qrToken, setQrToken] = useState('')
  const [success, setSuccess] = useState<ParcelHandover | null>(null)
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () => confirmHandover(parcelId.trim(), handoverId.trim(), { pin: pin.trim(), qrToken: qrToken.trim() }),
    onSuccess: result => {
      setSuccess(result)
      setError('')
      qc.invalidateQueries({ queryKey: ['driver', 'parcels'] })
      qc.invalidateQueries({ queryKey: ['handovers'] })
    },
    onError: cause => {
      setError(cause instanceof ApiError ? cause.message : cause instanceof Error ? cause.message : 'Validation impossible')
    },
  })

  const parcelOk = UUID_REGEX.test(parcelId.trim())
  const handoverOk = UUID_REGEX.test(handoverId.trim())
  const pinOk = /^\d{6}$/.test(pin.trim())
  const qrOk = qrToken.trim().length > 0
  const canSubmit = parcelOk && handoverOk && pinOk && qrOk && !mutation.isPending

  const reset = () => {
    setParcelId('')
    setHandoverId('')
    setPin('')
    setQrToken('')
    setSuccess(null)
    setError('')
    mutation.reset()
  }

  return (
    <div className="cm-detail-page" style={{ maxWidth: 520 }}>
      <div className="cm-page-head">
        <div className="cm-page-head-body">
          <h1>Recevoir un colis transféré</h1>
          <p className="cm-page-head-sub">
            Entrez les identifiants communiqués par le chauffeur sortant pour prendre en
            charge le colis.
          </p>
        </div>
      </div>

      {success ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Toast tone="success" message="Transfert validé. Le colis vous est désormais assigné." />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              padding: 14,
              borderRadius: 10,
              border: '1px solid var(--border-subtle)',
              background: 'var(--surface-card)',
            }}
          >
            <div>
              <strong>ID du transfert :</strong>{' '}
              <code style={{ fontFamily: 'var(--font-mono)' }}>{success.id}</code>
            </div>
            <div>
              <strong>Confirmé le :</strong>{' '}
              {success.confirmedAt ? new Date(success.confirmedAt).toLocaleString() : '—'}
            </div>
          </div>
          <Button variant="secondary" onClick={reset}>
            Valider un autre transfert
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input
            label="Identifiant du colis (UUID)"
            icon="package_2"
            mono
            maxLength={36}
            value={parcelId}
            onChange={event => setParcelId(event.target.value.trim())}
            error={parcelId && !parcelOk ? 'Format UUID invalide' : undefined}
          />
          <Input
            label="Identifiant du transfert (UUID)"
            icon="swap_horiz"
            mono
            maxLength={36}
            value={handoverId}
            onChange={event => setHandoverId(event.target.value.trim())}
            error={handoverId && !handoverOk ? 'Format UUID invalide' : undefined}
          />
          <Input
            label="Code PIN (6 chiffres)"
            icon="password"
            inputMode="numeric"
            maxLength={6}
            mono
            value={pin}
            onChange={event => setPin(event.target.value.replace(/\D/g, ''))}
            error={pin && !pinOk ? '6 chiffres requis' : undefined}
          />
          <Input
            label="Jeton QR"
            icon="qr_code_2"
            mono
            value={qrToken}
            onChange={event => setQrToken(event.target.value.trim())}
          />
          {error && <Toast tone="error" message={error} />}
          <Button icon="check" disabled={!canSubmit} loading={mutation.isPending} onClick={() => mutation.mutate()}>
            Valider la réception
          </Button>
        </div>
      )}
    </div>
  )
}
