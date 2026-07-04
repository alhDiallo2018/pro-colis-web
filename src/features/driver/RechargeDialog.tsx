import { useState } from 'react'
import { Button, Dialog, Input, Select, Toast } from '@/ds'
import { usePurchaseScore } from './hooks'
import { ApiError } from '@/lib/api/client'

interface RechargeDialogProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

const PACKS = [
  { label: '500 points — 500 FCFA', points: 500 },
  { label: '1 000 points — 1 000 FCFA', points: 1000 },
  { label: '3 000 points — 3 000 FCFA', points: 3000 },
  { label: '5 000 points — 5 000 FCFA', points: 5000 },
  { label: '10 000 points — 10 000 FCFA', points: 10000 },
]

const PAYMENT_METHODS = [
  { value: 'wave', label: 'Wave' },
  { value: 'orange_money', label: 'Orange Money' },
  { value: 'freemMoney', label: 'FreeMoney' },
  { value: 'card', label: 'Carte bancaire' },
  { value: 'cash', label: 'Espèces' },
]

export function RechargeDialog({ open, onClose, onSuccess }: RechargeDialogProps) {
  const purchase = usePurchaseScore()
  const [pack, setPack] = useState(PACKS[0].points.toString())
  const [customPoints, setCustomPoints] = useState('')
  const [method, setMethod] = useState('wave')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [useCustom, setUseCustom] = useState(false)

  if (!open) return null

  const points = useCustom ? Number(customPoints) : Number(pack)
  const valid = points >= 100 && (method !== 'cash' || points > 0)

  const submit = () => {
    purchase.mutate(
      { points, method, phoneNumber: method !== 'cash' ? phoneNumber.trim() || undefined : undefined },
      {
        onSuccess: () => {
          setCustomPoints('')
          setPhoneNumber('')
          onSuccess?.()
          onClose()
        },
      },
    )
  }

  const error = purchase.error instanceof ApiError ? purchase.error.message : purchase.error ? 'Achat impossible' : null
  const showPhone = method !== 'cash'

  return (
    <Dialog
      open
      onClose={onClose}
      icon="account_balance_wallet"
      iconTone="amber"
      title="Recharger des points"
      actions={
        <>
          <Button variant="secondary" block onClick={onClose}>
            Annuler
          </Button>
          <Button variant="amber" block icon="add" loading={purchase.isPending} disabled={!valid} onClick={submit}>
            Acheter {points} pts
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {!useCustom ? (
          <Select
            label="Forfait"
            value={pack}
            onChange={(e) => setPack(e.target.value)}
            options={PACKS.map((p) => ({ value: p.points.toString(), label: p.label }))}
          />
        ) : (
          <Input
            label="Nombre de points"
            icon="toll"
            type="number"
            inputMode="numeric"
            mono
            placeholder="Ex : 2 000"
            value={customPoints}
            onChange={(e) => setCustomPoints(e.target.value)}
          />
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{ fontSize: 13, color: 'var(--text-link)', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => setUseCustom(!useCustom)}
          >
            {useCustom ? '← Choisir un forfait' : 'Montant personnalisé'}
          </span>
        </div>

        <Select
          label="Moyen de paiement"
          options={PAYMENT_METHODS}
          value={method}
          onChange={(e) => setMethod(e.target.value)}
        />

        {showPhone && (
          <Input
            label="Numéro de téléphone"
            icon="call"
            mono
            placeholder="+221 77 000 00 00"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        )}

        <div style={{ background: 'var(--slate-50)', borderRadius: 'var(--radius-md)', padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Les points vous permettent d&apos;accéder aux annonces de colis et de recevoir des missions.
          1 point = 1 FCFA.
        </div>

        {error && <Toast tone="error" message={error} />}
      </div>
    </Dialog>
  )
}
