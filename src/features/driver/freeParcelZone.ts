// ============================================================
// FILE: lib/screens/driver/freeParcelZone.ts
// ============================================================

import type { Parcel, User } from '@/lib/api/types'

type UserZoneFields = Pick<
  User,
  'primaryZoneId' | 'primaryZoneName' | 'zoneId' | 'zoneName' | 'city'
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

  // 1. Zone principale
  if (user.primaryZoneId || user.primaryZoneName) {
    return {
      id: user.primaryZoneId ?? null,
      name: user.primaryZoneName?.trim() || null,
    }
  }

  // 2. Zone secondaire
  if (user.zoneId || user.zoneName) {
    return {
      id: user.zoneId ?? null,
      name: user.zoneName?.trim() || null,
    }
  }

  // 3. Ville par défaut (fallback)
  return { id: null, name: user.city?.trim() || null }
}

/**
 * Vérifie si un colis correspond à la zone du chauffeur.
 * Compare par ID ou par nom (zone ou ville).
 */
export function isParcelInDriverHomeZone(
  parcel: Parcel,
  user: UserZoneFields | null | undefined,
): boolean {
  const zone = getDriverHomeZone(user)

  // ✅ Si le chauffeur n'a PAS de zone → AFFICHER TOUS LES COLIS
  if (!zone.id && !zone.name) {
    return true
  }

  // ✅ Vérification par ID (priorité)
  const matchesZoneId =
    !!zone.id && 
    (parcel.zoneId === zone.id || 
     parcel.departureZoneId === zone.id ||
     parcel.arrivalZoneId === zone.id)

  // ✅ Vérification par nom
  const normalizedZoneName = normalizeZoneName(zone.name)
  const matchesZoneName =
    !!normalizedZoneName &&
    [
      parcel.departureZoneName, 
      parcel.departureCity,
      parcel.arrivalZoneName,
      parcel.arrivalCity
    ].some((value) => normalizeZoneName(value) === normalizedZoneName)

  // ✅ Si le colis correspond par ID ou par nom → dans la zone
  return matchesZoneId || matchesZoneName
}

/**
 * Filtre les colis free selon la zone du chauffeur.
 * 
 * ✅ Règle :
 * - Si le chauffeur a une zone → filtre les colis de sa zone
 * - Si le chauffeur n'a pas de zone → retourne TOUS les colis
 */
export function filterFreeParcelsByDriverZone(
  parcels: Parcel[],
  user: UserZoneFields | null | undefined,
): Parcel[] {
  const zone = getDriverHomeZone(user)
  
  // ✅ Si le chauffeur n'a PAS de zone → retourner TOUS les colis
  if (!zone.id && !zone.name) {
    console.log('🔍 [freeParcelZone] Pas de zone → affiche TOUS les colis:', parcels.length)
    return parcels
  }

  // ✅ Si le chauffeur a une zone → filtrer
  console.log('🔍 [freeParcelZone] Zone du chauffeur:', zone.name)
  const filtered = parcels.filter((parcel) => isParcelInDriverHomeZone(parcel, user))
  console.log('🔍 [freeParcelZone] Colis dans la zone:', filtered.length)
  return filtered
}