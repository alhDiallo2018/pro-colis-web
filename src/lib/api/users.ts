import { api } from './client'
import type { Role, User } from './types'

export interface ProfilePayload {
  fullName?: string
  email?: string | null
  address?: string | null
  city?: string | null
  region?: string | null
  profilePhoto?: string | null
}

const PROFILE_PATH: Record<Role, string> = {
  client: '/client/profile',
  driver: '/driver/profile',
  admin: '/garage-admin/profile',
  super_admin: '/super-admin/profile',
  support: '/super-admin/profile',
  support_technique: '/support-technique/profile',
  support_commercial: '/support-commercial/profile',
}

/** Met à jour le profil de l'utilisateur courant selon son rôle. */
export async function updateProfile(role: Role, payload: ProfilePayload): Promise<User> {
  const { data } = await api.put(PROFILE_PATH[role], payload)
  return data.user ?? data.data
}

/** Change le code PIN de l'utilisateur courant. */
export async function changePin(payload: { currentPin: string; newPin: string }): Promise<void> {
  await api.put('/users/pin', payload)
}

/** Met à jour le statut de disponibilité du chauffeur (driverStatus). */
export async function updateDriverStatus(status: 'available' | 'busy' | 'offline'): Promise<User> {
  const { data } = await api.put('/driver/profile', { driverStatus: status })
  return data.user ?? data.data
}
