export {
  sendEmail,
  sendSms,
  sendBulkEmail,
  getBrevoConfig,
  updateBrevoConfig,
  testBrevoConnection,
} from '@/lib/api/brevo'
export type { BrevoEmailParams, BrevoSmsParams, BrevoConfig, SendResult } from '@/lib/api/brevo'

export {
  EMAIL_TEMPLATES,
  SMS_TEMPLATES,
  parcelCreatedEmail,
  parcelStatusEmail,
  parcelDeliveredEmail,
  bidReceivedEmail,
  bidAcceptedEmail,
  driverAssignedEmail,
  welcomeEmail,
  passwordResetEmail,
  verificationEmail,
  parcelCreatedSms,
  parcelStatusSms,
  parcelDeliveredSms,
  bidReceivedSms,
  bidAcceptedSms,
  driverAssignedSms,
  welcomeSms,
  verificationSms,
} from './templates'
export type { NotificationEventType, NotificationContext } from './templates'

export {
  dispatchNotification,
  loadPreferences,
  savePreferences,
  ALL_EVENT_TYPES,
} from './trigger'
export type { NotificationChannel, NotificationPreference } from './trigger'
