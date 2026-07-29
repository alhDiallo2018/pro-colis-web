import type { AppNotification } from '@/lib/api/notifications'
import type { Role } from '@/lib/api/types'

export interface NotificationAction {
  label: string
  to: string
}

/** Route de la page notifications propre à chaque espace utilisateur. */
export function notificationsPathForRole(role: Role | undefined): string {
  if (role === 'client') return '/client/notifications'
  if (role === 'driver') return '/driver/notifications'
  if (role === 'admin') return '/garage/notifications'
  if (role === 'super_admin') return '/admin/notifications'
  return '/support-admin/notifications'
}

function dataString(notification: AppNotification, key: string): string | undefined {
  const value = notification.data?.[key]
  return typeof value === 'string' && value ? value : undefined
}

/**
 * Résout l'action métier d'une notification sans envoyer un rôle vers une
 * route à laquelle il n'a pas accès. Les données historiques peuvent porter
 * parcelId dans la colonne dédiée ou dans le JSON `data`.
 */
export function notificationAction(
  notification: AppNotification,
  role: Role | undefined,
): NotificationAction | null {
  const parcelId = notification.parcelId ?? dataString(notification, 'parcelId')
  const trackingNumber = dataString(notification, 'trackingNumber')

  if (parcelId) {
    if (role === 'client') {
      return { label: 'Voir le colis', to: `/client/colis/${encodeURIComponent(parcelId)}` }
    }
    if (role === 'driver') return { label: 'Voir mes missions', to: '/driver/missions' }
    if (role === 'admin') {
      return { label: 'Voir le colis', to: `/garage/colis/${encodeURIComponent(parcelId)}` }
    }
    if (role === 'super_admin') return { label: 'Voir les colis', to: '/admin/colis' }
    return { label: 'Voir les colis', to: '/support-admin/colis' }
  }

  if (trackingNumber) {
    return {
      label: 'Suivre le colis',
      to: `/track/${encodeURIComponent(trackingNumber)}`,
    }
  }

  if (notification.type.includes('bid') || notification.type.includes('offer')) {
    if (role === 'client') return { label: 'Voir les offres', to: '/client/offres' }
    if (role === 'driver') return { label: 'Voir mes missions', to: '/driver/missions' }
  }

  if (notification.type.includes('withdrawal')) {
    if (role === 'driver') return { label: 'Voir mes retraits', to: '/driver/points' }
    if (role === 'super_admin') {
      return { label: 'Voir les retraits', to: '/admin/finance/withdrawals' }
    }
  }

  return null
}
