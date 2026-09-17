import { useEffect, useState } from 'react'
import { Button, Dialog, Input, Toast } from '@/ds'
import { ApiError } from '@/lib/api/client'
import { formatFcfa } from '@/lib/format'
import { useDriverFinancialState, useDriverWallet, usePayWalletDebt } from './hooks'

interface PayDebtDialogProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

/**
 * Règlement de la dette de commission avec le solde wallet existant.
 *
 * Le montant réellement réglé est borné par l'API (`/driver/wallet/pay-debt`)
 * par le solde disponible et la dette restante : le Web ne recalcule aucune
 * règle métier. Le bouton ne fait que transmettre le montant demandé ; l'API
 * reste la source de vérité, et son résultat resynchronise immédiatement l'état
 * financier (commissionDebt / canAcceptNewDeliveries).
 */
export function PayDebtDialog({ open, onClose, onSuccess }: PayDebtDialogProps) {
  const fin = useDriverFinancialState()
  const wallet = useDriverWallet()
  const repay = usePayWalletDebt()

  const debt = fin.commissionDebt
  const balance = Number(wallet.data?.balance ?? 0)
  const maxRepayable = Math.min(debt, balance)

  const [amount, setAmount] = useState('')

  // Réinitialise le montant proposé à chaque ouverture (et quand la dette change),
  // par défaut sur la totalité réglable.
  useEffect(() => {
    if (open) setAmount(maxRepayable > 0 ? String(maxRepayable) : '')
  }, [open, maxRepayable])

  if (!open) return null

  const parsed = Number(amount)
  const valid = Number.isFinite(parsed) && parsed > 0 && parsed <= maxRepayable
  const error = repay.error instanceof ApiError ? repay.error.message : null

  const submit = () => {
    if (!valid) return
    repay.mutate(parsed, {
      onSuccess: (result) => {
        setAmount('')
        onSuccess?.()
        if (result.remainingDebt <= 0) onClose()
      },
    })
  }

  const lastResult = repay.data

  return (
    <Dialog
      open
      onClose={onClose}
      icon="payments"
      iconTone="amber"
      title="Régler la dette de commission"
      actions={
        <>
          <Button variant="secondary" block onClick={onClose}>
            {lastResult && lastResult.remainingDebt <= 0 ? 'Fermer' : 'Plus tard'}
          </Button>
          {!(lastResult && lastResult.remainingDebt <= 0) && maxRepayable > 0 && (
            <Button
              variant="amber"
              block
              icon="payments"
              loading={repay.isPending}
              disabled={!valid}
              onClick={submit}
            >
              Régler {formatFcfa(parsed)}
            </Button>
          )}
        </>
      }
    >
      <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {error && <Toast tone="error" message={error} />}

        {lastResult && (
          <Toast
            tone={lastResult.remainingDebt <= 0 ? 'success' : 'warning'}
            message={
              lastResult.remainingDebt <= 0
                ? 'Dette entièrement réglée. Vous pouvez à nouveau accepter des livraisons.'
                : `Il reste ${formatFcfa(lastResult.remainingDebt)} de dette de commission.`
            }
          />
        )}

        <div
          style={{
            background: 'var(--amber-50)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            border: '1px solid var(--amber-100)',
          }}
        >
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, color: 'var(--amber-600)', marginBottom: 6 }}>
            Dette de commission
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 22, color: 'var(--amber-700)' }}>
            {formatFcfa(debt)}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)' }}>
          <span>Solde portefeuille disponible</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-strong)' }}>
            {formatFcfa(balance)}
          </span>
        </div>

        {maxRepayable > 0 ? (
          <>
            <Input
              label="Montant à régler (FCFA)"
              icon="payments"
              type="number"
              inputMode="numeric"
              mono
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
              help={`Maximum réglable maintenant : ${formatFcfa(maxRepayable)}`}
            />

            {!valid && parsed > 0 && parsed > maxRepayable && (
              <Toast tone="warning" message={`Montant supérieur au maximum réglable (${formatFcfa(maxRepayable)}).`} />
            )}

            <button
              type="button"
              onClick={() => setAmount(String(maxRepayable))}
              style={{
                alignSelf: 'flex-start',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-link)',
              }}
            >
              Tout régler ({formatFcfa(maxRepayable)})
            </button>
          </>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Votre solde portefeuille ne permet pas de régler la dette pour l&apos;instant. Rechargez votre
            portefeuille ou vos points&nbsp;: un achat de points règle la dette en priorité.
          </div>
        )}
      </div>
    </Dialog>
  )
}
