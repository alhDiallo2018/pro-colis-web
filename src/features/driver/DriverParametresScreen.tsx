import { Card, SegmentedControl, Toast } from '@/ds'
import { useAuthStore } from '@/store/auth'
import { useUpdateDriverStatus } from './hooks'
import type { DriverStatus } from '@/lib/api/types'
import { NotificationPreferencesSheet } from '@/components/NotificationPreferences'
import { SecurityCard } from '@/features/shared/profile/SecurityCard'
import { DangerZoneCard } from '@/features/shared/profile/DangerZoneCard'

const STATUS_OPTIONS = [
  { value: 'available', label: 'Disponible', icon: 'check_circle' },
  { value: 'busy', label: 'Occupé', icon: 'pending' },
  { value: 'offline', label: 'Hors ligne', icon: 'do_not_disturb_on' },
]

export function DriverParametresScreen() {
  const user = useAuthStore((s) => s.user)
  const updateStatus = useUpdateDriverStatus()

  if (!user) return null

  const status = (user.driverStatus ?? 'offline') as DriverStatus

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Availability */}
      <Card padding="lg">
        <h3 style={{ margin: '0 0 4px', fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)', color: 'var(--text-strong)' }}>Disponibilité</h3>
        <p style={{ margin: '0 0 16px', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
          Votre statut détermine si vous recevez de nouvelles missions.
        </p>
        <SegmentedControl
          options={STATUS_OPTIONS}
          value={status}
          onChange={(v) => updateStatus.mutate(v as DriverStatus)}
        />
        {updateStatus.isError && <Toast tone="error" message="Impossible de mettre à jour le statut." style={{ marginTop: 14 }} />}
      </Card>

      <SecurityCard />

      <NotificationPreferencesSheet userEmail={user.email} userPhone={user.phone} />

      <DangerZoneCard />
    </div>
  )
}
