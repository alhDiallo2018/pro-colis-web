import { api } from './client'

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
  /** Montant non couvert, enregistré en dette (`commission_debt`) quand la
   *  politique configurée l'autorise. 0 = commission entièrement réglée. */
  debt?: number
  /** Dette de commission cumulée sur le portefeuille, en FCFA. */
  commissionDebt?: number
  transaction?: { id: string; type: string; amount: number }
}

/** Estimer la commission pour un montant. La commission provient exclusivement
 *  de l'API (`/commissions/estimate`) : aucune valeur par défaut locale. En cas
 *  d'échec réseau, l'erreur est propagée à l'appelant (useQuery la gère). */
export async function estimate(amount: number): Promise<CommissionEstimate> {
  const { data } = await api.post('/commissions/estimate', { amount })
  const result = data.commission ?? data.data ?? data
  return {
    amount,
    commission: result.commission,
    netAmount: result.netAmount ?? amount - result.commission,
    percentage: result.percentage ?? 0,
    minAmount: result.minAmount ?? 0,
    maxAmount: result.maxAmount ?? 0,
    profile: result.profile ?? data.profile ?? 'local',
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

export interface PayDebtResult {
  /** Montant réellement réglé sur cette opération (FCFA). */
  debtRepaid: number
  /** Dette restante après l'opération (FCFA). */
  remainingDebt: number
  /** Dette de commission cumulée sur le portefeuille (FCFA). */
  commissionDebt: number
  /** Seuil de blocage actuellement configuré (0 désactive le blocage). */
  debtLimit: number
  /** Nouveau solde wallet après règlement (FCFA). */
  balance: number
  /** État métier renvoyé par l'API après règlement. */
  canAcceptNewDeliveries: boolean
}

/**
 * Règle tout ou partie de la dette de commission avec le solde wallet existant.
 * `amount` est le montant demandé en FCFA ; `amount <= 0` signifie « régler tout
 * ce que le solde permet ». L'API borne elle-même le montant par le solde et la
 * dette restante : le Web ne recalcule jamais la règle métier.
 */
export async function payWalletDebt(amount: number): Promise<PayDebtResult> {
  const { data } = await api.post('/driver/wallet/pay-debt', { amount })
  return data.data ?? data
}
