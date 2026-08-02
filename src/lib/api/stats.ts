import { api } from './client'

/**
 * Statistiques personnelles / de rôle.
 * Toutes ces routes existent côté API (mobile.routes.js) et renvoient
 * l'enveloppe `{ success, message, stats }` — les données sont à plat.
 */

/** GET /users/stats — compteurs personnels, tous rôles confondus. */
export interface UserStats {
  totalParcels: number
  activeParcels: number
  deliveredParcels: number
  pendingBids: number
  unreadNotifications: number
  scoreBalance: number
}

export async function userStats(): Promise<UserStats> {
  const { data } = await api.get('/users/stats')
  const s = (data.stats ?? data.data?.stats ?? {}) as Partial<UserStats>
  return {
    totalParcels: s.totalParcels ?? 0,
    activeParcels: s.activeParcels ?? 0,
    deliveredParcels: s.deliveredParcels ?? 0,
    pendingBids: s.pendingBids ?? 0,
    unreadNotifications: s.unreadNotifications ?? 0,
    scoreBalance: s.scoreBalance ?? 0,
  }
}

/** GET /client/bids/stats — offres reçues sur les colis du client. */
export interface ClientBidStats {
  received: number
  pending: number
  accepted: number
  rejected: number
}

export async function clientBidStats(): Promise<ClientBidStats> {
  const { data } = await api.get('/client/bids/stats')
  const s = (data.stats ?? data.data?.stats ?? {}) as Partial<ClientBidStats>
  return {
    received: s.received ?? 0,
    pending: s.pending ?? 0,
    accepted: s.accepted ?? 0,
    rejected: s.rejected ?? 0,
  }
}

/** GET /driver/stats — activité du chauffeur connecté. */
export interface DriverStats {
  assignedParcels: number
  activeParcels: number
  completedDeliveries: number
  rating: number
  scoreBalance: number
  pendingBids: number
  openAdvertisements: number
}

export async function driverStats(): Promise<DriverStats> {
  const { data } = await api.get('/driver/stats')
  const s = (data.stats ?? data.data?.stats ?? {}) as Partial<DriverStats>
  return {
    assignedParcels: s.assignedParcels ?? 0,
    activeParcels: s.activeParcels ?? 0,
    completedDeliveries: s.completedDeliveries ?? 0,
    rating: Number(s.rating ?? 0),
    scoreBalance: s.scoreBalance ?? 0,
    pendingBids: s.pendingBids ?? 0,
    openAdvertisements: s.openAdvertisements ?? 0,
  }
}

/** GET /garage-admin/stats — activité de la zone de l'admin connecté. */
export interface GarageStats {
  zoneId: string | null
  totalParcels: number
  activeParcels: number
  deliveredToday: number
  activeDrivers: number
  revenue: number
  parcelsByStatus: Record<string, number>
}

export async function garageStats(): Promise<GarageStats> {
  const { data } = await api.get('/garage-admin/stats')
  const s = (data.stats ?? data.data?.stats ?? {}) as Record<string, unknown>
  return {
    zoneId: (s.zoneId as string) ?? null,
    totalParcels: Number(s.totalParcels ?? 0),
    activeParcels: Number(s.activeParcels ?? 0),
    deliveredToday: Number(s.deliveredToday ?? 0),
    activeDrivers: Number(s.activeDrivers ?? 0),
    revenue: Number(s.revenue ?? 0),
    parcelsByStatus: (s.parcelsByStatus as Record<string, number>) ?? {},
  }
}

/** GET /super-admin/stats — vue plateforme (super admin + support). */
export interface GlobalStats {
  totalUsers: number
  totalDrivers: number
  totalClients: number
  totalZones: number
  totalVehicles: number
  totalParcels: number
  parcelsInTransit: number
  parcelsDeliveredToday: number
  parcelsPending: number
  totalRevenue: number
}

export async function globalStats(): Promise<GlobalStats> {
  const { data } = await api.get('/super-admin/stats')
  const s = (data.stats ?? data.data?.stats ?? {}) as Record<string, unknown>
  const num = (key: string) => Number(s[key] ?? 0)
  return {
    totalUsers: num('totalUsers'),
    totalDrivers: num('totalDrivers'),
    totalClients: num('totalClients'),
    totalZones: num('totalGarages'),
    totalVehicles: num('totalVehicles'),
    totalParcels: num('totalParcels'),
    parcelsInTransit: num('parcelsInTransit'),
    parcelsDeliveredToday: num('parcelsDeliveredToday'),
    parcelsPending: num('parcelsPending'),
    totalRevenue: num('totalRevenue'),
  }
}

/** GET /advertisements/stats — annonces du chauffeur connecté (global sinon). */
export interface AdvertisementStats {
  total: number
  open: number
  closed: number
}

export async function advertisementStats(): Promise<AdvertisementStats> {
  const { data } = await api.get('/advertisements/stats')
  const s = (data.stats ?? data.data?.stats ?? {}) as Partial<AdvertisementStats>
  return { total: s.total ?? 0, open: s.open ?? 0, closed: s.closed ?? 0 }
}
