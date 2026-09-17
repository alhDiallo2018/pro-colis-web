import { ApiError } from '@/lib/api/client'
import { formatFcfa } from '@/lib/format'

/** Code stable renvoyé par l'API quand une acceptation est refusée pour dette. */
export const COMMISSION_DEBT_CODE = 'COMMISSION_DEBT_REQUIRED'

/** Code stable renvoyé par l'API quand une nouvelle dette dépasserait le plafond. */
export const DEBT_LIMIT_EXCEEDED_CODE = 'DEBT_LIMIT_EXCEEDED'

/** L'API a refusé l'opération car une dette de commission est impayée. */
export function isCommissionDebtError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.code === COMMISSION_DEBT_CODE
}

/** L'API a refusé la création d'une nouvelle dette car le plafond serait dépassé. */
export function isDebtLimitExceededError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.code === DEBT_LIMIT_EXCEEDED_CODE
}

/** Message utilisateur lors d'une tentative d'acceptation bloquée par une dette. */
export function commissionDebtMessage(amount: number): string {
  return `Vous avez une dette de commission de ${formatFcfa(amount)}. Veuillez la régler avant d'accepter un nouveau colis.`
}

/**
 * Message utilisateur lors d'un refus pour dépassement du plafond de dette.
 * Le montant n'est pas inventé : seul le Backend connaît la limite exacte.
 */
export function debtLimitExceededMessage(): string {
  return 'Cette nouvelle livraison dépasserait votre limite de dette autorisée. Réglez une partie de votre dette avant de l\'accepter.'
}

/** Message utilisateur affiché quand une dette a été partiellement réglée. */
export function remainingDebtMessage(amount: number): string {
  return `Il reste ${formatFcfa(amount)} de dette de commission. Les nouvelles acceptations restent bloquées.`
}
