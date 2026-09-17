import { describe, expect, it } from 'vitest'
import { ApiError } from '@/lib/api/client'
import {
  CANCELLATION_ALREADY_CANCELLED,
  CANCELLATION_EXPIRED,
  CANCELLATION_NOT_ALLOWED,
  cancellationErrorMessage,
  hasPenalty,
  hasRefund,
  isAlreadyCancelled,
  isCancellationExpired,
  isCancellationNotAllowed,
  refundStatusLabel,
  responsibilityLabel,
} from './cancellation'
import type { CancellationOutcome } from '@/lib/api/types'

function outcome(partial: Partial<CancellationOutcome> = {}): CancellationOutcome {
  return { allowed: true, penalized: false, exempt: false, responsibility: null, ...partial }
}

describe('responsibilityLabel', () => {
  it('traduit les responsabilités connues', () => {
    expect(responsibilityLabel('client')).toBe('Client responsable')
    expect(responsibilityLabel('driver')).toBe('Chauffeur responsable')
    expect(responsibilityLabel('shared')).toBe('Responsabilité partagée')
    expect(responsibilityLabel('exempt')).toBe('Exonéré')
  })

  it('ne suppose jamais une valeur par défaut pour un statut inconnu', () => {
    expect(responsibilityLabel('custom')).toBe('Non déterminé')
    expect(responsibilityLabel(null)).toBe('Non déterminé')
  })
})

describe('refundStatusLabel', () => {
  it('traduit les statuts de remboursement', () => {
    expect(refundStatusLabel('pending')).toBe('Remboursement en attente')
    expect(refundStatusLabel('processing')).toBe('Remboursement en cours')
    expect(refundStatusLabel('completed')).toBe('Remboursement terminé')
    expect(refundStatusLabel('failed')).toBe('Remboursement échoué')
  })

  it('renvoie un libellé neutre pour un statut inconnu', () => {
    expect(refundStatusLabel('inconnu')).toBe('Statut inconnu')
    expect(refundStatusLabel(null)).toBe('Statut inconnu')
  })
})

describe('hasPenalty / hasRefund', () => {
  it('détecte une pénalité uniquement si le backend l\'indique et qu\'elle n\'est pas exonérée', () => {
    expect(hasPenalty(outcome({ penalized: true, exempt: false }))).toBe(true)
    expect(hasPenalty(outcome({ penalized: true, exempt: true }))).toBe(false)
    expect(hasPenalty(outcome({ penalized: false }))).toBe(false)
    expect(hasPenalty(null)).toBe(false)
  })

  it('détecte un remboursement exposé par l\'API', () => {
    expect(hasRefund(outcome({ refund: 0 }))).toBe(true)
    expect(hasRefund(outcome({}))).toBe(false)
    expect(hasRefund(null)).toBe(false)
  })
})

describe('isAlreadyCancelled / isCancellationNotAllowed / isCancellationExpired', () => {
  it('reconnaît les codes stables', () => {
    expect(isAlreadyCancelled(new ApiError('Déjà annulé', CANCELLATION_ALREADY_CANCELLED, 409))).toBe(true)
    expect(isCancellationNotAllowed(new ApiError('Interdit', CANCELLATION_NOT_ALLOWED, 409))).toBe(true)
    expect(isCancellationExpired(new ApiError('Expiré', CANCELLATION_EXPIRED, 409))).toBe(true)
  })

  it('ignore les autres erreurs', () => {
    expect(isAlreadyCancelled(new ApiError('boom', 'OTHER', 409))).toBe(false)
    expect(isAlreadyCancelled(new Error('boom'))).toBe(false)
  })
})

describe('cancellationErrorMessage', () => {
  it('traduit les codes sans exposer le code technique', () => {
    const err = new ApiError('Déjà annulé', CANCELLATION_ALREADY_CANCELLED, 409)
    expect(cancellationErrorMessage(err)).toBe('Ce colis a déjà été annulé.')
    expect(cancellationErrorMessage(err)).not.toContain(CANCELLATION_ALREADY_CANCELLED)
  })

  it('reprend le message de l\'API pour les erreurs inconnues', () => {
    const err = new ApiError('Conflit de données', 'CONFLICT', 409)
    expect(cancellationErrorMessage(err)).toBe('Conflit de données')
  })

  it('ne laisse pas fuiter les détails techniques hors ApiError', () => {
    expect(cancellationErrorMessage(new Error('boom'))).toBe("L'annulation n'a pas pu aboutir. Veuillez réessayer.")
    expect(cancellationErrorMessage(null)).toBe("L'annulation n'a pas pu aboutir. Veuillez réessayer.")
  })
})
