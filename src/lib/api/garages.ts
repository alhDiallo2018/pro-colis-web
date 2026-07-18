import { api } from './client'
import type { Garage } from './types'

/** Liste publique des garages actifs (sélecteurs de trajet). */
export async function listPublic(): Promise<Garage[]> {
  const { data } = await api.get('/public/garages')
  return data.garages ?? data.data ?? []
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
