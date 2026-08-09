import { describe, expect, it } from 'vitest'
import type { User } from '@/lib/api/types'
import type { Advertisement } from '@/lib/api/advertisements'
import { filterByHomeZone, getHomeZone, hasHomeZone, isInHomeZone } from './homeZone'

function user(overrides: Partial<User>): User {
  return {
    id: 'user-1',
    email: null,
    phone: '+221760000000',
    fullName: 'Utilisateur',
    role: 'client',
    status: 'active',
    ...overrides,
  }
}

function ad(id: string, departureCity: string, arrivalCity: string): Advertisement {
  return { id, driverId: 'driver-1', departureCity, arrivalCity }
}

describe('homeZone', () => {
  it('remonte la zone principale avant la zone secondaire et la ville', () => {
    expect(getHomeZone(user({ primaryZoneId: 'z1', primaryZoneName: 'Cocody', city: 'Abidjan' })))
      .toEqual({ id: 'z1', name: 'Cocody' })
    expect(getHomeZone(user({ zoneName: 'Marcory', city: 'Abidjan' }))).toEqual({
      id: null,
      name: 'Marcory',
    })
    expect(getHomeZone(user({ city: 'Abidjan' }))).toEqual({ id: null, name: 'Abidjan' })
    expect(getHomeZone(user({}))).toEqual({ id: null, name: null })
  })

  it('signale un compte sans zone', () => {
    expect(hasHomeZone(user({ city: 'Dakar' }))).toBe(true)
    expect(hasHomeZone(user({}))).toBe(false)
    expect(hasHomeZone(null)).toBe(false)
  })

  it('filtre les annonces des chauffeurs comme les colis', () => {
    // Le client voit les trajets qui partent de chez lui comme ceux qui y mènent.
    const depuis = ad('1', 'Dakar', 'Thiès')
    const vers = ad('2', 'Saint-Louis', 'dakar')
    const ailleurs = ad('3', 'Thiès', 'Saint-Louis')

    expect(filterByHomeZone([depuis, vers, ailleurs], user({ city: 'Dakar' }))).toEqual([
      depuis,
      vers,
    ])
  })

  it('exige une correspondance exacte, pas un préfixe', () => {
    expect(isInHomeZone(ad('1', 'Dakar Plateau', 'Thiès'), user({ city: 'Dakar' }))).toBe(false)
  })

  it('rapproche par identifiant de zone quand les libellés diffèrent', () => {
    const trajet: Advertisement = {
      id: '1',
      driverId: 'driver-1',
      departureZoneId: 'zone-1',
      departureCity: 'Libellé sans rapport',
    }
    expect(isInHomeZone(trajet, user({ primaryZoneId: 'zone-1', primaryZoneName: 'Cocody' }))).toBe(
      true,
    )
  })

  it('ne retient rien pour un utilisateur sans zone', () => {
    expect(filterByHomeZone([ad('1', 'Dakar', 'Thiès')], user({}))).toEqual([])
  })
})
