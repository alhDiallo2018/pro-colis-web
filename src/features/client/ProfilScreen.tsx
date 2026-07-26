import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, Card, StatBox } from '@/ds'
import { useAuthStore } from '@/store/auth'
import { NotificationPreferencesSheet } from '@/components/NotificationPreferences'
import { ProfileHeader } from '@/features/shared/profile/ProfileHeader'
import { IdentityCard } from '@/features/shared/profile/IdentityCard'
import { SecurityCard } from '@/features/shared/profile/SecurityCard'
import { AddressBookCard } from '@/features/shared/profile/AddressBookCard'
import {
  useFavoriteGarages,
  useMyBidStats,
  useMyStats,
  useRemoveFavoriteGarage,
} from '@/features/shared/profile/hooks'
import { formatPoints } from '@/lib/format'
import { useMyParcels } from './hooks'

export function ProfilScreen() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const stats = useMyStats()
  const bidStats = useMyBidStats()
  const favorites = useFavoriteGarages()
  const removeFavorite = useRemoveFavoriteGarage()
  const parcelsQ = useMyParcels({ limit: 200 })
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)

  if (!user) return null

  const parcels = parcelsQ.data?.parcels ?? []
  const totalSpent = parcels
    .filter((p) => p.status === 'delivered')
    .reduce((sum, p) => sum + Number(p.totalAmount ?? p.negotiatedPrice ?? p.price ?? 0), 0)
  const cancelled = parcels.filter((p) => p.status === 'cancelled').length

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <ProfileHeader
        user={user}
        onPhotoChange={setPhotoDataUrl}
        meta={[
          { icon: 'package_2', label: 'Colis envoyés', value: stats.data?.totalParcels ?? parcels.length },
          { icon: 'payments', label: 'Total dépensé', value: `${new Intl.NumberFormat('fr-FR').format(Math.round(totalSpent))} FCFA` },
        ]}
      />

      {/* Activité personnelle */}
      <Card padding="lg">
        <h3 style={{ margin: '0 0 14px', fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)', color: 'var(--text-strong)' }}>
          Mon activité
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          <StatBox icon="package_2" tone="primary" value={stats.data?.totalParcels ?? '—'} label="Colis envoyés" />
          <StatBox icon="local_shipping" tone="teal" value={stats.data?.activeParcels ?? '—'} label="En cours" />
          <StatBox icon="task_alt" tone="green" value={stats.data?.deliveredParcels ?? '—'} label="Livrés" />
          <StatBox icon="cancel" tone="red" value={cancelled} label="Annulés" />
          <StatBox icon="stars" tone="amber" value={stats.data ? formatPoints(stats.data.scoreBalance) : '—'} label="Points" />
          <StatBox icon="notifications" tone="neutral" value={stats.data?.unreadNotifications ?? '—'} label="Notifications" />
        </div>
      </Card>

      {/* Offres reçues */}
      <Card padding="lg">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)', color: 'var(--text-strong)' }}>
            Mes offres reçues
          </h3>
          <Button size="sm" variant="secondary" iconTrailing="chevron_right" onClick={() => navigate('/client/offres')}>
            Voir les offres
          </Button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          <StatBox icon="inbox" tone="primary" value={bidStats.data?.received ?? '—'} label="Reçues" />
          <StatBox icon="hourglass_top" tone="amber" value={bidStats.data?.pending ?? '—'} label="En attente" />
          <StatBox icon="thumb_up" tone="green" value={bidStats.data?.accepted ?? '—'} label="Acceptées" />
          <StatBox icon="thumb_down" tone="neutral" value={bidStats.data?.rejected ?? '—'} label="Refusées" />
        </div>
      </Card>

      <IdentityCard user={user} photoDataUrl={photoDataUrl} onPhotoSaved={() => setPhotoDataUrl(null)} />

      <AddressBookCard />

      {/* Zones favorites */}
      {favorites.data && favorites.data.length > 0 && (
        <Card padding="lg">
          <h3 style={{ margin: '0 0 14px', fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)', color: 'var(--text-strong)' }}>
            Mes zones favorites
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {favorites.data.map((g) => (
              <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5, color: 'var(--text-strong)' }}>{g.name}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{g.city ?? g.region ?? '—'}</div>
                </div>
                {g.isActive === false && <Badge tone="neutral">Inactive</Badge>}
                <Button size="sm" variant="ghost" icon="heart_minus" onClick={() => removeFavorite.mutate(g.id)}>
                  Retirer
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <NotificationPreferencesSheet userEmail={user.email} userPhone={user.phone} />

      <SecurityCard />
    </div>
  )
}
