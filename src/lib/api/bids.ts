import { api } from './client'
import type { Bid } from './types'

export interface CreateBidPayload {
  parcelId: string
  price: number
  message?: string
  audioUrl?: string
}

export interface BidNegotiation {
  id: string
  bidId: string
  authorId: string
  authorRole: string
  authorName?: string
  price: number
  message?: string
  type: string
  createdAt: string
}

export interface AcceptBidResponse {
  success: boolean
  finalized: boolean
  bid?: Bid
  parcel?: any
  message?: string
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

export async function accept(parcelId: string, bidId: string): Promise<AcceptBidResponse> {
  const { data } = await api.post(`/client/parcels/${parcelId}/bids/${bidId}/accept`)
  return data
}

export async function reject(parcelId: string, bidId: string): Promise<void> {
  await api.post(`/client/parcels/${parcelId}/bids/${bidId}/reject`)
}

/** Client counter-proposal: a new price + message sent back to the driver. */
export async function negotiate(bidId: string, payload: { price: number; message?: string }): Promise<Bid> {
  const { data } = await api.post(`/client/bids/${bidId}/negotiate`, payload)
  return data.bid ?? data.data
}

/** Driver responds to a counter-offer: accept, counter, or reject. */
export async function driverRespond(bidId: string, payload: { action: 'accept' | 'counter' | 'reject'; price?: number; message?: string }): Promise<{ bid?: Bid; parcel?: any; finalized?: boolean }> {
  const { data } = await api.post(`/driver/bids/${bidId}/respond`, payload)
  return data
}

/** Get negotiation history for a bid. */
export async function getNegotiations(bidId: string): Promise<BidNegotiation[]> {
  const { data } = await api.get(`/bids/${bidId}/negotiations`)
  return data.negotiations ?? []
}
