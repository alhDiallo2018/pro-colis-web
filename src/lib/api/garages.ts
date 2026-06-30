import { api } from './client'
import type { Garage } from './types'

/** Liste publique des garages actifs (sélecteurs de trajet). */
export async function listPublic(): Promise<Garage[]> {
  const { data } = await api.get('/public/garages')
  return data.garages ?? data.data ?? []
}
