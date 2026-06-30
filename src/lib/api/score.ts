import { api } from './client'

export interface ScoreBalance {
  balance: number
}

/** Solde de points du wallet de l'utilisateur courant. */
export async function getBalance(): Promise<number> {
  const { data } = await api.get('/score/balance')
  // The API may expose the value under `balance`, `score`, or `data`.
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
