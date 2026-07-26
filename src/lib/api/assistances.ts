import { api } from './client'
import type { ListParams, Pagination } from './types'

export type AssistanceChannel = 'email' | 'chat' | 'call'
export type AssistanceStatus = 'open' | 'in_progress' | 'resolved'

export interface Assistance {
  id: string
  code: string
  channel: AssistanceChannel
  subject: string
  notes?: string | null
  status: AssistanceStatus
  contactName?: string | null
  contactPhone?: string | null
  userId?: string | null
  user?: { id: string; fullName: string; phone: string; email: string | null; role: string } | null
  handledById?: string | null
  handledBy?: { id: string; fullName: string } | null
  resolvedAt?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface AssistanceSummary {
  total: number
  open: number
  inProgress: number
  resolved: number
}

export interface AssistanceList {
  assistances: Assistance[]
  summary?: AssistanceSummary
  pagination?: Pagination
}

export interface AssistancePayload {
  channel: AssistanceChannel
  subject: string
  notes?: string
  userId?: string | null
  contactName?: string
  contactPhone?: string
  status?: AssistanceStatus
}

/** Utilisateur candidat au rattachement d'une assistance. */
export interface AssistanceUser {
  id: string
  fullName: string
  phone: string
  email?: string | null
  role: string
  city?: string | null
  status?: string
}

/**
 * Recherche d'utilisateurs inscrits pour rattacher l'assistance au bon compte.
 * Sans terme, l'API renvoie les comptes récemment actifs (liste jamais vide).
 */
export async function searchAssistanceUsers(search: string): Promise<AssistanceUser[]> {
  const { data } = await api.get('/super-admin/assistances/users/search', {
    params: search ? { search } : {},
  })
  return data.users ?? data.data ?? []
}

/** Admin — liste paginée des assistances (avec filtres search / channel / status). */
export async function listAssistances(params: ListParams = {}): Promise<AssistanceList> {
  const { data } = await api.get('/super-admin/assistances', { params })
  return {
    assistances: data.assistances ?? data.data ?? [],
    summary: data.summary,
    pagination: data.pagination,
  }
}

/** Admin — enregistrer une nouvelle assistance (génère un code de suivi). */
export async function createAssistance(payload: AssistancePayload): Promise<Assistance> {
  const { data } = await api.post('/super-admin/assistances', payload)
  return data.assistance ?? data.data
}

/** Admin — mettre à jour une assistance (statut, notes…). */
export async function updateAssistance(id: string, payload: Partial<AssistancePayload>): Promise<Assistance> {
  const { data } = await api.put(`/super-admin/assistances/${id}`, payload)
  return data.assistance ?? data.data
}

/** Admin — supprimer une assistance. */
export async function deleteAssistance(id: string): Promise<void> {
  await api.delete(`/super-admin/assistances/${id}`)
}
