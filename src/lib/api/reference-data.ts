// Client HTTP des referentiels editables (phase 2 + phase 5).
//
// Sept listes dynamiques sont servies par l'API :
//  - phase 2 : vehicle-types, document-types, expense-categories
//  - phase 5 : parcel-categories, payment-methods, driver-statuses,
//    incident-severities
// Chaque liste expose une route publique (`/reference/...`) pour les ecrans
// et une route admin (`/admin/reference/...`) pour la gestion. Les types
// miroitent `prisma/schema.prisma`.
import { api } from './client'

export type ReferenceType =
  | 'vehicle-types'
  | 'document-types'
  | 'expense-categories'
  | 'parcel-categories'
  | 'payment-methods'
  | 'driver-statuses'
  | 'incident-severities'

/** Enveloppe lecture : chaque entite partage ces champs communs. */
export interface ReferenceItemBase {
  id: string
  code: string
  label: string
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface VehicleTypeItem extends ReferenceItemBase {
  category: string
  maxWeightKg: number | null
  maxVolumeM3: number | null
}

export interface DocumentTypeItem extends ReferenceItemBase {
  appliesTo: string
  isRequired: boolean
}

export type ExpenseCategoryItem = ReferenceItemBase

export interface ParcelCategoryItem extends ReferenceItemBase {
  icon: string | null
  maxWeightKg: number | null
  isFragile: boolean
}

export interface PaymentMethodItem extends ReferenceItemBase {
  provider: string | null
  channel: string
}

export interface DriverStatusItem extends ReferenceItemBase {
  color: string | null
}

export interface IncidentSeverityItem extends ReferenceItemBase {
  color: string | null
  slaHours: number | null
}

export interface ReferencePayload {
  code: string
  label: string
  isActive?: boolean
  sortOrder?: number
  // Specialisations : ignorees par l'API si le champ n'existe pas pour l'entite.
  category?: string
  maxWeightKg?: number | null
  maxVolumeM3?: number | null
  appliesTo?: string
  isRequired?: boolean
  // Phase 5
  icon?: string | null
  isFragile?: boolean
  provider?: string | null
  channel?: string
  color?: string | null
  slaHours?: number | null
}

// --- Lecture publique (cache cote API 5 min) ---

export async function listPublicVehicleTypes(category?: string): Promise<VehicleTypeItem[]> {
  const { data } = await api.get('/reference/vehicle-types', { params: category ? { category } : undefined })
  return data.data ?? []
}

export async function listPublicDocumentTypes(appliesTo?: string): Promise<DocumentTypeItem[]> {
  const { data } = await api.get('/reference/document-types', { params: appliesTo ? { appliesTo } : undefined })
  return data.data ?? []
}

export async function listPublicExpenseCategories(): Promise<ExpenseCategoryItem[]> {
  const { data } = await api.get('/reference/expense-categories')
  return data.data ?? []
}

export async function listPublicParcelCategories(): Promise<ParcelCategoryItem[]> {
  const { data } = await api.get('/reference/parcel-categories')
  return data.data ?? []
}

export async function listPublicPaymentMethods(channel?: string): Promise<PaymentMethodItem[]> {
  const { data } = await api.get('/reference/payment-methods', { params: channel ? { channel } : undefined })
  return data.data ?? []
}

export async function listPublicDriverStatuses(): Promise<DriverStatusItem[]> {
  const { data } = await api.get('/reference/driver-statuses')
  return data.data ?? []
}

export async function listPublicIncidentSeverities(): Promise<IncidentSeverityItem[]> {
  const { data } = await api.get('/reference/incident-severities')
  return data.data ?? []
}

// --- Admin : liste paginee + CRUD ---

export interface AdminListParams {
  page?: number
  limit?: number
  isActive?: boolean
  search?: string
  category?: string
  appliesTo?: string
  channel?: string
}

export interface Paginated<T> {
  items: T[]
  pagination: { total: number; page: number; limit: number; totalPages: number }
}

async function adminList<T>(type: ReferenceType, params?: AdminListParams): Promise<Paginated<T>> {
  const { data } = await api.get(`/admin/reference/${type}`, { params })
  return { items: data.data ?? [], pagination: data.pagination }
}

export const listAdminVehicleTypes = (params?: AdminListParams) =>
  adminList<VehicleTypeItem>('vehicle-types', params)
export const listAdminDocumentTypes = (params?: AdminListParams) =>
  adminList<DocumentTypeItem>('document-types', params)
export const listAdminExpenseCategories = (params?: AdminListParams) =>
  adminList<ExpenseCategoryItem>('expense-categories', params)
export const listAdminParcelCategories = (params?: AdminListParams) =>
  adminList<ParcelCategoryItem>('parcel-categories', params)
export const listAdminPaymentMethods = (params?: AdminListParams) =>
  adminList<PaymentMethodItem>('payment-methods', params)
export const listAdminDriverStatuses = (params?: AdminListParams) =>
  adminList<DriverStatusItem>('driver-statuses', params)
export const listAdminIncidentSeverities = (params?: AdminListParams) =>
  adminList<IncidentSeverityItem>('incident-severities', params)

export async function createReferenceItem<T>(type: ReferenceType, payload: ReferencePayload): Promise<T> {
  const { data } = await api.post(`/admin/reference/${type}`, payload)
  return data.data
}

export async function updateReferenceItem<T>(
  type: ReferenceType,
  id: string,
  payload: Partial<ReferencePayload>,
): Promise<T> {
  const { data } = await api.put(`/admin/reference/${type}/${id}`, payload)
  return data.data
}

/** Suppression douce cote API : bascule `isActive` a false. */
export async function deactivateReferenceItem<T>(type: ReferenceType, id: string): Promise<T> {
  const { data } = await api.delete(`/admin/reference/${type}/${id}`)
  return data.data
}
