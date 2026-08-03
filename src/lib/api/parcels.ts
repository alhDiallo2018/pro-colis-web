import { api } from './client'
import type { ListParams, Pagination, Parcel, ParcelEvent } from './types'

export interface ParcelList {
  parcels: Parcel[]
  pagination?: Pagination
  sent?: Parcel[]
  received?: Parcel[]
  sentTotal?: number
  receivedTotal?: number
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
  departureZoneId?: string | null
  arrivalZoneId?: string | null
  driverId?: string | null
  price?: number | null
  isUrgent?: boolean
  isInsured?: boolean
  isFreeForBidding?: boolean
  proposedPrice?: number | null
  notes?: string | null
}

export async function listMine(params: ListParams = {}): Promise<ParcelList> {
  const { data } = await api.get('/client/parcels/my-parcels', { params })
  const parcels = data.parcels ?? []
  const sent = data.sent
  const received = data.received

  // L'API renvoie soit une liste unique, soit deux groupes sur les anciennes versions.
  // Ne pas classer arbitrairement la liste unique comme « reçue ».
  return {
    parcels: sent || received ? [...(sent ?? []), ...(received ?? [])] : parcels,
    pagination: data.pagination,
    sent,
    received,
    sentTotal: data.sentTotal,
    receivedTotal: data.receivedTotal,
  }
}

export async function listSent(params: ListParams = {}): Promise<ParcelList> {
  const { data } = await api.get('/client/parcels/my-parcels', { params: { ...params, filter: 'sent' } })
  return { parcels: data.parcels ?? [], pagination: data.pagination }
}

export async function listReceived(params: ListParams = {}): Promise<ParcelList> {
  const { data } = await api.get('/client/parcels/my-parcels', { params: { ...params, filter: 'received' } })
  return { parcels: data.parcels ?? [], pagination: data.pagination }
}

export async function getClientParcel(parcelId: string): Promise<Parcel> {
  const { data } = await api.get(`/client/parcels/${parcelId}`)
  return data.parcel
}

/** Garage admin : détail d'un colis de la zone. */
export async function getParcel(parcelId: string): Promise<Parcel> {
  const { data } = await api.get(`/garage-admin/parcels/${parcelId}`)
  return data.parcel ?? data.data
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

/**
 * Champs qu'un client peut corriger tant que le colis n'est pas engagé.
 * Miroir de `PARCEL_EDITABLE_*_FIELDS` côté API : tout autre champ est ignoré
 * par le serveur.
 */
export interface UpdateParcelPayload {
  receiverName?: string
  receiverPhone?: string
  receiverEmail?: string | null
  receiverAddress?: string | null
  description?: string
  notes?: string | null
  weight?: number | null
  type?: string | null
  price?: number | null
  proposedPrice?: number | null
  isUrgent?: boolean
  isInsured?: boolean
  departureZoneId?: string | null
  arrivalZoneId?: string | null
  paymentMethod?: string | null
  paymentChannel?: string | null
  cashCollectionPoint?: string | null
}

/**
 * Modifier un colis. L'API refuse (409) dès qu'un chauffeur est assigné, qu'une
 * offre est acceptée ou qu'un paiement est engagé : côté web, `isParcelEditable`
 * masque l'action en amont, mais l'erreur reste possible en cas de course.
 */
export async function update(parcelId: string, payload: UpdateParcelPayload): Promise<Parcel> {
  const { data } = await api.put(`/client/parcels/${parcelId}`, payload)
  return data.parcel ?? data.data
}

export async function cancel(parcelId: string, reason?: string): Promise<Parcel> {
  const { data } = await api.post(`/client/parcels/${parcelId}/cancel`, { reason })
  return data.parcel
}

export async function confirmCash(parcelId: string): Promise<Parcel> {
  const { data } = await api.post(`/super-admin/parcels/${parcelId}/confirm-cash`)
  return data.parcel ?? data.data
}

export async function listFree(params: ListParams = {}): Promise<ParcelList> {
  const { data } = await api.get('/public/parcels/free', { params })
  return { parcels: data.parcels ?? data.data ?? [], pagination: data.pagination }
}

export async function track(trackingNumber: string): Promise<Parcel> {
  const { data } = await api.get(`/public/parcels/track/${trackingNumber}`)
  return data.parcel ?? data.data
}

/**
 * Recherche transverse (GET /search/parcels) sur le numéro de suivi, le nom de
 * l'expéditeur et celui du destinataire. Le périmètre est appliqué par l'API
 * selon le rôle : un client ne voit que ses envois, un chauffeur ses missions.
 */
export async function search(params: { q?: string; status?: string }): Promise<Parcel[]> {
  const { data } = await api.get('/search/parcels', { params })
  return (data.parcels ?? data.data ?? []) as Parcel[]
}

export async function timeline(parcelId: string): Promise<ParcelEvent[]> {
  const { data } = await api.get(`/parcels/${parcelId}/timeline`)
  return data.events ?? data.timeline ?? []
}
