// File d'attente Background Sync côté client.
//
// Partage la base IndexedDB `procolis-sync` avec le Service Worker
// (`pwa/sw.js`). Même schéma, même tag `procolis-sync` : c'est volontaire —
// l'UI écrit un job, le SW le rejoue dès que la connexion revient.
//
// Les navigateurs qui n'implémentent pas Background Sync (Safari, Firefox)
// déclenchent le flush au prochain chargement de page connecté, via
// `flushBackgroundQueue()`. Pas de doublon : chaque réussite supprime le
// job, et chaque POST porte un `X-Request-Id` que l'API dédoublonne déjà.

export interface SyncJob {
  id: string
  url: string
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
  requestId: string
  createdAt: number
  attempts?: number
}

const DB_NAME = 'procolis-sync'
const DB_VERSION = 1
const STORE = 'queue'
const SYNC_TAG = 'procolis-sync'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
  })
}

function nextId(): string {
  // `crypto.randomUUID` est préféré ; fallback déterministe pour les tests.
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

async function registerSync(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false
  try {
    const registration = await navigator.serviceWorker.ready
    const syncManager = (registration as ServiceWorkerRegistration & {
      sync?: { register: (tag: string) => Promise<void> }
    }).sync
    if (!syncManager) return false
    await syncManager.register(SYNC_TAG)
    return true
  } catch {
    // Permissions site refusées, quota, mode navigation privée : on tombe
    // sur le fallback au prochain `online`.
    return false
  }
}

/**
 * Ajoute une opération à la file et tente de déclencher la synchro.
 *
 * `requestId` doit être stable pour la même tentative métier : l'API utilise
 * déjà cette convention pour dédoublonner côté serveur. Sans ça, un rejeu
 * créerait un doublon si la première tentative avait en réalité réussi.
 */
export async function enqueueSyncJob(input: Omit<SyncJob, 'id' | 'createdAt' | 'attempts'>): Promise<SyncJob> {
  const job: SyncJob = {
    id: nextId(),
    createdAt: Date.now(),
    attempts: 0,
    ...input,
  }
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(job)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()

  // Si le navigateur supporte Background Sync, laisse-le piloter le rejeu.
  // Sinon, tente une passe immédiate si on est en ligne : évite d'attendre
  // le prochain `online` quand la coupure était fugace.
  const registered = await registerSync()
  if (!registered && navigator.onLine) {
    void flushBackgroundQueue()
  }
  return job
}

/**
 * Rejoue tous les jobs présents. Appelé automatiquement au retour en ligne
 * et manuellement au boot. Idempotent : chaque succès supprime le job.
 */
export async function flushBackgroundQueue(): Promise<{ sent: number; failed: number }> {
  if (!navigator.onLine) return { sent: 0, failed: 0 }

  const db = await openDb()
  const jobs: SyncJob[] = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAll()
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve((req.result as SyncJob[]) || [])
  })

  let sent = 0
  let failed = 0

  for (const job of jobs) {
    try {
      const response = await fetch(job.url, {
        method: job.method || 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Id': job.requestId,
          ...(job.headers || {}),
        },
        body: job.body !== undefined ? JSON.stringify(job.body) : undefined,
      })

      if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 401)) {
        // 2xx : succès. 4xx hors 401 : requête invalide définitivement —
        // retenter créerait une boucle infinie, on purge.
        await removeJob(db, job.id)
        sent += 1
      } else {
        failed += 1
        await bumpAttempts(db, job.id)
      }
    } catch {
      failed += 1
      await bumpAttempts(db, job.id)
    }
  }

  db.close()
  return { sent, failed }
}

async function removeJob(db: IDBDatabase, id: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function bumpAttempts(db: IDBDatabase, id: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    const getReq = store.get(id)
    getReq.onsuccess = () => {
      const job = getReq.result as SyncJob | undefined
      if (!job) return
      const attempts = (job.attempts || 0) + 1
      // 10 tentatives suffisent à couvrir une panne multi-heure ; au-delà
      // le payload est vraisemblablement invalide — on purge pour éviter
      // qu'un job mort bloque les suivants.
      if (attempts >= 10) store.delete(id)
      else store.put({ ...job, attempts })
    }
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** Nombre de jobs en attente — utile pour une bannière UI. */
export async function pendingSyncCount(): Promise<number> {
  try {
    const db = await openDb()
    const count = await new Promise<number>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).count()
      req.onerror = () => reject(req.error)
      req.onsuccess = () => resolve(req.result)
    })
    db.close()
    return count
  } catch {
    return 0
  }
}

/** Vide intégralement la file — utile à la déconnexion. */
export async function clearSyncQueue(): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).clear()
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch {
    // Pas d'IndexedDB (navigation privée, SSR) : rien à nettoyer.
  }
}
