import { api } from './client'

export interface Payment {
  id: string
  parcelId?: string | null
  trackingNumber?: string | null
  amount: number
  currency?: string
  method?: string | null
  status: string
  createdAt?: string
  completedAt?: string | null
}

/** Historique des paiements de l'utilisateur courant. */
export async function history(): Promise<Payment[]> {
  const { data } = await api.get('/payments/history')
  return data.payments ?? data.data ?? []
}
