import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { api } from './client'
import { cancelParcel, getCancellationQuote } from './cancellation'

vi.mock('./client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

const mockedGet = api.get as Mock
const mockedPost = api.post as Mock

describe('contrat annulation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('demande le devis d\'annulation au bon endpoint', async () => {
    mockedGet.mockResolvedValue({
      data: {
        allowed: true,
        penalized: true,
        exempt: false,
        responsibility: 'client',
        penalty: 500,
        refund: 4500,
      },
    })

    const quote = await getCancellationQuote('p-1')
    expect(mockedGet).toHaveBeenCalledWith('/client/parcels/p-1/cancel/quote')
    expect(quote.penalty).toBe(500)
    expect(quote.refund).toBe(4500)
    expect(quote.responsibility).toBe('client')
  })

  it('normalise les montants en nombres et ignore les valeurs vides', async () => {
    mockedGet.mockResolvedValue({
      data: { penalty: '500', refund: null, paidAmount: '' },
    })

    const quote = await getCancellationQuote('p-1')
    expect(quote.penalty).toBe(500)
    expect(quote.refund).toBeNull()
    expect(quote.paidAmount).toBeNull()
  })

  it('annule un colis en transmettant uniquement le motif', async () => {
    mockedPost.mockResolvedValue({
      data: {
        parcel: { id: 'p-1', status: 'cancelled' },
        event: { id: 'e-1', status: 'cancelled' },
        penalty: 0,
        penalized: false,
        exempt: true,
        responsibility: 'exempt',
      },
    })

    const result = await cancelParcel('p-1', { reason: 'Changement de plan' })
    expect(mockedPost).toHaveBeenCalledWith('/client/parcels/p-1/cancel', { reason: 'Changement de plan' })
    expect(result.parcel?.status).toBe('cancelled')
    expect(result.event?.id).toBe('e-1')
    expect(result.exempt).toBe(true)
    expect(result.penalized).toBe(false)
  })

  it('conserve la répartition par partie quand le backend la fournit', async () => {
    mockedPost.mockResolvedValue({
      data: {
        responsibility: 'shared',
        penalized: true,
        client: { penalty: 250, refund: 2250 },
        driver: { penalty: 250, walletDeduction: 250 },
      },
    })

    const result = await cancelParcel('p-1')
    expect(result.responsibility).toBe('shared')
    expect(result.client?.penalty).toBe(250)
    expect(result.driver?.walletDeduction).toBe(250)
  })
})
