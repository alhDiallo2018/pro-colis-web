import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { api } from './client'
import { fetchActiveBroadcasts } from './broadcasts'
import { listMine } from './parcels'
import { driverDetail, getScore } from './admin-reputation'
import { rechargeWallet } from './admin-finance'

vi.mock('./client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

const mockedGet = api.get as Mock
const mockedPost = api.post as Mock

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
        user: { id: 'u-1', fullName: 'Awa Test', garageName: 'Dakar' },
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

  it('envoie userId dans le corps de recharge exigé par le contrôleur actuel', async () => {
    mockedPost.mockResolvedValue({
      data: {
        wallet: { id: 'u-1', balance: 5000 },
        transaction: { id: 'tx-1', amount: 5000 },
      },
    })

    await rechargeWallet('u-1', { amount: 5000, description: 'Ajustement' })
    expect(mockedPost).toHaveBeenCalledWith('/super-admin/wallets/u-1/recharge', {
      userId: 'u-1',
      amount: 5000,
      description: 'Ajustement',
    })
  })
})
