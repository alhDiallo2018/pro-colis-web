import { api } from './client'
import type { ListParams, Pagination } from './types'

export type ExpenseStatus = 'paid' | 'pending'

export interface Expense {
  id: string
  reference: string
  title: string
  category: string
  amount: number
  currency: string
  description?: string | null
  proofUrl?: string | null
  status: ExpenseStatus
  spentAt?: string | null
  createdById?: string | null
  createdBy?: { id: string; fullName: string } | null
  createdAt?: string
  updatedAt?: string
}

export interface ExpenseSummary {
  count: number
  totalAmount: number
  paidAmount: number
  pendingAmount: number
}

export interface ExpenseList {
  expenses: Expense[]
  summary?: ExpenseSummary
  pagination?: Pagination
}

export interface ExpensePayload {
  title: string
  category?: string
  amount: number
  currency?: string
  description?: string
  proofUrl?: string | null
  status?: ExpenseStatus
  spentAt?: string
}

/** Admin — liste paginée des dépenses (filtres search / category / status / from / to). */
export async function listExpenses(params: ListParams = {}): Promise<ExpenseList> {
  const { data } = await api.get('/super-admin/expenses', { params })
  return {
    expenses: data.expenses ?? data.data ?? [],
    summary: data.summary,
    pagination: data.pagination,
  }
}

/** Admin — enregistrer une nouvelle dépense (génère une référence). */
export async function createExpense(payload: ExpensePayload): Promise<Expense> {
  const { data } = await api.post('/super-admin/expenses', payload)
  return data.expense ?? data.data
}

/** Admin — mettre à jour une dépense. */
export async function updateExpense(id: string, payload: Partial<ExpensePayload>): Promise<Expense> {
  const { data } = await api.put(`/super-admin/expenses/${id}`, payload)
  return data.expense ?? data.data
}

/** Admin — supprimer une dépense. */
export async function deleteExpense(id: string): Promise<void> {
  await api.delete(`/super-admin/expenses/${id}`)
}
