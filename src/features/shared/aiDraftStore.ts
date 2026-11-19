import type { AiParcelDraft } from '@/lib/api/ai-assistant'

export const AI_DRAFT_KEY = 'ai:parcelDraft'

export function saveAiParcelDraft(draft: AiParcelDraft): void {
  try {
    sessionStorage.setItem(AI_DRAFT_KEY, JSON.stringify(draft))
  } catch {
    // storage plein ou désactivé : on ignore
  }
}

/**
 * Consomme le brouillon AI et le retire immédiatement du storage
 * (usage unique, pas de ré-application fantôme sur un rechargement).
 */
export function consumeAiParcelDraft(): AiParcelDraft | null {
  try {
    const raw = sessionStorage.getItem(AI_DRAFT_KEY)
    if (!raw) return null
    sessionStorage.removeItem(AI_DRAFT_KEY)
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return parsed as AiParcelDraft
  } catch {
    return null
  }
}
