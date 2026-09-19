import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from './client'
import { locationLabel, type Advertisement } from './advertisements'
import { resolveZone } from './zones'
import { list } from './client-debts'

vi.mock('./client', async (importOriginal) => ({
  ...await importOriginal<typeof import('./client')>(),
  api: { post: vi.fn(), get: vi.fn() },
}))

beforeEach(() => vi.clearAllMocks())

describe('lieux des annonces', () => {
  it('ignore les villes vides et privilégie le lieu précis', () => {
    const ad: Advertisement = { id: 'ad', driverId: 'driver', departureName: ' Ouakam ',
      departureCity: '', arrivalZoneName: 'Thiès Nord', arrivalCity: ' ' }
    expect(locationLabel(ad, 'departure')).toBe('Ouakam')
    expect(locationLabel(ad, 'arrival')).toBe('Thiès Nord')
    expect(locationLabel({ ...ad, departureName: '', departureGarageName: 'Garage Dakar' }, 'departure')).toBe('Garage Dakar')
    expect(locationLabel({ id: 'ad', driverId: 'driver', departureCity: 'Dakar' }, 'departure')).toBe('Dakar')
  })

  it('conserve la zone pending et jamais le garage miroir comme ZoneId', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {
      data: { id: 'zone-uuid', name: 'Nouveau lieu', status: 'pending' },
      garage: { id: 'garage-uuid' }, garageId: 'garage-uuid', created: true,
    } })
    const resolved = await resolveZone({ name: 'Nouveau lieu', latitude: 14, longitude: -17 })
    expect(resolved.zone.id).toBe('zone-uuid')
    expect(resolved.created).toBe(true)
  })
})

describe('dettes personnelles', () => {
  it('utilise la pagination du serveur sans passer un autre utilisateur', async () => {
    const response = { debts: [], summary: { totalDebt: 400 }, pagination: { totalPages: 2 } }
    vi.mocked(api.get).mockResolvedValue({ data: response })
    expect(await list(2)).toEqual(response)
    expect(api.get).toHaveBeenCalledWith('/client/debts', { params: { page: 2, limit: 20 } })
  })
  it('ne transforme jamais une réponse incomplète en absence de dette', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { debts: [] } })
    await expect(list()).rejects.toThrow('Impossible de lire vos dettes')
  })
})
