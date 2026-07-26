import { useState } from 'react'
import { Card, StatBox } from '@/ds'
import { useAuthStore } from '@/store/auth'
import { NotificationPreferencesSheet } from '@/components/NotificationPreferences'
import { ProfileHeader } from './profile/ProfileHeader'
import { IdentityCard } from './profile/IdentityCard'
import { SecurityCard } from './profile/SecurityCard'
import { useMyGarageStats, useMyStats, usePlatformStats } from './profile/hooks'
import { formatFcfa } from '@/lib/format'
import { isSupportRole } from '@/lib/api/types'

const PARCEL_STATUS_LABEL: Record<string, string> = {
  pending: 'En attente',
  free: 'Libre service',
  confirmed: 'Confirmés',
  picked_up: 'Ramassés',
  in_transit: 'En transit',
  arrived: 'Arrivés',
  out_for_delivery: 'En livraison',
  delivered: 'Livrés',
  cancelled: 'Annulés',
}

/**
 * Profil des comptes internes : admin de zone, super admin et rôles support.
 * Le contenu s'adapte au rôle — périmètre zone pour l'admin, périmètre
 * plateforme pour le super admin et le support.
 */
export function StaffProfilScreen() {
  const user = useAuthStore((s) => s.user)
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)

  const isGarageAdmin = user?.role === 'admin'
  const isPlatformStaff = user?.role === 'super_admin' || isSupportRole(user?.role)

  const garageStats = useMyGarageStats(isGarageAdmin)
  const platformStats = usePlatformStats(isPlatformStaff)
  const myStats = useMyStats()

  if (!user) return null

  const garage = garageStats.data
  const platform = platformStats.data
  const byStatus = Object.entries(garage?.parcelsByStatus ?? {}).filter(([, count]) => count > 0)

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <ProfileHeader
        user={user}
        onPhotoChange={setPhotoDataUrl}
        meta={[
          ...(isGarageAdmin
            ? [{ icon: 'garage', label: 'Zone gérée', value: user.garageName ?? '—' }]
            : []),
          { icon: 'notifications', label: 'Notifications non lues', value: myStats.data?.unreadNotifications ?? '—' },
        ]}
      />

      {/* Périmètre zone */}
      {isGarageAdmin && (garageStats.isSuccess || garageStats.isLoading) && (
        <Card padding="lg">
          <h3 style={{ margin: '0 0 4px', fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)', color: 'var(--text-strong)' }}>
            Ma zone {user.garageName ? `· ${user.garageName}` : ''}
          </h3>
          <p style={{ margin: '0 0 14px', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
            Activité de la zone dont vous avez la charge.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
            <StatBox icon="package_2" tone="primary" value={garage?.totalParcels ?? '—'} label="Colis de la zone" />
            <StatBox icon="local_shipping" tone="teal" value={garage?.activeParcels ?? '—'} label="En cours" />
            <StatBox icon="task_alt" tone="green" value={garage?.deliveredToday ?? '—'} label="Livrés aujourd'hui" />
            <StatBox icon="directions_car" tone="neutral" value={garage?.activeDrivers ?? '—'} label="Chauffeurs dispo" />
            <StatBox icon="payments" tone="amber" value={garage ? formatFcfa(garage.revenue) : '—'} label="Encaissé" />
          </div>

          {byStatus.length > 0 && (
            <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {byStatus.map(([status, count]) => (
                <span
                  key={status}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-pill)',
                    background: 'var(--surface-sunken)',
                    fontSize: 12.5,
                    color: 'var(--text-body)',
                  }}
                >
                  {PARCEL_STATUS_LABEL[status] ?? status}
                  <b style={{ fontFamily: 'var(--font-mono)' }}>{count}</b>
                </span>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Périmètre plateforme */}
      {isPlatformStaff && (platformStats.isSuccess || platformStats.isLoading) && (
        <Card padding="lg">
          <h3 style={{ margin: '0 0 4px', fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)', color: 'var(--text-strong)' }}>
            Mon périmètre
          </h3>
          <p style={{ margin: '0 0 14px', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
            Vue plateforme accessible avec votre rôle.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
            <StatBox icon="group" tone="primary" value={platform?.totalUsers ?? '—'} label="Utilisateurs" />
            <StatBox icon="local_shipping" tone="teal" value={platform?.totalDrivers ?? '—'} label="Chauffeurs" />
            <StatBox icon="person" tone="neutral" value={platform?.totalClients ?? '—'} label="Clients" />
            <StatBox icon="garage" tone="amber" value={platform?.totalGarages ?? '—'} label="Zones" />
            <StatBox icon="package_2" tone="primary" value={platform?.totalParcels ?? '—'} label="Colis" />
            <StatBox icon="task_alt" tone="green" value={platform?.parcelsDeliveredToday ?? '—'} label="Livrés aujourd'hui" />
          </div>
        </Card>
      )}

      <IdentityCard user={user} photoDataUrl={photoDataUrl} onPhotoSaved={() => setPhotoDataUrl(null)} />

      <NotificationPreferencesSheet userEmail={user.email} userPhone={user.phone} />

      <SecurityCard />
    </div>
  )
}
