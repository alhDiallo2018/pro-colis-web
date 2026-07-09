import { useState } from 'react'
import { Button, Card, Input, SegmentedControl, Toast } from '@/ds'
import { useAuthStore } from '@/store/auth'
import { useChangePin, useUpdateDriverStatus } from './hooks'
import { ApiError } from '@/lib/api/client'
import type { DriverStatus } from '@/lib/api/types'

const STATUS_OPTIONS = [
  { value: 'available', label: 'Disponible', icon: 'check_circle' },
  { value: 'busy', label: 'Occupé', icon: 'pending' },
  { value: 'offline', label: 'Hors ligne', icon: 'do_not_disturb_on' },
]

export function DriverParametresScreen() {
  const user = useAuthStore((s) => s.user)
  const updateStatus = useUpdateDriverStatus()
  const changePin = useChangePin()

  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinSaved, setPinSaved] = useState(false)

  if (!user) return null

  const status = (user.driverStatus ?? 'offline') as DriverStatus
  const pinValid = /^\d{6}$/.test(currentPin) && /^\d{6}$/.test(newPin) && newPin === confirmPin
  const pinMismatch = confirmPin.length === 6 && newPin !== confirmPin

  const submitPin = (e: React.FormEvent) => {
    e.preventDefault()
    setPinSaved(false)
    changePin.mutate(
      { currentPin, newPin },
      {
        onSuccess: () => {
          setPinSaved(true)
          setCurrentPin('')
          setNewPin('')
          setConfirmPin('')
        },
      },
    )
  }

  const pinError = changePin.error instanceof ApiError ? changePin.error.message : null

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Availability */}
      <Card padding="lg">
        <h3 style={{ margin: '0 0 4px', fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)', color: 'var(--text-strong)' }}>Disponibilité</h3>
        <p style={{ margin: '0 0 16px', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
          Votre statut détermine si vous recevez de nouvelles missions.
        </p>
        <SegmentedControl
          options={STATUS_OPTIONS}
          value={status}
          onChange={(v) => updateStatus.mutate(v as DriverStatus)}
        />
        {updateStatus.isError && <Toast tone="error" message="Impossible de mettre à jour le statut." style={{ marginTop: 14 }} />}
      </Card>

      {/* PIN */}
      <Card padding="lg">
        <h3 style={{ margin: '0 0 16px', fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)', color: 'var(--text-strong)' }}>Changer le code PIN</h3>
        <form onSubmit={submitPin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Code PIN actuel"
            icon="lock"
            type="password"
            inputMode="numeric"
            mono
            placeholder="6 chiffres"
            value={currentPin}
            onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />
          <div className="pc-field-pair" style={{ gap: 16 }}>
            <Input
              label="Nouveau code PIN"
              icon="lock_reset"
              type="password"
              inputMode="numeric"
              mono
              placeholder="6 chiffres"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
            <Input
              label="Confirmer"
              icon="lock_reset"
              type="password"
              inputMode="numeric"
              mono
              placeholder="6 chiffres"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              error={pinMismatch ? 'Les codes ne correspondent pas' : undefined}
            />
          </div>
          {pinError && <Toast tone="error" message={pinError} />}
          {pinSaved && !pinError && <Toast tone="success" message="Code PIN mis à jour." />}
          <div>
            <Button type="submit" icon="save" loading={changePin.isPending} disabled={!pinValid}>
              Mettre à jour le PIN
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
