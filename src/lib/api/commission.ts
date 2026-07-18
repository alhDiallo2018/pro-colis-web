import { api } from './client'
import { calculateCommission } from '@/lib/commission'

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
  walletDebited?: number
  pointsDebited?: number
  newWalletBalance?: number
  newScoreBalance?: number
  debt?: { id: string; amount: number; status: string } | null
  transaction?: { id: string; type: string; amount: number }
}

/** Estimer la commission pour un montant (endpoint public preferé,
 *  avec fallback local si l'API n'est pas encore disponible). */
export async function estimate(amount: number): Promise<CommissionEstimate> {
  try {
    const { data } = await api.post('/commissions/estimate', { amount })
    const result = data.commission ?? data.data ?? data
    return {
      amount,
      commission: result.commission,
      netAmount: result.netAmount ?? amount - result.commission,
      percentage: result.percentage ?? data.percentage ?? 5,
      minAmount: result.minAmount ?? data.minAmount ?? 100,
      maxAmount: result.maxAmount ?? data.maxAmount ?? 500,
      profile: result.profile ?? data.profile ?? 'local',
    }
  } catch {
    // fallback local
    const r = calculateCommission(amount)
    return { amount, ...r, profile: 'local' }
  }
}

/** Estimer la commission pour un colis spécifique. */
export async function estimateForParcel(parcelId: string): Promise<CommissionEstimate> {
  const { data } = await api.get(`/driver/parcels/${parcelId}/commission`)
  const c = data.commission ?? data.data
  return { ...c, amount: c.amount ?? c.deliveryAmount ?? 0 }
}

/**
 * Payer la commission pour un colis payé en cash.
 * @param parcelId - ID du colis livré
 * @param source - 'wallet' (FCFA), 'score' (points), ou 'auto' (wallet puis score puis combiné)
 * @param amount - Montant de la livraison pour calculer la commission
 */
export async function payCashCommission(
  parcelId: string,
  source: 'wallet' | 'score' | 'auto' = 'auto',
  amount?: number
): Promise<PayCashCommissionResult> {
  const { data } = await api.post(`/driver/parcels/${parcelId}/pay-commission`, {
    source,
    ...(amount != null ? { amount } : {}),
  })
  return data.result ?? data
}
