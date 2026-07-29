import type { Parcel, User } from '@/lib/api/types'

type UserZoneFields = Pick<
  User,
  'primaryZoneId' | 'primaryZoneName' | 'garageId' | 'garageName' | 'city'
>

export interface DriverHomeZone {
  id: string | null
  name: string | null
}

/** Normalise uniquement la casse et les espaces afin de conserver une correspondance de zone exacte. */
function normalizeZoneName(value: string | null | undefined): string {
  return value?.normalize('NFC').trim().toLocaleLowerCase('fr') ?? ''
}

/**
 * Utilise la zone principale du chauffeur, puis son ancienne zone/garage et enfin
 * sa ville de résidence lorsque le compte ne possède pas encore de zone dédiée.
 */
export function getDriverHomeZone(user: UserZoneFields | null | undefined): DriverHomeZone {
  if (!user) return { id: null, name: null }

  if (user.primaryZoneId || user.primaryZoneName) {
    return {
      id: user.primaryZoneId ?? null,
      name: user.primaryZoneName?.trim() || null,
    }
  }

  if (user.garageId || user.garageName) {
    return {
      id: user.garageId ?? null,
      name: user.garageName?.trim() || null,
    }
  }

  return { id: null, name: user.city?.trim() || null }
}

/**
 * Un colis correspond quand son identifiant de départ ou son nom de départ est
 * exactement celui de la zone du chauffeur. La comparaison des noms ignore la casse.
 */
export function isParcelInDriverHomeZone(
  parcel: Parcel,
  user: UserZoneFields | null | undefined,
): boolean {
  const zone = getDriverHomeZone(user)
  const matchesZoneId =
    !!zone.id && (parcel.zoneId === zone.id || parcel.departureGarageId === zone.id)

  const normalizedZoneName = normalizeZoneName(zone.name)
  const matchesZoneName =
    !!normalizedZoneName &&
    [parcel.departureGarageName, parcel.departureCity].some(
      (value) => normalizeZoneName(value) === normalizedZoneName,
    )

  return matchesZoneId || matchesZoneName
}

export function filterFreeParcelsByDriverZone(
  parcels: Parcel[],
  user: UserZoneFields | null | undefined,
): Parcel[] {
  return parcels.filter((parcel) => isParcelInDriverHomeZone(parcel, user))
}
