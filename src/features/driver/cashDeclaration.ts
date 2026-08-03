import type { CashCollectionPoint, Parcel } from '@/lib/api/types'

// Règles d'encaissement en espèces, transposées de `lib/models/parcel.dart`
// (mobile) pour que les deux clients proposent la déclaration au même moment.

const PICKED_UP_STATUSES = ['picked_up', 'in_transit', 'arrived', 'out_for_delivery', 'delivered']

/** Montant convenu de la course, dans l'ordre de priorité retenu par le mobile. */
export function payableAmount(parcel: Parcel): number {
  const candidates = [
    parcel.negotiatedPrice,
    parcel.bids?.find((bid) => bid.id === parcel.selectedBidId)?.price,
    parcel.price,
    parcel.proposedPrice,
  ]
  return candidates.find((value): value is number => typeof value === 'number' && value > 0) ?? 0
}

/**
 * Canal effectif : un colis sans canal explicite (données antérieures) est
 * déduit de sa méthode de paiement, et à défaut considéré en espèces — c'est
 * l'usage par défaut sur le terrain.
 */
export function isCashParcel(parcel: Parcel): boolean {
  if (parcel.paymentChannel) return parcel.paymentChannel === 'cash'
  if (parcel.paymentMethod) return parcel.paymentMethod === 'cash'
  return true
}

/** Étape d'encaissement ; par défaut le destinataire paie à la livraison. */
export function resolvedCollectionPoint(parcel: Parcel): CashCollectionPoint {
  return parcel.cashCollectionPoint ?? 'receiver_delivery'
}

/** Le chauffeur a déclaré l'encaissement, un admin doit encore le valider. */
export function isCashDeclared(parcel: Parcel): boolean {
  return isCashParcel(parcel) && parcel.paymentStatus === 'processing'
}

function hasBeenPickedUp(parcel: Parcel): boolean {
  return Boolean(parcel.pickupDate) || PICKED_UP_STATUSES.includes(parcel.status)
}

/**
 * Le chauffeur doit déclarer un encaissement à ce stade : une fois le jalon
 * franchi (ramassage si l'expéditeur paie, livraison si c'est le destinataire).
 */
export function needsCashDeclaration(parcel: Parcel): boolean {
  if (!isCashParcel(parcel)) return false
  if (parcel.status === 'cancelled') return false
  if (parcel.paymentStatus === 'completed' || isCashDeclared(parcel)) return false
  if (payableAmount(parcel) <= 0) return false
  return resolvedCollectionPoint(parcel) === 'sender_pickup' ? hasBeenPickedUp(parcel) : parcel.status === 'delivered'
}

export const COLLECTION_POINT_LABEL: Record<CashCollectionPoint, string> = {
  sender_pickup: "Encaissé auprès de l'expéditeur",
  receiver_delivery: 'Encaissé auprès du destinataire',
}
