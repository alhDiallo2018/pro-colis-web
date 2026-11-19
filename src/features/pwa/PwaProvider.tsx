import { useContext, useEffect, useState, type ReactNode } from 'react'
import { Button } from '@/ds'
import { QueryClientContext } from '@tanstack/react-query'
import { isAppleMobile, isStandalone, PwaContext } from './context'
import { flushBackgroundQueue, persistPwaBranding, persistPwaTimings } from './pwaSync'
import { precacheByRole } from './precacheByRole'
import { useAuthStore } from '@/store/auth'
import { usePublicConfig } from '@/lib/usePublicConfig'
import './pwa.css'

/** Ne consomme React Query que si un `QueryClientProvider` est présent au-
 *  dessus : certains tests PWA montent uniquement `PwaProvider` sans Query. */
function TimingsBridge() {
  const { data: publicConfig } = usePublicConfig()
  useEffect(() => {
    if (publicConfig?.timings) {
      void persistPwaTimings(publicConfig.timings as Record<string, unknown>)
    }
  }, [publicConfig?.timings])
  // Phase 6 — propage branding + fallbacks notifications vers le SW. Le même
  // pattern IDB que les timings est réutilisé : le SW relit après kill/revive.
  useEffect(() => {
    if (publicConfig?.branding || publicConfig?.notifications) {
      void persistPwaBranding(
        publicConfig.branding as Record<string, unknown> | undefined,
        publicConfig.notifications as Record<string, unknown> | undefined,
      )
    }
  }, [publicConfig?.branding, publicConfig?.notifications])
  return null
}

export function PwaProvider({ children }: { children: ReactNode }) {
  const [installed, setInstalled] = useState(isStandalone)
  const [appleMobile] = useState(isAppleMobile)
  const [dismissed, setDismissed] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null)
  const [updating, setUpdating] = useState(false)
  // Précache des écrans du rôle dès l'ouverture de session (via SW cache).
  const userRole = useAuthStore((s) => s.user?.role)
  const sessionId = useAuthStore((s) => s.sessionId)
  useEffect(() => {
    precacheByRole(userRole, sessionId)
  }, [userRole, sessionId])

  // Propage les timings admin vers le SW (`pwaSyncMaxAttempts`…). Persistance
  // en IDB : le SW relit la valeur à chaque réveil, même après kill.
  // `TimingsBridge` est monté conditionnellement : sans `QueryClientProvider`
  // dans l'arbre (cas des tests PWA minimaux), `usePublicConfig` throw — on
  // préserve ces tests tant que l'app en prod monte toujours le provider.
  const hasQueryClient = useContext(QueryClientContext) != null

  useEffect(() => {
    const media = window.matchMedia('(display-mode: standalone)')
    const syncInstalled = () => setInstalled(isStandalone())
    const syncOnline = () => {
      const nowOnline = navigator.onLine
      setOnline(nowOnline)
      // Fallback Background Sync pour les navigateurs sans SyncManager
      // (Safari macOS + iOS, Firefox) : on rejoue dès le retour en ligne.
      if (nowOnline) {
        void flushBackgroundQueue()
      }
    }
    media.addEventListener('change', syncInstalled)
    window.addEventListener('appinstalled', syncInstalled)
    window.addEventListener('online', syncOnline)
    window.addEventListener('offline', syncOnline)
    // Rejeu au boot : couvre le cas où l'onglet a été tué pendant la coupure.
    if (navigator.onLine) void flushBackgroundQueue()
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

    // Le SW relaie un clic sur notification push vers l'onglet actif. Le
    // routage reste côté UI : le SW ne connaît pas React Router, et un simple
    // `location.assign` suffit à ouvrir la bonne vue en respectant l'historique.
    const onSwMessage = (event: MessageEvent) => {
      const payload = event.data as { type?: string; target?: string } | null
      if (!payload || payload.type !== 'PUSH_NOTIFICATION_CLICK') return
      const target = typeof payload.target === 'string' ? payload.target : '/app/notifications'
      if (window.location.pathname + window.location.search !== target) {
        window.location.assign(target)
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
    navigator.serviceWorker.addEventListener('message', onSwMessage)
    return () => {
      disposed = true
      document.removeEventListener('visibilitychange', checkUpdate)
      navigator.serviceWorker.removeEventListener('message', onSwMessage)
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
      {hasQueryClient && <TimingsBridge />}
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
