import type { ReactNode } from 'react'
import { Avatar, Badge, Card, Icon } from '@/ds'
import { ProfilePhotoCapture } from '@/components/ProfilePhotoCapture'
import { formatDate, formatDateTime } from '@/lib/format'
import type { IdentityStatus } from '@/lib/api/identity'
import type { Role, User } from '@/lib/api/types'

const ROLE_LABEL: Record<Role, string> = {
  client: 'Client',
  driver: 'Chauffeur',
  admin: 'Admin zone',
  super_admin: 'Super admin',
  support: 'Support',
  support_technique: 'Support technique',
  support_commercial: 'Support commercial',
}

const KYC_BADGE: Record<IdentityStatus, { label: string; tone: 'green' | 'amber' | 'red'; icon: string }> = {
  approved: { label: 'Identité vérifiée', tone: 'green', icon: 'verified_user' },
  pending: { label: 'Identité en attente', tone: 'amber', icon: 'hourglass_top' },
  rejected: { label: 'Identité refusée', tone: 'red', icon: 'gpp_bad' },
}

export interface ProfileMetaItem {
  icon: string
  label: string
  value: ReactNode
}

export interface ProfileHeaderProps {
  user: User
  /** Autorise le changement de photo (remonte le data-URL, `''` pour supprimer). */
  onPhotoChange?: (dataUrl: string) => void
  /** Statut KYC si le rôle est concerné (chauffeurs). */
  kycStatus?: IdentityStatus | null
  /** Badges supplémentaires propres au rôle (disponibilité, note…). */
  badges?: ReactNode
  /** Lignes d'information additionnelles dans la grille méta. */
  meta?: ProfileMetaItem[]
}

/**
 * En-tête de profil commun à tous les rôles : photo, identité, badges de
 * vérification et grille des méta-données du compte.
 */
export function ProfileHeader({ user, onPhotoChange, kycStatus, badges, meta = [] }: ProfileHeaderProps) {
  const baseMeta: ProfileMetaItem[] = [
    { icon: 'call', label: 'Téléphone', value: user.phone },
    { icon: 'mail', label: 'Email', value: user.email || 'Non renseigné' },
    { icon: 'location_on', label: 'Ville', value: user.city || 'Non renseignée' },
    ...(user.region ? [{ icon: 'map', label: 'Région', value: user.region }] : []),
    ...(user.address ? [{ icon: 'home', label: 'Adresse', value: user.address }] : []),
    ...(user.garageName || user.primaryZoneName
      ? [{ icon: 'garage', label: 'Zone', value: user.garageName ?? user.primaryZoneName ?? '—' }]
      : []),
    { icon: 'event', label: 'Membre depuis', value: formatDate(user.createdAt) },
    { icon: 'login', label: 'Dernière connexion', value: formatDateTime(user.lastLogin) },
    { icon: 'fingerprint', label: 'Identifiant', value: <span style={{ fontFamily: 'var(--font-mono)' }}>{user.id.slice(0, 8)}…</span> },
    ...meta,
  ]

  const kyc = kycStatus ? KYC_BADGE[kycStatus] : null

  return (
    <Card padding="lg">
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 20 }}>
        <div style={{ flex: 'none' }}>
          {onPhotoChange ? (
            <ProfilePhotoCapture
              currentPhotoUrl={user.profilePhoto}
              userName={user.fullName}
              onChange={(dataUrl) => onPhotoChange(dataUrl ?? '')}
            />
          ) : (
            <Avatar name={user.fullName} src={user.profilePhoto ?? undefined} size="xl" />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--fs-h2)', color: 'var(--text-strong)' }}>
            {user.fullName}
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
            <Badge tone="primary">{ROLE_LABEL[user.role] ?? user.role}</Badge>
            <Badge tone={user.status === 'active' ? 'green' : 'red'} icon={user.status === 'active' ? 'check_circle' : 'block'}>
              {user.status === 'active' ? 'Compte actif' : user.status === 'suspended' ? 'Compte suspendu' : 'Compte supprimé'}
            </Badge>
            {badges}
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
            <Badge tone={user.isPhoneVerified ? 'green' : 'neutral'} icon={user.isPhoneVerified ? 'check' : 'schedule'}>
              Téléphone {user.isPhoneVerified ? 'vérifié' : 'non vérifié'}
            </Badge>
            <Badge tone={user.isEmailVerified ? 'green' : 'neutral'} icon={user.isEmailVerified ? 'check' : 'schedule'}>
              Email {user.isEmailVerified ? 'vérifié' : 'non vérifié'}
            </Badge>
            {kyc && (
              <Badge tone={kyc.tone} icon={kyc.icon}>
                {kyc.label}
              </Badge>
            )}
            {user.isProfileComplete === false && (
              <Badge tone="amber" icon="edit_note">
                Profil incomplet
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 20,
          paddingTop: 18,
          borderTop: '1px solid var(--border-subtle)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: 14,
        }}
      >
        {baseMeta.map((m) => (
          <div key={m.label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <Icon name={m.icon} size={18} style={{ color: 'var(--text-faint)', marginTop: 2 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, color: 'var(--text-faint)' }}>
                {m.label}
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--text-strong)', wordBreak: 'break-word' }}>{m.value}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
