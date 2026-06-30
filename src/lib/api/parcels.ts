import { api } from './client'
import type { ListParams, Pagination, Parcel, ParcelEvent } from './types'

export interface ParcelList {
  parcels: Parcel[]
  pagination?: Pagination
}

export interface CreateParcelPayload {
  senderName: string
  senderPhone: string
  senderEmail?: string | null
  receiverName: string
  receiverPhone: string
  receiverEmail?: string | null
  receiverAddress?: string | null
  description?: string | null
  weight?: number | null
  type?: string | null
  departureGarageId?: string | null
  arrivalGarageId?: string | null
  driverId?: string | null
  price?: number | null
  isUrgent?: boolean
  isInsured?: boolean
  isFreeForBidding?: boolean
  proposedPrice?: number | null
  notes?: string | null
}

/** Liste des colis du client courant. */
export async function listMine(params: ListParams = {}): Promise<ParcelList> {
  const { data } = await api.get('/client/parcels/my-parcels', { params })
  return { parcels: data.parcels ?? [], pagination: data.pagination }
}

export async function getClientParcel(parcelId: string): Promise<Parcel> {
  const { data } = await api.get(`/client/parcels/${parcelId}`)
  return data.parcel
}

/** The recipient's delivery code (proof of receipt), visible to the sender. */
export async function deliveryCode(parcelId: string): Promise<string> {
  const { data } = await api.get(`/client/parcels/${parcelId}/delivery-code`)
  return data.code as string
}

export async function create(payload: CreateParcelPayload): Promise<Parcel> {
  const { data } = await api.post('/client/parcels/create', payload)
  return data.parcel
}

export async function cancel(parcelId: string, reason?: string): Promise<Parcel> {
  const { data } = await api.post(`/client/parcels/${parcelId}/cancel`, { reason })
  return data.parcel
}

/** Colis libres pour offres (annonces). */
export async function listFree(params: ListParams = {}): Promise<ParcelList> {
  const { data } = await api.get('/public/parcels/free', { params })
  return { parcels: data.parcels ?? [], pagination: data.pagination }
}

/** Suivi public par numéro de suivi. */
export async function track(trackingNumber: string): Promise<Parcel> {
  const { data } = await api.get(`/public/parcels/track/${trackingNumber}`)
  return data.parcel
}

export async function timeline(parcelId: string): Promise<ParcelEvent[]> {
  const { data } = await api.get(`/parcels/${parcelId}/timeline`)
  return data.events ?? data.timeline ?? []
}
