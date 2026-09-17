export interface CommissionConfig {
  percentage: number
  minAmount: number
  maxAmount: number
}

/** Calcule la commission à partir d'une configuration explicite. Aucune valeur
 *  par défaut n'est codée en dur : l'appelant fournit la configuration issue
 *  de `/public/config` ou de `/commissions/estimate`. */
export function calculateCommission(amount: number, config: CommissionConfig): {
  commission: number
  netAmount: number
  percentage: number
  minAmount: number
  maxAmount: number
} {
  const pct = config.percentage
  const min = config.minAmount
  const max = config.maxAmount

  const raw = amount * (pct / 100)
  const commission = Math.min(max, Math.max(min, raw))

  return {
    commission: Math.round(commission),
    netAmount: amount - Math.round(commission),
    percentage: pct,
    minAmount: min,
    maxAmount: max,
  }
}

export function requiresBothWalletAndPoints(
  walletBalance: number,
  scoreBalance: number,
  commission: number,
): boolean {
  return walletBalance < commission && (walletBalance + scoreBalance) >= commission
}

export function splitCommissionPayment(
  walletBalance: number,
  scoreBalance: number,
  commission: number,
): { fromWallet: number; fromPoints: number } {
  const fromWallet = Math.min(walletBalance, commission)
  const remaining = commission - fromWallet
  const fromPoints = Math.min(scoreBalance, remaining)
  return { fromWallet, fromPoints }
}

export function canPayCommission(
  walletBalance: number,
  scoreBalance: number,
  commission: number,
): boolean {
  return walletBalance + scoreBalance >= commission
}

/**
 * Un solde de points couvre-t-il une commission en FCFA ? Le taux de conversion
 * provient exclusivement du backend (`score.cfaPerPoint`) : aucune hypothèse
 * « 1 point = 1 FCFA » n'est codée ici. `scoreBalance` est entier, donc
 * `scoreBalance * cfaPerPoint >= commission` équivaut à la règle serveur
 * `scoreBalance >= ceil(commission / cfaPerPoint)`.
 */
export function pointsCoverCommission(
  scoreBalance: number,
  cfaPerPoint: number,
  commission: number,
): boolean {
  return scoreBalance * cfaPerPoint >= commission
}
