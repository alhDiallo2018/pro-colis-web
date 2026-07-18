export interface CommissionConfig {
  percentage: number
  minAmount: number
  maxAmount: number
}

const DEFAULT_CONFIG: CommissionConfig = {
  percentage: 5,
  minAmount: 100,
  maxAmount: 500,
}

export function calculateCommission(amount: number, config: Partial<CommissionConfig> = {}): {
  commission: number
  netAmount: number
  percentage: number
  minAmount: number
  maxAmount: number
} {
  const pct = config.percentage ?? DEFAULT_CONFIG.percentage
  const min = config.minAmount ?? DEFAULT_CONFIG.minAmount
  const max = config.maxAmount ?? DEFAULT_CONFIG.maxAmount

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
