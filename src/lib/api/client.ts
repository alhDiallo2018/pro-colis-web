import axios, { AxiosError, type InternalAxiosRequestConfig, type AxiosInstance } from 'axios'
import { authStore, useAuthStore } from '@/store/auth'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

/** Standard error envelope from the API: { success:false, message, error:{ code, details } }. */
export class ApiError extends Error {
  code: string
  status: number
  details: unknown[]
  constructor(message: string, code = 'INTERNAL_ERROR', status = 500, details: unknown[] = []) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.details = details
  }
}

/** Transport sans intercepteur pour ne jamais boucler sur /auth/refresh. */
const bare = axios.create({ baseURL: BASE_URL, timeout: 30_000 })
export const api: AxiosInstance = axios.create({ baseURL: BASE_URL, timeout: 30_000 })

type AuthRequest = InternalAxiosRequestConfig & {
  _retried?: boolean
  _authSessionId?: string | null
  _authAccessToken?: string | null
}
const publicAuthRoutes = new Set([
  '/auth/login', '/auth/login-with-pin', '/auth/register', '/auth/refresh',
  // Une preuve Google/PIN refusee ne doit jamais declencher une rotation de session.
  '/auth/google/config', '/auth/google', '/auth/google/link', '/auth/google/phone-otp', '/auth/google/register',
  '/auth/logout', '/auth/forgot-password', '/auth/reset-password',
  '/auth/send-otp', '/auth/verify-otp', '/auth/verify-email', '/auth/resend-verification',
])
const isPublicAuth = (url = '') => publicAuthRoutes.has(url.split('?')[0])

api.interceptors.request.use((config: AuthRequest) => {
  const state = authStore.get()
  if (config._retried && config._authSessionId !== state.sessionId) {
    throw new ApiError('Session modifiée', 'SESSION_CHANGED', 0)
  }
  config._authSessionId = state.sessionId
  config._authAccessToken = state.accessToken
  if (state.accessToken && !isPublicAuth(config.url)) {
    config.headers.set('Authorization', `Bearer ${state.accessToken}`)
  }
  return config
})

function asApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  const failure = error as AxiosError<{ message?: string; error?: { code?: string; details?: unknown[] } }>
  return new ApiError(failure.response?.data?.message || failure.message || 'Erreur réseau',
    failure.response?.data?.error?.code || 'NETWORK_ERROR', failure.response?.status ?? 0,
    failure.response?.data?.error?.details ?? [])
}

let refreshFlight: { sessionId: string | null; promise: Promise<string> } | null = null

async function refreshAccessToken(failedAccessToken: string, sessionId: string | null): Promise<string> {
  const renew = async () => {
    // Relire APRES le verrou : un autre onglet peut avoir fini la rotation.
    await useAuthStore.persist.rehydrate()
    const start = authStore.get()
    if (start.sessionId !== sessionId || !start.accessToken) {
      throw new ApiError('Session modifiée', 'SESSION_CHANGED', 0)
    }
    if (start.accessToken !== failedAccessToken) return start.accessToken
    if (!start.refreshToken) {
      useAuthStore.getState().clearSession()
      throw new ApiError('Session expirée', 'UNAUTHORIZED', 401)
    }
    try {
      const { data } = await bare.post('/auth/refresh', { refreshToken: start.refreshToken })
      const current = authStore.get()
      if (current.sessionId !== sessionId || !current.accessToken) {
        throw new ApiError('Session modifiée', 'SESSION_CHANGED', 0)
      }
      // Une reponse ancienne ne remplace jamais une connexion ou rotation plus recente.
      if (current.refreshToken !== start.refreshToken) return current.accessToken
      if (!data.accessToken || !data.refreshToken) {
        throw new ApiError('Réponse de renouvellement invalide', 'INVALID_AUTH_RESPONSE', 502)
      }
      useAuthStore.getState().setTokens(data)
      return data.accessToken as string
    } catch (error) {
      const failure = asApiError(error)
      const current = authStore.get()
      if (current.sessionId === sessionId && current.refreshToken === start.refreshToken && failure.status === 401) {
        useAuthStore.getState().clearSession()
      }
      // 429, 5xx, timeout et hors-ligne preservent la session et leur vrai statut.
      throw failure
    }
  }
  // Le verrou navigateur couvre les onglets ; la promesse couvre les requetes
  // du meme onglet. Sans Web Locks, la grace serveur absorbe les doublons proches.
  if (typeof navigator !== 'undefined' && navigator.locks) {
    return navigator.locks.request('sendprocolis-auth-refresh', renew)
  }
  return renew()
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as AuthRequest | undefined
    const state = authStore.get()
    if (error.response?.status !== 401 || !original || isPublicAuth(original.url) ||
        !original._authAccessToken || original._authSessionId !== state.sessionId) {
      throw asApiError(error)
    }
    if (original._retried) {
      if (state.accessToken === original._authAccessToken) useAuthStore.getState().clearSession()
      throw asApiError(error)
    }
    original._retried = true
    if (!refreshFlight || refreshFlight.sessionId !== state.sessionId) {
      const flight = { sessionId: state.sessionId, promise: Promise.resolve('') }
      flight.promise = refreshAccessToken(original._authAccessToken, state.sessionId).finally(() => {
        if (refreshFlight === flight) refreshFlight = null
      })
      refreshFlight = flight
    }
    const token = await refreshFlight.promise
    // Le nouveau token est aussi rattache a la generation de session courante.
    if (authStore.get().sessionId !== original._authSessionId) throw new ApiError('Session modifiée', 'SESSION_CHANGED', 0)
    original.headers.set('Authorization', `Bearer ${token}`)
    return api(original)
  },
)

/**
 * Unwrap the API success envelope `{ success, message, ...data }` and return
 * a single top-level field (e.g. `parcels`, `parcel`, `user`).
 */
export async function unwrap<T>(promise: Promise<{ data: Record<string, unknown> }>, key: string): Promise<T> {
  const { data } = await promise
  return data[key] as T
}
