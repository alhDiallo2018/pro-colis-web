import axios, { AxiosError, type AxiosRequestConfig, type AxiosInstance } from 'axios'
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

/** Bare client without interceptors — used for the refresh call to avoid loops. */
const bare = axios.create({ baseURL: BASE_URL })

export const api: AxiosInstance = axios.create({ baseURL: BASE_URL })

// Attach the Bearer token from the auth store.
api.interceptors.request.use((config) => {
  const token = authStore.get().accessToken
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Single-flight refresh: concurrent 401s share one refresh promise.
let refreshPromise: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  const { refreshToken } = authStore.get()
  if (!refreshToken) throw new ApiError('Session expirée', 'UNAUTHORIZED', 401)
  const { data } = await bare.post('/auth/refresh', { refreshToken })
  const accessToken: string = data.accessToken
  const newRefresh: string = data.refreshToken ?? refreshToken
  if (!accessToken) throw new ApiError('Session expirée', 'UNAUTHORIZED', 401)
  useAuthStore.getState().setTokens({ accessToken, refreshToken: newRefresh })
  return accessToken
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string; error?: { code?: string; details?: unknown[] } }>) => {
    const original = error.config as (AxiosRequestConfig & { _retried?: boolean }) | undefined
    const status = error.response?.status

    // Try one transparent refresh on 401, then replay the original request.
    if (status === 401 && original && !original._retried && !original.url?.includes('/auth/')) {
      original._retried = true
      try {
        refreshPromise = refreshPromise ?? refreshAccessToken()
        const token = await refreshPromise
        refreshPromise = null
        original.headers = { ...(original.headers ?? {}), Authorization: `Bearer ${token}` }
        return api(original)
      } catch {
        refreshPromise = null
        useAuthStore.getState().clearSession()
      }
    }

    const body = error.response?.data
    throw new ApiError(
      body?.message || error.message || 'Erreur réseau',
      body?.error?.code || 'NETWORK_ERROR',
      status ?? 0,
      body?.error?.details ?? [],
    )
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
