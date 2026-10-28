export const vehicleTypes = [
  { value: 'motorcycle', label: 'Moto (2 roues)' },
  { value: 'truck', label: 'Camion' },
  { value: 'van', label: 'Fourgonnette' },
  { value: 'tricycle', label: 'Tricycle' },
  { value: 'bus', label: 'Bus (Tata, horaire…)' },
  { value: 'gp', label: 'GP' },
]
export interface Stop {
  zoneId: string
  name?: string
  offsetMinutes: number
  scheduledAt?: string
  latitude?: number
  longitude?: number
}
export interface Itinerary {
  serviceType: string
  lineNumber?: string | null
  stops: Stop[]
}
export interface RouteTemplate {
  id: string
  name: string
  data: {
    availableWeight: number
    proposedPrice: number | null
    itinerary: Itinerary
  }
}
export interface Departure {
  departureAt: string
  reverse: boolean
}
export interface Schedule {
  requestId: string
  departures: Departure[]
  availableWeight: number
  proposedPrice: number | null
}
export interface LiveJourney {
  advertisementId: string
  vehicleReference: string
  driverName: string
  vehicleModel: string
  lineNumber?: string
  departure: Stop
  arrival: Stop
  departureAt: string
  position: {
    latitude: number
    longitude: number
    accuracyMeters: number
    capturedAt: string
    expiresAt: string
  }
}
export function freshJourney(j: LiveJourney, now = Date.now()) {
  const p = j.position,
    age = now - Date.parse(p.capturedAt)
  return (
    Number.isFinite(p.latitude) &&
    Number.isFinite(p.longitude) &&
    Math.abs(p.latitude) <= 90 &&
    Math.abs(p.longitude) <= 180 &&
    age >= -5000 &&
    age < 60000 &&
    Date.parse(p.expiresAt) > now
  )
}
/** Les dates sont absolues, les arrêts restent relatifs au départ. Chaque sens
 * conserve la même durée : aucune copie de GPS, réservation ou ancien horaire. */
export function departures(
  first: string,
  count: number,
  interval: number,
  duration: number,
  reverse: boolean,
  alternate: boolean,
): Departure[] {
  const start = Date.parse(first)
  if (
    !Number.isFinite(start) ||
    !Number.isInteger(count) ||
    count < 1 ||
    count > 100 ||
    !Number.isFinite(interval) ||
    (count > 1 && interval < duration)
  )
    throw new Error(
      'Choisissez 1 à 100 départs et un intervalle au moins égal à la durée du trajet.',
    )
  return Array.from({ length: count }, (_, i) => ({
    departureAt: new Date(start + i * interval * 60000).toISOString(),
    reverse: alternate && i % 2 === 1 ? !reverse : reverse,
  }))
}
