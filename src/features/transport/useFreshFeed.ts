import { useEffect, useState } from 'react'
import { api } from '@/lib/api/client'
import { useAuthStore } from '@/store/auth'
/** Les résultats temps réel ne survivent ni à une coupure, ni à un changement
 * de compte ou de filtre. Les requêtes sont sérialisées et annulées à la sortie. */
export function useFreshFeed<T>(
  url: string,
  params: Record<string, string | number>,
  enabled = true,
  delay = 5000,
) {
  const session = useAuthStore((s) => s.sessionId),
    signature = JSON.stringify(params)
  const [state, setState] = useState<{ key: string; data?: T; error?: string }>({ key: '' })
  const key = `${session}:${url}:${signature}`
  useEffect(() => {
    let disposed = false,
      timer: ReturnType<typeof setTimeout> | undefined,
      controller: AbortController | undefined,
      generation = 0
    async function refresh() {
      const ticket = ++generation
      controller?.abort()
      clearTimeout(timer)
      setState({ key })
      if (!enabled || document.hidden || !navigator.onLine) return
      controller = new AbortController()
      try {
        const { data } = await api.get(url, {
          params: JSON.parse(signature),
          signal: controller.signal,
        })
        if (!disposed && ticket === generation) setState({ key, data })
      } catch (e) {
        if (!disposed && ticket === generation) setState({ key, error: (e as Error).message })
      } finally {
        if (!disposed && ticket === generation) timer = setTimeout(poll, delay)
      }
    }
    async function poll() {
      if (document.hidden || !navigator.onLine) {
        void refresh()
        return
      }
      const ticket = ++generation
      controller = new AbortController()
      try {
        const { data } = await api.get(url, {
          params: JSON.parse(signature),
          signal: controller.signal,
        })
        if (!disposed && ticket === generation) setState({ key, data })
      } catch (e) {
        if (!disposed && ticket === generation) setState({ key, error: (e as Error).message })
      } finally {
        if (!disposed && ticket === generation) timer = setTimeout(poll, delay)
      }
    }
    void refresh()
    window.addEventListener('online', refresh)
    window.addEventListener('offline', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      disposed = true
      generation++
      controller?.abort()
      clearTimeout(timer)
      window.removeEventListener('online', refresh)
      window.removeEventListener('offline', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [key, url, signature, session, enabled, delay])
  return state.key === key ? state : { key }
}
