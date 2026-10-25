// @vitest-environment node
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { describe, expect, it, vi } from 'vitest'

// Exécuter le vrai worker dans un contexte isolé vérifie la frontière réseau /
// cache sans réimplémenter sa stratégie dans le test.
function worker() {
  const listeners: Record<string, (event: any) => void> = {}
  const cache = { addAll: vi.fn().mockResolvedValue(undefined), put: vi.fn().mockResolvedValue(undefined), match: vi.fn() }
  const caches = { open: vi.fn().mockResolvedValue(cache), keys: vi.fn().mockResolvedValue(['procolis-v1', 'other-app']), delete: vi.fn().mockResolvedValue(true) }
  const fetch = vi.fn()
  const self = { location: { origin: 'https://procolis.test' }, addEventListener: (name: string, callback: (event: any) => void) => { listeners[name] = callback }, clients: { claim: vi.fn().mockResolvedValue(undefined) }, skipWaiting: vi.fn().mockResolvedValue(undefined) }
  runInNewContext(readFileSync(new URL('../../../pwa/sw.js', import.meta.url), 'utf8'), { self, caches, fetch, URL, Response, console })
  function request(path: string, mode = 'cors', method = 'GET') {
    const event = { request: { url: new URL(path, self.location.origin).href, mode, method }, respondWith: vi.fn(), waitUntil: vi.fn() }
    listeners.fetch(event)
    return event
  }
  return { listeners, cache, caches, fetch, self, request }
}

describe('service worker ProColis', () => {
  it('ne prend jamais en charge les API, uploads, paiements POST ou domaines externes', () => {
    const { request, caches } = worker()
    for (const url of ['/api/v1/auth/me', '/uploads/identity.png', '/collect/faro', 'https://payment.test/test']) {
      expect(request(url, 'navigate').respondWith).not.toHaveBeenCalled()
    }
    expect(request('/payment-status.php', 'navigate', 'POST').respondWith).not.toHaveBeenCalled()
    expect(request('/assets/app-123.js?token=secret').respondWith).not.toHaveBeenCalled()
    expect(caches.open).not.toHaveBeenCalled()
  })

  it('sert un secours hors connexion même après un accès direct à un écran privé', async () => {
    const { request, fetch, cache } = worker()
    fetch.mockRejectedValue(new Error('offline'))
    const fallback = new Response('Connexion indisponible')
    cache.match.mockResolvedValue(fallback)
    expect(await request('/client/colis/123', 'navigate').respondWith.mock.calls[0][0]).toBe(fallback)
    expect(cache.match).toHaveBeenCalledWith('/offline.html')
    expect(cache.put).not.toHaveBeenCalled()
  })

  it('ne conserve jamais le HTML de navigation et ne masque pas les erreurs 404', async () => {
    const { request, fetch, cache } = worker()
    const response = new Response('Not found', { status: 404 })
    fetch.mockResolvedValue(response)
    expect(await request('/unknown', 'navigate').respondWith.mock.calls[0][0]).toBe(response)
    expect(cache.put).not.toHaveBeenCalled()
  })

  it('ne met pas un fallback HTML en cache à la place d’un bundle', async () => {
    const { request, fetch, cache } = worker()
    fetch.mockResolvedValue(new Response('<html/>', { headers: { 'content-type': 'text/html' } }))
    await request('/assets/app-123.js').respondWith.mock.calls[0][0]
    expect(cache.put).not.toHaveBeenCalled()
  })

  it('sert un bundle depuis son cache et continue si le quota de stockage est atteint', async () => {
    const { request, fetch, cache } = worker()
    const response = new Response('code', { headers: { 'content-type': 'application/javascript' } })
    cache.match.mockResolvedValueOnce(response)
    expect(await request('/assets/app-123.js').respondWith.mock.calls[0][0]).toBe(response)
    expect(fetch).not.toHaveBeenCalled()
    fetch.mockResolvedValue(response)
    cache.put.mockRejectedValue(new Error('quota'))
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(await request('/assets/app-456.js').respondWith.mock.calls[0][0]).toBe(response)
    warn.mockRestore()
  })

  it('attend le choix de mise à jour et supprime uniquement ses anciens caches', async () => {
    const { listeners, caches, self } = worker()
    const event = { waitUntil: vi.fn() }
    listeners.install(event)
    await event.waitUntil.mock.calls[0][0]
    expect(self.skipWaiting).not.toHaveBeenCalled()
    listeners.message({ data: { type: 'SKIP_WAITING' }, waitUntil: vi.fn() })
    expect(self.skipWaiting).toHaveBeenCalledOnce()
    event.waitUntil.mockClear()
    listeners.activate(event)
    await event.waitUntil.mock.calls[0][0]
    expect(caches.delete).toHaveBeenCalledExactlyOnceWith('procolis-v1')
    expect(self.clients.claim).toHaveBeenCalledOnce()
  })
})
