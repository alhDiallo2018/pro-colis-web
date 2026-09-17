import { ApiError } from '@/lib/api/client'
import type { CancellationOutcome, CancellationResponsibility, RefundStatus } from '@/lib/api/types'

/**
 * Aides d'affichage pour le système d'annulation. Aucune règle financière ni
 * aucun montant n'est codé ici : ces fonctions ne font que mapper des codes
 * d'erreur / états renvoyés par l'API vers des libellés français.
 */

/** L'API a refusé car le colis est déjà annulé. */
export const CANCELLATION_ALREADY_CANCELLED = 'PARCEL_ALREADY_CANCELLED'
/** L'API a refusé car le statut ne permet plus l'annulation. */
export const CANCELLATION_NOT_ALLOWED = 'CANCELLATION_NOT_ALLOWED'
/** L'API a refusé car le délai d'annulation est expiré. */
export const CANCELLATION_EXPIRED = 'CANCELLATION_EXPIRED'
/** L'API a refusé car le motif est absent ou ne correspond à aucun motif configuré. */
export const CANCELLATION_REASON_REQUIRED = 'CANCELLATION_REASON_REQUIRED'

export function isAlreadyCancelled(error: unknown): error is ApiError {
  return error instanceof ApiError && error.code === CANCELLATION_ALREADY_CANCELLED
}

export function isCancellationNotAllowed(error: unknown): error is ApiError {
  return error instanceof ApiError && error.code === CANCELLATION_NOT_ALLOWED
}

export function isCancellationExpired(error: unknown): error is ApiError {
  return error instanceof ApiError && error.code === CANCELLATION_EXPIRED
}

/** Libellé français de la responsabilité d'annulation. */
export function responsibilityLabel(responsibility: CancellationResponsibility | null | undefined): string {
  switch (responsibility) {
    case 'client':
      return 'Client responsable'
    case 'driver':
      return 'Chauffeur responsable'
    case 'shared':
      return 'Responsabilité partagée'
    case 'exempt':
      return 'Exonéré'
    default:
      return 'Non déterminé'
  }
}

/** Libellé français du statut de remboursement. */
export function refundStatusLabel(status: RefundStatus | null | undefined): string {
  switch (status) {
    case 'pending':
      return 'Remboursement en attente'
    case 'processing':
      return 'Remboursement en cours'
    case 'completed':
      return 'Remboursement terminé'
    case 'failed':
      return 'Remboursement échoué'
    case 'none':
      return 'Aucun remboursement'
    default:
      return 'Statut inconnu'
  }
}

/** L'issue expose-t-elle une pénalité ? (décidé par le backend) */
export function hasPenalty(outcome: CancellationOutcome | null | undefined): boolean {
  return outcome?.penalized === true && !outcome?.exempt
}

/** L'issue expose-t-elle un remboursement ? */
export function hasRefund(outcome: CancellationOutcome | null | undefined): boolean {
  return outcome?.refund != null
}

/**
 * Message utilisateur d'une erreur d'annulation. On n'invente jamais un code
 * d'erreur ni un montant : on traduit les codes stables connus et on laisse le
 * message de l'API pour le reste (déjà rédigé côté serveur).
 */
export function cancellationErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "L'annulation n'a pas pu aboutir. Veuillez réessayer."
  }
  switch (error.code) {
    case CANCELLATION_ALREADY_CANCELLED:
      return 'Ce colis a déjà été annulé.'
    case CANCELLATION_NOT_ALLOWED:
      return "Ce colis ne peut plus être annulé à ce stade."
    case CANCELLATION_EXPIRED:
      return "Le délai d'annulation est expiré."
    case CANCELLATION_REASON_REQUIRED:
      return 'Veuillez sélectionner un motif d’annulation valide.'
    default:
      return error.message || "L'annulation n'a pas pu aboutir."
  }
}
