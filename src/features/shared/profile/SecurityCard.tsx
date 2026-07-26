import { useState } from 'react'
import { Button, Card, Input, Toast } from '@/ds'
import { ApiError } from '@/lib/api/client'
import { useChangeMyPin } from './hooks'

/** Carte « Sécurité » : changement du code PIN à 6 chiffres. */
export function SecurityCard() {
  const changePin = useChangeMyPin()
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [saved, setSaved] = useState(false)

  const digits = (v: string) => v.replace(/\D/g, '').slice(0, 6)
  const valid = /^\d{6}$/.test(currentPin) && /^\d{6}$/.test(newPin) && newPin === confirmPin
  const mismatch = confirmPin.length === 6 && newPin !== confirmPin

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(false)
    changePin.mutate(
      { currentPin, newPin },
      {
        onSuccess: () => {
          setSaved(true)
          setCurrentPin('')
          setNewPin('')
          setConfirmPin('')
        },
      },
    )
  }

  const error = changePin.error instanceof ApiError ? changePin.error.message : null

  return (
    <Card padding="lg">
      <h3 style={{ margin: '0 0 4px', fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)', color: 'var(--text-strong)' }}>
        Sécurité
      </h3>
      <p style={{ margin: '0 0 16px', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
        Votre code PIN à 6 chiffres protège l'accès à votre compte.
      </p>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Input
          label="Code PIN actuel"
          icon="lock"
          type="password"
          inputMode="numeric"
          mono
          placeholder="6 chiffres"
          value={currentPin}
          onChange={(e) => setCurrentPin(digits(e.target.value))}
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
            onChange={(e) => setNewPin(digits(e.target.value))}
          />
          <Input
            label="Confirmer"
            icon="lock_reset"
            type="password"
            inputMode="numeric"
            mono
            placeholder="6 chiffres"
            value={confirmPin}
            onChange={(e) => setConfirmPin(digits(e.target.value))}
            error={mismatch ? 'Les codes ne correspondent pas' : undefined}
          />
        </div>
        {error && <Toast tone="error" message={error} />}
        {saved && !error && <Toast tone="success" message="Code PIN mis à jour." />}
        <div>
          <Button type="submit" icon="save" loading={changePin.isPending} disabled={!valid}>
            Mettre à jour le PIN
          </Button>
        </div>
      </form>
    </Card>
  )
}
