import { useEffect, useRef, useState } from 'react'
import { heartbeat, SUPPORT_ROLES } from '@/lib/api/supportChat'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/ds'

export function SupportAvailability() {
  const user = useAuthStore(state => state.user)
  if (!user || !SUPPORT_ROLES.includes(user.role)) return null
  return <Presence key={user.id} userId={user.id} defaultAvailable={user.role !== 'super_admin'} />
}

function Presence({ userId, defaultAvailable }: { userId: string; defaultAvailable: boolean }) {
  const [available, setAvailable] = useState(defaultAvailable)
  const [error, setError] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const connectionId = useRef(crypto.randomUUID())
  const queue = useRef(Promise.resolve())
  useEffect(() => {
    let mounted = true
    const publish = (value: boolean) => {
      // Serialise les transitions visible/cache : une ancienne requete lente
      // ne doit pas remettre disponible un onglet qui vient de se fermer.
      queue.current = queue.current.catch(() => {}).then(async () => {
        if (useAuthStore.getState().user?.id !== userId) return
        try {
          await heartbeat(connectionId.current, value)
          if (mounted) { setError(false); setConfirmed(value) }
        } catch { if (mounted) { setError(true); setConfirmed(false) } }
      })
    }
    const refresh = () => publish(available && document.visibilityState === 'visible')
    refresh()
    const interval = setInterval(refresh, 20000)
    const leave = () => publish(false)
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('pagehide', leave)
    return () => {
      mounted = false
      clearInterval(interval)
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('pagehide', leave)
      publish(false)
    }
  }, [userId, available])
  return <div style={{ padding: '8px 24px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', background: 'var(--surface-card)' }}>
    <span role="status">{error ? 'Présence non confirmée — reconnexion en cours' : confirmed ? 'Support : disponible sur cet appareil' : 'Support : indisponible sur cet appareil'}</span>
    <Button size="sm" variant="secondary" onClick={() => setAvailable(value => !value)}>
      {available ? 'Me rendre indisponible' : 'Me rendre disponible'}
    </Button>
  </div>
}
