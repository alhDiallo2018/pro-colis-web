import type { Parcel } from '@/lib/api/types'

/**
 * Un colis n'est corrigeable que tant que rien ne l'engage. Miroir des gardes
 * de `updateParcel` côté API : chauffeur assigné, offre acceptée ou paiement
 * amorcé ferment l'édition.
 */
export function isParcelEditable(parcel: Parcel): boolean {
  // `proposal_sent` et `negotiating` restent modifiables côté API : le colis
  // est proposé mais aucun chauffeur ne l'a encore pris en charge.
  const EDITABLE_STATUSES = ['pending', 'free', 'proposal_sent', 'negotiating']
  if (!EDITABLE_STATUSES.includes(parcel.status)) return false
  if (parcel.assignedDriverId ?? parcel.driverId) return false
  if (parcel.selectedBidId || parcel.negotiatedPrice) return false
  if (parcel.bids?.some((bid) => bid.status === 'accepted')) return false
  return parcel.paymentStatus !== 'processing' && parcel.paymentStatus !== 'completed'
}
