import { describe, expect, it } from 'vitest'
import { ApiError } from '@/lib/api/client'
import {
  COMMISSION_DEBT_CODE,
  DEBT_LIMIT_EXCEEDED_CODE,
  commissionDebtMessage,
  debtLimitExceededMessage,
  isCommissionDebtError,
  isDebtLimitExceededError,
  remainingDebtMessage,
} from './commissionDebt'

describe('isCommissionDebtError', () => {
  it('reconnaît une erreur COMMISSION_DEBT_REQUIRED', () => {
    const err = new ApiError('Vous avez une dette…', COMMISSION_DEBT_CODE, 403)
    expect(isCommissionDebtError(err)).toBe(true)
  })

  it('ignore les autres erreurs métier', () => {
    const err = new ApiError('Conflit', 'CONFLICT', 409)
    expect(isCommissionDebtError(err)).toBe(false)
  })

  it('ignore les erreurs non ApiError', () => {
    expect(isCommissionDebtError(new Error('boom'))).toBe(false)
    expect(isCommissionDebtError(null)).toBe(false)
  })
})

describe('commissionDebtMessage', () => {
  it('produit un message compréhensible avec le montant réel', () => {
    expect(commissionDebtMessage(500)).toBe(
      'Vous avez une dette de commission de 500 FCFA. Veuillez la régler avant d\'accepter un nouveau colis.',
    )
  })

  it('n\'expose jamais le code technique COMMISSION_DEBT_REQUIRED', () => {
    expect(commissionDebtMessage(1500)).not.toContain(COMMISSION_DEBT_CODE)
  })

  it('indique que les acceptations restent possibles sous le seuil', () => {
    expect(commissionDebtMessage(500, 1000)).toContain('Vous pouvez encore accepter des colis')
    expect(commissionDebtMessage(500, 1000)).toMatch(/1.000 FCFA/)
  })
})

describe('remainingDebtMessage', () => {
  it('affiche le montant restant après un règlement partiel', () => {
    expect(remainingDebtMessage(400)).toBe(
      'Il reste 400 FCFA de dette de commission. Les nouvelles acceptations restent bloquées.',
    )
  })

  it('confirme la réactivation lorsque la dette repasse sous le seuil', () => {
    expect(remainingDebtMessage(400, true)).toContain('de nouveau accepter')
  })
})

describe('isDebtLimitExceededError', () => {
  it('reconnaît une erreur DEBT_LIMIT_EXCEEDED', () => {
    const err = new ApiError('Plafond atteint', DEBT_LIMIT_EXCEEDED_CODE, 409)
    expect(isDebtLimitExceededError(err)).toBe(true)
  })

  it('ignore les autres erreurs métier', () => {
    expect(isDebtLimitExceededError(new ApiError('boom', 'OTHER', 409))).toBe(false)
    expect(isDebtLimitExceededError(new Error('boom'))).toBe(false)
  })
})

describe('debtLimitExceededMessage', () => {
  it('produit un message compréhensible sans inventer de montant', () => {
    expect(debtLimitExceededMessage()).toContain('limite de dette')
    expect(debtLimitExceededMessage()).not.toContain('FCFA')
  })
})
