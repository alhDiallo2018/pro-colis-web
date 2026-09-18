import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { api } from './client'
import { fetchActiveBroadcasts } from './broadcasts'
import { listMine } from './parcels'
import { driverDetail, getScore } from './admin-reputation'
import { rechargeWallet } from './admin-finance'
import { garageAssignDriver, garageCancelParcel } from './roles'
import { createPaydunyaPayment } from './paydunya'

vi.mock('./client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}))

const mockedGet = api.get as Mock
const mockedPost = api.post as Mock
const mockedPut = api.put as Mock

describe('contrats API critiques', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('charge les bandeaux depuis la route publique', async () => {
    const broadcasts = [{ id: 'b-1', active: true, message: 'Maintenance' }]
    mockedGet.mockResolvedValue({ data: { broadcasts } })

    await expect(fetchActiveBroadcasts()).resolves.toEqual(broadcasts)
    expect(mockedGet).toHaveBeenCalledWith('/public/broadcasts')
  })

  it('préserve une réponse colis plate sans la classer comme reçue', async () => {
    const parcel = { id: 'p-1', trackingNumber: 'PC-1', status: 'pending' }
    mockedGet.mockResolvedValue({
      data: { parcels: [parcel], pagination: { page: 1 } },
    })

    const result = await listMine()
    expect(result.parcels).toEqual([parcel])
    expect(result.sent).toBeUndefined()
    expect(result.received).toBeUndefined()
  })

  it('recompose le détail score renvoyé en trois blocs par l’API', async () => {
    mockedGet.mockResolvedValue({
      data: {
        user: { id: 'u-1', fullName: 'Awa Test', zoneName: 'Dakar' },
        score: {
          points: 120,
          totalEarned: 150,
          totalSpent: 30,
          level: 'STANDARD',
        },
        transactions: [
          {
            id: 'tx-1',
            amount: 120,
            type: 'bonus',
            description: 'Test',
            status: 'completed',
          },
        ],
      },
    })

    await expect(getScore('u-1')).resolves.toMatchObject({
      userId: 'u-1',
      fullName: 'Awa Test',
      points: 120,
      level: 'STANDARD',
      transactions: [{ id: 'tx-1' }],
    })
  })

  it('accepte le détail chauffeur directement à la racine de la réponse', async () => {
    const detail = {
      user: { id: 'u-1', fullName: 'Awa Test', phone: '+221770000000' },
      score: null,
      wallet: null,
    }
    mockedGet.mockResolvedValue({ data: detail })

    await expect(driverDetail('u-1')).resolves.toEqual(detail)
  })

  it('utilise le userId de la route canonique pour une recharge', async () => {
    mockedPost.mockResolvedValue({
      data: {
        wallet: { id: 'u-1', balance: 5000 },
        transaction: { id: 'tx-1', amount: 5000 },
      },
    })

    await rechargeWallet('u-1', { amount: 5000, description: 'Ajustement' })
    expect(mockedPost).toHaveBeenCalledWith('/super-admin/wallets/u-1/recharge', {
      amount: 5000,
      description: 'Ajustement',
    })
  })

  it('assigne un chauffeur via la transition de statut du garage', async () => {
    mockedPut.mockResolvedValue({ data: { parcel: { id: 'p-1', status: 'confirmed' } } })

    await garageAssignDriver('p-1', 'd-1')
    expect(mockedPut).toHaveBeenCalledWith('/garage-admin/parcels/p-1/status', {
      status: 'confirmed',
      driverId: 'd-1',
    })
  })

  it('annule un colis garage avec un motif métier', async () => {
    mockedPut.mockResolvedValue({ data: { parcel: { id: 'p-1', status: 'cancelled' } } })

    await garageCancelParcel('p-1', 'client_change_of_mind')
    expect(mockedPut).toHaveBeenCalledWith('/garage-admin/parcels/p-1/status', {
      status: 'cancelled',
      reason: 'client_change_of_mind',
    })
  })

  it('transmet l’identifiant de pénalité au paiement PayDunya', async () => {
    mockedPost.mockResolvedValue({ data: { token: 'tok-1', paymentUrl: 'https://pay.test/tok-1' } })

    await createPaydunyaPayment('penalty_debt', { debtId: 'debt-1', amount: 1500 })
    expect(mockedPost).toHaveBeenCalledWith('/payments/paydunya/create', {
      type: 'penalty_debt',
      parcelId: undefined,
      points: undefined,
      amount: 1500,
      debtId: 'debt-1',
    })
  })
})
