import { api } from './client'

export const SUPPORT_EMAIL = 'support-commercial@sendprocolis.com'

export interface SupportMessage {
  id: string
  userId?: string | null
  subject: string
  message: string
  createdAt?: string
}

export interface SendSupportMessagePayload {
  subject: string
  message: string
  name?: string
  email?: string
}

/** Envoie un message authentifié au support via l'API, qui garde les secrets d'envoi côté serveur. */
export async function sendSupportMessage(payload: SendSupportMessagePayload): Promise<SupportMessage> {
  const { data } = await api.post('/support/messages', payload)
  return (data.supportMessage ?? data.data) as SupportMessage
}

/** Construit un recours sûr pour les visiteurs anonymes sans exposer de clé d'email dans le navigateur. */
export function buildSupportMailto(payload: SendSupportMessagePayload): string {
  const identity = [payload.name, payload.email].filter(Boolean).join(' — ')
  const body = identity ? `${identity}\n\n${payload.message}` : payload.message
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(payload.subject)}&body=${encodeURIComponent(body)}`
}

/* ------------------------------------------------------------------ */
/* Anti-abuse throttle: 1 message / minute, max 3 / rolling hour.      */
/* Client-side guard persisted in localStorage (per browser).          */
/* ------------------------------------------------------------------ */

const RATE_STORAGE_KEY = 'pc_support_sends'
const COOLDOWN_MS = 60_000
const WINDOW_MS = 3_600_000
const MAX_PER_WINDOW = 3

function readRecentSends(now: number): number[] {
  try {
    const raw = localStorage.getItem(RATE_STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []
    return parsed.filter((t): t is number => typeof t === 'number' && now - t < WINDOW_MS)
  } catch {
    return []
  }
}

export type SupportRateCheck = { allowed: true } | { allowed: false; waitSeconds: number }

/** Check whether a new support message can be sent right now. */
export function checkSupportRateLimit(): SupportRateCheck {
  const now = Date.now()
  const sends = readRecentSends(now)
  const last = sends.length > 0 ? sends[sends.length - 1] : undefined
  if (last !== undefined && now - last < COOLDOWN_MS) {
    return { allowed: false, waitSeconds: Math.ceil((COOLDOWN_MS - (now - last)) / 1000) }
  }
  if (sends.length >= MAX_PER_WINDOW) {
    const oldest = sends[0] ?? now
    return { allowed: false, waitSeconds: Math.ceil((oldest + WINDOW_MS - now) / 1000) }
  }
  return { allowed: true }
}

/** Record a successful send for the rate limit window. */
export function recordSupportSend(): void {
  try {
    const now = Date.now()
    const sends = readRecentSends(now)
    sends.push(now)
    localStorage.setItem(RATE_STORAGE_KEY, JSON.stringify(sends))
  } catch {
    /* storage unavailable — nothing to record */
  }
}

/** Human-readable wait duration ("45 s", "12 min"). */
export function formatWait(waitSeconds: number): string {
  if (waitSeconds < 60) return `${waitSeconds} s`
  return `${Math.ceil(waitSeconds / 60)} min`
}
