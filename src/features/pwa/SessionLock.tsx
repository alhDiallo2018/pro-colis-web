import { useCallback, useEffect, useRef, useState } from 'react'
import { Button, Icon, Input, Toast } from '@/ds'
import { loginWithPin } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'
import { useAuthStore } from '@/store/auth'
import './pwa.css'

const IDLE_MS = Number(import.meta.env.VITE_SESSION_LOCK_MS) || 10 * 60 * 1000
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll', 'focus']

function isStandalone() {
  if (typeof window === 'undefined') return false
  const matchStandalone = window.matchMedia?.('(display-mode: standalone)').matches
  const iosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true
  return matchStandalone || iosStandalone
}

/**
 * Verrou de session après inactivité, actif uniquement en PWA installée.
 * Sur web classique le navigateur fournit déjà un onglet distinct et la
 * fermeture ferme la session — le verrou serait redondant.
 */
export function SessionLock() {
  const user = useAuthStore((s) => s.user)
  const setSession = useAuthStore((s) => s.setSession)
  const [locked, setLocked] = useState(false)
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const enabled = !!user && isStandalone()

  const resetTimer = useCallback(() => {
    if (!enabled || locked) return
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setLocked(true), IDLE_MS)
  }, [enabled, locked])

  useEffect(() => {
    if (!enabled) return
    resetTimer()
    for (const ev of ACTIVITY_EVENTS) window.addEventListener(ev, resetTimer, { passive: true })
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        setLocked(true)
      } else {
        resetTimer()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      for (const ev of ACTIVITY_EVENTS) window.removeEventListener(ev, resetTimer)
      document.removeEventListener('visibilitychange', onVisibility)
      if (timer.current) clearTimeout(timer.current)
    }
  }, [enabled, resetTimer])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || busy) return
    const identifier = user.phone || user.email
    if (!identifier) {
      setError("Identifiant introuvable — reconnectez-vous.")
      return
    }
    setBusy(true)
    setError('')
    try {
      const session = await loginWithPin({ identifier, pin })
      setSession(session)
      setPin('')
      setLocked(false)
      resetTimer()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'PIN incorrect')
    } finally {
      setBusy(false)
    }
  }

  if (!enabled || !locked) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Session verrouillée"
      className="pwa-lock"
    >
      <form onSubmit={submit} className="pwa-lock-card">
        <span className="pwa-lock-icon">
          <Icon name="lock" size={28} />
        </span>
        <div>
          <h2 className="pwa-lock-title">Session verrouillée</h2>
          <p className="pwa-lock-sub" style={{ marginTop: 6 }}>
            Saisissez votre code PIN pour reprendre là où vous en étiez.
          </p>
        </div>
        <Input
          label="Code PIN"
          type="password"
          inputMode="numeric"
          autoFocus
          autoComplete="current-password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
        />
        <Button type="submit" loading={busy} disabled={pin.length < 4} block icon="lock_open">
          Déverrouiller
        </Button>
        {error && <Toast tone="error" message={error} />}
      </form>
    </div>
  )
}
