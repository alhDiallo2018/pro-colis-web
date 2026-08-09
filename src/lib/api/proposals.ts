import { api } from './client'
import type { Parcel } from './types'

/**
 * Propositions directes : quand un client choisit lui-même son chauffeur, le
 * colis n'est pas assigné pour autant. Le chauffeur reçoit une offre qu'il peut
 * accepter, refuser ou négocier, et la main passe alternativement d'un camp à
 * l'autre — voir `ParcelProposal.lastOfferBy`.
 */

export type DriverProposalAction = 'accept' | 'reject' | 'counter'
export type ClientProposalAction = 'accept' | 'counter'

export interface ProposalResponsePayload {
  price?: number
  message?: string
}

/** Chauffeur : propositions reçues, en attente ou en négociation. */
export async function listForDriver(): Promise<Parcel[]> {
  const { data } = await api.get('/driver/proposals')
  return data.parcels ?? []
}

/** Chauffeur : accepter, refuser ou contre-proposer. */
export async function driverRespond(
  parcelId: string,
  action: DriverProposalAction,
  payload: ProposalResponsePayload = {},
): Promise<Parcel> {
  const { data } = await api.post(`/driver/proposals/${parcelId}/respond`, { action, ...payload })
  return data.parcel
}

/** Client : répondre à la contre-offre du chauffeur. */
export async function clientRespond(
  parcelId: string,
  action: ClientProposalAction,
  payload: ProposalResponsePayload = {},
): Promise<Parcel> {
  const { data } = await api.post(`/client/proposals/${parcelId}/respond-counter`, { action, ...payload })
  return data.parcel
}
