import type { DriverStatus } from '@/lib/api/types'

/**
 * Statuts de disponibilité d'un chauffeur, partagés entre la liste de choix
 * (NewParcelScreen) et la fiche chauffeur. Les libellés restent alignés sur les
 * valeurs réellement stockées par l'API (`available` / `busy` / `offline`) :
 * rien n'est inventé, un statut inconnu retombe sur « Hors ligne ».
 */

export const DRIVER_STATUS_LABEL: Record<string, string> = {
  available: 'Disponible',
  busy: 'Occupé',
  offline: 'Hors ligne',
}

export const DRIVER_STATUS_COLOR: Record<string, string> = {
  available: 'var(--green-600)',
  busy: 'var(--amber-600)',
  offline: 'var(--slate-400)',
}

export const DRIVER_AVATAR_STATUS = {
  available: 'online',
  busy: 'busy',
  offline: 'offline',
} as const

export function driverStatusKey(status: string | null | undefined): DriverStatus {
  return status === 'available' || status === 'busy' ? status : 'offline'
}

export function driverStatusLabel(status: string | null | undefined): string {
  return DRIVER_STATUS_LABEL[driverStatusKey(status)] ?? DRIVER_STATUS_LABEL.offline
}

export function driverStatusColor(status: string | null | undefined): string {
  return DRIVER_STATUS_COLOR[driverStatusKey(status)] ?? DRIVER_STATUS_COLOR.offline
}

/**
 * Un chauffeur « hors ligne » ne peut pas être choisi : la proposition n'irait
 * nulle part. « Occupé » reste sélectionnable, simplement signalé — il peut
 * toujours accepter, refuser ou négocier comme n'importe quelle demande.
 */
export function isDriverSelectable(status: string | null | undefined): boolean {
  return driverStatusKey(status) !== 'offline'
}
