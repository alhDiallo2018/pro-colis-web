import { useState, type ChangeEvent } from 'react'
import { Avatar, Badge, Button, Input, Select, StatBox, Dialog, Toast } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import {
  useWallets,
  useWallet,
  useWalletTransactions,
  useRechargeWallet,
  useDebitWallet,
} from './hooks'
import { formatFcfa, formatDate } from '@/lib/format'
import type { Wallet } from '@/lib/api/admin-finance'
import type { ListParams } from '@/lib/api/types'

const TX_GRID = '120px 80px 100px 1fr 120px 120px 140px'
const cell: React.CSSProperties = { display: 'flex', alignItems: 'center', minWidth: 0 }

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Tous' },
  { value: 'active', label: 'Actif' },
  { value: 'suspended', label: 'Suspendu' },
]

const SOLDE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Tous' },
  { value: 'low', label: 'Solde &lt;500' },
  { value: 'zero', label: 'Solde nul' },
  { value: 'above', label: 'Solde &gt;seuil' },
]

const TX_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Tous' },
  { value: 'recharge', label: 'Recharge' },
  { value: 'commission', label: 'Commission' },
  { value: 'bonus', label: 'Bonus' },
  { value: 'ajustement', label: 'Ajustement' },
  { value: 'remboursement', label: 'Remboursement' },
  { value: 'correction', label: 'Correction' },
  { value: 'penalite', label: 'Pénalité' },
]

const WALLET_GRID = '1fr 140px 140px 120px 120px 140px 110px 150px 100px'

function txBadgeTone(type: string): 'green' | 'red' | 'amber' | 'primary' | 'neutral' {
  switch (type) {
    case 'recharge': return 'green'
    case 'commission': return 'red'
    case 'bonus': return 'primary'
    case 'remboursement': return 'amber'
    case 'correction': return 'neutral'
    case 'penalite': return 'red'
    default: return 'neutral'
  }
}

function RechargeDialog({ userId, open, onClose }: { userId: string; open: boolean; onClose: () => void }) {
  const [montant, setMontant] = useState('')
  const [type, setType] = useState('depot_manuel')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const mutation = useRechargeWallet(userId)

  const handleSubmit = async () => {
    setError(null)
    const amount = Number(montant)
    if (!amount || amount <= 0) {
      setError('Montant invalide')
      return
    }
    try {
      await mutation.mutateAsync({ amount, origin: type, description })
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors du rechargement')
    }
  }

  return (
    <Dialog open={open} title="Recharger le wallet" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
        <Input
          label="Montant (FCFA)"
          type="number"
          value={montant}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setMontant(e.target.value)}
          placeholder="Ex: 10000"
        />
        <Select
          label="Type / Origine"
          value={type}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setType(e.target.value)}
          options={[
            { value: 'depot_manuel', label: 'Dépôt manuel' },
            { value: 'bonus_commercial', label: 'Bonus commercial' },
            { value: 'compensation', label: 'Compensation' },
            { value: 'promotion', label: 'Promotion' },
            { value: 'correction', label: 'Correction' },
          ]}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: 'var(--text-body)' }}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Motif du rechargement"
            rows={3}
            style={{
              resize: 'vertical',
              padding: '12px 14px',
              background: 'var(--surface-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
              fontSize: 15,
              lineHeight: 1.5,
              color: 'var(--text-strong)',
              outline: 'none',
            }}
          />
        </div>
        {error && <Toast tone="error" title="Erreur" message={error} onClose={() => setError(null)} />}
        {mutation.isError && !error && (
          <Toast tone="error" title="Erreur" message={(mutation.error as Error)?.message ?? 'Erreur inconnue'} />
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit} loading={mutation.isPending}>Recharger</Button>
        </div>
      </div>
    </Dialog>
  )
}

function DebitDialog({ userId, open, onClose }: { userId: string; open: boolean; onClose: () => void }) {
  const [montant, setMontant] = useState('')
  const [raison, setRaison] = useState('correction')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const mutation = useDebitWallet(userId)

  const handleSubmit = async () => {
    setError(null)
    const amount = Number(montant)
    if (!amount || amount <= 0) {
      setError('Montant invalide')
      return
    }
    try {
      await mutation.mutateAsync({ amount, origin: raison, description })
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors du débit')
    }
  }

  return (
    <Dialog open={open} title="Débiter le wallet" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
        <Input
          label="Montant (FCFA)"
          type="number"
          value={montant}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setMontant(e.target.value)}
          placeholder="Ex: 5000"
        />
        <Select
          label="Raison"
          value={raison}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setRaison(e.target.value)}
          options={[
            { value: 'correction', label: 'Correction' },
            { value: 'fraude', label: 'Fraude' },
            { value: 'erreur', label: 'Erreur' },
            { value: 'penalite', label: 'Pénalité' },
            { value: 'ajustement', label: 'Ajustement' },
          ]}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: 'var(--text-body)' }}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Motif du débit"
            rows={3}
            style={{
              resize: 'vertical',
              padding: '12px 14px',
              background: 'var(--surface-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
              fontSize: 15,
              lineHeight: 1.5,
              color: 'var(--text-strong)',
              outline: 'none',
            }}
          />
        </div>
        {error && <Toast tone="error" title="Erreur" message={error} onClose={() => setError(null)} />}
        {mutation.isError && !error && (
          <Toast tone="error" title="Erreur" message={(mutation.error as Error)?.message ?? 'Erreur inconnue'} />
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button variant="danger" onClick={handleSubmit} loading={mutation.isPending}>Débiter</Button>
        </div>
      </div>
    </Dialog>
  )
}

function WalletList() {
  const [search, setSearch] = useState('')
  const [garage, setGarage] = useState('')
  const [region, setRegion] = useState('')
  const [status, setStatus] = useState('')
  const [soldeFilter, setSoldeFilter] = useState('')
  const [minBalance, setMinBalance] = useState('')
  const [maxBalance, setMaxBalance] = useState('')

  const params: ListParams = {}
  if (search) params.search = search
  if (status) params.status = status
  if (garage) params.garage = garage
  if (region) params.region = region
  if (soldeFilter) params.balance = soldeFilter
  if (minBalance) params.minBalance = Number(minBalance)
  if (maxBalance) params.maxBalance = Number(maxBalance)

  const query = useWallets(params)
  const wallets = query.data?.wallets ?? []

  const totalWallets = wallets.length
  const totalSolde = wallets.reduce((s, w) => s + (w.balance ?? 0), 0)
  const faibles = wallets.filter((w) => (w.balance ?? 0) < 500).length
  const inactifs = wallets.filter((w) => !w.lastActivityAt).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '14px 18px',
          background: 'var(--surface-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          fontSize: 13,
          color: 'var(--text-muted)',
          flexWrap: 'wrap',
        }}
      >
        <strong style={{ color: 'var(--text-strong)', fontSize: 14 }}>Total: {totalWallets}</strong>
        <span>Solde total: <strong style={{ color: 'var(--text-strong)' }}>{formatFcfa(totalSolde)}</strong></span>
        <span>Faibles: <strong style={{ color: 'var(--red-500)' }}>{faibles}</strong></span>
        <span>Inactifs: <strong style={{ color: 'var(--text-strong)' }}>{inactifs}</strong></span>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Input
          icon="search"
          placeholder="Rechercher chauffeur, téléphone..."
          value={search}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 220 }}
        />
        <Select
          icon="garage"
          placeholder="Garage"
          value={garage}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setGarage(e.target.value)}
          options={[{ value: '', label: 'Tous les garages' }]}
          style={{ minWidth: 170 }}
        />
        <Select
          icon="map"
          placeholder="Région"
          value={region}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setRegion(e.target.value)}
          options={[{ value: '', label: 'Toutes les régions' }]}
          style={{ minWidth: 170 }}
        />
        <Select
          value={status}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value)}
          options={STATUS_OPTIONS}
          style={{ minWidth: 140 }}
        />
        <Select
          value={soldeFilter}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setSoldeFilter(e.target.value)}
          options={SOLDE_OPTIONS}
          style={{ minWidth: 150 }}
        />
        <Input
          type="number"
          placeholder="Solde min"
          value={minBalance}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setMinBalance(e.target.value)}
          style={{ width: 110 }}
        />
        <Input
          type="number"
          placeholder="Solde max"
          value={maxBalance}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setMaxBalance(e.target.value)}
          style={{ width: 110 }}
        />
      </div>

      <Panel title={`Wallets · ${query.data?.pagination?.total ?? wallets.length}`} flush>
        <div className="pc-table-scroll">
          <div style={{ minWidth: 1100 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: WALLET_GRID,
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
              <span>Chauffeur</span>
              <span>Téléphone</span>
              <span>Garage</span>
              <span>Région</span>
              <span>Solde</span>
              <span>Total rechargé</span>
              <span>Total consommé</span>
              <span>Dernière recharge</span>
              <span>Statut</span>
            </div>

            <QueryState
              isLoading={query.isLoading}
              isError={query.isError}
              error={query.error}
              isEmpty={wallets.length === 0}
              emptyTitle="Aucun wallet"
              emptyMessage="Aucun wallet ne correspond à ces filtres."
              onRetry={() => query.refetch()}
            >
              {wallets.map((w) => (
                <WalletRow key={w.id} wallet={w} />
              ))}
            </QueryState>
          </div>
        </div>
      </Panel>
    </div>
  )
}

function WalletRow({ wallet: w }: { wallet: Wallet }) {
  const drv = w.driver
  const st = w.status === 'active'
  return (
    <a
      href={`#/super-admin/wallets?userId=${w.id}`}
      style={{ display: 'grid', gridTemplateColumns: WALLET_GRID, alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid var(--slate-100)', cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}
    >
      <span style={{ ...cell, gap: 8 }}>
        <Avatar name={drv?.fullName ?? 'Inconnu'} src={drv?.profilePhoto ?? undefined} size="xs" />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {drv?.fullName ?? '—'}
        </span>
      </span>
      <span style={{ ...cell, fontSize: 12.5, color: 'var(--text-body)' }}>{drv?.phone ?? '—'}</span>
      <span style={{ ...cell, fontSize: 12.5, color: 'var(--text-body)' }}>{drv?.garageName ?? '—'}</span>
      <span style={{ ...cell, fontSize: 12.5, color: 'var(--text-body)' }}>{drv?.region ?? '—'}</span>
      <span style={{ ...cell, fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12.5, color: 'var(--teal-600)' }}>{formatFcfa(w.balance)}</span>
      <span style={{ ...cell, fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--text-body)' }}>{formatFcfa(w.totalDeposited)}</span>
      <span style={{ ...cell, fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--text-body)' }}>{formatFcfa(w.totalSpent)}</span>
      <span style={{ ...cell, fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(w.lastDepositAt)}</span>
      <span style={cell}>
        <Badge tone={st ? 'green' : 'amber'}>{st ? 'Actif' : 'Suspendu'}</Badge>
      </span>
    </a>
  )
}

function WalletDetail({ userId, onBack }: { userId: string; onBack: () => void }) {
  const wallet = useWallet(userId)
  const [txType, setTxType] = useState('')
  const [showRecharge, setShowRecharge] = useState(false)
  const [showDebit, setShowDebit] = useState(false)

  const txParams: ListParams = {}
  if (txType) txParams.type = txType

  const txQuery = useWalletTransactions(userId, txParams)
  const transactions = txQuery.data?.transactions ?? []
  const w = wallet.data

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Button variant="ghost" icon="arrow_back" onClick={onBack} style={{ alignSelf: 'flex-start' }}>
        Retour
      </Button>

      <QueryState
        isLoading={wallet.isLoading}
        isError={wallet.isError}
        error={wallet.error}
        isEmpty={!w}
        emptyTitle="Wallet introuvable"
        emptyMessage="Impossible de charger ce wallet."
        onRetry={() => wallet.refetch()}
      >
        {w && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Avatar name={w.driver?.fullName ?? 'Inconnu'} src={w.driver?.profilePhoto ?? undefined} size="lg" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--text-strong)' }}>
                  {w.driver?.fullName ?? 'Inconnu'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                  {w.driver?.phone ?? '—'} · {w.driver?.garageName ?? '—'} · {w.driver?.region ?? '—'}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
              <StatBox icon="account_balance_wallet" tone="teal" value={formatFcfa(w.balance)} label="Solde actuel" />
              <StatBox icon="trending_up" tone="green" value={formatFcfa(w.totalDeposited)} label="Total rechargé" />
              <StatBox icon="trending_down" tone="red" value={formatFcfa(w.totalSpent)} label="Total consommé" />
              <StatBox icon="percent" tone="amber" value={w.commissionCount ?? '—'} label="Commissions" />
              <StatBox icon="add_card" tone="primary" value={w.depositCount ?? '—'} label="Recharges" />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <Button icon="add_card" onClick={() => setShowRecharge(true)}>Recharger</Button>
              <Button icon="remove" variant="danger" onClick={() => setShowDebit(true)}>Débiter</Button>
              <Button variant="secondary" icon="history">Historique</Button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Filtrer par type
              </span>
              <Select
                value={txType}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setTxType(e.target.value)}
                options={TX_TYPE_OPTIONS}
                style={{ minWidth: 160 }}
              />
            </div>

            <Panel title={`Transactions · ${txQuery.data?.pagination?.total ?? transactions.length}`} flush>
              <div className="pc-table-scroll">
                <div style={{ minWidth: 820 }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: TX_GRID,
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
                    <span>Description</span>
                    <span>Solde avant</span>
                    <span>Solde après</span>
                    <span>Admin</span>
                  </div>

                  <QueryState
                    isLoading={txQuery.isLoading}
                    isError={txQuery.isError}
                    error={txQuery.error}
                    isEmpty={transactions.length === 0}
                    emptyTitle="Aucune transaction"
                    emptyMessage="Aucune transaction trouvée."
                    onRetry={() => txQuery.refetch()}
                  >
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: TX_GRID,
                          alignItems: 'center',
                          padding: '12px 18px',
                          borderBottom: '1px solid var(--slate-100)',
                        }}
                      >
                        <span style={{ ...cell, flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-body)' }}>{formatDate(tx.createdAt)}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
                            {tx.createdAt ? new Date(tx.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </span>
                        </span>
                        <span style={cell}>
                          <Badge tone={txBadgeTone(tx.type)}>{tx.type}</Badge>
                        </span>
                        <span style={{
                          ...cell,
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          fontSize: 12.5,
                          color: tx.amount >= 0 ? 'var(--green-600)' : 'var(--red-500)',
                        }}>
                          {tx.amount >= 0 ? '+' : ''}{formatFcfa(tx.amount)}
                        </span>
                        <span style={{ ...cell, fontSize: 12.5, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tx.description ?? '—'}
                        </span>
                        <span style={{ ...cell, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-body)' }}>
                          {formatFcfa(tx.balanceBefore)}
                        </span>
                        <span style={{ ...cell, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-body)' }}>
                          {formatFcfa(tx.balanceAfter)}
                        </span>
                        <span style={{ ...cell, fontSize: 12.5, color: 'var(--text-body)' }}>
                          {tx.admin?.fullName ?? tx.performedBy ?? '—'}
                        </span>
                      </div>
                    ))}
                  </QueryState>
                </div>
              </div>
            </Panel>

            <RechargeDialog userId={userId} open={showRecharge} onClose={() => setShowRecharge(false)} />
            <DebitDialog userId={userId} open={showDebit} onClose={() => setShowDebit(false)} />
          </>
        )}
      </QueryState>
    </div>
  )
}

export function WalletsPage() {
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.hash.split('?')[1] ?? '') : null
  const initialUserId = searchParams?.get('userId') ?? undefined
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(initialUserId)

  if (selectedUserId) {
    return <WalletDetail userId={selectedUserId} onBack={() => setSelectedUserId(undefined)} />
  }

  return <WalletList />
}
