import { api } from './client'
import type { ListParams, User } from './types'

export interface AdvertisementOffer {
  id: string
  advertisementId: string
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
  id: string
  driverId: string
  driverName?: string
  driver?: User | null
  departureZoneId?: string | null
  arrivalZoneId?: string | null
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
export async function acceptOffer(advertisementId: string, offerId: string): Promise<void> {
  await api.post(`/advertisements/${advertisementId}/offers/${offerId}/accept`)
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
