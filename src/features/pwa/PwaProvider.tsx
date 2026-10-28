import { useEffect, useState, type ReactNode } from 'react'
import { Button } from '@/ds'
import { isAppleMobile, isStandalone, PwaContext } from './context'
import './pwa.css'

export function PwaProvider({ children }: { children: ReactNode }) {
  const [installed, setInstalled] = useState(isStandalone)
  const [appleMobile] = useState(isAppleMobile)
  const [dismissed, setDismissed] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(display-mode: standalone)')
    const syncInstalled = () => setInstalled(isStandalone())
    const syncOnline = () => setOnline(navigator.onLine)
    media.addEventListener('change', syncInstalled)
    window.addEventListener('appinstalled', syncInstalled)
    window.addEventListener('online', syncOnline)
    window.addEventListener('offline', syncOnline)
    return () => {
      media.removeEventListener('change', syncInstalled)
      window.removeEventListener('appinstalled', syncInstalled)
      window.removeEventListener('online', syncOnline)
      window.removeEventListener('offline', syncOnline)
    }
  }, [])

  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
    let disposed = false
    let registration: ServiceWorkerRegistration | undefined
    let installing: ServiceWorker | null = null

    const onStateChange = () => {
      // Une première installation est silencieuse. Une mise à jour attend le
      // choix de l'utilisateur afin de ne pas interrompre un formulaire.
      if (!disposed && installing?.state === 'installed' && navigator.serviceWorker.controller) {
        setWaiting(registration?.waiting ?? installing)
      }
    }
    const onUpdateFound = () => {
      installing?.removeEventListener('statechange', onStateChange)
      installing = registration?.installing ?? null
      installing?.addEventListener('statechange', onStateChange)
    }
    const checkUpdate = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        registration?.update().catch((error) => console.warn('[PWA] Vérification de mise à jour impossible', error))
      }
    }

    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .then((result) => {
        if (disposed) return
        registration = result
        if (result.waiting) setWaiting(result.waiting)
        result.addEventListener('updatefound', onUpdateFound)
        onUpdateFound()
      })
      .catch((error) => console.error('[PWA] Installation du service worker impossible', error))
    document.addEventListener('visibilitychange', checkUpdate)
    return () => {
      disposed = true
      document.removeEventListener('visibilitychange', checkUpdate)
      registration?.removeEventListener('updatefound', onUpdateFound)
      installing?.removeEventListener('statechange', onStateChange)
    }
  }, [])

  useEffect(() => {
    if (!updating || !waiting) return
    // Seul l'onglet ayant demandé la mise à jour se recharge : les autres
    // onglets peuvent contenir une saisie encore en cours.
    const reload = () => window.location.reload()
    navigator.serviceWorker.addEventListener('controllerchange', reload, { once: true })
    waiting.postMessage({ type: 'SKIP_WAITING' })
    const timeout = window.setTimeout(() => setUpdating(false), 15000)
    return () => {
      window.clearTimeout(timeout)
      navigator.serviceWorker.removeEventListener('controllerchange', reload)
    }
  }, [updating, waiting])

  return (
    <PwaContext.Provider value={{ installed, appleMobile }}>
      {!online && <div className="pwa-notice" role="status">Vous êtes hors connexion. Votre profil et votre historique sauvegardé restent accessibles depuis le menu. Les opérations et le GPS nécessitent Internet.</div>}
      {waiting && online && (
        <div className="pwa-notice" role="status">
          <span>Une nouvelle version est prête. Terminez votre saisie avant de l’appliquer.</span>
          <Button variant="secondary" loading={updating} onClick={() => setUpdating(true)}>Mettre à jour</Button>
        </div>
      )}
      {appleMobile && !installed && !dismissed && (
        <aside className="pwa-install-banner" aria-label="Installer ProColis">
          <img src="/icons/apple-touch-icon.png" width="40" height="40" alt="" />
          <a href="/installer"><strong>ProColis sur votre iPhone ou iPad</strong><span>Installer sans App Store</span></a>
          <button type="button" aria-label="Masquer l’aide à l’installation" onClick={() => setDismissed(true)}>×</button>
        </aside>
      )}
      {children}
    </PwaContext.Provider>
  )
}
