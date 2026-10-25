import { api } from './client'
import type { AuthSession } from './types'

export interface GoogleChallenge {
  status: 'link_required' | 'profile_required'
  challengeToken: string
  email: string
  fullName: string
  expiresAt: string
}
export type GoogleSession = AuthSession & { status: 'authenticated' }
export type GoogleStart = GoogleSession | GoogleChallenge
export type GoogleRegistration = GoogleSession | { status: 'link_required'; identifier: string; email: string }

export async function googleConfiguration(): Promise<{ enabled: boolean; serverClientId: string | null }> {
  const { data } = await api.get('/auth/google/config')
  return data
}
export async function startGoogle(idToken: string): Promise<GoogleStart> {
  const { data } = await api.post('/auth/google', { idToken })
  return data
}
export async function linkGoogle(payload: { challengeToken: string; identifier: string; pin: string }): Promise<GoogleSession> {
  const { data } = await api.post('/auth/google/link', payload)
  return data
}
export async function sendGoogleOtp(payload: { challengeToken: string; phone: string }): Promise<{ sent: boolean; retryAfterSeconds: number }> {
  const { data } = await api.post('/auth/google/phone-otp', payload)
  return data
}
export async function registerGoogle(payload: {
  challengeToken: string; phone: string; otpCode: string; fullName: string
  pin: string; role: 'client' | 'driver'; acceptedTerms: true
}): Promise<GoogleRegistration> {
  const { data } = await api.post('/auth/google/register', payload)
  return data
}
