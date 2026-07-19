import { api } from './client'
import type { ListParams, Pagination } from './types'

// --- Reputation ---

export interface ScoreEntry {
  userId: string
  driverName?: string
  fullName?: string
  garageName?: string | null
  region?: string | null
  points: number
  totalEarned: number
  totalSpent: number
  level: string
  rating?: number | null
  totalDeliveries?: number
  lastUpdated?: string
}

export interface ScoreDetail extends ScoreEntry {
  transactions?: ScoreTransaction[]
}

export interface ScoreTransaction {
  id: string
  amount: number
  type: string
  description: string
  parcelId?: string | null
  status: string
  source?: string | null
  grantedBy?: { id: string; fullName: string } | null
  motif?: string | null
  balanceBefore?: number
  balanceAfter?: number
  metadata?: unknown
  createdAt?: string
}

export interface DriverRanking {
  rank: number
  userId: string
  fullName: string
  profilePhoto?: string | null
  garageName?: string | null
  region?: string | null
  points: number
  level: string
  rating?: number | null
  totalDeliveries: number
  completedDeliveries?: number
  successRate?: number
  walletBalance?: number
}

export interface ReputationDashboard {
  eliteCount: number
  premiumCount: number
  standardCount: number
  newCount: number
  totalDrivers: number
  averageRating: number
}

export interface DriverDetail {
  user: {
    id: string
    fullName: string
    phone: string
    email?: string | null
    profilePhoto?: string | null
    garageName?: string | null
    region?: string | null
    rating?: number | null
    totalDeliveries?: number
    createdAt?: string
  }
  score?: {
    points: number
    totalEarned: number
    totalSpent: number
    level: string
  } | null
  wallet?: {
    balance: number
    pendingBalance?: number
    totalDeposited: number
    totalSpent: number
    totalWithdrawn?: number
    totalCommissionsPaid?: number
    status: string
  } | null
}

export interface ScoreList {
  scores: ScoreEntry[]
  pagination?: Pagination
}

export interface RankingList {
  rankings: DriverRanking[]
}

export type ScoreTransactionType =
  | 'DRIVER_RECHARGE'
  | 'COMMERCIAL_BONUS'
  | 'ADMIN_BONUS'
  | 'PERFORMANCE_REWARD'
  | 'COMPENSATION'
  | 'ADJUSTMENT'
  | 'REFUND'
  | 'COMMISSION_DEDUCTION'

export interface AddPointsPayload {
  amount: number
  description: string
  type?: ScoreTransactionType
  source?: string
  motif?: string
}

/** Dashboard réputation */
export async function reputationDashboard(): Promise<ReputationDashboard> {
  const { data } = await api.get('/super-admin/reputation/dashboard')
  return data
}

/** Liste des scores */
export async function listScores(params: ListParams = {}): Promise<ScoreList> {
  const { data } = await api.get('/super-admin/scores', { params })
  return { scores: data.scores ?? data.data ?? [], pagination: data.pagination }
}

/** Détail d'un score */
export async function getScore(userId: string): Promise<ScoreDetail> {
  const { data } = await api.get(`/super-admin/scores/${userId}`)
  return data.score ?? data.data
}

/** Historique des transactions de score */
export async function scoreHistory(userId: string, params: ListParams = {}): Promise<ScoreTransaction[]> {
  const { data } = await api.get(`/super-admin/scores/${userId}/history`, { params })
  return data.transactions ?? data.data ?? []
}

/** Ajouter des points */
export async function addPoints(userId: string, payload: AddPointsPayload): Promise<ScoreDetail> {
  const { data } = await api.post(`/super-admin/scores/${userId}/add`, payload)
  return data.score ?? data.data
}

/** Retirer des points */
export async function removePoints(userId: string, payload: { amount: number; description: string; type?: string; motif?: string }): Promise<ScoreDetail> {
  const { data } = await api.post(`/super-admin/scores/${userId}/remove`, payload)
  return data.score ?? data.data
}

/** Classement chauffeurs */
export async function driverRanking(): Promise<DriverRanking[]> {
  const { data } = await api.get('/super-admin/scores/ranking')
  return data.rankings ?? data.data ?? []
}

/** Fiche chauffeur combinée */
export async function driverDetail(userId: string): Promise<DriverDetail> {
  const { data } = await api.get(`/super-admin/drivers/${userId}`)
  return data.driver ?? data.data
}
