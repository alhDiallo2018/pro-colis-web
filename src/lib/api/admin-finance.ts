import { api } from './client'
import type { ListParams, Pagination, User } from './types'

// --- Finance ---

export interface Wallet {
  id: string
  driver?: User | null
  balance: number
  totalDeposited: number
  totalSpent: number
  totalRefunded: number
  status: 'active' | 'suspended'
  lastDepositAt?: string | null
  lastActivityAt?: string | null
  transactionCount?: number
  commissionCount?: number
  depositCount?: number
  createdAt?: string
  updatedAt?: string
}

export interface WalletTransaction {
  id: string
  type: string
  amount: number
  balanceBefore: number
  balanceAfter: number
  parcelId?: string | null
  description?: string | null
  origin?: string | null
  status: string
  performedBy?: string | null
  admin?: { fullName: string } | null
  createdAt?: string
}

export interface FinanceDashboard {
  totalWallets: number
  totalBalance: number
  totalDeposited: number
  totalSpent: number
  commissionsMonth: number
  depositsMonth: number
  walletsLow: number
  walletsInactive: number
}

export interface CommissionConfig {
  id: string
  profile: 'local' | 'regional' | 'express' | 'international'
  percentage: number
  minAmount: number
  maxAmount: number
  isActive: boolean
  effectiveFrom: string
  createdAt?: string
  updatedAt?: string
}

export interface CommissionSimulation {
  profile: string
  percentage: number
  minAmount: number
  maxAmount: number
  amount: number
  commission: number
}

export interface AdminPayment {
  id: string
  amount: number
  currency?: string
  method?: string
  status: string
  transactionId?: string
  phoneNumber?: string | null
  reference?: string
  user?: { id?: string; fullName?: string; phone?: string; email?: string } | null
  parcel?: { id: string; trackingNumber?: string } | null
  completedAt?: string | null
  createdAt?: string
}

export interface WalletList {
  wallets: Wallet[]
  pagination?: Pagination
}

export interface TransactionList {
  transactions: WalletTransaction[]
  pagination?: Pagination
}

/** Dashboard financier */
export async function financeDashboard(): Promise<FinanceDashboard> {
  const { data } = await api.get('/super-admin/finance/dashboard')
  return data.dashboard ?? data.data
}

/** Liste des wallets */
export async function listWallets(params: ListParams = {}): Promise<WalletList> {
  const { data } = await api.get('/super-admin/wallets', { params })
  return { wallets: data.wallets ?? data.data ?? [], pagination: data.pagination }
}

/** Détail d'un wallet */
export async function getWallet(userId: string): Promise<Wallet> {
  const { data } = await api.get(`/super-admin/wallets/${userId}`)
  return data.wallet ?? data.data
}

/** Transactions d'un wallet */
export async function walletTransactions(userId: string, params: ListParams = {}): Promise<TransactionList> {
  const { data } = await api.get(`/super-admin/wallets/${userId}/transactions`, { params })
  return { transactions: data.transactions ?? data.data ?? [], pagination: data.pagination }
}

/** Recharger un wallet */
export async function rechargeWallet(userId: string, payload: {
  amount: number
  type?: string
  description?: string
  parcelId?: string
  origin?: string
}): Promise<{ wallet: Wallet; transaction: WalletTransaction }> {
  // Le contrôleur API actuel lit encore userId dans le corps malgré le paramètre de route.
  // L'envoyer aux deux endroits garde le client compatible sans changer l'URL canonique.
  const { data } = await api.post(`/super-admin/wallets/${userId}/recharge`, { userId, ...payload })
  return { wallet: data.wallet, transaction: data.transaction }
}

/** Débiter un wallet */
export async function debitWallet(userId: string, payload: {
  amount: number
  type?: string
  description?: string
  parcelId?: string
  origin?: string
}): Promise<{ wallet: Wallet; transaction: WalletTransaction }> {
  // Même compatibilité temporaire que pour la recharge (voir commentaire ci-dessus).
  const { data } = await api.post(`/super-admin/wallets/${userId}/debit`, { userId, ...payload })
  return { wallet: data.wallet, transaction: data.transaction }
}

/** Configuration des commissions */
export async function getCommissionConfig(): Promise<CommissionConfig[]> {
  const { data } = await api.get('/super-admin/commissions/config')
  return data.configs ?? data.data ?? []
}

export async function updateCommissionConfig(payload: {
  profile: string
  percentage?: number
  minAmount?: number
  maxAmount?: number
  isActive?: boolean
  effectiveFrom?: string
}): Promise<CommissionConfig> {
  const { data } = await api.put('/super-admin/commissions/config', payload)
  return data.config ?? data.data
}

/** Simulateur de commission */
export async function simulateCommission(amount: number): Promise<CommissionSimulation[]> {
  const { data } = await api.post('/super-admin/commissions/simulate', { amount })
  return data.simulations ?? data.data ?? []
}

/** Paiements */
export async function listPayments(params: ListParams = {}): Promise<{ payments: AdminPayment[]; pagination?: Pagination }> {
  const { data } = await api.get('/super-admin/payments', { params })
  return { payments: data.payments ?? data.data ?? [], pagination: data.pagination }
}

export async function getPayment(paymentId: string): Promise<AdminPayment> {
  const { data } = await api.get(`/super-admin/payments/${paymentId}`)
  return data.payment ?? data.data
}
