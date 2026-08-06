import type { ApiParcelStatus } from '@/lib/api/types'
import type { ParcelStatus } from '@/ds'

const nf = new Intl.NumberFormat('fr-FR')

/** Montant en FCFA : `12 500 FCFA` (espace insécable comme séparateur de milliers). */
export function formatFcfa(amount: number | null | undefined): string {
  if (amount == null) return '—'
  return `${nf.format(Math.round(amount))} FCFA`
}

/** Points du wallet : `+150 pts` / `-50 pts`. */
export function formatPoints(points: number | null | undefined): string {
  if (points == null) return '—'
  const sign = points > 0 ? '+' : ''
  return `${sign}${nf.format(points)} pts`
}

/** Poids : `1,2 kg`. */
export function formatWeight(weight: number | null | undefined): string {
  if (weight == null) return '—'
  return `${nf.format(weight)} kg`
}

const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
const dateTimeFmt = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : dateFmt.format(d)
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : dateTimeFmt.format(d)
}

/**
 * Map an API parcel status (Prisma enum) to the design-system status key.
 * The API uses snake_case lifecycle names; the DS uses shorter keys.
 */
const STATUS_MAP: Record<ApiParcelStatus, ParcelStatus> = {
  pending: 'pending',
  free: 'free',
  negotiating: 'negotiating',
  confirmed: 'confirmed',
  picked_up: 'pickup',
  in_transit: 'transit',
  arrived: 'arrived',
  out_for_delivery: 'delivering',
  delivered: 'delivered',
  cancelled: 'cancelled',
}

export function toStatusKey(status: ApiParcelStatus | string | null | undefined): ParcelStatus {
  if (!status) return 'pending'
  return STATUS_MAP[status as ApiParcelStatus] ?? 'pending'
}
