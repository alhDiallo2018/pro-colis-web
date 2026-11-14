import type { Itinerary } from '@/features/transport/domain'
import { api } from './client'
import type { ListParams, User } from './types'

export interface AdvertisementOffer {
  id: string
  advertisementId: string
  journeySegment?: {pickup: {name:string}; dropoff: {name:string}} | null
  clientId: string
  client?: User | null
  parcelId?: string | null
  parcel?: {
    id: string
    trackingNumber?: string
    description?: string | null
    weight?: string | null
    receiverName?: string
    receiverPhone?: string
    receiverAddress?: string | null
    status?: string
    type?: string
    photoUrls?: string[]
    videoUrls?: string[]
    audioUrls?: string[]
  } | null
  price: number
  message?: string | null
  status: string
  responseMessage?: string | null
  createdAt?: string
}

export interface Advertisement {
  itinerary?: Itinerary | null
  transport?: {vehicleId:string; reference:string; type:string} | null
  id: string
  driverId: string
  driverName?: string
  driver?: User | null
  departureZoneId?: string | null
  arrivalZoneId?: string | null
  departureName?: string | null
  arrivalName?: string | null
  departureZoneName?: string | null
  arrivalZoneName?: string | null
  departureGarageName?: string | null
  arrivalGarageName?: string | null
  departureCity?: string | null
  arrivalCity?: string | null
  departureAt?: string | null
  availableWeight?: number | null
  proposedPrice?: number | null
  description?: string | null
  audioUrl?: string | null
  status?: string
  isActive?: boolean
  offersCount?: number
  maxWeight?: number | null
  maxLength?: number | null
  maxWidth?: number | null
  maxHeight?: number | null
  offers?: AdvertisementOffer[]
  createdAt?: string
}

export interface CreateAdvertisementPayload {
  itinerary?: Itinerary
  vehicleId?: string
  departureCity?: string
  arrivalCity?: string
  departureZoneId?: string | null
  arrivalZoneId?: string | null
  departureAt?: string | null
  availableWeight?: number | null
  proposedPrice?: number | null
  description?: string | null
  audioUrl?: string | null
}

/** Chauffeur : créer une annonce de trajet. */
export async function create(payload: CreateAdvertisementPayload): Promise<Advertisement> {
  const { data } = await api.post('/advertisements', payload)
  return data.advertisement ?? data.data
}

/** Toutes les annonces de trajet des chauffeurs (parcourues par les clients). */
export async function list(params: ListParams = {}): Promise<Advertisement[]> {
  const { data } = await api.get('/advertisements', { params })
  return data.advertisements ?? data.data ?? []
}

export async function detail(advertisementId: string): Promise<Advertisement> {
  const { data } = await api.get(`/advertisements/${advertisementId}`)
  return data.advertisement ?? data.data
}

/** Mes annonces (chauffeur courant). */
export async function listMine(): Promise<Advertisement[]> {
  const { data } = await api.get('/advertisements/my')
  return data.advertisements ?? data.data ?? []
}

export async function close(advertisementId: string): Promise<void> {
  await api.post(`/advertisements/${advertisementId}/close`)
}

/** Client : proposer un colis / un prix sur l'annonce d'un chauffeur. */
export async function createOffer(
  advertisementId: string,
  payload: { price: number; message?: string; parcelId?: string },
): Promise<AdvertisementOffer> {
  const { data } = await api.post(`/advertisements/${advertisementId}/offers`, payload)
  return data.offer ?? data.data
}

/** Chauffeur : accepter une offre sur son annonce. */
export async function acceptOffer(advertisementId: string, offerId: string): Promise<{ success: boolean; finalized?: boolean }> {
  const { data } = await api.post(`/advertisements/${advertisementId}/offers/${offerId}/accept`)
  return data
}

/** Chauffeur : refuser une offre sur son annonce. */
export async function rejectOffer(advertisementId: string, offerId: string): Promise<void> {
  await api.post(`/advertisements/${advertisementId}/offers/${offerId}/reject`)
}

/** Négocier le prix d'une offre (chauffeur ou client). */
export async function negotiateOffer(
  advertisementId: string,
  offerId: string,
  payload: { price: number; message?: string },
): Promise<AdvertisementOffer> {
  const { data } = await api.post(`/advertisements/${advertisementId}/offers/${offerId}/negotiate`, payload)
  return data.offer ?? data.data
}

/** Même libellé dans les cartes, détails et conversations, sans chaîne vide. */
export function locationLabel(ad: Advertisement, side: 'departure' | 'arrival'): string {
  return [ad[`${side}Name`], ad[`${side}ZoneName`], ad[`${side}GarageName`], ad[`${side}City`]]
    .map((value) => value?.trim()).find(Boolean) || '—'
}

// ---- Manifeste navette (parité avec Mobile `advertisement_manifest_screen`) ---

export interface ManifestOfferSummary {
  id: string
  parcelId?: string | null
  trackingNumber?: string | null
  receiverName?: string | null
  price?: number | null
  boardingStopOrder?: number | null
  dropOffStopOrder?: number | null
}

export interface ManifestStop {
  order: number
  label?: string | null
  zoneId?: string | null
  picked: ManifestOfferSummary[]
  dropOffs: ManifestOfferSummary[]
}

export interface AdvertisementManifest {
  advertisementId: string
  transitLineId?: string | null
  totalOffers: number
  stops: ManifestStop[]
  unassigned: ManifestOfferSummary[]
}

function parseOfferSummary(raw: unknown): ManifestOfferSummary {
  const o = (raw ?? {}) as Record<string, unknown>
  const parcel = (o.parcel ?? {}) as Record<string, unknown>
  const rawPrice = o.price
  let price: number | null = null
  if (typeof rawPrice === 'number') price = rawPrice
  else if (typeof rawPrice === 'string') { const n = Number(rawPrice); if (!Number.isNaN(n)) price = n }
  const boarding = o.boardingStop as Record<string, unknown> | undefined
  const dropOff = o.dropOffStop as Record<string, unknown> | undefined
  return {
    id: String(o.id ?? ''),
    parcelId: (o.parcelId as string | null | undefined) ?? null,
    trackingNumber: (parcel.trackingNumber as string | null | undefined) ?? null,
    receiverName: (parcel.receiverName as string | null | undefined) ?? null,
    price,
    boardingStopOrder: typeof boarding?.order === 'number' ? boarding.order : null,
    dropOffStopOrder: typeof dropOff?.order === 'number' ? dropOff.order : null,
  }
}

/** `GET /advertisements/:id/manifest` — réponse non enveloppée côté API. */
export async function fetchManifest(advertisementId: string): Promise<AdvertisementManifest> {
  const { data } = await api.get(`/advertisements/${advertisementId}/manifest`)
  const payload = (data?.data ?? data ?? {}) as Record<string, unknown>
  const stops = (payload.stops as unknown[] | undefined) ?? []
  const unassigned = (payload.unassigned as unknown[] | undefined) ?? []
  return {
    advertisementId: String(payload.advertisementId ?? advertisementId),
    transitLineId: (payload.transitLineId as string | null | undefined) ?? null,
    totalOffers: typeof payload.totalOffers === 'number' ? payload.totalOffers : 0,
    stops: stops.map((s) => {
      const stop = (s ?? {}) as Record<string, unknown>
      return {
        order: typeof stop.order === 'number' ? stop.order : 0,
        label: (stop.label as string | null | undefined) ?? null,
        zoneId: (stop.zoneId as string | null | undefined) ?? null,
        picked: ((stop.picked as unknown[] | undefined) ?? []).map(parseOfferSummary),
        dropOffs: ((stop.dropOffs as unknown[] | undefined) ?? []).map(parseOfferSummary),
      }
    }),
    unassigned: unassigned.map(parseOfferSummary),
  }
}

// ---- Arrêts atteints (parité avec Mobile `advertisement_reached_stops_screen`) ---

export interface ReachedStopEvent {
  stopOrder: number
  stopLabel?: string | null
  zoneId?: string | null
  distanceMeters: number
  radiusMeters: number
  reachedAt?: string | null
  confirmedBy: number
}

export interface ReachedStopsResult {
  advertisementId: string
  transitLineId?: string | null
  reachedStops: ReachedStopEvent[]
}

/** `GET /advertisements/:id/reached-stops` — réponse non enveloppée côté API. */
export async function fetchReachedStops(advertisementId: string): Promise<ReachedStopsResult> {
  const { data } = await api.get(`/advertisements/${advertisementId}/reached-stops`)
  const payload = (data?.data ?? data ?? {}) as Record<string, unknown>
  const rows = (payload.reachedStops as unknown[] | undefined) ?? []
  return {
    advertisementId: String(payload.advertisementId ?? advertisementId),
    transitLineId: (payload.transitLineId as string | null | undefined) ?? null,
    reachedStops: rows.map((r) => {
      const o = (r ?? {}) as Record<string, unknown>
      return {
        stopOrder: typeof o.stopOrder === 'number' ? o.stopOrder : 0,
        stopLabel: (o.stopLabel as string | null | undefined) ?? null,
        zoneId: (o.zoneId as string | null | undefined) ?? null,
        distanceMeters: typeof o.distanceMeters === 'number' ? o.distanceMeters : 0,
        radiusMeters: typeof o.radiusMeters === 'number' ? o.radiusMeters : 0,
        reachedAt: (o.reachedAt as string | null | undefined) ?? null,
        confirmedBy: typeof o.confirmedBy === 'number' ? o.confirmedBy : 1,
      }
    }),
  }
}
