import { api } from './client'
import type { AuthSession, Role, User } from './types'

export interface LoginPayload {
  identifier: string
  pin: string
}

export interface RegisterPayload {
  phone: string
  fullName: string
  email?: string | null
  pin?: string
  password?: string
  role?: Role
  address?: string | null
  city?: string | null
  region?: string | null
  zoneId?: string | null
}

/** Connexion par identifiant (email/téléphone) + code PIN. */
export async function loginWithPin(payload: LoginPayload): Promise<AuthSession> {
  const { data } = await api.post('/auth/login-with-pin', payload)
  return { user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken }
}

export async function register(payload: RegisterPayload): Promise<AuthSession> {
  const { data } = await api.post('/auth/register', payload)
  return { user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken }
}

/** Utilisateur courant (vérifie la validité de la session). */
export async function me(): Promise<User> {
  const { data } = await api.get('/auth/me')
  return data.user
}
