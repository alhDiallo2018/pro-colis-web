import { api } from './client'
import type { Bid, ListParams, Pagination, Parcel, User, Zone } from './types'

interface ParcelList {
  parcels: Parcel[]
  pagination?: Pagination
}

// --- Driver ---
export async function driverParcels(params: ListParams = {}): Promise<ParcelList> {
  const { data } = await api.get('/driver/parcels', { params })
  return { parcels: data.parcels ?? [], pagination: data.pagination }
}

export async function driverParcel(parcelId: string): Promise<Parcel> {
  const { data } = await api.get(`/driver/parcels/${parcelId}`)
  return data.parcel ?? data.data
}

export async function driverBidsSent(): Promise<Bid[]> {
  const { data } = await api.get('/driver/bids/sent')
  return data.bids ?? data.data ?? []
}

/** Lifecycle steps a driver advances a parcel through. */
export type DriverStep = 'confirm' | 'pickup' | 'transit' | 'arrived' | 'out-for-delivery' | 'deliver'

export async function driverAdvance(parcelId: string, step: DriverStep): Promise<Parcel> {
  const { data } = await api.put(`/driver/parcels/${parcelId}/${step}`)
  return data.parcel ?? data.data
}

export interface DeliverPayload {
  otp: string
  recipientNote?: string
}

/** Confirm delivery — requires the recipient's OTP code (proof of receipt). */
export async function driverDeliver(parcelId: string, payload: DeliverPayload): Promise<Parcel> {
  const { data } = await api.put(`/driver/parcels/${parcelId}/deliver`, payload)
  return data.parcel ?? data.data
}

// --- Garage admin ---
export async function garageParcels(params: ListParams = {}): Promise<ParcelList> {
  const { data } = await api.get('/garage-admin/parcels', { params })
  return { parcels: data.parcels ?? [], pagination: data.pagination }
}

export async function garageDrivers(): Promise<User[]> {
  const { data } = await api.get('/garage-admin/drivers')
  return data.drivers ?? data.data ?? []
}

export async function garageAssignDriver(parcelId: string, driverId: string): Promise<Parcel> {
  const { data } = await api.put(`/garage-admin/parcels/${parcelId}/assign-driver`, { driverId })
  return data.parcel ?? data.data
}

/** Suppression d'un colis de la zone par l'admin de garage. */
export async function garageDeleteParcel(parcelId: string): Promise<void> {
  await api.delete(`/garage-admin/parcels/${parcelId}`)
}

/** Drivers of a given garage (public endpoint) — used by "Mon garage". */
export async function garageColleagues(zoneId: string): Promise<User[]> {
  const { data } = await api.get(`/public/drivers/zone/${zoneId}`)
  return data.drivers ?? data.data ?? []
}

// --- Super admin ---
export async function adminParcels(params: ListParams = {}): Promise<ParcelList> {
  const { data } = await api.get('/super-admin/parcels', { params })
  return { parcels: data.parcels ?? [], pagination: data.pagination }
}

export async function adminDeleteParcel(parcelId: string): Promise<void> {
  await api.delete(`/super-admin/parcels/${parcelId}`)
}

export async function adminZones(): Promise<Zone[]> {
  const { data } = await api.get('/super-admin/zones')
  return data.zones ?? data.data ?? []
}

export async function searchDrivers(): Promise<User[]> {
  const { data } = await api.get('/public/drivers/search')
  return data.drivers ?? data.data ?? []
}

interface UserList {
  users: User[]
  pagination?: Pagination
}

export async function adminUsers(params: ListParams = {}): Promise<UserList> {
  const { data } = await api.get('/super-admin/users', { params })
  return { users: data.users ?? data.data ?? [], pagination: data.pagination }
}

export async function adminUpdateUserStatus(userId: string, status: 'active' | 'suspended'): Promise<User> {
  const { data } = await api.patch(`/super-admin/users/${userId}/status`, { status })
  return data.user ?? data.data
}

export interface AdminUserPayload {
  fullName: string
  phone: string
  email?: string | null
  role: string
  status?: string
  address?: string | null
  city?: string | null
  region?: string | null
  /** Création uniquement — PIN initial du compte. */
  pin?: string
  gender?: string | null
  vehiclePlate?: string | null
  vehicleModel?: string | null
  driverStatus?: string | null
}

export async function adminCreateUser(payload: AdminUserPayload): Promise<User> {
  const { data } = await api.post('/super-admin/users', payload)
  return data.user ?? data.data
}

export async function adminUpdateUser(userId: string, payload: Partial<AdminUserPayload>): Promise<User> {
  const { data } = await api.put(`/super-admin/users/${userId}`, payload)
  return data.user ?? data.data
}

export async function adminDeleteUser(userId: string): Promise<void> {
  await api.delete(`/super-admin/users/${userId}`)
}

/** Réinitialise le PIN d'un utilisateur — le backend renvoie le nouveau PIN. */
export async function adminResetUserPin(userId: string): Promise<string | null> {
  const { data } = await api.post(`/super-admin/users/${userId}/reset-pin`)
  return (data.pin as string) ?? (data.newPin as string) ?? null
}

/** Global stats — shape is backend-defined, returned as a loose record. */
export async function adminStats(): Promise<Record<string, unknown>> {
  const { data } = await api.get('/super-admin/stats')
  const { success, message, ...rest } = data
  void success
  void message
  return (rest.stats as Record<string, unknown>) ?? (rest.data as Record<string, unknown>) ?? rest
}

export async function adminGetConfig(): Promise<Record<string, unknown>> {
  const { data } = await api.get('/super-admin/config')
  return (data.config as Record<string, unknown>) ?? (data.data as Record<string, unknown>) ?? {}
}

export async function adminUpdateConfig(config: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { data } = await api.put('/super-admin/config', config)
  return (data.config as Record<string, unknown>) ?? (data.data as Record<string, unknown>) ?? config
}
