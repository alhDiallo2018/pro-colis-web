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
 * Durée écoulée depuis `iso`, en français : « il y a 12 secondes »,
 * « il y a 3 minutes », « il y a 2 heures », « il y a 1 jour ». Les valeurs
 * dans le futur (horloge du client en avance) sont ramenées à l'instant.
 */
export function formatTimeAgo(iso: string | null | undefined, now: number = Date.now()): string {
  if (!iso) return 'à l’instant'
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return 'à l’instant'
  const s = Math.max(0, Math.floor((now - t) / 1000))
  if (s < 60) return `il y a ${s} seconde${s > 1 ? 's' : ''}`
  const m = Math.floor(s / 60)
  if (m < 60) return `il y a ${m} minute${m > 1 ? 's' : ''}`
  const h = Math.floor(m / 60)
  if (h < 24) return `il y a ${h} heure${h > 1 ? 's' : ''}`
  const d = Math.floor(h / 24)
  return `il y a ${d} jour${d > 1 ? 's' : ''}`
}

/**
 * Map an API parcel status (Prisma enum) to the design-system status key.
 * The API uses snake_case lifecycle names; the DS uses shorter keys.
 */
const STATUS_MAP: Record<ApiParcelStatus, ParcelStatus> = {
  pending: 'pending',
  free: 'free',
  proposal_sent: 'proposal',
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
