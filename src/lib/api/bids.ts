import { api } from './client'
import type { Bid } from './types'

export interface CreateBidPayload {
  parcelId: string
  price: number
  message?: string
  audioUrl?: string
}

/** Chauffeur : faire une offre sur une annonce. */
export async function create(payload: CreateBidPayload): Promise<Bid> {
  const { data } = await api.post('/driver/bids', payload)
  return data.bid ?? data.data
}

/** Offres reçues par le client. */
export async function listReceived(): Promise<Bid[]> {
  const { data } = await api.get('/client/bids/received')
  return data.bids ?? data.data ?? []
}

export async function listForParcel(parcelId: string): Promise<Bid[]> {
  const { data } = await api.get(`/public/parcels/${parcelId}/bids`)
  return data.bids ?? data.data ?? []
}

export async function accept(parcelId: string, bidId: string): Promise<void> {
  await api.post(`/client/parcels/${parcelId}/bids/${bidId}/accept`)
}

export async function reject(parcelId: string, bidId: string): Promise<void> {
  await api.post(`/client/parcels/${parcelId}/bids/${bidId}/reject`)
}

/** Client counter-proposal: a new price + message sent back to the driver. */
export async function negotiate(bidId: string, payload: { price: number; message?: string }): Promise<Bid> {
  const { data } = await api.post(`/client/bids/${bidId}/negotiate`, payload)
  return data.bid ?? data.data
}
