import { describe, expect, it } from 'vitest'
import type { Parcel, User } from '@/lib/api/types'
import { filterFreeParcelsByDriverZone, getDriverHomeZone } from './freeParcelZone'

function parcel(id: string, departureCity: string, departureZoneName?: string): Parcel {
  return {
    id,
    trackingNumber: `PC-${id}`,
    senderName: 'Client',
    senderPhone: '+221770000000',
    receiverName: 'Destinataire',
    receiverPhone: '+221780000000',
    status: 'free',
    departureCity,
    departureZoneName,
  }
}

function driver(overrides: Partial<User>): User {
  return {
    id: 'driver-1',
    email: null,
    phone: '+221760000000',
    fullName: 'Chauffeur',
    role: 'driver',
    status: 'active',
    ...overrides,
  }
}

describe('filterFreeParcelsByDriverZone', () => {
  it('compare la ville exacte sans tenir compte de la casse ni des espaces externes', () => {
    const parcels = [parcel('1', '  DAKAR '), parcel('2', 'Dakar Plateau')]

    expect(filterFreeParcelsByDriverZone(parcels, driver({ city: 'dakar' }))).toEqual([
      parcels[0],
    ])
  })

  it('privilégie la zone principale précise à la ville plus large', () => {
    const parcels = [parcel('1', 'Abidjan', 'Cocody'), parcel('2', 'Abidjan', 'Marcory')]
    const user = driver({ city: 'Abidjan', primaryZoneName: 'cOcOdY' })

    expect(getDriverHomeZone(user)).toEqual({ id: null, name: 'cOcOdY' })
    expect(filterFreeParcelsByDriverZone(parcels, user)).toEqual([parcels[0]])
  })

  it('accepte la correspondance exacte par identifiant de zone de départ', () => {
    const matching = { ...parcel('1', 'Autre ville'), departureZoneId: 'zone-1' }
    const user = driver({ primaryZoneId: 'zone-1', primaryZoneName: 'Cocody' })

    expect(filterFreeParcelsByDriverZone([matching], user)).toEqual([matching])
  })

  it('ne montre aucun colis lorsque la zone du chauffeur est inconnue', () => {
    expect(filterFreeParcelsByDriverZone([parcel('1', 'Dakar')], driver({}))).toEqual([])
  })
})
