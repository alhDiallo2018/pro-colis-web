import type { BadgeTone } from '@/ds'
import type {
  LeadKind,
  LeadStage,
  TicketChannel,
  TicketPriority,
  TicketStatus,
} from '@/lib/api/support-roles'

// Libellés et tons alignés sur `lib/models/support.dart` côté mobile : les deux
// clients affichent les mêmes mots pour les mêmes valeurs d'API.

export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
  open: 'Ouvert',
  pending: 'En attente client',
  in_progress: 'En cours',
  resolved: 'Résolu',
}

export const TICKET_STATUS_TONE: Record<TicketStatus, BadgeTone> = {
  open: 'amber',
  pending: 'neutral',
  in_progress: 'primary',
  resolved: 'green',
}

export const TICKET_PRIORITY_LABEL: Record<TicketPriority, string> = {
  critical: 'Critique',
  high: 'Haute',
  normal: 'Normale',
  low: 'Basse',
}

export const TICKET_PRIORITY_TONE: Record<TicketPriority, BadgeTone> = {
  critical: 'red',
  high: 'amber',
  normal: 'primary',
  low: 'neutral',
}

/** Ordre de traitement : le plus urgent en premier. */
export const TICKET_PRIORITIES: TicketPriority[] = ['critical', 'high', 'normal', 'low']
export const TICKET_STATUSES: TicketStatus[] = ['open', 'pending', 'in_progress', 'resolved']

export const TICKET_CHANNEL_LABEL: Record<TicketChannel, string> = {
  in_app: 'Chat in-app',
  phone: 'Téléphone',
  email: 'Email',
}

export const TICKET_CHANNEL_ICON: Record<TicketChannel, string> = {
  in_app: 'chat_bubble',
  phone: 'call',
  email: 'mail',
}

export const LEAD_STAGE_LABEL: Record<LeadStage, string> = {
  contacted: 'Contacté',
  qualified: 'Qualifié',
  negotiation: 'Négociation',
  signed: 'Signé',
}

export const LEAD_STAGE_TONE: Record<LeadStage, BadgeTone> = {
  contacted: 'neutral',
  qualified: 'primary',
  negotiation: 'amber',
  signed: 'green',
}

/** Étapes du pipeline dans l'ordre : sert au ruban de progression et au bouton « Avancer ». */
export const LEAD_STAGES: LeadStage[] = ['contacted', 'qualified', 'negotiation', 'signed']

export const LEAD_KIND_LABEL: Record<LeadKind, string> = {
  garage: 'Zone / garage',
  business_client: 'Client pro',
  driver_fleet: 'Flotte chauffeurs',
}

export const LEAD_KIND_ICON: Record<LeadKind, string> = {
  garage: 'warehouse',
  business_client: 'storefront',
  driver_fleet: 'local_shipping',
}

/** Étape suivante du pipeline, ou `null` sur un prospect déjà signé. */
export function nextStage(stage: LeadStage): LeadStage | null {
  const index = LEAD_STAGES.indexOf(stage)
  return index < 0 || index === LEAD_STAGES.length - 1 ? null : LEAD_STAGES[index + 1]
}

/**
 * Durée en minutes rendue lisible : « 45 min », « 3 h 20 », « 2 j ».
 * Les valeurs négatives sont affichées en valeur absolue — l'appelant se charge
 * de dire « en retard de … ».
 */
export function formatMinutes(minutes: number | null | undefined): string {
  if (minutes == null) return '—'
  const total = Math.abs(Math.round(minutes))
  if (total < 60) return `${total} min`
  const hours = Math.floor(total / 60)
  if (hours < 24) {
    const rest = total % 60
    return rest ? `${hours} h ${String(rest).padStart(2, '0')}` : `${hours} h`
  }
  const days = Math.floor(hours / 24)
  const restHours = hours % 24
  return restHours ? `${days} j ${restHours} h` : `${days} j`
}

/** Échéance de relance formulée du point de vue de l'agent. */
export function formatFollowUp(days: number | null | undefined): string {
  if (days == null) return 'Pas de relance planifiée'
  if (days < 0) return `En retard de ${Math.abs(days)} j`
  if (days === 0) return "À relancer aujourd'hui"
  if (days === 1) return 'À relancer demain'
  return `À relancer dans ${days} j`
}
