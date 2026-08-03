import { api } from './client'
import type {
  CashCollectionPoint,
  Pagination,
  Parcel,
  PaymentChannel,
} from './types'

export type CashDeclarationStatus = 'processing' | 'completed' | 'failed'

export interface CashDeclaration {
  id: string
  userId: string
  userName?: string | null
  parcelId?: string | null
  trackingNumber?: string | null
  amount: number
  currency: string
  method: 'cash'
  status: CashDeclarationStatus
  channel: PaymentChannel
  cashCollectionPoint?: CashCollectionPoint | null
  declaredBy?: string | null
  declaredByName?: string | null
  declaredAt?: string | null
  declarationNote?: string | null
  declarationProofUrl?: string | null
  rejectionReason?: string | null
  validatedBy?: string | null
  validatedAt?: string | null
  createdAt: string
  parcel?: Parcel | null
}

interface CashDeclarationList {
  declarations: CashDeclaration[]
  pagination?: Pagination
}

/** Convertit les Decimal Prisma en nombres uniquement à la frontière web. */
function normalizeDeclaration(raw: CashDeclaration & { amount: number | string }): CashDeclaration {
  const parcel = raw.parcel
    ? {
        ...raw.parcel,
        price: raw.parcel.price == null ? null : Number(raw.parcel.price),
        totalAmount: raw.parcel.totalAmount == null ? null : Number(raw.parcel.totalAmount),
      }
    : raw.parcel

  return { ...raw, amount: Number(raw.amount), parcel }
}

export interface DeclareCashPayload {
  amount: number
  collectionPoint: CashCollectionPoint
  note?: string
  proofUrl?: string
}

/**
 * Déclaration d'encaissement par le chauffeur : sur une course en espèces la
 * plateforme n'encaisse rien, l'argent passe de main en main. La déclaration
 * crée un paiement `cash` en `processing` qu'un admin valide ensuite.
 */
export async function declareCashCollection(
  parcelId: string,
  payload: DeclareCashPayload,
): Promise<CashDeclaration> {
  const { data } = await api.post(`/driver/parcels/${parcelId}/declare-cash`, payload)
  return normalizeDeclaration(data.payment ?? data.data?.payment)
}

/** Encaissements déclarés par le chauffeur connecté, tous statuts confondus. */
export async function driverCashDeclarations(params: {
  page?: number
  limit?: number
  status?: CashDeclarationStatus
} = {}): Promise<CashDeclarationList> {
  const { data } = await api.get('/driver/cash-declarations', { params })
  const declarations = (data.declarations ?? []).map(normalizeDeclaration)
  return { declarations, pagination: data.pagination }
}

export async function listCashDeclarations(params: {
  page?: number
  limit?: number
  status?: CashDeclarationStatus
} = {}): Promise<CashDeclarationList> {
  const { data } = await api.get('/super-admin/payments/cash-declarations', { params })
  const declarations = (data.declarations ?? []).map(normalizeDeclaration)
  return { declarations, pagination: data.pagination }
}

export async function validateCashDeclaration(paymentId: string): Promise<CashDeclaration> {
  const { data } = await api.post(`/super-admin/payments/${paymentId}/validate-cash`)
  return normalizeDeclaration(data.payment)
}

export async function rejectCashDeclaration(paymentId: string, reason: string): Promise<CashDeclaration> {
  const { data } = await api.post(`/super-admin/payments/${paymentId}/reject-cash`, { reason })
  return normalizeDeclaration(data.payment)
}
