/* Le build remplace ce marqueur : chaque version possède son propre cache.
 * Aucune page métier, réponse API ou pièce jointe n'est conservée ici.
 * Sans réseau, une page autonome explique comment reprendre la navigation.
 */
const CACHE = 'procolis-__BUILD_VERSION__'
const OFFLINE = '/offline.html'
const PUBLIC_FILES = [OFFLINE, '/icons/apple-touch-icon.png', '/icons/icon-192.png', '/icons/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PUBLIC_FILES)))
  // Pas de skipWaiting automatique : une saisie en cours doit être préservée.
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Purge aussi procolis-v1 qui pouvait conserver des fichiers téléversés,
    // sans supprimer les caches appartenant à une autre application.
    const keys = await caches.keys()
    await Promise.all(keys.filter((key) => key.startsWith('procolis-') && key !== CACHE).map((key) => caches.delete(key)))
    await self.clients.claim()
  })())
})

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
      return (await cache.match(OFFLINE)) ?? new Response('Connexion indisponible. Réessayez dans quelques instants.', {
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
