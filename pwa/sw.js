/* Le build remplace ce marqueur : chaque version possède son propre cache.
 * Seul le shell HTML public et ses bundles sont précachés.
 * Aucune réponse API, page personnalisée ou pièce jointe n'est conservée ici.
 */
const CACHE = 'procolis-__BUILD_VERSION__'
const OFFLINE = '/offline.html'
const SHELL = '/index.html'
const APP_ASSETS = /*__APP_ASSETS__*/ []
const PUBLIC_FILES = [OFFLINE, '/icons/apple-touch-icon.png', '/icons/icon-192.png', '/icons/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll([...PUBLIC_FILES, SHELL, ...APP_ASSETS])))
  // Pas de skipWaiting automatique : une saisie en cours doit être préservée.
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') event.waitUntil(self.skipWaiting())
  // L'UI pousse les timings publics (`timings.pwaSyncMaxAttempts`…) dès que
  // `/public/config` répond. Le SW persiste la valeur en IDB pour la relire
  // à chaque tour de sync, y compris après kill/revive du worker.
  if (event.data?.type === 'TIMINGS' && event.data.timings) {
    event.waitUntil(persistSyncConfig(event.data.timings).catch(() => {}))
  }
})

// Limite d'abandon par défaut — surchargée dès que l'UI envoie `TIMINGS`.
const DEFAULT_PWA_SYNC_MAX_ATTEMPTS = 10

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Purge aussi procolis-v1 qui pouvait conserver des fichiers téléversés,
    // sans supprimer les caches appartenant à une autre application.
    const keys = await caches.keys()
    await Promise.all(keys.filter((key) => key.startsWith('procolis-') && key !== CACHE).map((key) => caches.delete(key)))
    await self.clients.claim()
  })())
})

// --- Web Push (PWA) ---------------------------------------------------------
//
// Les messages envoyés par le backend (via `utils/web-push.js`) sont des JSON
// signés VAPID. On tolère un payload vide (ping d'un service de push qui ne
// transporte pas de contenu) en affichant une notification générique : masquer
// l'évènement laisserait l'utilisateur sans feedback alors qu'un service tiers
// a pourtant livré quelque chose.
self.addEventListener('push', (event) => {
  const fallback = { title: 'ProColis', body: 'Nouvelle activité', data: {} }
  let payload = fallback
  try {
    const raw = event.data?.text?.()
    if (raw) {
      const parsed = JSON.parse(raw)
      payload = { ...fallback, ...parsed, data: parsed.data || {} }
    }
  } catch {
    // Payload non-JSON : rare, on affiche quand même la notification par défaut.
  }

  const title = payload.title || fallback.title
  const options = {
    body: payload.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: payload.data || {},
    // Un `tag` identique écrase la notification précédente du même type :
    // évite l'empilement quand plusieurs évènements du même parcel tombent
    // en rafale.
    tag: payload.data?.type || undefined,
    renotify: false,
    requireInteraction: payload.priority === 'high' || payload.priority === 'urgent',
  }

  event.waitUntil(
    (async () => {
      await self.registration.showNotification(title, options)
      // Badging : si le payload contient un compteur, on l'applique au niveau
      // de l'application installée. Les navigateurs qui ne supportent pas
      // l'API ignorent silencieusement.
      if (typeof payload.badge === 'number' && 'setAppBadge' in self.navigator) {
        try { await self.navigator.setAppBadge(payload.badge) } catch { /* support partiel */ }
      }
    })(),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const data = event.notification.data || {}
  // Convention partagée avec le mobile : les notifications portent au moins
  // un `type` et éventuellement un identifiant (parcelId/bidId). On délègue
  // le routage au client principal qui connaît les URLs — le SW ne devrait
  // pas inventer des routes ici.
  const target = resolveNotificationTarget(data)

  event.waitUntil(
    (async () => {
      const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const client of clientsList) {
        if (client.url.includes(self.location.origin)) {
          // Reprendre un onglet existant plutôt que d'en ouvrir un second :
          // l'utilisateur garde son état (formulaires, scroll).
          await client.focus()
          client.postMessage({ type: 'PUSH_NOTIFICATION_CLICK', target, data })
          return
        }
      }
      // Aucun onglet ouvert : on lance l'app directement sur la bonne vue.
      await self.clients.openWindow(target || '/app')
    })(),
  )
})

self.addEventListener('notificationclose', (event) => {
  // Hook laissé explicite pour les stats futures ; pas d'effet actif pour
  // l'instant car envoyer un POST ici est peu fiable (SW peut être tué).
  void event
})

function resolveNotificationTarget(data) {
  if (!data || typeof data !== 'object') return '/app'
  if (typeof data.url === 'string' && data.url.startsWith('/')) return data.url
  if (data.parcelId) return `/app/parcels/${data.parcelId}`
  if (data.bidId && data.parcelId) return `/app/parcels/${data.parcelId}/bids/${data.bidId}`
  if (data.type === 'message' && data.conversationId) return `/app/chat/${data.conversationId}`
  return '/app/notifications'
}

// --- Background Sync --------------------------------------------------------
//
// La file est stockée en IndexedDB côté client (voir `pwaSync.ts`). On relit
// la liste à chaque déclenchement : les éléments ajoutés pendant un échec de
// synchro précédent ne doivent pas être perdus.
self.addEventListener('sync', (event) => {
  if (event.tag !== 'procolis-sync') return
  event.waitUntil(flushBackgroundSyncQueue())
})

async function flushBackgroundSyncQueue() {
  try {
    const db = await openSyncDatabase()
    const [jobs, maxAttempts] = await Promise.all([
      readAllSyncJobs(db),
      readSyncMaxAttempts(db),
    ])
    if (jobs.length === 0) return

    for (const job of jobs) {
      try {
        const response = await fetch(job.url, {
          method: job.method || 'POST',
          headers: {
            ...(job.headers || {}),
            'Content-Type': job.headers?.['Content-Type'] || 'application/json',
            // `X-Request-Id` applique la convention d'idempotence déjà en
            // vigueur côté API : un rejeu réseau ne crée jamais de doublon.
            'X-Request-Id': job.requestId,
          },
          body: job.body ? JSON.stringify(job.body) : undefined,
          credentials: 'include',
        })
        if (response.status === 401 || response.status === 403) {
          // Session expirée : inutile de retenter côté SW. L'UI retentera à
          // la prochaine connexion authentifiée.
          await deleteSyncJob(db, job.id)
          continue
        }
        if (response.ok || (response.status >= 200 && response.status < 500)) {
          await deleteSyncJob(db, job.id)
        } else {
          // 5xx : on garde le job pour la prochaine passe.
          await incrementSyncAttempt(db, job.id, maxAttempts)
        }
      } catch {
        await incrementSyncAttempt(db, job.id, maxAttempts)
      }
    }
  } catch (error) {
    console.warn('[PWA] Background sync a échoué', error)
    // Lever ici déclenche un re-déclenchement automatique du `sync` par le
    // navigateur (avec backoff) : exactement le comportement voulu.
    throw error
  }
}

function openSyncDatabase() {
  return new Promise((resolve, reject) => {
    // v2 ajoute le store `config` (K-V) pour stocker les timings publics
    // reçus de l'UI (ex. `pwaSyncMaxAttempts`). Compatible ascendant : les
    // bases v1 existantes sont migrées sans perte de données queue.
    const request = indexedDB.open('procolis-sync', 2)
    request.onerror = () => reject(request.error)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('queue')) {
        db.createObjectStore('queue', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('config')) {
        db.createObjectStore('config')
      }
    }
    request.onsuccess = () => resolve(request.result)
  })
}

async function persistSyncConfig(timings) {
  const db = await openSyncDatabase()
  if (!db.objectStoreNames.contains('config')) return
  await new Promise((resolve, reject) => {
    const tx = db.transaction('config', 'readwrite')
    tx.objectStore('config').put(timings, 'timings')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function readSyncMaxAttempts(db) {
  if (!db.objectStoreNames.contains('config')) return DEFAULT_PWA_SYNC_MAX_ATTEMPTS
  return new Promise((resolve) => {
    try {
      const tx = db.transaction('config', 'readonly')
      const request = tx.objectStore('config').get('timings')
      request.onerror = () => resolve(DEFAULT_PWA_SYNC_MAX_ATTEMPTS)
      request.onsuccess = () => {
        const value = request.result?.pwaSyncMaxAttempts
        const n = Number(value)
        resolve(Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_PWA_SYNC_MAX_ATTEMPTS)
      }
    } catch {
      resolve(DEFAULT_PWA_SYNC_MAX_ATTEMPTS)
    }
  })
}

function readAllSyncJobs(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('queue', 'readonly')
    const store = tx.objectStore('queue')
    const request = store.getAll()
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || [])
  })
}

function deleteSyncJob(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('queue', 'readwrite')
    tx.objectStore('queue').delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

function incrementSyncAttempt(db, id, maxAttempts = DEFAULT_PWA_SYNC_MAX_ATTEMPTS) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('queue', 'readwrite')
    const store = tx.objectStore('queue')
    const getRequest = store.get(id)
    getRequest.onsuccess = () => {
      const job = getRequest.result
      if (!job) return resolve()
      job.attempts = (job.attempts || 0) + 1
      // Abandon après `maxAttempts` : au-delà, un échec est persistant (payload
      // invalide, permissions révoquées). La valeur est pilotée par l'admin
      // (`timings.pwaSyncMaxAttempts`), défaut 10.
      if (job.attempts >= maxAttempts) {
        store.delete(id)
      } else {
        store.put(job)
      }
    }
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return
  // Exclusion explicite avant les navigations : même une URL API ouverte
  // directement ne doit jamais recevoir une page HTML de remplacement.
  if (/^\/(api|uploads|collect)(\/|$)/.test(url.pathname)) return

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        // Le HTML reste toujours frais : ne jamais mélanger un ancien index
        // avec les bundles hashés du nouveau déploiement.
        const response = await fetch(request)
        if (response.status < 500) return response
      } catch {
        // Safari peut suspendre l'application et la rouvrir hors connexion.
      }
      const cache = await caches.open(CACHE)
      return (await cache.match(SHELL)) ?? (await cache.match(OFFLINE)) ?? new Response('Connexion indisponible. Réessayez dans quelques instants.', {
        status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    })())
    return
  }

  // Liste positive : uniquement les bundles publics hashés par Vite et les
  // ressources d'installation. Les URL contenant des paramètres sont exclues.
  const isBundle = /^\/assets\/[^/]+-[\w-]+\.(js|css|woff2?|png|svg|webp|jpe?g)$/.test(url.pathname)
  if (url.search || (!isBundle && !PUBLIC_FILES.includes(url.pathname))) return
  event.respondWith((async () => {
    const cache = await caches.open(CACHE)
    const cached = await cache.match(request)
    if (cached) return cached
    const response = await fetch(request)
    // Un fallback SPA ou une redirection ne constitue pas un asset valide.
    if (response.ok && !response.redirected && !response.headers.get('content-type')?.includes('text/html')) {
      try {
        await cache.put(request, response.clone())
      } catch (error) {
        // Un quota Safari atteint ne doit pas empêcher le chargement en ligne.
        console.warn('[PWA] Ressource non mise en cache', error)
      }
    }
    return response
  })())
})
