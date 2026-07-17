import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Card, Dialog, Input, Toast } from '@/ds'
import { useWallet, useWalletTransactions, useRechargeWallet, useDebitWallet } from '@/features/superAdmin/hooks'
import { formatFcfa } from '@/lib/format'
import type { ApiError } from '@/lib/api/client'

export function WalletDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { data: wallet, isLoading, error } = useWallet(userId)
  const { data: txData } = useWalletTransactions(userId)
  const transactions = txData?.transactions ?? []

  const [showRecharge, setShowRecharge] = useState(false)
  const [showDebit, setShowDebit] = useState(false)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')

  const recharge = useRechargeWallet(userId!)
  const debit = useDebitWallet(userId!)

  const driverName = wallet?.driver?.fullName ?? 'Chauffeur'

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Chargement...</div>
  }

  if (error || !wallet) {
    return (
      <Card padding="lg" style={{ textAlign: 'center' }}>
        <h3 style={{ margin: '0 0 8px' }}>Wallet introuvable</h3>
        <p style={{ color: 'var(--text-muted)', margin: '0 0 16px' }}>Impossible de charger le wallet.</p>
        <Button variant="secondary" onClick={() => navigate('/admin/finance/wallets')}>
          Retour aux wallets
        </Button>
      </Card>
    )
  }

  const balance = wallet.balance ?? 0
  const totalDeposited = wallet.totalDeposited ?? 0
  const totalSpent = wallet.totalSpent ?? 0

  const handleAction = (isRecharge: boolean) => {
    const amt = Number(amount)
    if (!amt || amt <= 0) return
    const payload = { amount: amt, description: description.trim() || undefined }
    if (isRecharge) {
      recharge.mutate(payload, {
        onSuccess: () => {
          setShowRecharge(false)
          setAmount('')
          setDescription('')
        },
      })
    } else {
      debit.mutate(payload, {
        onSuccess: () => {
          setShowDebit(false)
          setAmount('')
          setDescription('')
        },
      })
    }
  }

  const actionError =
    (recharge.error ?? debit.error) instanceof Error
      ? (recharge.error ?? debit.error)!.message
      : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>
      <Card padding="lg">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Wallet de {driverName}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 32, color: balance >= 0 ? 'var(--green-600)' : 'var(--red-500)', marginTop: 4 }}>
            {formatFcfa(balance)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginTop: 16 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--color-primary)' }}>
                {formatFcfa(totalDeposited)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total rechargé</div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--amber-500)' }}>
                {formatFcfa(totalSpent)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total dépensé</div>
            </div>
          </div>
        </div>
      </Card>

      <div style={{ display: 'flex', gap: 12 }}>
        <Button block icon="add" onClick={() => setShowRecharge(true)}>Recharger</Button>
        <Button
          block
          variant="secondary"
          icon="remove"
          onClick={() => setShowDebit(true)}
          style={{ color: 'var(--red-500)', borderColor: 'var(--red-500)' }}
        >
          Débiter
        </Button>
      </div>

      <div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--text-strong)', margin: '0 0 10px' }}>
          Historique des transactions
        </h3>
        {transactions.length === 0 ? (
          <Card padding="lg">
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>
              Aucune transaction
            </div>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {transactions.map((tx) => {
              const isCredit = tx.type === 'deposit' || tx.type === 'recharge' || tx.amount > 0
              return (
                <Card key={tx.id} padding="md">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 'var(--radius-sm)',
                        background: isCredit ? 'var(--green-50)' : 'var(--red-50)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <span className="material-symbols-rounded" style={{ fontSize: 18, color: isCredit ? 'var(--green-600)' : 'var(--red-400)' }}>
                        {isCredit ? 'arrow_downward' : 'arrow_upward'}
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--text-strong)', textTransform: 'uppercase' }}>
                        {tx.type}
                      </div>
                      {tx.description && (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{tx.description}</div>
                      )}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: isCredit ? 'var(--green-600)' : 'var(--red-400)' }}>
                      {formatFcfa(tx.amount)}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {showRecharge && (
        <Dialog
          open
          onClose={() => setShowRecharge(false)}
          icon="account_balance_wallet"
          iconTone="primary"
          title="Recharger le wallet"
          actions={
            <>
              <Button variant="secondary" block onClick={() => setShowRecharge(false)}>Annuler</Button>
              <Button block icon="add" loading={recharge.isPending} onClick={() => handleAction(true)}>
                Recharger
              </Button>
            </>
          }
        >
          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input
              label="Montant (FCFA)"
              icon="payments"
              type="number"
              inputMode="numeric"
              mono
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Input
              label="Description (optionnel)"
              icon="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            {actionError && <Toast tone="error" message={actionError} />}
          </div>
        </Dialog>
      )}

      {showDebit && (
        <Dialog
          open
          onClose={() => setShowDebit(false)}
          icon="account_balance_wallet"
          iconTone="danger"
          title="Débiter le wallet"
          actions={
            <>
              <Button variant="secondary" block onClick={() => setShowDebit(false)}>Annuler</Button>
              <Button block icon="remove" loading={debit.isPending} onClick={() => handleAction(false)} style={{ background: 'var(--red-500)', color: '#fff' }}>
                Débiter
              </Button>
            </>
          }
        >
          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input
              label="Montant (FCFA)"
              icon="payments"
              type="number"
              inputMode="numeric"
              mono
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Input
              label="Description (optionnel)"
              icon="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            {actionError && <Toast tone="error" message={actionError} />}
          </div>
        </Dialog>
      )}
    </div>
  )
}
