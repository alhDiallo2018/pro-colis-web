// Client HTTP des referentiels editables (phase 2).
//
// Trois listes dynamiques sont servies par l'API : vehicle-types,
// document-types, expense-categories. Chaque liste expose une route publique
// (`/reference/...`) pour les ecrans et une route admin (`/admin/reference/...`)
// pour la gestion. Les types miroitent `prisma/schema.prisma`.
import { api } from './client'

export type ReferenceType = 'vehicle-types' | 'document-types' | 'expense-categories'

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

// --- Admin : liste paginee + CRUD ---

export interface AdminListParams {
  page?: number
  limit?: number
  isActive?: boolean
  search?: string
  category?: string
  appliesTo?: string
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
