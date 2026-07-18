import axios from 'axios'
import { api } from './client'

export const SUPPORT_EMAIL = 'support-commercial@sendprocolis.com'

const BREVO_SEND_URL = 'https://api.brevo.com/v3/smtp/email'
const BREVO_API_KEY: string = import.meta.env.VITE_BREVO_API_KEY || ''
const BREVO_SENDER_EMAIL: string = import.meta.env.VITE_BREVO_SENDER_EMAIL || 'no-reply@sendprocolis.com'
const BREVO_SENDER_NAME: string = import.meta.env.VITE_BREVO_SENDER_NAME || 'SENDPROCOLIS'

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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Deliver the message straight to the support inbox via the Brevo API (no backend needed). */
async function sendViaBrevo(payload: SendSupportMessagePayload): Promise<SupportMessage> {
  const { data } = await axios.post(
    BREVO_SEND_URL,
    {
      sender: { email: BREVO_SENDER_EMAIL, name: BREVO_SENDER_NAME },
      to: [{ email: SUPPORT_EMAIL, name: 'Support SendProColis' }],
      replyTo: payload.email ? { email: payload.email, name: payload.name || payload.email } : undefined,
      subject: payload.subject,
      textContent: payload.message,
      htmlContent: `<p>${escapeHtml(payload.message).replace(/\n/g, '<br/>')}</p>`,
    },
    { headers: { 'api-key': BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' } },
  )
  return {
    id: (data?.messageId as string) || 'brevo',
    subject: payload.subject,
    message: payload.message,
    createdAt: new Date().toISOString(),
  }
}

/**
 * Send a message to the support team (contact / réclamation forms).
 * Tries the backend first (`POST /support/messages`); when it is unreachable
 * and a Brevo key is configured, the email is delivered directly to the
 * support inbox via Brevo.
 */
export async function sendSupportMessage(payload: SendSupportMessagePayload): Promise<SupportMessage> {
  try {
    const { data } = await api.post('/support/messages', payload)
    return (data.supportMessage ?? data.data) as SupportMessage
  } catch (backendError) {
    if (!BREVO_API_KEY) throw backendError
    return sendViaBrevo(payload)
  }
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
