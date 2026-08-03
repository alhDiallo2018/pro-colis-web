// Brouillons de formulaires — pendant web de `lib/services/form_draft_store.dart`.
//
// Conserve la saisie en cours pour qu'une sortie par inadvertance (onglet
// fermé, navigation, rechargement) ne la fasse pas perdre. Un brouillon est un
// document JSON dans `localStorage`, cloisonné par formulaire (`slot`) et par
// compte (`ownerId`) pour qu'un utilisateur ne retrouve jamais la saisie d'un
// autre sur le même poste.
//
// Différence assumée avec le mobile : les pièces jointes ne sont pas
// persistées. Le mobile les recopie dans un dossier durable ; sur le web, les
// photos et vidéos vivent en data-URL et satureraient le quota de
// `localStorage` (~5 Mo). On restaure donc le texte, et l'utilisateur rattache
// ses médias.

const PREFIX = 'form_draft'

/** Au-delà, reproposer une saisie crée plus de confusion qu'elle n'en évite. */
export const DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

export interface FormDraft<T> {
  data: T
  savedAt: Date
}

function keyFor(slot: string, ownerId?: string | null): string {
  const owner = ownerId?.trim() || 'anon'
  return `${PREFIX}.${slot}.${owner}`
}

export function clearFormDraft(slot: string, ownerId?: string | null): void {
  try {
    window.localStorage.removeItem(keyFor(slot, ownerId))
  } catch {
    // Mode privé ou quota : rien à nettoyer, rien à signaler.
  }
}

export function loadFormDraft<T>(slot: string, ownerId?: string | null): FormDraft<T> | null {
  let raw: string | null = null
  try {
    raw = window.localStorage.getItem(keyFor(slot, ownerId))
  } catch {
    return null
  }
  if (!raw) return null

  try {
    const decoded = JSON.parse(raw) as { savedAt?: string; data?: T }
    const savedAt = decoded.savedAt ? new Date(decoded.savedAt) : null
    if (!savedAt || Number.isNaN(savedAt.getTime()) || decoded.data == null) {
      clearFormDraft(slot, ownerId)
      return null
    }
    if (Date.now() - savedAt.getTime() > DRAFT_MAX_AGE_MS) {
      clearFormDraft(slot, ownerId)
      return null
    }
    return { data: decoded.data, savedAt }
  } catch {
    // Une entrée illisible ne doit pas rester en travers : sans purge, elle
    // ferait échouer toutes les lectures suivantes de ce formulaire.
    clearFormDraft(slot, ownerId)
    return null
  }
}

export function saveFormDraft<T>(slot: string, ownerId: string | null | undefined, data: T): void {
  try {
    window.localStorage.setItem(
      keyFor(slot, ownerId),
      JSON.stringify({ savedAt: new Date().toISOString(), data }),
    )
  } catch {
    // Quota dépassé ou stockage refusé : le brouillon est un filet de
    // sécurité, son échec ne doit jamais interrompre la saisie.
  }
}

/** Efface tous les brouillons du poste, quel que soit le compte (déconnexion). */
export function clearAllFormDrafts(): void {
  try {
    const keys: string[] = []
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i)
      if (key?.startsWith(`${PREFIX}.`)) keys.push(key)
    }
    keys.forEach((key) => window.localStorage.removeItem(key))
  } catch {
    // Idem : purge best-effort.
  }
}

const MONTHS = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc']

/** « aujourd'hui 14:32 », « hier 09:05 », sinon « 28 juil · 18:40 ». */
export function formatDraftTimestamp(savedAt: Date): string {
  const hh = String(savedAt.getHours()).padStart(2, '0')
  const mm = String(savedAt.getMinutes()).padStart(2, '0')

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const day = new Date(savedAt.getFullYear(), savedAt.getMonth(), savedAt.getDate()).getTime()
  const diffDays = Math.round((today - day) / 86_400_000)

  if (diffDays === 0) return `aujourd’hui ${hh}:${mm}`
  if (diffDays === 1) return `hier ${hh}:${mm}`
  return `${savedAt.getDate()} ${MONTHS[savedAt.getMonth()]} · ${hh}:${mm}`
}
