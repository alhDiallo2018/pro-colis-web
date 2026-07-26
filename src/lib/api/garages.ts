import { api } from './client'
import type { Garage } from './types'

/** Nombre max de pages parcourues — garde-fou contre une pagination incohérente. */
const MAX_GARAGE_PAGES = 20
const GARAGE_PAGE_SIZE = 100

/**
 * Liste publique des garages actifs (sélecteurs de trajet).
 *
 * L'API pagine cette route (20 par défaut, 100 au maximum) : sans parcours
 * complet, les sélecteurs n'affichent qu'une fraction des zones et l'utilisateur
 * croit à tort que sa zone n'existe pas.
 */
export async function listPublic(): Promise<Garage[]> {
  const all: Garage[] = []
  let page = 1
  let totalPages = 1

  do {
    const { data } = await api.get('/public/garages', { params: { page, limit: GARAGE_PAGE_SIZE } })
    const batch: Garage[] = data.garages ?? data.data ?? []
    all.push(...batch)
    totalPages = data.pagination?.totalPages ?? 1
    // Une API qui ignorerait la pagination renverrait la même page indéfiniment.
    if (batch.length < GARAGE_PAGE_SIZE) break
    page += 1
  } while (page <= totalPages && page <= MAX_GARAGE_PAGES)

  return all
}

export interface GaragePayload {
  name: string
  country: string
  city: string
  region: string
  address?: string | null
  phone?: string | null
  latitude?: number | null
  longitude?: number | null
  isActive?: boolean
}

/** Création d'une zone (super admin) — n'importe où dans le monde. */
export async function createGarage(payload: GaragePayload): Promise<Garage> {
  const { data } = await api.post('/super-admin/garages', payload)
  return data.garage ?? data.data
}

/** Mise à jour d'une zone (super admin). */
export async function updateGarage(garageId: string, payload: Partial<GaragePayload>): Promise<Garage> {
  const { data } = await api.put(`/super-admin/garages/${garageId}`, payload)
  return data.garage ?? data.data
}

/** Suppression (logique) d'une zone (super admin). */
export async function deleteGarage(garageId: string): Promise<void> {
  await api.delete(`/super-admin/garages/${garageId}`)
}
