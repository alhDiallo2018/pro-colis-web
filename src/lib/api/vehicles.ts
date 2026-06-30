import { api } from './client'

export interface Vehicle {
  id: string
  plateNumber: string
  model: string
  type: string
  capacity: number
  garageId?: string | null
  driverId?: string | null
  isAvailable?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface VehiclePayload {
  plateNumber: string
  model: string
  type: string
  capacity?: number
}

/** Véhicule du chauffeur courant (null s'il n'en a pas encore). */
export async function getMine(): Promise<Vehicle | null> {
  const { data } = await api.get('/driver/vehicle')
  return data.vehicle ?? null
}

/** Crée ou met à jour le véhicule du chauffeur courant. */
export async function upsert(payload: VehiclePayload): Promise<Vehicle> {
  const { data } = await api.put('/driver/vehicle', payload)
  return data.vehicle ?? data.data
}
