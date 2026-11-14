import { getOffline, putOffline } from '@/lib/offlineDb'

export const prefix = 'procolis-offline-history:'
export interface Entry {
  id: string
  trackingNumber: string
  status: string
  departure: string
  arrival: string
  updatedAt?: string
  price?: number | null
}
export interface Snapshot {
  savedAt: string
  entries: Entry[]
}

// TTL 14 jours : au-delà, un snapshot hors ligne n'apporte plus rien qu'une
// confusion (statuts obsolètes). La lecture rafraîchit dès retour en ligne.
const HISTORY_TTL_MS = 14 * 24 * 60 * 60 * 1000

function sanitize(snapshot: Snapshot | null): Snapshot | null {
  if (!snapshot || typeof snapshot.savedAt !== 'string' || !Array.isArray(snapshot.entries)) return null
  return {
    savedAt: snapshot.savedAt,
    entries: snapshot.entries.filter(
      (entry: Entry) => entry && typeof entry.id === 'string' && typeof entry.trackingNumber === 'string',
    ),
  }
}

/** Lecture synchrone depuis localStorage — chemin rapide pour l'UI initiale. */
export function readHistory(owner: string): Snapshot | null {
  try {
    return sanitize(JSON.parse(localStorage.getItem(prefix + owner) || 'null'))
  } catch {
    return null
  }
}

/** Lecture durable depuis IndexedDB. Préférée dès qu'elle est disponible. */
export async function readHistoryDurable(owner: string): Promise<Snapshot | null> {
  const stored = await getOffline<Snapshot>(prefix + owner)
  return sanitize(stored)
}

/** Écrit la snapshot dans les deux backends : LS (sync rapide) + IDB (durable). */
export async function writeHistory(owner: string, snapshot: Snapshot): Promise<void> {
  const clean = sanitize(snapshot)
  if (!clean) return
  try {
    localStorage.setItem(prefix + owner, JSON.stringify(clean))
  } catch {
    // Quota localStorage saturé : IDB continue, la UI servira depuis IDB.
  }
  await putOffline(prefix + owner, clean, HISTORY_TTL_MS)
}
