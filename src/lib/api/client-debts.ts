import { api, ApiError } from './client'
import type { ClientPenaltyDebt } from '@/lib/clientDebt'

export interface ClientDebt extends ClientPenaltyDebt {
  trackingNumber: string
  reason?: string | null
  createdAt: string
  settledAt?: string | null
}

export interface ClientDebtsResponse {
  debts: ClientDebt[]
  summary: { totalDebt: number; currency: string; debtLimit: number; canCreateParcel: boolean }
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export async function list(page = 1): Promise<ClientDebtsResponse> {
  const { data } = await api.get('/client/debts', { params: { page, limit: 20 } })
  // Une réponse ancienne/incomplète n'est pas un solde nul : montrer l'erreur
  // permet de réessayer sans annoncer à tort que le compte est à jour.
  if (!Array.isArray(data.debts) || typeof data.summary?.totalDebt !== 'number' ||
      !Number.isFinite(data.summary.totalDebt) || data.summary.totalDebt < 0 ||
      typeof data.pagination?.totalPages !== 'number') {
    throw new ApiError('Impossible de lire vos dettes. Veuillez réessayer.', 'INVALID_RESPONSE')
  }
  return data
}
