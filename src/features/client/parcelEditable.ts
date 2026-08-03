import type { Parcel } from '@/lib/api/types'

/**
 * Un colis n'est corrigeable que tant que rien ne l'engage. Miroir des gardes
 * de `updateParcel` côté API : chauffeur assigné, offre acceptée ou paiement
 * amorcé ferment l'édition.
 */
export function isParcelEditable(parcel: Parcel): boolean {
  if (parcel.status !== 'pending' && parcel.status !== 'free') return false
  if (parcel.driverId) return false
  if (parcel.selectedBidId || parcel.negotiatedPrice) return false
  if (parcel.bids?.some((bid) => bid.status === 'accepted')) return false
  return parcel.paymentStatus !== 'processing' && parcel.paymentStatus !== 'completed'
}
