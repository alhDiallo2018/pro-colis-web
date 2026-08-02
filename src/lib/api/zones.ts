import { api } from './client'
import type { Zone, ZoneDriver } from './types'

export interface ZonePayload {
  name: string
  displayName?: string | null
  placeId?: string | null
  country?: string | null
  city?: string | null
  latitude: number
  longitude: number
  radius?: number
  boundary?: number[][] | null
  type?: 'CIRCLE' | 'POLYGON'
  isActive?: boolean
  parentId?: string | null
  metadata?: Record<string, unknown>
}

export async function listPublic(): Promise<Zone[]> {
  const { data } = await api.get('/public/zones')
  return data.data ?? []
}

export async function listZones(params?: {
  page?: number
  limit?: number
  country?: string
  city?: string
  type?: string
  isActive?: boolean
  status?: 'approved' | 'pending' | 'rejected'
  source?: string
  search?: string
}): Promise<{ zones: Zone[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> {
  const { data } = await api.get('/super-admin/zones', { params })
  return { zones: data.data ?? [], pagination: data.pagination }
}

export interface ResolveZonePayload {
  placeId?: string
  name?: string
  displayName?: string
  latitude: number
  longitude: number
  country?: string
  region?: string
  city?: string
}

export interface ResolvedZone {
  zone: Zone
  created: boolean
  pending?: boolean
  matchedBy?: 'placeId' | 'proximity' | 'created' | string
}

/** Résout un lieu Google Places en zone (la crée en "pending" si nécessaire). */
export async function resolveZone(payload: ResolveZonePayload): Promise<ResolvedZone> {
  const { data } = await api.post('/zones/resolve', payload)
  return {
    zone: data.data,
    created: data.created ?? false,
    pending: data.pending,
    matchedBy: data.matchedBy,
  }
}

/** Admin : approuver / rejeter une zone en attente. */
export async function setZoneStatus(zoneId: string, status: 'approved' | 'rejected' | 'pending'): Promise<Zone> {
  const { data } = await api.patch(`/super-admin/zones/${zoneId}/status`, { status })
  return data.data
}

export async function getZone(zoneId: string): Promise<Zone> {
  const { data } = await api.get(`/super-admin/zones/${zoneId}`)
  return data.data
}

export async function createZone(payload: ZonePayload): Promise<Zone> {
  const { data } = await api.post('/super-admin/zones', payload)
  return data.data
}

export async function updateZone(zoneId: string, payload: Partial<ZonePayload>): Promise<Zone> {
  const { data } = await api.put(`/super-admin/zones/${zoneId}`, payload)
  return data.data
}

export async function deleteZone(zoneId: string): Promise<void> {
  await api.delete(`/super-admin/zones/${zoneId}`)
}

export async function detectZone(latitude: number, longitude: number): Promise<Zone[]> {
  const { data } = await api.get('/zones/detect', { params: { latitude, longitude } })
  return data.data ?? []
}

export async function getZoneDrivers(zoneId: string): Promise<ZoneDriver[]> {
  const { data } = await api.get(`/super-admin/zones/${zoneId}/drivers`)
  return data.data ?? []
}

export async function assignDriver(zoneId: string, driverId: string, isPrimary?: boolean): Promise<void> {
  await api.post(`/super-admin/zones/${zoneId}/drivers`, { driverId, isPrimary })
}

export async function bulkAssignDrivers(zoneId: string, driverIds: string[], isPrimary?: boolean): Promise<void> {
  await api.post(`/super-admin/zones/${zoneId}/drivers/bulk`, { driverIds, isPrimary })
}

export async function removeDriver(zoneId: string, driverId: string): Promise<void> {
  await api.delete(`/super-admin/zones/${zoneId}/drivers`, { data: { driverId } })
}
