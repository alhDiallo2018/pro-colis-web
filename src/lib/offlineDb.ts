// Base IndexedDB pour l'historique hors ligne durable.
//
// Deux raisons de ne pas rester sur localStorage :
//   1. localStorage est capé à ~5 Mo partagés avec Zustand, les brouillons de
//      formulaire et le cache d'offlineAccess. Une liste de 50 colis par rôle
//      × plusieurs comptes sur le même poste dépasse déjà la moitié du budget ;
//   2. localStorage est synchrone : un `JSON.stringify` d'une liste longue
//      bloque le thread principal à chaque écriture.
//
// IDB n'a pas ces limites (quota par origine ~10-20 % du disque) et travaille
// hors du thread UI. On garde une API simple, en Promises — `offlineAccess`
// continue d'utiliser localStorage pour son chemin synchrone (voir
// `lib/offlineAccess.ts`) : les deux coexistent sans conflit.

const DB_NAME = 'procolis-offline'
const DB_VERSION = 1
const STORE = 'kv'

interface StoredEntry<T> {
  key: string
  value: T
  savedAt: number
  // `expiresAt` nul = pas de TTL explicite. L'invalidation reste alors
  // pilotée par le changement de session (voir `clearOfflineDbForSession`).
  expiresAt: number | null
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'key' })
      }
    }
    request.onsuccess = () => resolve(request.result)
  })
}

function hasIdb(): boolean {
  return typeof indexedDB !== 'undefined'
}

export async function putOffline<T>(key: string, value: T, ttlMs?: number): Promise<void> {
  if (!hasIdb()) return
  try {
    const db = await openDb()
    const entry: StoredEntry<T> = {
      key,
      value,
      savedAt: Date.now(),
      expiresAt: typeof ttlMs === 'number' && ttlMs > 0 ? Date.now() + ttlMs : null,
    }
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(entry)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch {
    // Mode privé / quota saturé : on dégrade silencieusement, un échec de
    // persistance ne doit pas interrompre le flux utilisateur.
  }
}

export async function getOffline<T>(key: string): Promise<T | null> {
  if (!hasIdb()) return null
  try {
    const db = await openDb()
    const entry = await new Promise<StoredEntry<T> | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).get(key)
      req.onerror = () => reject(req.error)
      req.onsuccess = () => resolve(req.result as StoredEntry<T> | undefined)
    })
    db.close()

    if (!entry) return null
    // TTL dépassé : on considère la donnée comme absente et on la purge en
    // tâche de fond — pas en bloquant, un read ne doit pas attendre un write.
    if (entry.expiresAt !== null && entry.expiresAt < Date.now()) {
      void deleteOffline(key)
      return null
    }
    return entry.value
  } catch {
    return null
  }
}

export async function deleteOffline(key: string): Promise<void> {
  if (!hasIdb()) return
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch {
    // Même raisonnement : échec silencieux.
  }
}

/**
 * Purge les entrées dont la clé commence par un préfixe. Utilisé à la
 * déconnexion pour ne laisser aucune donnée d'un compte précédent sur un
 * poste partagé (voir `clearOfflineDbForSession`).
 */
export async function deleteOfflineByPrefix(prefix: string): Promise<void> {
  if (!hasIdb()) return
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      const store = tx.objectStore(STORE)
      const req = store.openCursor()
      req.onerror = () => reject(req.error)
      req.onsuccess = () => {
        const cursor = req.result
        if (!cursor) return
        if (typeof cursor.key === 'string' && cursor.key.startsWith(prefix)) {
          cursor.delete()
        }
        cursor.continue()
      }
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch {
    // Pas d'IDB : rien à purger.
  }
}

/** Purge totale — appelée à la déconnexion. */
export async function clearOfflineDbForSession(): Promise<void> {
  await deleteOfflineByPrefix('')
}

/** Métadonnée d'un enregistrement — utile pour afficher "vu il y a X". */
export async function getOfflineMeta(key: string): Promise<{ savedAt: number; expiresAt: number | null } | null> {
  if (!hasIdb()) return null
  try {
    const db = await openDb()
    const entry = await new Promise<StoredEntry<unknown> | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).get(key)
      req.onerror = () => reject(req.error)
      req.onsuccess = () => resolve(req.result as StoredEntry<unknown> | undefined)
    })
    db.close()
    if (!entry) return null
    if (entry.expiresAt !== null && entry.expiresAt < Date.now()) return null
    return { savedAt: entry.savedAt, expiresAt: entry.expiresAt }
  } catch {
    return null
  }
}
