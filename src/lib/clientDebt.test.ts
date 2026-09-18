import { describe, expect, it } from 'vitest'
import { ApiError } from '@/lib/api/client'
import { CLIENT_DEBT_LIMIT_CODE, getClientDebtBlock } from './clientDebt'

describe('getClientDebtBlock', () => {
  it('extrait les pénalités payables de l\'erreur métier', () => {
    const error = new ApiError('Dette atteinte', CLIENT_DEBT_LIMIT_CODE, 403, [{
      path: 'clientDebt',
      debtAmount: 1500,
      debtLimit: 1000,
      debts: [{ id: 'debt-1', parcelId: 'parcel-1', amount: 1500, remaining: 900, status: 'partially_paid' }],
    }])

    expect(getClientDebtBlock(error)).toEqual({
      debtAmount: 1500,
      debtLimit: 1000,
      debts: [{ id: 'debt-1', parcelId: 'parcel-1', amount: 1500, remaining: 900, status: 'partially_paid' }],
    })
  })

  it('ignore les autres erreurs et les détails incomplets', () => {
    expect(getClientDebtBlock(new Error('boom'))).toBeNull()
    expect(getClientDebtBlock(new ApiError('Autre', 'OTHER', 409))).toBeNull()
    expect(getClientDebtBlock(new ApiError('Dette', CLIENT_DEBT_LIMIT_CODE, 403, []))).toBeNull()
  })
})
