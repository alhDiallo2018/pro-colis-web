import { Switch } from '@/ds'
import { useAuthStore } from '@/store/auth'
import { useUpdateDriverStatus } from './hooks'

/** Driver availability pill in the topbar, wired to the real driverStatus. */
export function AvailabilityToggle() {
  const status = useAuthStore((s) => s.user?.driverStatus)
  const update = useUpdateDriverStatus()
  const available = status === 'available'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '7px 14px',
        background: available ? 'var(--green-50)' : 'var(--surface-sunken)',
        borderRadius: 'var(--radius-pill)',
      }}
    >
      <span style={{ width: 9, height: 9, borderRadius: '50%', background: available ? 'var(--green-500)' : 'var(--slate-400)' }} />
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: available ? 'var(--green-700)' : 'var(--text-muted)' }}>
        {available ? 'Disponible' : 'Indisponible'}
      </span>
      <Switch checked={available} disabled={update.isPending} onChange={(c) => update.mutate(c ? 'available' : 'offline')} />
    </div>
  )
}
