// ============================================================
// FILE: lib/screens/driver/freeParcelZone.ts
// ============================================================

import type { Parcel, User } from '@/lib/api/types'
import { filterByHomeZone, getHomeZone, isInHomeZone, type HomeZone } from '@/lib/homeZone'

// La logique de rapprochement est partagée avec les écrans client (annonces) :
// elle vit dans `lib/homeZone`. Ce module garde les noms orientés chauffeur
// utilisés par les écrans du rôle.

type UserZoneFields = Pick<
  User,
  'primaryZoneId' | 'primaryZoneName' | 'zoneId' | 'zoneName' | 'city'
>

export type DriverHomeZone = HomeZone

/** Zone de rattachement du chauffeur : zone principale, zone secondaire, puis ville. */
export const getDriverHomeZone = (user: UserZoneFields | null | undefined): DriverHomeZone =>
  getHomeZone(user)

/** Un colis est dans la zone du chauffeur si son départ ou son arrivée y correspond. */
export const isParcelInDriverHomeZone = (
  parcel: Parcel,
  user: UserZoneFields | null | undefined,
): boolean => isInHomeZone(parcel, user)

/** Ne garde que les colis libres rattachés à la zone du chauffeur. */
export const filterFreeParcelsByDriverZone = (
  parcels: Parcel[],
  user: UserZoneFields | null | undefined,
): Parcel[] => filterByHomeZone(parcels, user)
