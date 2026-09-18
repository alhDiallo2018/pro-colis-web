import { api } from './client'

export type PaydunyaPaymentType = 'parcel' | 'score' | 'wallet' | 'penalty_debt'

export interface PaydunyaPaymentResult {
  token: string
  paymentUrl: string
}

export interface PaydunyaConfirmResult {
  token: string
  status: string
  amount: number
  receiptUrl?: string
  customer?: { name: string; phone: string; email: string } | null
}

export async function createPaydunyaPayment(
  type: PaydunyaPaymentType,
  { parcelId, points, amount, debtId }: { parcelId?: string; points?: number; amount?: number; debtId?: string }
): Promise<PaydunyaPaymentResult> {
  const { data } = await api.post('/payments/paydunya/create', { type, parcelId, points, amount, debtId })
  return data.data ?? data
}

export async function confirmPaydunyaPayment(token: string): Promise<PaydunyaConfirmResult> {
  const { data } = await api.get(`/payments/paydunya/confirm/${token}`)
  return data.data ?? data
}
