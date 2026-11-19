import { useEffect, useRef, useState } from 'react'
import { Button } from '@/ds'
import { api } from '@/lib/api/client'
import { useAuthStore } from '@/store/auth'
import { getTimings } from '@/lib/usePublicConfig'
/** Une session de navigateur ne suit qu'un départ. Les callbacks GPS restent
 * attachés au compte d'origine ; aucun point en mémoire n'est redaté. */
export function JourneySharing({ advertisementId }: { advertisementId?: string }) {
  const session = useAuthStore((s) => s.sessionId),
    [active, setActive] = useState(false),
    [error, setError] = useState('')
  const stopRef = useRef<() => void>(() => {}),
    startRef = useRef<() => void>(() => {})
  useEffect(() => {
    let stopped = true,
      watch: number | undefined,
      liveId: string | undefined,
      busy = false,
      last = 0,
      generation = 0
    const path = advertisementId
      ? `/advertisements/${advertisementId}/live`
      : '/driver/discovery-location'
    function sameSession() {
      return useAuthStore.getState().sessionId === session
    }
    async function remove(id?: string) {
      if (!sameSession()) return
      try {
        if (advertisementId) {
          if (id) await api.delete(path, { data: { sessionId: id } })
        } else await api.put(path, { enabled: false })
      } catch {
        setError(
          'Partage interrompu. La dernière position disparaîtra automatiquement à expiration.',
        )
      }
    }
    function stop() {
      if (stopped) return
      stopped = true
      generation++
      if (watch !== undefined) navigator.geolocation.clearWatch(watch)
      watch = undefined
      const id = liveId
      liveId = undefined
      setActive(false)
      void remove(id)
    }
    function start() {
      if (!stopped) return
      if (busy) { setError('Patientez pendant l’arrêt du précédent partage.'); return }
      if (!navigator.geolocation || !navigator.onLine || document.hidden) {
        setError('GPS et connexion nécessaires, avec cette page au premier plan.')
        return
      }
      last = 0
      stopped = false
      const ticket = ++generation
      setError('')
      setActive(true)
      // Timings admin : l'intervalle minimal entre deux uploads et la
      // fraîcheur maximale acceptée côté client suivent la politique serveur.
      const { locationUploadIntervalSec, locationFreshnessSec } = getTimings()
      const uploadIntervalMs = Math.max(1_000, locationUploadIntervalSec * 1_000)
      const freshnessMs = Math.max(5_000, locationFreshnessSec * 1_000)
      watch = navigator.geolocation.watchPosition(
        async (p) => {
          if (
            stopped ||
            ticket !== generation ||
            !sameSession() ||
            busy ||
            p.timestamp <= last ||
            Date.now() - p.timestamp > freshnessMs ||
            p.coords.accuracy > 1000
          )
            return
          if (last && p.timestamp - last < uploadIntervalMs) return
          busy = true
          try {
            const fix = {
              latitude: p.coords.latitude,
              longitude: p.coords.longitude,
              accuracyMeters: p.coords.accuracy,
              capturedAt: new Date(p.timestamp).toISOString(),
            }
            if (advertisementId) {
              if (liveId) await api.patch(path, { ...fix, sessionId: liveId })
              else {
                const { data } = await api.post(path, {
                  ...fix,
                  enabled: true,
                })
                if (stopped || ticket !== generation || !sameSession()) {
                  void remove(data.sessionId)
                  return
                }
                liveId = data.sessionId
              }
            } else {
              await api.put(path, {
                enabled: true,
                latitude: fix.latitude,
                longitude: fix.longitude,
              })
              if (stopped || ticket !== generation) void remove()
            }
            last = p.timestamp
          } catch (e) {
            if (ticket !== generation || !sameSession()) return
            setError((e as Error).message)
            stop()
          } finally {
            busy = false
          }
        },
        (e) => {
          setError(e.message)
          stop()
        },
        // Timeout GPS administrable : la valeur d'origine (20 s) laisse le
        // temps à la puce de converger ; la config admin peut remonter si
        // besoin en zones à mauvaise couverture.
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: Math.max(5_000, getTimings().geolocationTimeoutMs + 5_000),
        },
      )
    }
    startRef.current = start
    stopRef.current = stop
    const hidden = () => {
      if (document.hidden || !navigator.onLine) stop()
    }
    document.addEventListener('visibilitychange', hidden)
    window.addEventListener('offline', hidden)
    const watchdog = setInterval(() => {
      const freshnessWatchdogMs = Math.max(5_000, getTimings().locationFreshnessSec * 1_000)
      if (!stopped && last && Date.now() - last > freshnessWatchdogMs) {
        setError('GPS interrompu : réactivez le partage.')
        stop()
      }
    }, 5000)
    return () => {
      stop()
      clearInterval(watchdog)
      document.removeEventListener('visibilitychange', hidden)
      window.removeEventListener('offline', hidden)
    }
  }, [session, advertisementId])
  return (
    <div className="transport-panel">
      <strong>
        {advertisementId ? 'Position réelle de ce départ' : 'Être visible près des clients'}
      </strong>
      <p className="transport-note">
        {advertisementId
          ? 'Votre position précise est partagée pour ce véhicule et ce départ.'
          : 'Votre position approximative permet aux clients proches de vous trouver.'}{' '}
        Sur web/PWA, gardez cette page ouverte. Le partage s’arrête lorsque vous quittez la page ou
        la mettez en arrière-plan.
      </p>
      <Button variant="secondary" onClick={() => (active ? stopRef.current() : startRef.current())}>
        {active ? 'Arrêter le partage GPS' : 'Activer mon partage GPS'}
      </Button>
      {error && <p role="alert">{error}</p>}
    </div>
  )
}
