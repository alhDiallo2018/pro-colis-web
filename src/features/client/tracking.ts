import type { ApiParcelStatus, DriverLocation, Parcel } from '@/lib/api/types'

/**
 * État d'affichage de la position du chauffeur pour un colis. Le Web ne présente
 * jamais de coordonnées fictives : chaque état correspond à une réalité issue de
 * l'API de tracking.
 */
export type DriverLocationState =
  /** Livraison terminée ou annulée : on ne suit plus la position active. */
  | { kind: 'finished' }
  /** Aucun chauffeur affecté : position indisponible. */
  | { kind: 'unavailable' }
  /** Chauffeur affecté mais aucune position GPS reçue pour l'instant. */
  | { kind: 'waiting' }
  /** Position GPS récente (temps réel). */
  | { kind: 'active'; location: DriverLocation }
  /** Position GPS reçue mais trop ancienne pour être présentée comme temps réel. */
  | { kind: 'stale'; location: DriverLocation }

const TERMINAL_STATUSES: readonly ApiParcelStatus[] = ['delivered', 'cancelled']

/** Au-delà de ce délai, la position est considérée « ancienne » et n'est plus
 *  présentée comme étant en temps réel. */
export const STALE_AFTER_MS = 5 * 60_000

/** Un chauffeur est affecté dès que l'API renvoie un identifiant de chauffeur. */
export function hasAssignedDriver(parcel: Parcel): boolean {
  return !!(parcel.driverId || parcel.assignedDriverId)
}

function isStale(location: DriverLocation, now: number): boolean {
  const updatedAt = location.updatedAt ? new Date(location.updatedAt).getTime() : null
  return updatedAt != null && !Number.isNaN(updatedAt) && now - updatedAt > STALE_AFTER_MS
}

function hasCoordinates(location: DriverLocation): boolean {
  return location.latitude != null && location.longitude != null
}

/** Détermine l'état de suivi GPS à partir du colis et de l'instant courant. */
export function getDriverLocationState(parcel: Parcel, now: number = Date.now()): DriverLocationState {
  if (TERMINAL_STATUSES.includes(parcel.status)) return { kind: 'finished' }

  const location = parcel.driverLocation
  const assigned = hasAssignedDriver(parcel)
  const available = !!location && location.available !== false && hasCoordinates(location)

  if (!available) {
    return assigned ? { kind: 'waiting' } : { kind: 'unavailable' }
  }

  const loc = location as DriverLocation
  return isStale(loc, now) ? { kind: 'stale', location: loc } : { kind: 'active', location: loc }
}
