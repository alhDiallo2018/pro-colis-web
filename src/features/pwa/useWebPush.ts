import { useCallback, useEffect, useState } from 'react'
import {
  getWebPushPublicKey,
  subscribeWebPush,
  unsubscribeWebPush,
} from '@/lib/api/notifications'

export type WebPushStatus =
  | 'loading'
  | 'unsupported' // Service Worker ou Notification API absents.
  | 'server-disabled' // VAPID non configuré côté API.
  | 'denied' // L'utilisateur a refusé la permission.
  | 'default' // Permission pas encore demandée, bouton possible.
  | 'granted' // Permission accordée mais pas encore abonné.
  | 'subscribed' // Abonnement serveur actif.
  | 'error'

interface WebPushState {
  status: WebPushStatus
  endpoint: string | null
  error: string | null
}

// Les Service Workers exposent la clé publique en base64url. `PushManager` la
// veut en `BufferSource` adossé à un `ArrayBuffer` (pas `SharedArrayBuffer`) —
// on renvoie donc explicitement un `Uint8Array<ArrayBuffer>` plutôt qu'un
// `Uint8Array<ArrayBufferLike>` générique, sinon TS refuse au call site.
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(normalized)
  const buffer = new ArrayBuffer(raw.length)
  const output = new Uint8Array(buffer)
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i)
  return output
}

// Convertit un PushSubscription en payload sérialisable pour l'API.
function serializeSubscription(subscription: PushSubscription) {
  const json = subscription.toJSON()
  const keys = json.keys || ({} as Record<string, string>)
  return {
    endpoint: json.endpoint || subscription.endpoint,
    keys: { p256dh: keys.p256dh || '', auth: keys.auth || '' },
    expirationTime:
      typeof subscription.expirationTime === 'number' ? subscription.expirationTime : null,
  }
}

function initialStatus(): WebPushStatus {
  if (typeof window === 'undefined') return 'loading'
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return 'unsupported'
  }
  if (Notification.permission === 'denied') return 'denied'
  return 'loading'
}

/**
 * Pilote le cycle d'abonnement Web Push :
 *  - lit l'état existant (`PushManager.getSubscription`) sans jamais déclencher
 *    de prompt natif ;
 *  - expose `enable()` pour demander la permission et créer l'abonnement ;
 *  - expose `disable()` pour désabonner localement et côté serveur.
 *
 * Reste silencieux quand la plateforme ne supporte pas Web Push (Safari macOS
 * sans PWA installée, iOS < 16.4, etc.) : l'UI peut lire `status === 'unsupported'`
 * et masquer le toggle sans afficher d'erreur.
 */
export function useWebPush() {
  const [state, setState] = useState<WebPushState>(() => ({
    status: initialStatus(),
    endpoint: null,
    error: null,
  }))

  useEffect(() => {
    if (state.status === 'unsupported' || state.status === 'denied') return
    let cancelled = false

    ;(async () => {
      try {
        const registration = await navigator.serviceWorker.ready
        const existing = await registration.pushManager.getSubscription()
        if (cancelled) return
        if (existing) {
          setState({ status: 'subscribed', endpoint: existing.endpoint, error: null })
        } else if (Notification.permission === 'granted') {
          setState({ status: 'granted', endpoint: null, error: null })
        } else {
          setState({ status: 'default', endpoint: null, error: null })
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            status: 'error',
            endpoint: null,
            error: (error as Error).message || 'Push indisponible',
          })
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [state.status])

  const enable = useCallback(async () => {
    if (state.status === 'unsupported') return
    setState((prev) => ({ ...prev, status: 'loading', error: null }))

    try {
      const publicKey = await getWebPushPublicKey()
      if (!publicKey) {
        setState({ status: 'server-disabled', endpoint: null, error: null })
        return
      }

      // Le prompt natif n'est affiché qu'ici, en réponse à un clic utilisateur :
      // les navigateurs refusent toute demande déclenchée depuis un effet ou
      // un timer pour éviter les bannières agressives.
      const permission = await Notification.requestPermission()
      if (permission === 'denied') {
        setState({ status: 'denied', endpoint: null, error: null })
        return
      }
      if (permission !== 'granted') {
        setState({ status: 'default', endpoint: null, error: null })
        return
      }

      const registration = await navigator.serviceWorker.ready
      const existing = await registration.pushManager.getSubscription()
      // Si la clé VAPID a changé, l'ancien abonnement est invalide : on le
      // révoque avant d'en recréer un.
      if (existing) await existing.unsubscribe().catch(() => {})

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })
      await subscribeWebPush(serializeSubscription(subscription))
      setState({ status: 'subscribed', endpoint: subscription.endpoint, error: null })
    } catch (error) {
      setState({
        status: 'error',
        endpoint: null,
        error: (error as Error).message || 'Impossible d’activer les notifications push',
      })
    }
  }, [state.status])

  const disable = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        // L'ordre compte : purger côté serveur en premier garantit que l'API
        // ne re-notifiera plus, même si `unsubscribe()` échoue localement.
        await unsubscribeWebPush(subscription.endpoint).catch(() => {})
        await subscription.unsubscribe().catch(() => {})
      }
      setState({
        status: Notification.permission === 'granted' ? 'granted' : 'default',
        endpoint: null,
        error: null,
      })
    } catch (error) {
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: (error as Error).message || 'Impossible de désactiver les notifications',
      }))
    }
  }, [])

  return {
    status: state.status,
    endpoint: state.endpoint,
    error: state.error,
    enable,
    disable,
    supported: state.status !== 'unsupported',
  }
}
