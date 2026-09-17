import { useEffect, useState } from 'react'
import { Button, Dialog, Input, Select, Toast } from '@/ds'
import { usePurchaseScore, useDriverWallet } from './hooks'
import { createPaydunyaPayment } from '@/lib/api/paydunya'
import { purchaseWithWallet } from '@/lib/api/score'
import { ApiError } from '@/lib/api/client'
import { queryClient } from '@/lib/queryClient'
import { useAuthStore } from '@/store/auth'
import { usePublicConfig } from '@/lib/usePublicConfig'
import { formatFcfa } from '@/lib/format'

interface RechargeDialogProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

const PAYMENT_METHODS = [
  { value: 'wallet', label: 'Portefeuille (solde disponible)' },
  { value: 'paydunya', label: 'PayDunya (Wave, OM, Carte…)' },
  { value: 'wave', label: 'Wave (direct)' },
  { value: 'orange_money', label: 'Orange Money (direct)' },
  { value: 'freemMoney', label: 'FreeMoney (direct)' },
  { value: 'card', label: 'Carte bancaire (direct)' },
  { value: 'cash', label: 'Espèces' },
]

export function RechargeDialog({ open, onClose, onSuccess }: RechargeDialogProps) {
  const purchase = usePurchaseScore()
  const wallet = useDriverWallet()
  const userPhone = useAuthStore((s) => s.user?.phone ?? '')
  // Forfaits issus de la configuration publique (`score.packs`) : aucune valeur
  // en dur. Le prix affiché d'un forfait est dérivé du taux officiel
  // `score.cfaPerPoint` fourni par le backend (aucun « 1 point = 1 FCFA » codé
  // en dur ni aucun montant inventé).
  const publicConfigQ = usePublicConfig()
  const cfaPerPoint = Number(publicConfigQ.data?.points.cfaPerPoint ?? 1)
  const packs = (publicConfigQ.data?.points.packs ?? []).map((p) => ({
    label: `${p} points — ${formatFcfa(p * cfaPerPoint)}`,
    points: p,
  }))
  const [pack, setPack] = useState('')
  const [customPoints, setCustomPoints] = useState('')
  const [method, setMethod] = useState('wallet')
  const [phoneNumber, setPhoneNumber] = useState(userPhone)
  const [useCustom, setUseCustom] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Sélectionne le premier forfait dès que la configuration répond. On ne force
  // le mode « montant personnalisé » que si la config est bien chargée et qu'aucun
  // forfait n'est défini (tant qu'elle charge, on attend sans surprendre).
  useEffect(() => {
    if (packs.length === 0) {
      if (publicConfigQ.isSuccess) setUseCustom(true)
      return
    }
    if (!packs.some((p) => p.points.toString() === pack)) {
      setPack(packs[0].points.toString())
    }
  }, [packs, pack, publicConfigQ.isSuccess])

  if (!open) return null

  const points = useCustom ? Number(customPoints) : Number(pack)
  const isWallet = method === 'wallet'
  const isPaydunya = method === 'paydunya'
  const walletBalance = Number(wallet.data?.balance ?? 0)
  // Le backend exige uniquement un nombre de points positif ; le coût wallet
  // réel est `points × cfaPerPoint`. Aucun seuil arbitraire côté frontend.
  const pointsCost = points * cfaPerPoint
  const valid = Number.isInteger(points) && points > 0

  const submit = async () => {
    setErrorMsg(null)

    if (isWallet) {
      if (pointsCost > walletBalance) {
        setErrorMsg(`Solde insuffisant. Votre portefeuille: ${formatFcfa(walletBalance)}, requis: ${formatFcfa(pointsCost)}`)
        return
      }
      setLoading(true)
      try {
        await purchaseWithWallet(points)
        queryClient.invalidateQueries({ queryKey: ['driver', 'wallet'] })
        queryClient.invalidateQueries({ queryKey: ['score', 'balance'] })
        queryClient.invalidateQueries({ queryKey: ['score', 'history'] })
        onSuccess?.()
        onClose()
      } catch (e) {
        setErrorMsg((e as Error)?.message ?? 'Achat impossible')
      } finally {
        setLoading(false)
      }
    } else if (isPaydunya) {
      setLoading(true)
      try {
        const result = await createPaydunyaPayment('score', { points })
        window.location.href = result.paymentUrl
      } catch (e) {
        setErrorMsg((e as Error)?.message ?? 'Erreur PayDunya')
        setLoading(false)
      }
    } else {
      purchase.mutate(
        { points, method, phoneNumber: method !== 'cash' ? (phoneNumber.trim() || userPhone) || undefined : undefined },
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
  }

  const error =
    errorMsg ||
    (purchase.error instanceof ApiError ? purchase.error.message : purchase.error ? 'Achat impossible' : null)
  const showPhone = method !== 'cash' && method !== 'paydunya' && method !== 'wallet'

  const buttonLabel = isWallet
    ? `Acheter ${points} pts (portefeuille)`
    : isPaydunya
      ? `Payer ${points} pts avec PayDunya`
      : `Acheter ${points} pts`

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
          <Button
            variant="amber"
            block
            icon="add"
            loading={purchase.isPending || loading}
            disabled={!valid}
            onClick={submit}
            style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {buttonLabel}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {isWallet && (
          <div
            style={{
              background: 'var(--teal-50)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              fontSize: 13,
              color: 'var(--teal-800)',
              fontWeight: 500,
            }}
          >
            Solde portefeuille : {formatFcfa(walletBalance)}
          </div>
        )}

        {!useCustom ? (
          <Select
            label="Forfait"
            value={pack}
            onChange={(e) => setPack(e.target.value)}
            options={packs.map((p) => ({ value: p.points.toString(), label: p.label }))}
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
          onChange={(e) => {
            setMethod(e.target.value)
            setErrorMsg(null)
          }}
        />

        {showPhone && (
          <Input
            label="Numéro de téléphone"
            icon="call"
            mono
            placeholder={userPhone || '+221 77 000 00 00'}
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        )}

        <div
          style={{
            background: 'var(--slate-50)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            fontSize: 13,
            color: 'var(--text-muted)',
            lineHeight: 1.5,
          }}
        >
          Les points vous permettent d&apos;accéder aux annonces de colis et de recevoir des missions. 1 point ={' '}
          {formatFcfa(cfaPerPoint)}.
          {isWallet && (
            <span style={{ display: 'block', marginTop: 8, color: 'var(--teal-700)', fontWeight: 500 }}>
              Le montant sera débité de votre portefeuille immédiatement.
            </span>
          )}
          {isPaydunya && (
            <span style={{ display: 'block', marginTop: 8, color: 'var(--teal-700)', fontWeight: 500 }}>
              PayDunya accepte Wave, Orange Money, FreeMoney et carte bancaire. Vous serez redirigé vers la page de
              paiement sécurisée.
            </span>
          )}
        </div>

        {error && <Toast tone="error" message={error} />}
      </div>
    </Dialog>
  )
}
