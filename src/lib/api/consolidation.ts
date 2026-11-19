import { api } from './client'

/**
 * Wrapper du module consolidation / backhaul.
 *
 * Endpoint : `GET /drivers/backhaul-matches/:advertisementId`
 * RBAC : driver propriétaire de l'annonce ou shuttle_operator.
 *
 * Le service pur `matchCompatibleParcels` enrichit chaque candidat avec
 * `{ compatible, score, reasons, detourKm }` sur la base de la capacité
 * restante de l'annonce et de la tolérance d'écart au trajet.
 */

export interface BackhaulMatch {
  id: string
  trackingNumber: string | null
  senderName: string | null
  weightKg: number
  price: number | null
  createdAt: string | null
  status: string
  compatible: boolean
  score: number | null
  reasons: string[]
  detourKm: number | null
}

export interface BackhaulResponse {
  matches: BackhaulMatch[]
  rejected: BackhaulMatch[]
}

function str(v: unknown): string {
  return v == null ? '' : String(v)
}
function strOrNull(v: unknown): string | null {
  return v == null ? null : String(v)
}
function num(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return fallback
}
function numOrNull(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return null
}

function parseMatch(raw: Record<string, unknown>): BackhaulMatch {
  const reasons = Array.isArray(raw.reasons)
    ? (raw.reasons as unknown[]).map((r) => str(r)).filter((s) => s.length > 0)
    : []
  return {
    id: str(raw.id),
    trackingNumber: strOrNull(raw.trackingNumber),
    senderName: strOrNull(raw.senderName),
    weightKg: num(raw.weightKg),
    price: numOrNull(raw.price),
    createdAt: strOrNull(raw.createdAt),
    status: str(raw.status),
    compatible: raw.compatible === true,
    score: numOrNull(raw.score),
    reasons,
    detourKm: numOrNull(raw.detourKm),
  }
}

export async function fetchBackhaulMatches(advertisementId: string): Promise<BackhaulResponse> {
  const { data } = await api.get(`/drivers/backhaul-matches/${advertisementId}`)
  const payload = (data?.data ?? {}) as Record<string, unknown>
  const matches = Array.isArray(payload.matches)
    ? (payload.matches as Record<string, unknown>[]).map(parseMatch)
    : []
  const rejected = Array.isArray(payload.rejected)
    ? (payload.rejected as Record<string, unknown>[]).map(parseMatch)
    : []
  return { matches, rejected }
}

/**
 * Libellés UX pour les codes `reasons` renvoyés par le matcher. Toute raison
 * non mappée est affichée telle quelle — utile en debug.
 */
export const BACKHAUL_REASON_LABELS: Record<string, string> = {
  disabled: 'Consolidation désactivée',
  invalid_trip: 'Trajet invalide',
  status_not_adoptable: 'Colis non adoptable (déjà pris)',
  overweight: 'Trop lourd pour la capacité restante',
  off_route: 'Trop loin du trajet',
  missing_pickup_zone: 'Zone de retrait manquante',
  missing_dropoff_zone: 'Zone de livraison manquante',
}
