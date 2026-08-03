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

/**
 * Étape 1 de la récupération d'accès : envoie un code de vérification sur le
 * téléphone / l'email du compte. Quand Brevo n'est pas configuré (dev), l'API
 * renvoie le code en clair — on le remonte tel quel plutôt que de le masquer,
 * sinon le parcours est intestable en local.
 */
export async function forgotPin(identifier: string): Promise<{ sent: boolean; code?: string; message: string }> {
  const { data } = await api.post('/auth/forgot-password', { identifier })
  return { sent: Boolean(data.sent), code: data.code, message: data.message }
}

/** Étape 2 : le code reçu vaut preuve de possession, on pose le nouveau PIN. */
export async function resetPin(payload: { identifier: string; otpCode: string; newPin: string }): Promise<void> {
  await api.post('/auth/reset-password', payload)
}

/** Utilisateur courant (vérifie la validité de la session). */
export async function me(): Promise<User> {
  const { data } = await api.get('/auth/me')
  return data.user
}
