import type { Parcel, User } from '@/lib/api/types'

export type NotificationEventType =
  | 'parcel_created'
  | 'parcel_confirmed'
  | 'parcel_picked_up'
  | 'parcel_in_transit'
  | 'parcel_arrived'
  | 'parcel_out_for_delivery'
  | 'parcel_delivered'
  | 'parcel_cancelled'
  | 'bid_received'
  | 'bid_accepted'
  | 'bid_rejected'
  | 'driver_assigned'
  | 'payment_confirmed'
  | 'welcome'
  | 'password_reset'
  | 'verification'
  | 'account_suspended'

export interface NotificationContext {
  parcel?: Pick<Parcel, 'trackingNumber' | 'description' | 'status' | 'senderName' | 'receiverName' | 'departureCity' | 'arrivalCity' | 'price'>
  user?: Pick<User, 'fullName' | 'email' | 'phone'>
  driverName?: string
  zoneName?: string
  trackingNumber?: string
  price?: number
  bidPrice?: number
  reason?: string
  loginLink?: string
  resetLink?: string
  verificationCode?: string
}

const APP_NAME = 'SENDPROCOLIS'
const PLATFORM_URL = import.meta.env.VITE_APP_URL || 'https://sendprocolis.com'

/** Produit un lien de suivi public et encode le numéro avant son insertion dans l'email. */
function trackingUrl(trackingNumber: string): string {
  return `${PLATFORM_URL}/track/${encodeURIComponent(trackingNumber)}`
}

function emailShell(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
  <tr><td style="background:linear-gradient(135deg,#0d9488,#14b8a6);padding:32px 40px;text-align:center;">
    <span style="font-size:22px;font-weight:700;color:#fff;letter-spacing:0.5px;">${APP_NAME}</span>
  </td></tr>
  <tr><td style="padding:32px 40px;">
    <h1 style="margin:0 0 16px;font-size:20px;color:#1e293b;">${title}</h1>
    ${bodyContent}
  </td></tr>
  <tr><td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;">
    <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;">
      Ce message a été envoyé automatiquement par ${APP_NAME}.<br/>
      Pour gérer vos préférences de notification, connectez-vous à votre compte sur <a href="${PLATFORM_URL}" style="color:#0d9488;">${PLATFORM_URL}</a>.
    </p>
    <p style="margin:0;font-size:11px;color:#cbd5e1;">© ${new Date().getFullYear()} ${APP_NAME} — Livraison de colis au Sénégal, en Afrique et à l'international</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente',
  free: 'Disponible aux enchères',
  confirmed: 'Confirmé',
  picked_up: 'Ramassé',
  in_transit: 'En transit',
  arrived: 'Arrivé à destination',
  out_for_delivery: 'En cours de livraison',
  delivered: 'Livré',
  cancelled: 'Annulé',
}

// ─── EMAIL TEMPLATES ─────────────────────────────────────────

export function parcelCreatedEmail(ctx: NotificationContext): string {
  const t = ctx.parcel?.trackingNumber ?? ctx.trackingNumber ?? ''
  const d = ctx.parcel?.description ?? ''
  const body = `
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      Votre colis <strong style="color:#0d9488;">${t}</strong> a bien été enregistré.
      ${d ? `<br/><em>"${d}"</em>` : ''}
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:20px;">
      <tr><td style="padding:12px 16px;background:#f1f5f9;border-radius:8px;">
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr><td style="font-size:13px;color:#64748b;">Expéditeur</td><td style="font-size:13px;color:#1e293b;font-weight:600;">${ctx.parcel?.senderName ?? '—'}</td></tr>
          <tr><td style="font-size:13px;color:#64748b;">Destinataire</td><td style="font-size:13px;color:#1e293b;font-weight:600;">${ctx.parcel?.receiverName ?? '—'}</td></tr>
          <tr><td style="font-size:13px;color:#64748b;">Trajet</td><td style="font-size:13px;color:#1e293b;font-weight:600;">${ctx.parcel?.departureCity ?? '—'} → ${ctx.parcel?.arrivalCity ?? '—'}</td></tr>
        </table>
      </td></tr>
    </table>
    <p style="margin:0 0 24px;font-size:14px;color:#64748b;">
      Suivez l'avancement de votre colis à tout moment via votre tableau de bord.
    </p>
    <a href="${trackingUrl(t)}" style="display:inline-block;padding:12px 28px;background:#0d9488;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Suivre mon colis</a>
  `
  return emailShell(`Colis ${t} enregistré avec succès`, body)
}

export function parcelStatusEmail(ctx: NotificationContext): string {
  const t = ctx.parcel?.trackingNumber ?? ctx.trackingNumber ?? ''
  const status = STATUS_LABEL[ctx.parcel?.status ?? ''] ?? ctx.parcel?.status ?? ''
  const price = ctx.price ?? ctx.parcel?.price

  const body = `
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      Le statut de votre colis <strong style="color:#0d9488;">${t}</strong> a été mis à jour.
    </p>
    <div style="background:#ecfdf5;border-left:4px solid #0d9488;padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:20px;">
      <span style="font-size:16px;font-weight:700;color:#0d9488;">${status}</span>
    </div>
    ${ctx.driverName ? `<p style="margin:0 0 16px;font-size:14px;color:#475569;">Chauffeur assigné : <strong>${ctx.driverName}</strong></p>` : ''}
    ${price ? `<p style="margin:0 0 16px;font-size:14px;color:#475569;">Montant : <strong>${price.toLocaleString('fr-FR')} FCFA</strong></p>` : ''}
    <a href="${trackingUrl(t)}" style="display:inline-block;padding:12px 28px;background:#0d9488;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Voir le détail</a>
  `
  return emailShell(`Colis ${t} : ${status}`, body)
}

export function parcelDeliveredEmail(ctx: NotificationContext): string {
  const t = ctx.parcel?.trackingNumber ?? ctx.trackingNumber ?? ''
  const body = `
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      Votre colis <strong style="color:#0d9488;">${t}</strong> a été livré avec succès !
    </p>
    <div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;padding:18px;margin-bottom:20px;text-align:center;">
      <span style="font-size:32px;">📦</span>
      <p style="margin:8px 0 0;font-size:15px;font-weight:600;color:#065f46;">Livraison confirmée</p>
      ${ctx.driverName ? `<p style="margin:4px 0 0;font-size:13px;color:#047857;">par ${ctx.driverName}</p>` : ''}
    </div>
    <p style="margin:0 0 20px;font-size:14px;color:#64748b;">Merci de votre confiance ! Vous pouvez noter le service dans votre tableau de bord.</p>
    <a href="${PLATFORM_URL}/client" style="display:inline-block;padding:12px 28px;background:#0d9488;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Tableau de bord</a>
  `
  return emailShell(`Colis ${t} livré !`, body)
}

export function bidReceivedEmail(ctx: NotificationContext): string {
  const t = ctx.parcel?.trackingNumber ?? ctx.trackingNumber ?? ''
  const body = `
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      Un chauffeur a fait une offre pour votre colis <strong style="color:#0d9488;">${t}</strong>.
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:20px;">
      <tr><td style="padding:12px 16px;background:#f1f5f9;border-radius:8px;">
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr><td style="font-size:13px;color:#64748b;">Chauffeur</td><td style="font-size:13px;color:#1e293b;font-weight:600;">${ctx.driverName ?? '—'}</td></tr>
          ${ctx.bidPrice ? `<tr><td style="font-size:13px;color:#64748b;">Prix proposé</td><td style="font-size:13px;color:#1e293b;font-weight:600;">${ctx.bidPrice.toLocaleString('fr-FR')} FCFA</td></tr>` : ''}
        </table>
      </td></tr>
    </table>
    <a href="${PLATFORM_URL}/client/offres" style="display:inline-block;padding:12px 28px;background:#0d9488;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Voir les offres</a>
  `
  return emailShell(`Nouvelle offre pour le colis ${t}`, body)
}

export function bidAcceptedEmail(ctx: NotificationContext): string {
  const t = ctx.parcel?.trackingNumber ?? ctx.trackingNumber ?? ''
  const body = `
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      Votre offre pour le colis <strong style="color:#0d9488;">${t}</strong> a été acceptée !
    </p>
    <div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;padding:18px;margin-bottom:20px;">
      <p style="margin:0;font-size:15px;font-weight:600;color:#065f46;">Vous êtes assigné à cette livraison.</p>
      ${ctx.bidPrice ? `<p style="margin:6px 0 0;font-size:14px;color:#047857;">Prix convenu : ${ctx.bidPrice.toLocaleString('fr-FR')} FCFA</p>` : ''}
    </div>
    <a href="${PLATFORM_URL}/driver/missions" style="display:inline-block;padding:12px 28px;background:#0d9488;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Voir mes missions</a>
  `
  return emailShell(`Offre acceptée pour le colis ${t}`, body)
}

export function driverAssignedEmail(ctx: NotificationContext): string {
  const t = ctx.parcel?.trackingNumber ?? ctx.trackingNumber ?? ''
  const body = `
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      Un chauffeur a été assigné à votre colis <strong style="color:#0d9488;">${t}</strong>.
    </p>
    ${ctx.driverName ? `<p style="margin:0 0 16px;font-size:14px;color:#475569;">Chauffeur : <strong>${ctx.driverName}</strong></p>` : ''}
    <a href="${trackingUrl(t)}" style="display:inline-block;padding:12px 28px;background:#0d9488;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Suivre mon colis</a>
  `
  return emailShell(`Chauffeur assigné — Colis ${t}`, body)
}

export function welcomeEmail(ctx: NotificationContext): string {
  const name = ctx.user?.fullName ?? ''
  const body = `
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      Bienvenue sur ${APP_NAME},${name ? ` <strong>${name}</strong> !` : ' !'}
    </p>
    <p style="margin:0 0 16px;font-size:14px;color:#64748b;line-height:1.6;">
      ${APP_NAME} est votre plateforme de livraison de colis au Sénégal, en Afrique et à l'international.
      Commandez, expédiez ou transportez des colis en toute sécurité entre les principales villes du pays et au-delà des frontières.
    </p>
    <a href="${PLATFORM_URL}/login" style="display:inline-block;padding:12px 28px;background:#0d9488;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Accéder à mon compte</a>
  `
  return emailShell(`Bienvenue sur ${APP_NAME} !`, body)
}

export function passwordResetEmail(ctx: NotificationContext): string {
  const link = ctx.resetLink ?? `${PLATFORM_URL}/reset-password`
  const body = `
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      Vous avez demandé la réinitialisation de votre mot de passe.
    </p>
    <p style="margin:0 0 20px;font-size:14px;color:#64748b;">Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
    <a href="${link}" style="display:inline-block;padding:12px 28px;background:#0d9488;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Réinitialiser mon mot de passe</a>
    <p style="margin:20px 0 0;font-size:12px;color:#94a3b8;">Si vous n'avez pas demandé cette réinitialisation, ignorez ce message.</p>
  `
  return emailShell('Réinitialisation du mot de passe', body)
}

export function verificationEmail(ctx: NotificationContext): string {
  const code = ctx.verificationCode ?? '—'
  const body = `
    <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
      Voici votre code de vérification pour ${APP_NAME} :
    </p>
    <div style="background:#f1f5f9;border-radius:8px;padding:20px;text-align:center;margin-bottom:20px;">
      <span style="font-family:'Courier New',monospace;font-size:28px;font-weight:700;color:#0d9488;letter-spacing:6px;">${code}</span>
    </div>
    <p style="margin:0;font-size:12px;color:#94a3b8;">Ce code expire dans 10 minutes.</p>
  `
  return emailShell('Code de vérification', body)
}

// ─── SMS TEMPLATES ───────────────────────────────────────────

export function parcelCreatedSms(ctx: NotificationContext): string {
  const t = ctx.parcel?.trackingNumber ?? ctx.trackingNumber ?? ''
  return `${APP_NAME} : Colis ${t} enregistré. Suivez-le sur ${PLATFORM_URL}/suivi`
}

export function parcelStatusSms(ctx: NotificationContext): string {
  const t = ctx.parcel?.trackingNumber ?? ctx.trackingNumber ?? ''
  const status = STATUS_LABEL[ctx.parcel?.status ?? ''] ?? ctx.parcel?.status ?? ''
  return `${APP_NAME} : Colis ${t} — ${status}. ${ctx.driverName ? `Chauffeur : ${ctx.driverName}. ` : ''}Suivi : ${PLATFORM_URL}/suivi`
}

export function parcelDeliveredSms(ctx: NotificationContext): string {
  const t = ctx.parcel?.trackingNumber ?? ctx.trackingNumber ?? ''
  return `${APP_NAME} : Colis ${t} livré avec succès ! ${ctx.driverName ? `Merci à ${ctx.driverName} ! ` : ''}Notez le service sur l'app.`
}

export function bidReceivedSms(ctx: NotificationContext): string {
  const t = ctx.parcel?.trackingNumber ?? ctx.trackingNumber ?? ''
  return `${APP_NAME} : Nouvelle offre pour le colis ${t}${ctx.bidPrice ? ` à ${ctx.bidPrice.toLocaleString('fr-FR')} FCFA` : ''}. Consultez vos offres sur l'app.`
}

export function bidAcceptedSms(ctx: NotificationContext): string {
  const t = ctx.parcel?.trackingNumber ?? ctx.trackingNumber ?? ''
  return `${APP_NAME} : Votre offre pour le colis ${t} a été acceptée !${ctx.bidPrice ? ` Prix : ${ctx.bidPrice.toLocaleString('fr-FR')} FCFA.` : ''} Voir vos missions.`
}

export function driverAssignedSms(ctx: NotificationContext): string {
  const t = ctx.parcel?.trackingNumber ?? ctx.trackingNumber ?? ''
  return `${APP_NAME} : Chauffeur ${ctx.driverName ?? ''} assigné au colis ${t}. Suivi : ${PLATFORM_URL}/suivi`
}

export function welcomeSms(_ctx: NotificationContext): string {
  return `Bienvenue sur ${APP_NAME} ! Livraison de colis au Sénégal et à l'international. Téléchargez l'app ou connectez-vous sur ${PLATFORM_URL}`
}

export function verificationSms(ctx: NotificationContext): string {
  return `${APP_NAME} : Votre code de vérification est ${ctx.verificationCode ?? '—'}. Valable 10 minutes.`
}

// ─── TEMPLATE MAPS ───────────────────────────────────────────

export const EMAIL_TEMPLATES: Record<NotificationEventType, (ctx: NotificationContext) => string> = {
  parcel_created: parcelCreatedEmail,
  parcel_confirmed: parcelStatusEmail,
  parcel_picked_up: parcelStatusEmail,
  parcel_in_transit: parcelStatusEmail,
  parcel_arrived: parcelStatusEmail,
  parcel_out_for_delivery: parcelStatusEmail,
  parcel_delivered: parcelDeliveredEmail,
  parcel_cancelled: parcelStatusEmail,
  bid_received: bidReceivedEmail,
  bid_accepted: bidAcceptedEmail,
  bid_rejected: (ctx) => parcelStatusEmail(ctx),
  driver_assigned: driverAssignedEmail,
  payment_confirmed: parcelStatusEmail,
  welcome: welcomeEmail,
  password_reset: passwordResetEmail,
  verification: verificationEmail,
  account_suspended: (ctx) => parcelStatusEmail(ctx),
}

export const SMS_TEMPLATES: Partial<Record<NotificationEventType, (ctx: NotificationContext) => string>> = {
  parcel_created: parcelCreatedSms,
  parcel_picked_up: parcelStatusSms,
  parcel_in_transit: parcelStatusSms,
  parcel_delivered: parcelDeliveredSms,
  bid_received: bidReceivedSms,
  bid_accepted: bidAcceptedSms,
  driver_assigned: driverAssignedSms,
  welcome: welcomeSms,
  verification: verificationSms,
}
