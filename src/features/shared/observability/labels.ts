import type { BadgeTone } from '@/ds'
import type { LogLevel } from '@/lib/api/observability'

export const LEVEL_LABEL: Record<LogLevel, string> = {
  debug: 'Debug',
  info: 'Info',
  notice: 'Notice',
  warning: 'Alerte',
  error: 'Erreur',
  critical: 'Critique',
  alert: 'Urgence',
  emergency: 'Panne',
}

export const LEVEL_TONE: Record<LogLevel, BadgeTone> = {
  debug: 'neutral',
  info: 'primary',
  notice: 'teal',
  warning: 'amber',
  error: 'red',
  critical: 'red',
  alert: 'red',
  emergency: 'red',
}

export const SOURCE_LABEL: Record<string, string> = {
  api: 'API',
  postgres: 'PostgreSQL',
  caddy: 'Caddy',
  frontend: 'Web',
  docker: 'Infrastructure',
}

export function sourceLabel(source: string): string {
  return SOURCE_LABEL[source] ?? source
}

/** Nom lisible des services supervisés par Prometheus. */
export const SERVICE_LABEL: Record<string, string> = {
  api: 'API',
  postgres: 'Base de données',
  caddy: 'Proxy web',
  loki: 'Collecte des journaux',
  alloy: 'Agent de collecte',
  prometheus: 'Métriques',
}

export function serviceLabel(service: string): string {
  return SERVICE_LABEL[service] ?? service
}

/**
 * Les actions d'audit sont nommées `domaine.objet.verbe` côté API. On traduit
 * les segments connus plutôt que de maintenir une table de toutes les actions,
 * qui dériverait au premier ajout backend.
 */
const ACTION_SEGMENT: Record<string, string> = {
  advertisement: 'Annonce',
  assistance: 'Assistance',
  audit: 'Audit',
  auth: 'Authentification',
  broadcast: 'Diffusion',
  cash: 'Espèces',
  commission: 'Commission',
  config: 'Configuration',
  expense: 'Dépense',
  garage: 'Zone',
  zone: 'Zone',
  identity: 'Identité',
  incident: 'Incident',
  message: 'Message',
  notification: 'Notification',
  observability: 'Observabilité',
  offer: 'Offre',
  parcel: 'Colis',
  payment: 'Paiement',
  paydunya: 'PayDunya',
  reputation: 'Réputation',
  score: 'Score',
  user: 'Utilisateur',
  wallet: 'Wallet',
  withdrawal: 'Retrait',
  accept: 'acceptée',
  approve: 'approuvé',
  cancel: 'annulé',
  create: 'création',
  delete: 'suppression',
  export: 'export',
  login: 'connexion',
  logout: 'déconnexion',
  reject: 'rejeté',
  reset: 'réinitialisation',
  update: 'mise à jour',
  validate: 'validation',
}

export function formatAuditAction(action: string): string {
  return action
    .split('.')
    .map((segment) => ACTION_SEGMENT[segment] ?? segment)
    .join(' · ')
}

export const ROLE_LABEL: Record<string, string> = {
  client: 'Client',
  driver: 'Chauffeur',
  admin: 'Admin zone',
  super_admin: 'Super admin',
  support: 'Support',
  support_technique: 'Support technique',
  support_commercial: 'Support commercial',
}

export function roleLabel(role: string | null | undefined): string {
  if (!role) return 'Système'
  return ROLE_LABEL[role] ?? role
}

/** Durée relative courte : « il y a 4 min », « il y a 2 h ». */
export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '—'
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return '—'
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000))
  if (seconds < 60) return "à l'instant"
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `il y a ${hours} h`
  return `il y a ${Math.round(hours / 24)} j`
}

/** Durée d'un incident, exprimée depuis les minutes renvoyées par l'API. */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h ${minutes % 60 ? `${minutes % 60} min` : ''}`.trim()
  const days = Math.floor(hours / 24)
  return `${days} j ${hours % 24 ? `${hours % 24} h` : ''}`.trim()
}
