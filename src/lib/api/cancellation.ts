import { api } from './client'
import type { CancellationOutcome, Parcel, ParcelEvent } from './types'

/**
 * Conséquences d'une annulation calculées par le backend. Le Web ne recalcule
 * jamais la pénalité, les frais, la répartition ou le remboursement : il
 * consomme exclusivement les valeurs retournées ici.
 */

/** Réponse de la demande de devis d'annulation (avant confirmation). */
export interface CancellationQuote extends CancellationOutcome {
  /** Présent uniquement si l'API joint le colis à jour. */
  parcel?: Parcel | null
}

/** Résultat d'une annulation confirmée par le backend. */
export interface CancellationResult extends CancellationOutcome {
  parcel?: Parcel | null
  event?: ParcelEvent | null
}

/**
 * Devis d'annulation d'un colis client. En l'absence de données de pénalité
 * (endpoint non encore exposé par l'API), le contrat reste optionnel : l'appel
 * peut échouer en 404/501 et l'appelant affiche alors une confirmation neutre
 * sans montant inventé.
 *
 * Contrat API manquant : `GET /client/parcels/:parcelId/cancel/quote`.
 */
export async function getCancellationQuote(parcelId: string): Promise<CancellationQuote> {
  const { data } = await api.get(`/client/parcels/${parcelId}/cancel/quote`)
  return normalizeOutcome(data.quote ?? data.data ?? data, data.parcel ?? data.data?.parcel)
}

/**
 * Annule un colis client et retourne le résultat du backend (colis, événement
 * et éventuelles conséquences financières). Le corps n'envoie que le motif
 * choisi ; toute règle de pénalité est décidée côté serveur.
 */
export async function cancelParcel(
  parcelId: string,
  payload: { reason?: string } = {}
): Promise<CancellationResult> {
  const { data } = await api.post(`/client/parcels/${parcelId}/cancel`, { reason: payload.reason })
  return normalizeOutcome(data, data.parcel, data.event ?? data.data?.event)
}

/**
 * Annule une mission engagée par le chauffeur. Même moteur central que
 * l'annulation client : responsabilité, pénalité et remboursement sont calculés
 * exclusivement par le backend. Le Web n'envoie que le motif.
 */
export async function driverCancelParcel(
  parcelId: string,
  payload: { reason?: string } = {}
): Promise<CancellationResult> {
  const { data } = await api.post(`/driver/parcels/${parcelId}/cancel`, { reason: payload.reason })
  return normalizeOutcome(data, data.parcel, data.event ?? data.data?.event)
}

/** Normalise une enveloppe API plate en `CancellationOutcome` typé. */
function normalizeOutcome(
  source: Record<string, unknown> | undefined,
  parcel?: Parcel | null,
  event?: ParcelEvent | null
): CancellationResult {
  const s = (source ?? {}) as Record<string, unknown>
  return {
    allowed: s.allowed !== false,
    penalized: s.penalized === true,
    exempt: s.exempt === true,
    responsibility: (s.responsibility as CancellationOutcome['responsibility']) ?? null,
    paidAmount: num(s.paidAmount),
    fees: num(s.fees),
    paydunyaFee: num(s.paydunyaFee),
    technicalFee: num(s.technicalFee),
    penalty: num(s.penalty),
    refund: num(s.refund),
    refundStatus: (s.refundStatus as CancellationOutcome['refundStatus']) ?? null,
    message: (s.message as string | undefined) ?? null,
    reasons: Array.isArray(s.reasons) ? (s.reasons as CancellationOutcome['reasons']) : null,
    client: (s.client as CancellationOutcome['client']) ?? null,
    driver: (s.driver as CancellationOutcome['driver']) ?? null,
    parcel: parcel ?? null,
    event: event ?? null,
  }
}

function num(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}
