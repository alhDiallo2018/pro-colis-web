import { ApiError } from '@/lib/api/client'

export const CLIENT_DEBT_LIMIT_CODE = 'CANCELLATION_DEBT_LIMIT_EXCEEDED'

export interface ClientPenaltyDebt {
  id: string
  parcelId: string
  amount: number
  remaining: number
  status: string
  reference?: string
}

export interface ClientDebtBlock {
  debtAmount: number
  debtLimit: number
  debts: ClientPenaltyDebt[]
}

/**
 * Extrait le contrat structuré de l'erreur sans faire confiance à des données
 * réseau non typées. Une réponse ancienne ou incomplète retombe sur `null` et
 * conserve ainsi le message API générique.
 */
export function getClientDebtBlock(error: unknown): ClientDebtBlock | null {
  if (!(error instanceof ApiError) || error.code !== CLIENT_DEBT_LIMIT_CODE) return null

  const detail = error.details.find((entry) => {
    if (!entry || typeof entry !== 'object') return false
    return 'debtAmount' in entry && 'debtLimit' in entry && 'debts' in entry
  }) as Record<string, unknown> | undefined
  if (!detail) return null

  const debtAmount = Number(detail.debtAmount)
  const debtLimit = Number(detail.debtLimit)
  if (!Number.isFinite(debtAmount) || !Number.isFinite(debtLimit) || !Array.isArray(detail.debts)) return null

  const debts = detail.debts.flatMap((entry): ClientPenaltyDebt[] => {
    if (!entry || typeof entry !== 'object') return []
    const debt = entry as Record<string, unknown>
    const id = typeof debt.id === 'string' ? debt.id : ''
    const parcelId = typeof debt.parcelId === 'string' ? debt.parcelId : ''
    const amount = Number(debt.amount)
    const remaining = Number(debt.remaining)
    if (!id || !Number.isFinite(amount) || !Number.isFinite(remaining)) return []
    return [{
      id,
      parcelId,
      amount,
      remaining,
      status: typeof debt.status === 'string' ? debt.status : 'pending',
      reference: typeof debt.reference === 'string' ? debt.reference : undefined,
    }]
  })

  return { debtAmount, debtLimit, debts }
}
