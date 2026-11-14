/**
 * Stockage local des modèles de colis — jumeau web du `ParcelTemplateStore`
 * mobile (`lib/services/parcel_template_store.dart`).
 *
 * Choix d'architecture :
 * - stockage `localStorage` cloisonné par utilisateur (clé `parcel_templates.<ownerId>`) ;
 * - aucune synchronisation serveur — les templates mobiles ne sont pas remontés
 *   à l'API, le web reste iso ;
 * - les pièces jointes (photos, audio, vidéo) ne sont volontairement pas
 *   capturées dans un modèle, comme sur mobile ;
 * - les champs collent à ceux sérialisés par mobile pour qu'un futur backend
 *   partagé puisse être branché sans migration de données.
 *
 * Les erreurs d'accès au stockage (navigation privée, quota) sont silencieuses :
 * la fonctionnalité est optionnelle, elle ne doit jamais bloquer la création d'un colis.
 */

export type ParcelTemplateMode = 'free' | 'driver'

export interface ParcelTemplateData {
  departureZoneId?: string | null
  arrivalZoneId?: string | null
  receiverName?: string
  receiverPhone?: string
  receiverEmail?: string
  receiverAddress?: string
  description?: string
  weight?: string
  type?: string
  insurance?: boolean
  urgent?: boolean
  price?: string
  priceEdited?: boolean
  paymentChannel?: string
  cashCollectionPoint?: string
  mode?: ParcelTemplateMode
  driverId?: string | null
}

export interface ParcelTemplate {
  id: string
  name: string
  data: ParcelTemplateData
  createdAt: string
}

const STORAGE_PREFIX = 'parcel_templates.'

function keyFor(ownerId: string): string {
  return `${STORAGE_PREFIX}${ownerId}`
}

function safeStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage
  } catch {
    return null
  }
}

function newId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  } catch { /* fallthrough */ }
  return `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function parse(raw: string | null): ParcelTemplate[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (t): t is ParcelTemplate =>
        typeof t === 'object' &&
        t !== null &&
        typeof (t as ParcelTemplate).id === 'string' &&
        typeof (t as ParcelTemplate).name === 'string' &&
        typeof (t as ParcelTemplate).data === 'object',
    )
  } catch {
    return []
  }
}

function persist(ownerId: string, templates: ParcelTemplate[]): void {
  const storage = safeStorage()
  if (!storage) return
  try {
    storage.setItem(keyFor(ownerId), JSON.stringify(templates))
  } catch {
    /* quota dépassé ou mode privé : on abandonne silencieusement */
  }
}

export function listParcelTemplates(ownerId: string): ParcelTemplate[] {
  const storage = safeStorage()
  if (!storage) return []
  return parse(storage.getItem(keyFor(ownerId)))
}

export function saveParcelTemplate(
  ownerId: string,
  payload: { id?: string; name: string; data: ParcelTemplateData },
): ParcelTemplate {
  const templates = listParcelTemplates(ownerId)
  const existingIndex = payload.id ? templates.findIndex((t) => t.id === payload.id) : -1
  const next: ParcelTemplate =
    existingIndex >= 0
      ? { ...templates[existingIndex], name: payload.name, data: payload.data }
      : { id: newId(), name: payload.name, data: payload.data, createdAt: new Date().toISOString() }
  const copy = [...templates]
  if (existingIndex >= 0) copy[existingIndex] = next
  else copy.unshift(next)
  persist(ownerId, copy)
  return next
}

export function deleteParcelTemplate(ownerId: string, templateId: string): void {
  const templates = listParcelTemplates(ownerId)
  const copy = templates.filter((t) => t.id !== templateId)
  persist(ownerId, copy)
}

export function renameParcelTemplate(
  ownerId: string,
  templateId: string,
  name: string,
): ParcelTemplate | null {
  const templates = listParcelTemplates(ownerId)
  const index = templates.findIndex((t) => t.id === templateId)
  if (index < 0) return null
  const next = { ...templates[index], name }
  const copy = [...templates]
  copy[index] = next
  persist(ownerId, copy)
  return next
}
