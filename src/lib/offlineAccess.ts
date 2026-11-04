import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

const STORAGE_PREFIX = 'procolis-offline:'
const SESSION_KEY = `${STORAGE_PREFIX}__session`
const MAX_RESPONSE_BYTES = 256 * 1024

const personalReads = new Set([
  '/auth/me',
  '/client/parcels/my-parcels',
  '/driver/parcels',
  '/users/stats',
  '/client/bids/stats',
  '/client/bids/received',
  '/client/debts',
  '/driver/stats',
  '/driver/bids/sent',
  '/driver/proposals',
  '/driver/vehicle',
  '/driver/wallet',
  '/driver/cash-declarations',
  '/payments/history',
  '/score/balance',
  '/score/history',
  '/notifications',
  '/notifications/unread-count',
  '/notifications/preferences',
  '/addresses',
  '/favorites/zones',
  '/advertisements/my',
])

const dynamicPatterns = [
  /^\/(client|driver)\/parcels\/[^/]+$/,
  /^\/parcels\/[^/]+\/timeline$/,
]

export function isOfflineEligible(config: InternalAxiosRequestConfig): boolean {
  if ((config.method || 'get').toLowerCase() !== 'get') return false
  const path = (config.url || '').split('?')[0]
  if (personalReads.has(path)) return true
  return dynamicPatterns.some((rx) => rx.test(path))
}

// Alias local pour compatibilité avec le code existant de ce fichier.
const isEligible = isOfflineEligible

function cacheKey(config: InternalAxiosRequestConfig): string {
  const base = (config.url || '').split('?')[0]
  const params = new URLSearchParams()
  if (config.params && typeof config.params === 'object') {
    for (const [k, v] of Object.entries(config.params as Record<string, unknown>)) {
      if (v != null) params.set(k, String(v))
    }
  }
  const qs = params.toString()
  return STORAGE_PREFIX + (qs ? `${base}?${qs}` : base)
}

interface Entry {
  savedAt: string
  status: number
  data: unknown
}

export interface OfflineStatus {
  disconnected: boolean
  savedAt: string | null
}

type Listener = (status: OfflineStatus) => void

export class OfflineAccess {
  private listeners = new Set<Listener>()
  private stale = new Map<string, string>()
  private disconnected = false

  getStatus(): OfflineStatus {
    const dates = [...this.stale.values()].sort()
    return { disconnected: this.disconnected, savedAt: dates[0] ?? null }
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private emit() {
    const status = this.getStatus()
    for (const fn of this.listeners) fn(status)
  }

  useSession(sessionId: string | null) {
    const prev = localStorage.getItem(SESSION_KEY)
    if (prev === sessionId) return
    if (prev !== null) {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith(STORAGE_PREFIX) && key !== SESSION_KEY) localStorage.removeItem(key)
      }
    }
    if (sessionId) localStorage.setItem(SESSION_KEY, sessionId)
    else localStorage.removeItem(SESSION_KEY)
    this.stale.clear()
    this.disconnected = false
    this.emit()
  }

  save(config: InternalAxiosRequestConfig, response: AxiosResponse) {
    if (!isEligible(config) || response.status !== 200) return
    try {
      const serialized = JSON.stringify(response.data)
      if (serialized.length > MAX_RESPONSE_BYTES) return
      const entry: Entry = { savedAt: new Date().toISOString(), status: 200, data: response.data }
      localStorage.setItem(cacheKey(config), JSON.stringify(entry))
      this.stale.delete(cacheKey(config))
      this.disconnected = false
      this.emit()
    } catch {
      /* quota ignored */
    }
  }

  load(config: InternalAxiosRequestConfig): AxiosResponse | null {
    if (!isEligible(config)) return null
    try {
      const raw = localStorage.getItem(cacheKey(config))
      if (!raw) return null
      const entry = JSON.parse(raw) as Entry
      this.stale.set(cacheKey(config), entry.savedAt)
      this.disconnected = true
      this.emit()
      return {
        data: entry.data,
        status: entry.status,
        statusText: 'OK (offline cache)',
        headers: { 'x-offline-cache': entry.savedAt },
        config,
      } as AxiosResponse
    } catch {
      return null
    }
  }
}

export const offlineAccess = new OfflineAccess()

function isTransportFailure(error: AxiosError): boolean {
  if (error.response) return false
  const code = error.code ?? ''
  return (
    !navigator.onLine ||
    code === 'ERR_NETWORK' ||
    code === 'ECONNABORTED' ||
    code === 'ETIMEDOUT'
  )
}

export function installOfflineInterceptor(client: AxiosInstance) {
  client.interceptors.response.use(
    (response) => {
      offlineAccess.save(response.config as InternalAxiosRequestConfig, response)
      return response
    },
    (error: AxiosError) => {
      const config = error.config as InternalAxiosRequestConfig | undefined
      if (config && isTransportFailure(error)) {
        const cached = offlineAccess.load(config)
        if (cached) return cached
      }
      return Promise.reject(error)
    },
  )
}
