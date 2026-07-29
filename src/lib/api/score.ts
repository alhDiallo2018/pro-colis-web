import { api } from './client'

export interface ScoreBalance {
  balance: number
}

/** Solde de points du wallet de l'utilisateur courant. */
export async function getBalance(): Promise<number> {
  const { data } = await api.get('/score/balance')
  return data.balance ?? data.score ?? data.data?.balance ?? 0
}

export interface ScoreTransaction {
  id: string
  amount: number
  type: string
  description?: string | null
  status?: string
  parcelId?: string | null
  timestamp?: string
  createdAt?: string
}

/** Historique des mouvements de points. */
export async function history(): Promise<ScoreTransaction[]> {
  const { data } = await api.get('/score/history')
  return data.transactions ?? data.history ?? data.data ?? []
}

export interface PurchasePayload {
  points: number
  method?: string
  phoneNumber?: string
}

export interface PurchaseResult {
  payment?: { id: string; amount: number; method: string; status: string; reference: string }
  transaction: { id: string; amount: number; type: string; description: string }
}

export async function purchase(payload: PurchasePayload): Promise<PurchaseResult> {
  const { data } = await api.post('/score/purchase', {
    points: payload.points,
    method: payload.method || 'cash',
    phoneNumber: payload.phoneNumber,
  })
  return data
}

export async function purchaseWithWallet(points: number): Promise<PurchaseResult> {
  const { data } = await api.post('/score/purchase/wallet', { points })
  return data
}

export interface DriverWallet {
  userId?: string
  balance: number
  pendingBalance?: number
  totalEarned?: number
  totalWithdrawn?: number
  totalCommissionsPaid?: number
  totalDeposited: number
  totalSpent: number
  status: string
}

export async function getWallet(): Promise<DriverWallet> {
  const { data } = await api.get('/driver/wallet')
  const w = data.wallet ?? data.data ?? data
  return { ...w, balance: w.balance ?? w.availableBalance ?? 0 }
}
