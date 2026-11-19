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
// v2 : ajoute le store `config` partagé avec `pwa/sw.js` (voir `openSyncDatabase`).
const DB_VERSION = 2
const STORE = 'queue'
const CONFIG_STORE = 'config'
const SYNC_TAG = 'procolis-sync'
/** Nombre d'essais max par défaut avant purge d'un job — surchargé par la
 *  config admin `timings.pwaSyncMaxAttempts`. */
const DEFAULT_MAX_SYNC_ATTEMPTS = 10

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(CONFIG_STORE)) {
        db.createObjectStore(CONFIG_STORE)
      }
    }
    request.onsuccess = () => resolve(request.result)
  })
}

async function readMaxSyncAttempts(db: IDBDatabase): Promise<number> {
  if (!db.objectStoreNames.contains(CONFIG_STORE)) return DEFAULT_MAX_SYNC_ATTEMPTS
  return new Promise<number>((resolve) => {
    try {
      const tx = db.transaction(CONFIG_STORE, 'readonly')
      const req = tx.objectStore(CONFIG_STORE).get('timings')
      req.onerror = () => resolve(DEFAULT_MAX_SYNC_ATTEMPTS)
      req.onsuccess = () => {
        const n = Number((req.result as { pwaSyncMaxAttempts?: unknown } | undefined)?.pwaSyncMaxAttempts)
        resolve(Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_MAX_SYNC_ATTEMPTS)
      }
    } catch {
      resolve(DEFAULT_MAX_SYNC_ATTEMPTS)
    }
  })
}

/** Pousse les timings publics vers le store IDB partagé + le SW actif. À
 *  appeler dès que `/public/config` répond côté UI (`PwaProvider`). */
export async function persistPwaTimings(timings: Record<string, unknown> | undefined): Promise<void> {
  if (!timings) return
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(CONFIG_STORE, 'readwrite')
      tx.objectStore(CONFIG_STORE).put(timings, 'timings')
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch {
    /* IDB indisponible (mode privé Firefox) : on tolère, le SW gardera son
     * défaut statique. */
  }
  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'TIMINGS', timings })
    }
  } catch {
    /* noop */
  }
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
  const [jobs, maxAttempts] = await Promise.all<[Promise<SyncJob[]>, Promise<number>]>([
    new Promise<SyncJob[]>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).getAll()
      req.onerror = () => reject(req.error)
      req.onsuccess = () => resolve((req.result as SyncJob[]) || [])
    }),
    readMaxSyncAttempts(db),
  ])

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
        await bumpAttempts(db, job.id, maxAttempts)
      }
    } catch {
      failed += 1
      await bumpAttempts(db, job.id, maxAttempts)
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

async function bumpAttempts(db: IDBDatabase, id: string, maxAttempts = DEFAULT_MAX_SYNC_ATTEMPTS): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    const getReq = store.get(id)
    getReq.onsuccess = () => {
      const job = getReq.result as SyncJob | undefined
      if (!job) return
      const attempts = (job.attempts || 0) + 1
      // `maxAttempts` est piloté par l'admin (`timings.pwaSyncMaxAttempts`) —
      // au-delà, on purge pour éviter qu'un payload invalide bloque la file.
      if (attempts >= maxAttempts) store.delete(id)
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
