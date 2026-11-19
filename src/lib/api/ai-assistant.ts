import { api } from './client'

/**
 * Wrapper de l'assistant conversationnel (parité mobile `lib/services/api/ai_api.dart`).
 *
 * - `POST /ai/assistant` : prompt NL → intent + draft + answerText
 * - `POST /ai/assistant/transcribe` : URL audio uploadée → texte (stub V1, renvoie null)
 * - `GET  /ai/assistant/config` : vérifie si la clé Claude est posée côté API
 *
 * Dégradation : en cas d'erreur réseau, `ask` renvoie un fallback `answerText`
 * courtois plutôt que de remonter l'exception. L'UI n'a jamais à catch.
 */

export type AiIntent = 'create_parcel' | 'track_parcel' | 'faq' | 'unknown'

export interface AiParcelDraft {
  senderCity: string | null
  receiverCity: string | null
  receiverName: string | null
  receiverPhone: string | null
  weightKg: number | null
  type: string | null
  isUrgent: boolean
  notes: string | null
}

export interface AiAssistantResult {
  intent: AiIntent
  draft: AiParcelDraft | null
  trackingNumber: string | null
  answerText: string
  configured: boolean
}

function asString(v: unknown): string | null {
  return typeof v === 'string' && v.trim().length > 0 ? v : null
}

function asNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return null
}

function asIntent(v: unknown): AiIntent {
  if (v === 'create_parcel' || v === 'track_parcel' || v === 'faq') return v
  return 'unknown'
}

function parseDraft(raw: unknown): AiParcelDraft | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  return {
    senderCity: asString(r.senderCity),
    receiverCity: asString(r.receiverCity),
    receiverName: asString(r.receiverName),
    receiverPhone: asString(r.receiverPhone),
    weightKg: asNumber(r.weightKg),
    type: asString(r.type),
    isUrgent: r.isUrgent === true,
    notes: asString(r.notes),
  }
}

const FALLBACK: AiAssistantResult = {
  intent: 'unknown',
  draft: null,
  trackingNumber: null,
  answerText:
    "L'assistant est indisponible pour le moment. Vous pouvez créer un colis depuis « Nouveau colis ».",
  configured: false,
}

export async function askAssistant(message: string, city?: string): Promise<AiAssistantResult> {
  try {
    const { data } = await api.post('/ai/assistant', {
      message,
      ...(city ? { city } : {}),
    })
    const payload = (data?.data ?? {}) as Record<string, unknown>
    const result = (payload.result ?? {}) as Record<string, unknown>
    return {
      intent: asIntent(result.intent),
      draft: parseDraft(result.draft),
      trackingNumber: asString(result.trackingNumber),
      answerText:
        asString(result.answerText) ??
        "Je n'ai pas compris, pouvez-vous reformuler ?",
      configured: payload.configured === true,
    }
  } catch {
    return FALLBACK
  }
}

export async function transcribeAudio(audioUrl: string): Promise<string | null> {
  try {
    const { data } = await api.post('/ai/assistant/transcribe', { audioUrl })
    const payload = (data?.data ?? data ?? {}) as Record<string, unknown>
    const text = asString(payload.text)
    return text
  } catch {
    return null
  }
}

export async function isAssistantConfigured(): Promise<boolean> {
  try {
    const { data } = await api.get('/ai/assistant/config')
    return (data?.data as Record<string, unknown>)?.configured === true
  } catch {
    return false
  }
}
