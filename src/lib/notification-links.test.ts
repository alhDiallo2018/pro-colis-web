import { describe, expect, it } from 'vitest'
import { notificationAction, notificationsPathForRole } from './notification-links'
import type { AppNotification } from './api/notifications'

const notification: AppNotification = {
  id: 'n-1',
  type: 'parcel_in_transit',
  title: 'Colis en transit',
  body: 'Votre colis est en route.',
  isRead: false,
  parcelId: 'parcel/1',
}

describe('liens des notifications', () => {
  it('ouvre la page de notifications propre au rôle', () => {
    expect(notificationsPathForRole('client')).toBe('/client/notifications')
    expect(notificationsPathForRole('admin')).toBe('/garage/notifications')
    expect(notificationsPathForRole('support_technique')).toBe('/support-admin/notifications')
  })

  it('envoie un client vers le détail de son colis avec un identifiant encodé', () => {
    expect(notificationAction(notification, 'client')).toEqual({
      label: 'Voir le colis',
      to: '/client/colis/parcel%2F1',
    })
  })

  it('accepte parcelId dans les données des anciennes notifications', () => {
    expect(
      notificationAction(
        { ...notification, parcelId: null, data: { parcelId: 'p-2' } },
        'admin',
      ),
    ).toEqual({
      label: 'Voir le colis',
      to: '/garage/colis/p-2',
    })
  })
})
