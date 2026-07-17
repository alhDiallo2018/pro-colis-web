import { sendEmail, sendSms } from '@/lib/api/brevo'
import {
  EMAIL_TEMPLATES,
  SMS_TEMPLATES,
  type NotificationEventType,
  type NotificationContext,
} from './templates'

export type NotificationChannel = 'in_app' | 'email' | 'sms'

export interface NotificationPreference {
  eventType: NotificationEventType
  channels: NotificationChannel[]
}

export const ALL_EVENT_TYPES: NotificationEventType[] = [
  'parcel_created',
  'parcel_confirmed',
  'parcel_picked_up',
  'parcel_in_transit',
  'parcel_arrived',
  'parcel_out_for_delivery',
  'parcel_delivered',
  'parcel_cancelled',
  'bid_received',
  'bid_accepted',
  'bid_rejected',
  'driver_assigned',
  'payment_confirmed',
  'welcome',
  'password_reset',
  'verification',
  'account_suspended',
]

const DEFAULT_PREFERENCES: NotificationPreference[] = ALL_EVENT_TYPES.map((eventType) => ({
  eventType,
  channels: ['in_app'],
}))

const PREFS_STORAGE_KEY = 'sendprocolis-notification-prefs'

export function loadPreferences(): NotificationPreference[] {
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY)
    if (raw) return JSON.parse(raw) as NotificationPreference[]
  } catch { /* ignore */ }
  return DEFAULT_PREFERENCES
}

export function savePreferences(prefs: NotificationPreference[]): void {
  localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs))
}

function getChannels(eventType: NotificationEventType): NotificationChannel[] {
  const prefs = loadPreferences()
  const entry = prefs.find((p) => p.eventType === eventType)
  return entry?.channels ?? ['in_app']
}

/**
 * Dispatche une notification sur les canaux configurés (email, SMS, in-app).
 *
 * En production, l'envoi email/SMS passe par le backend qui appelle l'API Brevo.
 * Le `userEmail` et `userPhone` sont requis pour ces canaux.
 */
export async function dispatchNotification(
  eventType: NotificationEventType,
  ctx: NotificationContext,
  userEmail?: string | null,
  userPhone?: string | null,
): Promise<void> {
  const channels = getChannels(eventType)

  const promises: Promise<unknown>[] = []

  if (channels.includes('email') && userEmail) {
    const template = EMAIL_TEMPLATES[eventType]
    if (template) {
      const htmlContent = template(ctx)
      const subject = getSubjectFor(eventType, ctx)
      promises.push(
        sendEmail({
          to: userEmail,
          toName: ctx.user?.fullName ?? undefined,
          subject,
          htmlContent,
        }).catch((err) => console.warn('[notification] email failed:', err)),
      )
    }
  }

  if (channels.includes('sms') && userPhone) {
    const template = SMS_TEMPLATES[eventType]
    if (template) {
      const content = template(ctx)
      promises.push(
        sendSms({
          to: userPhone,
          content,
        }).catch((err) => console.warn('[notification] sms failed:', err)),
      )
    }
  }

  await Promise.allSettled(promises)
}

function getSubjectFor(eventType: NotificationEventType, ctx: NotificationContext): string {
  const t = ctx.parcel?.trackingNumber ?? ctx.trackingNumber ?? ''
  switch (eventType) {
    case 'parcel_created': return `PRO COLIS — Colis ${t} enregistré`
    case 'parcel_confirmed': return `PRO COLIS — Colis ${t} confirmé`
    case 'parcel_picked_up': return `PRO COLIS — Colis ${t} ramassé`
    case 'parcel_in_transit': return `PRO COLIS — Colis ${t} en transit`
    case 'parcel_arrived': return `PRO COLIS — Colis ${t} arrivé`
    case 'parcel_out_for_delivery': return `PRO COLIS — Colis ${t} en livraison`
    case 'parcel_delivered': return `PRO COLIS — Colis ${t} livré !`
    case 'parcel_cancelled': return `PRO COLIS — Colis ${t} annulé`
    case 'bid_received': return `PRO COLIS — Offre reçue pour ${t}`
    case 'bid_accepted': return `PRO COLIS — Offre acceptée pour ${t}`
    case 'bid_rejected': return `PRO COLIS — Offre refusée pour ${t}`
    case 'driver_assigned': return `PRO COLIS — Chauffeur assigné à ${t}`
    case 'payment_confirmed': return `PRO COLIS — Paiement confirmé`
    case 'welcome': return 'Bienvenue sur PRO COLIS !'
    case 'password_reset': return 'PRO COLIS — Réinitialisation du mot de passe'
    case 'verification': return 'PRO COLIS — Code de vérification'
    case 'account_suspended': return 'PRO COLIS — Compte suspendu'
    default: return `PRO COLIS — Notification`
  }
}
