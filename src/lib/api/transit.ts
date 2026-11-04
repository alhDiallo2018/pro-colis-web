import { api } from './client'
import type { TransitOperator, TransitDirection } from '@/ds'

export interface TransitZone {
  id: string
  name: string
  latitude: number
  longitude: number
  status: string
}

export interface TransitStop {
  order: number
  label: string
  zoneId: string
  zone: TransitZone | null
}

export interface TransitLineSummary {
  id: string
  operator: TransitOperator
  number: string
  direction: TransitDirection
  name: string
  origin: string
  destination: string
}

export interface TransitLineDetail extends TransitLineSummary {
  stops: TransitStop[]
}

export interface TransitLiveAdvertisement {
  id: string
  driverId: string
  driverName: string
  departureAt: string | null
  availableWeight: number | null
  proposedPrice: number | null
  live: {
    latitude: number
    longitude: number
    accuracyMeters: number
    capturedAt: string
  } | null
}

export interface TransitLiveResponse {
  line: TransitLineSummary
  advertisements: TransitLiveAdvertisement[]
}

export interface TransitDraftResponse {
  transitLineId: string
  departureZoneId: string
  arrivalZoneId: string
  departureCity: string
  arrivalCity: string
  itinerary: {
    serviceType: 'shuttle'
    lineNumber: string
    stops: { zoneId: string; offsetMinutes: number }[]
  }
}

export async function listTransitLines(operator?: TransitOperator) {
  const params = operator ? { operator } : {}
  const { data } = await api.get<{ lines: TransitLineSummary[] }>('/transit/lines', { params })
  return data.lines
}

export async function getTransitLine(lineId: string) {
  const { data } = await api.get<{ line: TransitLineDetail }>(`/transit/lines/${lineId}`)
  return data.line
}

export async function getTransitLineLive(lineId: string) {
  const { data } = await api.get<TransitLiveResponse>(`/transit/lines/${lineId}/live`)
  return data
}

export async function getTransitDraft(lineId: string) {
  const { data } = await api.get<TransitDraftResponse>(`/transit/lines/${lineId}/draft`)
  return data
}

export async function searchTransitStops(q: string) {
  const { data } = await api.get<{ stops: TransitZone[] }>('/transit/stops/search', {
    params: { q },
  })
  return data.stops
}
