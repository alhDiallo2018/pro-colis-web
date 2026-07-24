import { useState } from 'react'
import { Button, Dialog, Input, Select, Toast } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import { useScoreBalance, useScoreHistory, useDriverWallet, useWithdrawWallet, useMyWithdrawals, useCancelWithdrawal } from './hooks'
import { createPaydunyaPayment } from '@/lib/api/paydunya'
import { formatDateTime, formatFcfa, formatPoints } from '@/lib/format'
import { RechargeDialog } from './RechargeDialog'
import { ApiError } from '@/lib/api/client'
import { useAuthStore } from '@/store/auth'
import type { Withdrawal, WithdrawalStatus } from '@/lib/api/withdrawals'

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
  const myWithdrawals = useMyWithdrawals()
  const userPhone = useAuthStore((s) => s.user?.phone ?? '')
  const txns = history.data ?? []
  const withdrawalList = myWithdrawals.data ?? []
  const [showRecharge, setShowRecharge] = useState(false)
  const [showWalletRecharge, setShowWalletRecharge] = useState(false)
  const [walletAmount, setWalletAmount] = useState(1000)
  const [walletCustom, setWalletCustom] = useState('')
  const [walletLoading, setWalletLoading] = useState(false)
  const [useCustomWallet, setUseCustomWallet] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawMethod, setWithdrawMethod] = useState('wave')
  const [withdrawPhone, setWithdrawPhone] = useState(userPhone)
  const withdraw = useWithdrawWallet()
  const cancelWithdrawal = useCancelWithdrawal()

  const hasActiveWithdrawal = withdrawalList.some(
    (w: Withdrawal) => w.status === 'PENDING' || w.status === 'PROCESSING',
  )
  const availableBalance = Number(wallet.data?.balance ?? 0)
  const pendingBalance = Number(wallet.data?.pendingBalance ?? 0)
  const totalWithdrawn = Number(wallet.data?.totalWithdrawn ?? 0)
  const totalCommissionsPaid = Number(wallet.data?.totalCommissionsPaid ?? 0)

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
                Portefeuille (FCFA)
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
                {formatFcfa(availableBalance)}
              </div>
              {pendingBalance > 0 && (
                <div style={{ fontSize: 12, color: 'var(--amber-600)', marginTop: 2, fontWeight: 600 }}>
                  Dont {formatFcfa(pendingBalance)} en attente de retrait
                </div>
              )}
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Rechargé: {formatFcfa(Number(wallet.data.totalDeposited))}
                {totalCommissionsPaid > 0 ? <> · Commissions: {formatFcfa(totalCommissionsPaid)}</> : null}
                {totalWithdrawn > 0 ? <> · Retiré: {formatFcfa(totalWithdrawn)}</> : null}
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
                disabled={availableBalance < 500 || hasActiveWithdrawal}
                title={hasActiveWithdrawal ? 'Un retrait est déjà en cours' : availableBalance < 500 ? 'Minimum 500 FCFA' : undefined}
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
              disabled={!Number(withdrawAmount) || Number(withdrawAmount) < 500 || Number(withdrawAmount) > availableBalance || hasActiveWithdrawal}
              onClick={() => {
                withdraw.mutate(
                  {
                    amount: Number(withdrawAmount),
                    method: withdrawMethod,
                    phone: withdrawPhone.trim() || userPhone || undefined,
                  },
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
            placeholder={userPhone || '+221 77 000 00 00'}
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

          {hasActiveWithdrawal && (
            <Toast
              tone="warning"
              message="Vous avez déjà un retrait en cours. Veuillez attendre son traitement."
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
            Solde disponible : {formatFcfa(availableBalance)}
            {pendingBalance > 0 ? <> (dont {formatFcfa(pendingBalance)} en attente)</> : null}
            . Minimum : 500 FCFA. Traité sous 24-48h.
          </div>
        </div>
      </Dialog>

      {/* Withdrawal history */}
      {withdrawalList.length > 0 && (
        <Panel title="Historique des retraits" flush>
          {withdrawalList.map((w: Withdrawal) => {
            const statusColors: Record<WithdrawalStatus, string> = {
              PENDING: 'var(--amber-600)',
              PROCESSING: 'var(--blue-600)',
              SUCCESS: 'var(--green-600)',
              FAILED: 'var(--red-600)',
              CANCELLED: 'var(--gray-500)',
            }
            const statusLabels: Record<WithdrawalStatus, string> = {
              PENDING: 'En attente',
              PROCESSING: 'En cours',
              SUCCESS: 'Réussi',
              FAILED: 'Échoué',
              CANCELLED: 'Annulé',
            }
            const methodLabels: Record<string, string> = {
              wave: 'Wave', orange_money: 'Orange Money', freeMoney: 'FreeMoney', freemMoney: 'FreeMoney',
              bank: 'Virement', paydunya: 'PayDunya',
            }
            return (
              <div
                key={w.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '13px 18px',
                  borderBottom: '1px solid var(--slate-100)',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text-strong)' }}>
                    Retrait {formatFcfa(w.amount)} vers {methodLabels[w.method] ?? w.method}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {new Date(w.createdAt).toLocaleString('fr-FR')}
                    {w.phoneNumber ? <> · {w.phoneNumber}</> : null}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: statusColors[w.status] }}>
                    {statusLabels[w.status]}
                  </span>
                  {w.status === 'PENDING' && (
                    <button
                      type="button"
                      onClick={() => cancelWithdrawal.mutate(w.id)}
                      disabled={cancelWithdrawal.isPending}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--red-500)', fontSize: 11, fontWeight: 600,
                        padding: '2px 6px',
                      }}
                    >
                      Annuler
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </Panel>
      )}
    </div>
  )
}
