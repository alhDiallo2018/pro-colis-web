import { api } from './client'

export type HandoverStatus = 'pending_pickup' | 'completed' | 'cancelled'

export interface ParcelHandover {
  id: string
  parcelId: string
  fromDriverId: string
  toDriverId: string
  fromAdvertisementId?: string | null
  toAdvertisementId?: string | null
  latitude?: number | null
  longitude?: number | null
  initiatedAt: string
  confirmedAt?: string | null
  cancelledAt?: string | null
  status: HandoverStatus
  pickupPinLast4?: string | null
  pickupProofType?: string | null
  cancellationReason?: string | null
}

export interface InitiatedHandover {
  handover: ParcelHandover
  pickupPin: string
  pickupQrToken: string
}

export interface InitiateHandoverPayload {
  toDriverId: string
  latitude?: number
  longitude?: number
  fromAdvertisementId?: string
  toAdvertisementId?: string
}

export async function initiateHandover(
  parcelId: string,
  payload: InitiateHandoverPayload,
): Promise<InitiatedHandover> {
  const { data } = await api.post(`/parcels/${parcelId}/handovers`, payload)
  return {
    handover: data.handover ?? data.data?.handover,
    pickupPin: data.pickupPin ?? data.data?.pickupPin,
    pickupQrToken: data.pickupQrToken ?? data.data?.pickupQrToken,
  }
}

export async function listHandovers(parcelId: string): Promise<ParcelHandover[]> {
  const { data } = await api.get(`/parcels/${parcelId}/handovers`)
  return data.handovers ?? data.data?.handovers ?? []
}

export async function confirmHandover(
  parcelId: string,
  handoverId: string,
  payload: { pin: string; qrToken: string },
): Promise<ParcelHandover> {
  const { data } = await api.post(
    `/parcels/${parcelId}/handovers/${handoverId}/confirm`,
    payload,
  )
  return data.handover ?? data.data?.handover
}

export async function cancelHandover(
  parcelId: string,
  handoverId: string,
  payload: { reason?: string } = {},
): Promise<ParcelHandover> {
  const body: { reason?: string } = {}
  const reason = payload.reason?.trim()
  if (reason) body.reason = reason
  const { data } = await api.post(
    `/parcels/${parcelId}/handovers/${handoverId}/cancel`,
    body,
  )
  return data.handover ?? data.data?.handover
}

export const HANDOVERABLE_PARCEL_STATUSES = ['picked_up', 'in_transit', 'arrived'] as const
export type HandoverableParcelStatus = (typeof HANDOVERABLE_PARCEL_STATUSES)[number]
export function canHandoverParcel(status: string | null | undefined): status is HandoverableParcelStatus {
  return !!status && (HANDOVERABLE_PARCEL_STATUSES as readonly string[]).includes(status)
}
