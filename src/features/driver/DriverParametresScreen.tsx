import { useMemo } from 'react'
import { Card, SegmentedControl, Toast } from '@/ds'
import { useAuthStore } from '@/store/auth'
import { useUpdateDriverStatus } from './hooks'
import type { DriverStatus } from '@/lib/api/types'
import { useDriverStatuses } from '@/lib/useReferenceData'
import { NotificationPreferencesSheet } from '@/components/NotificationPreferences'
import { SecurityCard } from '@/features/shared/profile/SecurityCard'
import { DangerZoneCard } from '@/features/shared/profile/DangerZoneCard'

// Fallback cote client : si le referentiel n'est pas (encore) accessible
// (hors ligne, API indisponible), on garde les trois statuts historiques
// pour que l'ecran reste exploitable. L'icone Material Symbols est
// resolue ici car le referentiel n'expose pas de glyphe en phase 5.
const STATUS_FALLBACK: Array<{ value: string; label: string; icon: string }> = [
  { value: 'available', label: 'Disponible', icon: 'check_circle' },
  { value: 'busy', label: 'Occupé', icon: 'pending' },
  { value: 'offline', label: 'Hors ligne', icon: 'do_not_disturb_on' },
]

// La seule connaissance metier qu'on garde cote code, c'est l'icone a
// afficher pour chaque code : le referentiel ne stocke que le label et la
// couleur, le SegmentedControl attend un glyph pour chaque option.
const ICON_BY_CODE: Record<string, string> = {
  available: 'check_circle',
  busy: 'pending',
  offline: 'do_not_disturb_on',
  on_leave: 'event_busy',
}

export function DriverParametresScreen() {
  const user = useAuthStore((s) => s.user)
  const updateStatus = useUpdateDriverStatus()
  // Phase 5 : les statuts sont servis par `/reference/driver-statuses`.
  const statusesQ = useDriverStatuses()

  const options = useMemo(() => {
    const rows = statusesQ.data ?? []
    if (!rows.length) return STATUS_FALLBACK
    return rows.map((row) => ({
      value: row.code,
      label: row.label,
      icon: ICON_BY_CODE[row.code] ?? 'radio_button_checked',
    }))
  }, [statusesQ.data])

  if (!user) return null

  const status = (user.driverStatus ?? 'offline') as DriverStatus

  return (
    <div className="cm-detail-page" style={{ maxWidth: 720 }}>
      <div className="cm-page-head">
        <div className="cm-page-head-body">
          <h1>Paramètres</h1>
          <p className="cm-page-head-sub">Disponibilité, sécurité et notifications</p>
        </div>
      </div>
      {/* Availability */}
      <Card padding="lg">
        <h3 style={{ margin: '0 0 4px', fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)', color: 'var(--text-strong)' }}>Disponibilité</h3>
        <p style={{ margin: '0 0 16px', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
          Votre statut détermine si vous recevez de nouvelles missions.
        </p>
        <SegmentedControl
          options={options}
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
