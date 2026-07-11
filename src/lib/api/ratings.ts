import { api } from './client'
import type { User } from './types'

export interface Rating {
  id: string
  parcelId?: string | null
  driverId?: string | null
  ratedBy: string
  rating: number
  comment?: string | null
  author?: User | null
  createdAt?: string
}

export interface CreateRatingPayload {
  driverId: string
  parcelId?: string | null
  rating: number
  comment?: string | null
}

export async function createRating(payload: CreateRatingPayload): Promise<Rating> {
  const { data } = await api.post('/ratings', payload)
  return data.rating ?? data.data
}

export async function getDriverRatings(driverId: string): Promise<Rating[]> {
  const { data } = await api.get(`/ratings/driver/${driverId}`)
  return data.ratings ?? data.data ?? []
}
