import { api } from './client'
import type { ListParams, Pagination } from './types'

export type WithdrawalStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'
export type WithdrawalMethod = 'wave' | 'orange_money' | 'freeMoney' | 'freemMoney' | 'bank' | 'paydunya'

export interface Withdrawal {
  id: string
  walletId: string
  amount: number
  method: WithdrawalMethod
  phoneNumber?: string | null
  idempotencyKey: string
  status: WithdrawalStatus
  providerRef?: string | null
  failureReason?: string | null
  reviewedBy?: string | null
  reviewedAt?: string | null
  completedAt?: string | null
  createdAt: string
  updatedAt?: string
  driver?: { id: string; fullName: string; phone: string } | null
}

export interface WithdrawalList {
  withdrawals: Withdrawal[]
  pagination?: Pagination
}

export interface CreateWithdrawalPayload {
  amount: number
  method: WithdrawalMethod
  phone?: string
  idempotencyKey: string
}

/** Demander un retrait (driver) */
export async function requestWithdrawal(payload: CreateWithdrawalPayload): Promise<Withdrawal> {
  const { data } = await api.post('/driver/wallet/withdraw', payload)
  return data.withdrawal ?? data.data ?? data
}

/** Historique des retraits du chauffeur connecte */
export async function myWithdrawals(): Promise<Withdrawal[]> {
  const { data } = await api.get('/driver/wallet/withdrawals')
  return data.withdrawals ?? data.data ?? []
}

/** Annuler un retrait (driver, PENDING seulement) */
export async function cancelWithdrawal(id: string): Promise<Withdrawal> {
  const { data } = await api.delete(`/driver/wallet/withdrawals/${id}`)
  return data.withdrawal ?? data.data ?? data
}

/** Admin — Liste des retraits */
export async function listWithdrawals(params: ListParams = {}): Promise<WithdrawalList> {
  const { data } = await api.get('/super-admin/withdrawals', { params })
  return { withdrawals: data.withdrawals ?? data.data ?? [], pagination: data.pagination }
}

/** Admin — Detail retrait */
export async function getWithdrawal(id: string): Promise<Withdrawal> {
  const { data } = await api.get(`/super-admin/withdrawals/${id}`)
  return data.withdrawal ?? data.data ?? data
}

/** Admin — Approuver retrait */
export async function approveWithdrawal(id: string): Promise<Withdrawal> {
  const { data } = await api.post(`/super-admin/withdrawals/${id}/approve`)
  return data.withdrawal ?? data.data ?? data
}

/** Admin — Rejeter retrait */
export async function rejectWithdrawal(id: string, reason: string): Promise<Withdrawal> {
  const { data } = await api.post(`/super-admin/withdrawals/${id}/reject`, { reason })
  return data.withdrawal ?? data.data ?? data
}

/** Admin — Marquer SUCCESS (deversement manuel) */
export async function completeWithdrawal(id: string): Promise<Withdrawal> {
  const { data } = await api.post(`/super-admin/withdrawals/${id}/complete`)
  return data.withdrawal ?? data.data ?? data
}
