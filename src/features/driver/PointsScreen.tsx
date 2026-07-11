import { useState } from 'react'
import { Button, Dialog, Input, Select, Toast } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import { useScoreBalance, useScoreHistory, useDriverWallet, useWithdrawWallet } from './hooks'
import { createPaydunyaPayment } from '@/lib/api/paydunya'
import { formatDateTime, formatFcfa, formatPoints } from '@/lib/format'
import { RechargeDialog } from './RechargeDialog'
import { ApiError } from '@/lib/api/client'

const WALLET_PACKS = [
  { label: '1 000 FCFA', amount: 1000 },
  { label: '2 000 FCFA', amount: 2000 },
  { label: '5 000 FCFA', amount: 5000 },
  { label: '10 000 FCFA', amount: 10000 },
]

export function DriverPointsScreen() {
  const balance = useScoreBalance()
  const history = useScoreHistory()
  const wallet = useDriverWallet()
  const txns = history.data ?? []
  const [showRecharge, setShowRecharge] = useState(false)
  const [showWalletRecharge, setShowWalletRecharge] = useState(false)
  const [walletAmount, setWalletAmount] = useState(1000)
  const [walletCustom, setWalletCustom] = useState('')
  const [walletLoading, setWalletLoading] = useState(false)
  const [useCustomWallet, setUseCustomWallet] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawMethod, setWithdrawMethod] = useState('wave')
  const [withdrawPhone, setWithdrawPhone] = useState('')
  const withdraw = useWithdrawWallet()

  const rechargeWallet = async () => {
    const amount = useCustomWallet ? Number(walletCustom) : walletAmount
    if (!amount || amount < 100) return
    setWalletLoading(true)
    try {
      const result = await createPaydunyaPayment('wallet', { amount })
      window.location.href = result.paymentUrl
    } catch {
      setWalletLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Points balance card */}
      <div
        style={{
          background: 'var(--gradient-brand)',
          borderRadius: 'var(--radius-lg)',
          padding: 24,
          color: '#fff',
          boxShadow: 'var(--shadow-brand)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 52,
              height: 52,
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255,255,255,0.18)',
            }}
          >
            <span className="material-symbols-rounded fill" style={{ fontSize: 28 }}>
              account_balance_wallet
            </span>
          </span>
          <div>
            <div
              style={{
                fontSize: 12,
                opacity: 0.85,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                fontWeight: 700,
              }}
            >
              Solde de points
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 32 }}>
              {balance.data ?? '—'}
              <span style={{ fontSize: 15, opacity: 0.8 }}> pts</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
          <Button variant="amber" block icon="add" onClick={() => setShowRecharge(true)}>
            Recharger
          </Button>
          <Button variant="secondary" block icon="redeem">
            Utiliser
          </Button>
        </div>
      </div>

      {/* Wallet balance card */}
      {wallet.data && (
        <div
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div
                style={{
                  fontSize: 12,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                }}
              >
                Portefeuille
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  fontSize: 26,
                  color: 'var(--text-strong)',
                  marginTop: 4,
                }}
              >
                {formatFcfa(Number(wallet.data.balance))}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Rechargé: {formatFcfa(Number(wallet.data.totalDeposited))} · Dépensé:{' '}
                {formatFcfa(Number(wallet.data.totalSpent))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button
                variant="primary"
                size="sm"
                icon="add_card"
                onClick={() => setShowWalletRecharge(true)}
                style={{ whiteSpace: 'nowrap' }}
              >
                Recharger
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon="payments"
                onClick={() => setShowWithdraw(true)}
                disabled={Number(wallet.data?.balance ?? 0) < 100}
              >
                Retirer
              </Button>
            </div>
          </div>
        </div>
      )}

      <Panel title="Historique des points" flush>
        <QueryState
          isLoading={history.isLoading}
          isError={history.isError}
          error={history.error}
          isEmpty={txns.length === 0}
          emptyTitle="Aucun mouvement"
          emptyMessage="Vos credits et debits de points apparaîtront ici."
          onRetry={() => history.refetch()}
        >
          {txns.map((t) => {
            const positive = (t.amount ?? 0) >= 0
            return (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '13px 18px',
                  borderBottom: '1px solid var(--slate-100)',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 38,
                    height: 38,
                    borderRadius: 'var(--radius-sm)',
                    background: positive ? 'var(--green-50)' : 'var(--red-50)',
                    color: positive ? 'var(--green-700)' : 'var(--red-500)',
                    flex: 'none',
                  }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 20 }}>
                    {positive ? 'trending_up' : 'trending_down'}
                  </span>
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 600,
                      fontSize: 13.5,
                      color: 'var(--text-strong)',
                    }}
                  >
                    {t.description ?? t.type}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {formatDateTime(t.timestamp ?? t.createdAt)}
                  </div>
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    fontSize: 14,
                    color: positive ? 'var(--green-600)' : 'var(--red-500)',
                  }}
                >
                  {formatPoints(t.amount)}
                </span>
              </div>
            )
          })}
        </QueryState>
      </Panel>

      <Panel title="Historique des recharges" flush>
        <QueryState
          isLoading={history.isLoading}
          isError={history.isError}
          error={history.error}
          isEmpty={txns.filter((t) => t.type === 'purchase').length === 0}
          emptyTitle="Aucune recharge"
          emptyMessage="Vos achats de points apparaîtront ici."
          onRetry={() => history.refetch()}
        >
          {txns
            .filter((t) => t.type === 'purchase')
            .map((t) => (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '13px 18px',
                  borderBottom: '1px solid var(--slate-100)',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 38,
                    height: 38,
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--amber-50)',
                    color: 'var(--amber-600)',
                    flex: 'none',
                  }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 20 }}>
                    add_circle
                  </span>
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 600,
                      fontSize: 13.5,
                      color: 'var(--text-strong)',
                    }}
                  >
                    {t.description ?? 'Recharge'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {formatDateTime(t.timestamp ?? t.createdAt)}
                  </div>
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    fontSize: 14,
                    color: 'var(--amber-600)',
                  }}
                >
                  +{t.amount} pts
                </span>
              </div>
            ))}
        </QueryState>
      </Panel>

      <RechargeDialog open={showRecharge} onClose={() => setShowRecharge(false)} />

      <Dialog
        open={showWalletRecharge}
        onClose={() => setShowWalletRecharge(false)}
        icon="account_balance_wallet"
        iconTone="primary"
        title="Recharger le portefeuille"
        actions={
          <>
            <Button variant="secondary" block onClick={() => setShowWalletRecharge(false)}>
              Annuler
            </Button>
            <Button
              variant="primary"
              block
              icon="add_card"
              loading={walletLoading}
              disabled={useCustomWallet ? !Number(walletCustom) || Number(walletCustom) < 100 : false}
              onClick={rechargeWallet}
            >
              Recharger {useCustomWallet ? formatFcfa(Number(walletCustom)) : formatFcfa(walletAmount)}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!useCustomWallet ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {WALLET_PACKS.map((p) => (
                <button
                  key={p.amount}
                  type="button"
                  onClick={() => setWalletAmount(p.amount)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    border: walletAmount === p.amount ? '2px solid var(--teal-500)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    background: walletAmount === p.amount ? 'var(--teal-50)' : 'var(--surface-card)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    width: '100%',
                  }}
                >
                  <span style={{ fontWeight: 600, color: 'var(--text-strong)' }}>{p.label}</span>
                  {walletAmount === p.amount && (
                    <span className="material-symbols-rounded" style={{ fontSize: 20, color: 'var(--teal-600)' }}>
                      check_circle
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <Input
              label="Montant (FCFA)"
              icon="payments"
              type="number"
              inputMode="numeric"
              mono
              placeholder="Ex : 3 000"
              value={walletCustom}
              onChange={(e) => setWalletCustom(e.target.value)}
            />
          )}

          <span
            style={{ fontSize: 13, color: 'var(--text-link)', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => setUseCustomWallet(!useCustomWallet)}
          >
            {useCustomWallet ? '← Choisir un montant' : 'Montant personnalisé'}
          </span>

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
            Le portefeuille permet de payer les commissions sur les livraisons. Vous serez redirigé vers PayDunya pour
            effectuer le paiement.
          </div>
        </div>
      </Dialog>

      <Dialog
        open={showWithdraw}
        onClose={() => setShowWithdraw(false)}
        icon="payments"
        iconTone="primary"
        title="Retirer des fonds"
        actions={
          <>
            <Button variant="secondary" block onClick={() => setShowWithdraw(false)}>
              Annuler
            </Button>
            <Button
              variant="primary"
              block
              icon="payments"
              loading={withdraw.isPending}
              disabled={!Number(withdrawAmount) || Number(withdrawAmount) < 100 || Number(withdrawAmount) > Number(wallet.data?.balance ?? 0)}
              onClick={() => {
                withdraw.mutate(
                  { amount: Number(withdrawAmount), method: withdrawMethod, phone: withdrawPhone || undefined },
                  {
                    onSuccess: () => {
                      setShowWithdraw(false)
                      setWithdrawAmount('')
                      setWithdrawPhone('')
                    },
                  },
                )
              }}
            >
              Retirer {formatFcfa(Number(withdrawAmount))}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Montant (FCFA)"
            icon="payments"
            type="number"
            inputMode="numeric"
            mono
            placeholder="Ex : 5 000"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
          />
          <Select
            label="Mode de retrait"
            value={withdrawMethod}
            onChange={(e) => setWithdrawMethod(e.target.value)}
            options={[
              { value: 'wave', label: 'Wave' },
              { value: 'orange_money', label: 'Orange Money' },
              { value: 'freemMoney', label: 'FreeMoney' },
              { value: 'bank', label: 'Virement bancaire' },
            ]}
          />
          <Input
            label="Numéro de téléphone / compte"
            icon="call"
            mono
            placeholder="+221 77 000 00 00"
            value={withdrawPhone}
            onChange={(e) => setWithdrawPhone(e.target.value)}
          />

          {withdraw.isError && (
            <Toast
              tone="error"
              message={
                withdraw.error instanceof ApiError
                  ? withdraw.error.message
                  : 'Erreur lors du retrait'
              }
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
            Solde disponible : {formatFcfa(Number(wallet.data?.balance ?? 0))}. Le retrait sera traité sous 24-48h.
          </div>
        </div>
      </Dialog>
    </div>
  )
}
