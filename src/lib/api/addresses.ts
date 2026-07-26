import { api } from './client'
import type { Garage } from './types'

/** Carnet d'adresses de l'utilisateur connecté (GET/POST/PUT/DELETE /addresses). */
export interface Address {
  id: string
  userId?: string
  label?: string | null
  address: string
  city?: string | null
  region?: string | null
  latitude?: number | string | null
  longitude?: number | string | null
  isDefault: boolean
  createdAt?: string
  updatedAt?: string
}

export interface AddressPayload {
  label?: string | null
  address: string
  city?: string | null
  region?: string | null
  latitude?: number | null
  longitude?: number | null
  isDefault?: boolean
}

export async function listAddresses(): Promise<Address[]> {
  const { data } = await api.get('/addresses')
  return (data.addresses ?? data.data?.addresses ?? []) as Address[]
}

export async function createAddress(payload: AddressPayload): Promise<Address> {
  const { data } = await api.post('/addresses', payload)
  return (data.address ?? data.data?.address) as Address
}

export async function updateAddress(addressId: string, payload: Partial<AddressPayload>): Promise<Address> {
  const { data } = await api.put(`/addresses/${addressId}`, payload)
  return (data.address ?? data.data?.address) as Address
}

export async function deleteAddress(addressId: string): Promise<void> {
  await api.delete(`/addresses/${addressId}`)
}

export async function setDefaultAddress(addressId: string): Promise<void> {
  await api.patch(`/addresses/${addressId}/default`)
}

/** Zones favorites de l'utilisateur (GET/POST/DELETE /favorites/garages). */
export async function favoriteGarages(): Promise<Garage[]> {
  const { data } = await api.get('/favorites/garages')
  return (data.garages ?? data.data?.garages ?? []) as Garage[]
}

export async function addFavoriteGarage(garageId: string): Promise<void> {
  await api.post(`/favorites/garages/${garageId}`)
}

export async function removeFavoriteGarage(garageId: string): Promise<void> {
  await api.delete(`/favorites/garages/${garageId}`)
}
