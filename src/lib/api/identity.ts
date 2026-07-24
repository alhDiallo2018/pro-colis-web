import { api } from './client'
import type { ListParams, Pagination } from './types'

export type IdentityStatus = 'pending' | 'approved' | 'rejected'

export interface IdentityVerification {
  id: string
  status: IdentityStatus
  documentType?: string | null
  documentFrontUrl?: string | null
  documentBackUrl?: string | null
  rejectionReason?: string | null
  reviewedBy?: string | null
  reviewedAt?: string | null
  createdAt?: string
  updatedAt?: string
  user?: {
    id: string
    fullName: string
    phone: string
    email: string | null
    role: string
    isVerified: boolean
  } | null
}

export interface IdentitySummary {
  total: number
  pending: number
  approved: number
  rejected: number
}

export interface IdentityList {
  verifications: IdentityVerification[]
  summary?: IdentitySummary
  pagination?: Pagination
}

/** Admin — liste des vérifications d'identité (filtre status / search). */
export async function listVerifications(params: ListParams = {}): Promise<IdentityList> {
  const { data } = await api.get('/super-admin/identity-verifications', { params })
  return {
    verifications: data.verifications ?? data.data ?? [],
    summary: data.summary,
    pagination: data.pagination,
  }
}

/** Admin — approuver une vérification (marque le chauffeur vérifié). */
export async function approveVerification(id: string): Promise<IdentityVerification> {
  const { data } = await api.post(`/super-admin/identity-verifications/${id}/approve`)
  return data.verification ?? data.data
}

/** Admin — rejeter une vérification (motif requis). */
export async function rejectVerification(id: string, reason: string): Promise<IdentityVerification> {
  const { data } = await api.post(`/super-admin/identity-verifications/${id}/reject`, { reason })
  return data.verification ?? data.data
}
