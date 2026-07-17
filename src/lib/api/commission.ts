import { api } from './client'
import type { Parcel } from './types'

export interface CommissionEstimate {
  amount: number
  commission: number
  netAmount: number
  percentage: number
  minAmount: number
  maxAmount: number
  profile: string
}

export interface PayCashCommissionResult {
  success: boolean
  message: string
  commission: number
  newWalletBalance?: number
  newScoreBalance?: number
  transaction?: { id: string; type: string; amount: number }
}

/** Estimer la commission pour un montant de livraison. */
export async function estimate(amount: number): Promise<CommissionEstimate> {
  const { data } = await api.post('/super-admin/commissions/simulate', { amount })
  const simulations = (data.simulations ?? data.data) as CommissionEstimate[]
  return simulations?.[0] ?? {
    amount,
    commission: Math.min(Math.max(amount * 0.05, 100), 500),
    netAmount: amount - Math.min(Math.max(amount * 0.05, 100), 500),
    percentage: 5,
    minAmount: 100,
    maxAmount: 500,
    profile: 'local',
  }
}

/** Estimer la commission pour un colis spécifique. */
export async function estimateForParcel(parcelId: string): Promise<CommissionEstimate> {
  const { data } = await api.get(`/driver/parcels/${parcelId}/commission`)
  return data.commission ?? data.data
}

/**
 * Pour un colis payé en cash : le chauffeur paie la commission depuis son wallet ou ses points.
 * @param parcelId - ID du colis livré
 * @param source - 'wallet' (portefeuille FCFA) ou 'score' (points)
 * @param amount - Montant de la livraison pour calculer la commission
 */
export async function payCashCommission(
  parcelId: string,
  source: 'wallet' | 'score',
  amount?: number
): Promise<PayCashCommissionResult> {
  const { data } = await api.post(`/driver/parcels/${parcelId}/pay-commission`, {
    source,
    ...(amount != null ? { amount } : {}),
  })
  return data.result ?? data
}
