import { api } from './client'
import type { Pagination, Role } from './types'

// Contrat défini par ProColis-Api/specs/logs/observability.md. Le backend
// interroge Loki et Prometheus ; le navigateur ne les voit jamais directement.

export const LOG_SOURCES = ['api', 'postgres', 'caddy', 'frontend', 'docker'] as const
export type LogSource = (typeof LOG_SOURCES)[number]

export const LOG_LEVELS = [
  'debug',
  'info',
  'notice',
  'warning',
  'error',
  'critical',
  'alert',
  'emergency',
] as const
export type LogLevel = (typeof LOG_LEVELS)[number]

/** Niveaux qui méritent une action : ce sont eux que compte la carte « Erreurs ». */
export const CRITICAL_LEVELS: readonly LogLevel[] = ['error', 'critical', 'alert', 'emergency']

export interface LogEntryError {
  name?: string
  code?: string
  message?: string
  stack?: string
}

export interface LogEntry {
  id: string
  timestamp: string
  severity: LogLevel
  source: string
  environment?: string
  message: string
  requestId?: string | null
  route?: string | null
  method?: string | null
  statusCode?: number | null
  durationMs?: number | null
  userId?: string | null
  error?: LogEntryError | null
  context?: Record<string, unknown> | null
  /** Vrai quand le serveur a retiré stack, contexte et userId (rôles support). */
  redacted?: boolean
}

export interface LogPage {
  limit: number
  hasMore: boolean
  nextCursor: string | null
}

export interface LogList {
  logs: LogEntry[]
  page: LogPage
}

export type ServiceStatus = 'healthy' | 'unavailable'

export interface ServiceHealth {
  service: string
  status: ServiceStatus
  checkedAt: string
}

export interface ObservabilitySummary {
  from: string
  to: string
  total: number
  byLevel: Partial<Record<LogLevel, number>>
  bySource: Record<string, number>
  latestAt: string | null
  services: ServiceHealth[]
}

export interface LogFilters {
  source?: LogSource | ''
  levels?: LogLevel[]
  q?: string
  requestId?: string
  from?: string
  to?: string
  limit?: number
  cursor?: string
}

/**
 * Les filtres vides doivent disparaître de l'URL : le backend rejette en 400
 * une source inconnue ou une recherche de moins de deux caractères, y compris
 * quand la valeur est une chaîne vide.
 */
function toQueryParams(filters: LogFilters): Record<string, string | number> {
  const params: Record<string, string | number> = {}
  if (filters.source) params.source = filters.source
  if (filters.levels?.length) params.levels = filters.levels.join(',')
  if (filters.q && filters.q.trim().length >= 2) params.q = filters.q.trim()
  if (filters.requestId?.trim()) params.requestId = filters.requestId.trim()
  if (filters.from) params.from = filters.from
  if (filters.to) params.to = filters.to
  if (filters.limit) params.limit = filters.limit
  if (filters.cursor) params.cursor = filters.cursor
  return params
}

export async function observabilitySummary(filters: LogFilters = {}): Promise<ObservabilitySummary> {
  const { data } = await api.get('/super-admin/observability/summary', { params: toQueryParams(filters) })
  return data.summary ?? data.data
}

export async function observabilityLogs(filters: LogFilters = {}): Promise<LogList> {
  const { data } = await api.get('/super-admin/observability/logs', { params: toQueryParams(filters) })
  return {
    logs: data.logs ?? [],
    page: data.page ?? { limit: filters.limit ?? 50, hasMore: false, nextCursor: null },
  }
}

export async function observabilityServices(): Promise<ServiceHealth[]> {
  const { data } = await api.get('/super-admin/observability/services')
  return data.services ?? []
}

export type ExportFormat = 'csv' | 'jsonl'

/**
 * L'export est un téléchargement de fichier, pas du JSON : on récupère un blob
 * et on déclenche la sauvegarde depuis le navigateur. Réservé au super admin
 * (le backend renvoie 403 aux rôles support).
 */
export async function downloadObservabilityExport(filters: LogFilters, format: ExportFormat): Promise<void> {
  const response = await api.get('/super-admin/observability/export', {
    params: { ...toQueryParams({ ...filters, cursor: undefined, limit: undefined }), format },
    responseType: 'blob',
  })

  const stamp = new Date().toISOString().slice(0, 19).replace(/[:]/g, '-')
  const url = URL.createObjectURL(response.data as Blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `procolis-logs-${stamp}.${format}`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

// --- Journal d'audit métier ---

export interface AuditLogActor {
  id: string
  fullName: string
  phone?: string | null
  role: Role | string
}

export interface AuditLogEntry {
  id: string
  actorId?: string | null
  actorRole?: string | null
  actor?: AuditLogActor | null
  action: string
  entityType: string
  entityId?: string | null
  beforeData?: Record<string, unknown> | null
  afterData?: Record<string, unknown> | null
  /** Le serveur signale un instantané existant même quand il ne l'expose pas. */
  hasChangeSnapshot?: boolean
  ipAddress?: string | null
  userAgent?: string | null
  requestId?: string | null
  redacted?: boolean
  createdAt: string
}

export interface AuditLogFilters {
  page?: number
  limit?: number
  search?: string
  actorRole?: string
  actorId?: string
  action?: string
  entityType?: string
  entityId?: string
  from?: string
  to?: string
}

export interface AuditLogList {
  auditLogs: AuditLogEntry[]
  pagination?: Pagination
}

export async function auditLogs(filters: AuditLogFilters = {}): Promise<AuditLogList> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== ''),
  )
  const { data } = await api.get('/super-admin/audit-logs', { params })
  return { auditLogs: data.auditLogs ?? data.data ?? [], pagination: data.pagination }
}
