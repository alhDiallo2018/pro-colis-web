import { PARCEL_STATUS, type ParcelStatus, type StepperStep } from '@/ds'
import { formatDateTime, toStatusKey } from '@/lib/format'
import type { Parcel } from '@/lib/api/types'

/** The canonical happy-path lifecycle, used to render the tracking timeline. */
export const LIFECYCLE: ParcelStatus[] = ['pending', 'confirmed', 'pickup', 'transit', 'arrived', 'delivering', 'delivered']

/** Build Stepper steps from a parcel's events, or derive them from its status. */
export function buildSteps(parcel: Parcel): StepperStep[] {
  if (parcel.events && parcel.events.length > 0) {
    const sorted = [...parcel.events].sort((a, b) => (a.timestamp ?? '').localeCompare(b.timestamp ?? ''))
    return sorted.map((ev, i) => {
      const key = toStatusKey(ev.status)
      return {
        label: PARCEL_STATUS[key].label,
        icon: PARCEL_STATUS[key].icon,
        time: formatDateTime(ev.timestamp),
        note: ev.description ?? ev.location ?? undefined,
        status: i === sorted.length - 1 ? 'current' : 'done',
      }
    })
  }
  const current = toStatusKey(parcel.status)
  if (current === 'cancelled') {
    return [{ label: 'Annulé', icon: 'cancel', status: 'current' }]
  }
  // La proposition directe n'est pas une étape de la course : tant qu'elle
  // n'est pas acceptée, le suivi reste au premier jalon.
  const idx = LIFECYCLE.indexOf(current === 'proposal' || current === 'negotiating' ? 'pending' : current)
  return LIFECYCLE.map((k, i) => ({
    label: PARCEL_STATUS[k].label,
    icon: PARCEL_STATUS[k].icon,
    status: i < idx ? 'done' : i === idx ? 'current' : 'todo',
  }))
}
