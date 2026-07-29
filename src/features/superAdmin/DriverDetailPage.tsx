import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Avatar, Badge, Button, Dialog, Input, StatBox, Tabs, Toast } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import {
  useDriverDetail,
  useScoreHistory,
  useWallet,
  useWalletTransactions,
  useRechargeWallet,
  useDebitWallet,
} from './hooks'
import { formatFcfa, formatDate, formatDateTime } from '@/lib/format'
import { useIsMobile } from '@/lib/useMediaQuery'
import { ApiError } from '@/lib/api/client'

const LEVEL_TONE: Record<string, 'primary' | 'amber' | 'green' | 'neutral'> = {
  ELITE: 'primary',
  PREMIUM: 'amber',
  STANDARD: 'green',
  NEW: 'neutral',
}

const TX_TONE: Record<string, 'green' | 'red' | 'neutral'> = {
  earn: 'green',
  bonus: 'green',
  spend: 'red',
  penalty: 'red',
}

const TX_LABEL: Record<string, string> = {
  earn: 'Gain',
  bonus: 'Bonus',
  spend: 'Dépense',
  penalty: 'Pénalité',
  adjustment: 'Ajustement',
}

const WALLET_TX_LABEL: Record<string, string> = {
  deposit: 'Rechargement',
  debit: 'Débit',
  refund: 'Remboursement',
  commission: 'Commission',
  payment: 'Paiement',
}

/** Paire label/valeur d'une carte mobile. */
function MobileField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontSize: 12.5 }}>
      <span style={{ color: 'var(--text-muted)', flex: 'none' }}>{label}</span>
      <span style={{ minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', color: 'var(--text-body)' }}>{children}</span>
    </div>
  )
}

export function DriverDetailPage() {
  const isMobile = useIsMobile()
  const { userId } = useParams<{ userId: string }>()
  const [tab, setTab] = useState('reputation')
  const [rechargeOpen, setRechargeOpen] = useState(false)
  const [debitOpen, setDebitOpen] = useState(false)
  const [errorToast, setErrorToast] = useState<string | null>(null)

  const driverQuery = useDriverDetail(userId)
  const scoreHistoryQuery = useScoreHistory(userId)
  const walletQuery = useWallet(userId)
  const walletTxQuery = useWalletTransactions(userId)

  const driver = driverQuery.data
  const user = driver?.user
  const score = driver?.score
  const wallet = walletQuery.data
  const scoreTxs = scoreHistoryQuery.data ?? []
  const walletTxs = walletTxQuery.data?.transactions ?? []

  const rechargeMutation = useRechargeWallet(userId!)
  const debitMutation = useDebitWallet(userId!)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {errorToast && (
        <Toast tone="error" message={errorToast} onClose={() => setErrorToast(null)} />
      )}

      <QueryState
        isLoading={driverQuery.isLoading}
        isError={driverQuery.isError}
        error={driverQuery.error}
        emptyTitle="Chauffeur introuvable"
        emptyMessage="Ce chauffeur n'existe pas ou a été supprimé."
        onRetry={() => driverQuery.refetch()}
      >
        {user && (
          <>
            <Panel>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Avatar name={user.fullName} src={user.profilePhoto ?? undefined} size="lg" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--text-strong)' }}>
                    {user.fullName}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                    {user.phone}
                    {user.garageName && ` · ${user.garageName}`}
                    {user.region && ` · ${user.region}`}
                  </div>
                  <div style={{ marginTop: 6, display: 'flex', gap: 6, alignItems: 'center' }}>
                    {score?.level && (
                      <Badge tone={LEVEL_TONE[score.level] ?? 'neutral'}>{score.level}</Badge>
                    )}
                    {user.rating != null && (
                      <span style={{ fontSize: 13, color: 'var(--text-body)', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <span className="material-symbols-rounded" style={{ fontSize: 15, color: 'var(--amber-400)' }}>star</span>
                        {user.rating.toFixed(1)}
                      </span>
                    )}
                    {user.createdAt && (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Inscrit le {formatDate(user.createdAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Panel>

            <Tabs
              items={[
                { value: 'reputation', label: 'Réputation' },
                { value: 'finance', label: 'Finance' },
              ]}
              value={tab}
              onChange={setTab}
            />

            {tab === 'reputation' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {score && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
                    <StatBox icon="stars" tone="primary" value={score.points} label="Score" />
                    <StatBox icon="military_tech" tone="amber" value={score.level} label="Niveau" />
                    <StatBox icon="star" tone="amber" value={user.rating?.toFixed(1) ?? '—'} label="Note" />
                    <StatBox icon="local_shipping" tone="teal" value={user.totalDeliveries ?? 0} label="Livraisons" />
                    <StatBox icon="trending_up" tone="green" value={score.totalEarned} label="Total gagné" />
                    <StatBox icon="trending_down" tone="red" value={score.totalSpent} label="Total dépensé" />
                  </div>
                )}

                <Panel title="Historique des scores" flush>
                  {isMobile ? (
                    <QueryState
                      isLoading={scoreHistoryQuery.isLoading}
                      isError={scoreHistoryQuery.isError}
                      error={scoreHistoryQuery.error}
                      isEmpty={scoreTxs.length === 0}
                      emptyTitle="Aucune transaction"
                      emptyMessage="Ce chauffeur n'a pas encore de transactions de score."
                      onRetry={() => scoreHistoryQuery.refetch()}
                    >
                      {scoreTxs.map((tx) => (
                        <div key={tx.id} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '13px 16px', borderBottom: '1px solid var(--slate-100)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-body)' }}>{formatDateTime(tx.createdAt)}</span>
                            <Badge tone={TX_TONE[tx.type] ?? 'neutral'}>{TX_LABEL[tx.type] ?? tx.type}</Badge>
                          </div>
                          <MobileField label="Points">
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, color: tx.amount > 0 ? 'var(--green-600)' : 'var(--red-500)' }}>
                              {tx.amount > 0 ? '+' : ''}{tx.amount} pts
                            </span>
                          </MobileField>
                          <MobileField label="Description">
                            <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description || '—'}</span>
                          </MobileField>
                        </div>
                      ))}
                    </QueryState>
                  ) : (
                  <div className="pc-table-scroll">
                    <div style={{ minWidth: 600 }}>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 100px 120px 1fr',
                          padding: '11px 18px',
                          borderBottom: '1px solid var(--border-subtle)',
                          fontFamily: 'var(--font-display)',
                          fontWeight: 700,
                          fontSize: 11,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: 'var(--text-faint)',
                        }}
                      >
                        <span>Date</span>
                        <span>Type</span>
                        <span>Points</span>
                        <span>Description</span>
                      </div>
                      <QueryState
                        isLoading={scoreHistoryQuery.isLoading}
                        isError={scoreHistoryQuery.isError}
                        error={scoreHistoryQuery.error}
                        isEmpty={scoreTxs.length === 0}
                        emptyTitle="Aucune transaction"
                        emptyMessage="Ce chauffeur n'a pas encore de transactions de score."
                        onRetry={() => scoreHistoryQuery.refetch()}
                      >
                        {scoreTxs.map((tx) => (
                          <div
                            key={tx.id}
                            style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px 1fr', alignItems: 'center', padding: '11px 18px', borderBottom: '1px solid var(--slate-100)' }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', minWidth: 0, fontSize: 12.5, color: 'var(--text-body)' }}>
                              {formatDateTime(tx.createdAt)}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                              <Badge tone={TX_TONE[tx.type] ?? 'neutral'}>{TX_LABEL[tx.type] ?? tx.type}</Badge>
                            </span>
                            <span style={{
                              display: 'flex', alignItems: 'center', minWidth: 0,
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 700,
                              fontSize: 13,
                              color: tx.amount > 0 ? 'var(--green-600)' : 'var(--red-500)',
                            }}>
                              {tx.amount > 0 ? '+' : ''}{tx.amount} pts
                            </span>
                            <span style={{ minWidth: 0, fontSize: 12.5, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                              {tx.description || '—'}
                            </span>
                          </div>
                        ))}
                      </QueryState>
                    </div>
                  </div>
                  )}
                </Panel>
              </div>
            )}

            {tab === 'finance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <QueryState
                  isLoading={walletQuery.isLoading}
                  isError={walletQuery.isError}
                  error={walletQuery.error}
                  emptyTitle="Aucun wallet"
                  emptyMessage="Ce chauffeur n'a pas de wallet."
                  onRetry={() => walletQuery.refetch()}
                >
                  {wallet && (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
                        <StatBox icon="account_balance_wallet" tone="primary" value={formatFcfa(wallet.balance)} label="Solde" />
                        <StatBox icon="add_card" tone="green" value={formatFcfa(wallet.totalDeposited)} label="Total rechargé" />
                        <StatBox icon="shopping_cart" tone="red" value={formatFcfa(wallet.totalSpent)} label="Total consommé" />
                      </div>

                      <div style={{ display: 'flex', gap: 10 }}>
                        <Button icon="add" variant="primary" onClick={() => setRechargeOpen(true)}>
                          Recharger
                        </Button>
                        <Button icon="remove" variant="danger" onClick={() => setDebitOpen(true)}>
                          Débiter
                        </Button>
                      </div>

                      <Panel title="Historique des transactions wallet" flush>
                        {isMobile ? (
                          <QueryState
                            isLoading={walletTxQuery.isLoading}
                            isError={walletTxQuery.isError}
                            error={walletTxQuery.error}
                            isEmpty={walletTxs.length === 0}
                            emptyTitle="Aucune transaction"
                            emptyMessage="Aucune transaction wallet trouvée."
                            onRetry={() => walletTxQuery.refetch()}
                          >
                            {walletTxs.map((tx) => (
                              <div key={tx.id} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '13px 16px', borderBottom: '1px solid var(--slate-100)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                                  <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-body)' }}>{formatDateTime(tx.createdAt)}</span>
                                  <Badge tone={tx.type === 'debit' ? 'red' : 'green'}>{WALLET_TX_LABEL[tx.type] ?? tx.type}</Badge>
                                </div>
                                <MobileField label="Montant">
                                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12.5, color: tx.type === 'debit' ? 'var(--red-500)' : 'var(--green-600)' }}>
                                    {tx.type === 'debit' ? '-' : '+'}{formatFcfa(tx.amount)}
                                  </span>
                                </MobileField>
                                <MobileField label="Solde après">
                                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 12 }}>{formatFcfa(tx.balanceAfter)}</span>
                                </MobileField>
                                <MobileField label="Description">
                                  <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description ?? '—'}</span>
                                </MobileField>
                              </div>
                            ))}
                          </QueryState>
                        ) : (
                        <div className="pc-table-scroll">
                          <div style={{ minWidth: 600 }}>
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 100px 120px 120px 1fr',
                                padding: '11px 18px',
                                borderBottom: '1px solid var(--border-subtle)',
                                fontFamily: 'var(--font-display)',
                                fontWeight: 700,
                                fontSize: 11,
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                                color: 'var(--text-faint)',
                              }}
                            >
                              <span>Date</span>
                              <span>Type</span>
                              <span>Montant</span>
                              <span>Solde après</span>
                              <span>Description</span>
                            </div>
                            <QueryState
                              isLoading={walletTxQuery.isLoading}
                              isError={walletTxQuery.isError}
                              error={walletTxQuery.error}
                              isEmpty={walletTxs.length === 0}
                              emptyTitle="Aucune transaction"
                              emptyMessage="Aucune transaction wallet trouvée."
                              onRetry={() => walletTxQuery.refetch()}
                            >
                              {walletTxs.map((tx) => (
                                <div
                                  key={tx.id}
                                  style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px 120px 1fr', alignItems: 'center', padding: '11px 18px', borderBottom: '1px solid var(--slate-100)' }}
                                >
                                  <span style={{ display: 'flex', alignItems: 'center', minWidth: 0, fontSize: 12.5, color: 'var(--text-body)' }}>
                                    {formatDateTime(tx.createdAt)}
                                  </span>
                                  <span style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                                    <Badge tone={tx.type === 'debit' ? 'red' : 'green'}>
                                      {WALLET_TX_LABEL[tx.type] ?? tx.type}
                                    </Badge>
                                  </span>
                                  <span style={{
                                    display: 'flex', alignItems: 'center', minWidth: 0,
                                    fontFamily: 'var(--font-mono)',
                                    fontWeight: 700,
                                    fontSize: 12.5,
                                    color: tx.type === 'debit' ? 'var(--red-500)' : 'var(--green-600)',
                                  }}>
                                    {tx.type === 'debit' ? '-' : '+'}{formatFcfa(tx.amount)}
                                  </span>
                                  <span style={{ display: 'flex', alignItems: 'center', minWidth: 0, fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 12, color: 'var(--text-body)' }}>
                                    {formatFcfa(tx.balanceAfter)}
                                  </span>
                                  <span style={{ minWidth: 0, fontSize: 12.5, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                                    {tx.description ?? '—'}
                                  </span>
                                </div>
                              ))}
                            </QueryState>
                          </div>
                        </div>
                        )}
                      </Panel>
                    </>
                  )}
                </QueryState>
              </div>
            )}
          </>
        )}
      </QueryState>

      {userId && (
        <RechargeWalletDialog
          userId={userId}
          open={rechargeOpen}
          onClose={() => setRechargeOpen(false)}
          mutation={rechargeMutation}
        />
      )}
      {userId && (
        <DebitWalletDialog
          userId={userId}
          open={debitOpen}
          onClose={() => setDebitOpen(false)}
          mutation={debitMutation}
        />
      )}
    </div>
  )
}

interface WalletDialogProps {
  userId: string
  open: boolean
  onClose: () => void
  mutation: ReturnType<typeof useRechargeWallet>
}

function RechargeWalletDialog({ open, onClose, mutation }: WalletDialogProps) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = async () => {
    const num = Number(amount)
    if (!amount || Number.isNaN(num) || num <= 0) {
      setLocalError('Le montant doit être supérieur à 0.')
      return
    }
    setLocalError(null)
    try {
      await mutation.mutateAsync({ amount: num, description: description.trim() || undefined })
      setAmount('')
      setDescription('')
      onClose()
    } catch (error) {
      setLocalError(error instanceof ApiError ? error.message : 'Erreur lors du rechargement.')
    }
  }

  const handleClose = () => {
    setAmount('')
    setDescription('')
    setLocalError(null)
    onClose()
  }

  return (
    <Dialog open={open} title="Recharger le wallet" icon="add_card" iconTone="green" onClose={handleClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
        <Input
          label="Montant (FCFA)"
          type="number"
          placeholder="Ex: 5000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          icon="payments"
        />
        <Input
          label="Description"
          placeholder="Motif du rechargement..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {localError && (
          <Toast tone="error" message={localError} onClose={() => setLocalError(null)} />
        )}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
        <Button variant="secondary" onClick={handleClose} block>
          Annuler
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          loading={mutation.isPending}
          disabled={mutation.isPending}
          block
        >
          Recharger
        </Button>
      </div>
    </Dialog>
  )
}

function DebitWalletDialog({ open, onClose, mutation }: WalletDialogProps) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = async () => {
    const num = Number(amount)
    if (!amount || Number.isNaN(num) || num <= 0) {
      setLocalError('Le montant doit être supérieur à 0.')
      return
    }
    setLocalError(null)
    try {
      await mutation.mutateAsync({ amount: num, description: description.trim() || undefined })
      setAmount('')
      setDescription('')
      onClose()
    } catch (error) {
      setLocalError(error instanceof ApiError ? error.message : 'Erreur lors du débit.')
    }
  }

  const handleClose = () => {
    setAmount('')
    setDescription('')
    setLocalError(null)
    onClose()
  }

  return (
    <Dialog open={open} title="Débiter le wallet" icon="money_off" iconTone="danger" onClose={handleClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
        <Input
          label="Montant (FCFA)"
          type="number"
          placeholder="Ex: 2000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          icon="payments"
        />
        <Input
          label="Description"
          placeholder="Motif du débit..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {localError && (
          <Toast tone="error" message={localError} onClose={() => setLocalError(null)} />
        )}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
        <Button variant="secondary" onClick={handleClose} block>
          Annuler
        </Button>
        <Button
          variant="danger"
          onClick={handleSubmit}
          loading={mutation.isPending}
          disabled={mutation.isPending}
          block
        >
          Débiter
        </Button>
      </div>
    </Dialog>
  )
}
