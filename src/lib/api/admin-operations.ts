import { api } from './client'

export interface WebhookDeliveryRow {
  id: string
  partnerName: string
  eventType: string
  status: string
  attempts: number
  lastStatusCode: number | null
  createdAt: string | null
  deliveredAt: string | null
  nextAttemptAt: string | null
}

export interface StopEventRow {
  id: string
  advertisementId: string
  driverId: string
  stopOrder: number
  stopLabel: string | null
  distanceMeters: number
  radiusMeters: number
  reachedAt: string | null
}

export interface HandoverRow {
  id: string
  parcelId: string
  trackingNumber: string | null
  fromDriverId: string
  toDriverId: string
  status: string
  initiatedAt: string | null
  confirmedAt: string | null
  cancelledAt: string | null
  cancellationReason: string | null
}

export interface IntegrationsHealth {
  status: string
  integrations: Record<string, unknown>
  checkedAt: string | null
}

function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' ? v : typeof v === 'string' ? Number(v) || fallback : fallback
}

function str(v: unknown): string {
  return v == null ? '' : String(v)
}

function strOrNull(v: unknown): string | null {
  return v == null ? null : String(v)
}

/** `GET /super-admin/webhooks/recent` — liste chronologique. */
export async function getRecentWebhooks(limit = 50): Promise<WebhookDeliveryRow[]> {
  const { data } = await api.get('/super-admin/webhooks/recent', { params: { limit } })
  const list = Array.isArray(data?.deliveries) ? data.deliveries : []
  return list.map((raw: Record<string, unknown>) => ({
    id: str(raw.id),
    partnerName: str(raw.partnerName),
    eventType: str(raw.eventType),
    status: str(raw.status),
    attempts: num(raw.attempts),
    lastStatusCode: raw.lastStatusCode == null ? null : num(raw.lastStatusCode, 0),
    createdAt: strOrNull(raw.createdAt),
    deliveredAt: strOrNull(raw.deliveredAt),
    nextAttemptAt: strOrNull(raw.nextAttemptAt),
  }))
}

/** `GET /super-admin/stop-events/recent` — arrêts GPS récemment atteints. */
export async function getRecentStopEvents(limit = 50): Promise<StopEventRow[]> {
  const { data } = await api.get('/super-admin/stop-events/recent', { params: { limit } })
  const list = Array.isArray(data?.events) ? data.events : []
  return list.map((raw: Record<string, unknown>) => ({
    id: str(raw.id),
    advertisementId: str(raw.advertisementId),
    driverId: str(raw.driverId),
    stopOrder: num(raw.stopOrder),
    stopLabel: strOrNull(raw.stopLabel),
    distanceMeters: num(raw.distanceMeters),
    radiusMeters: num(raw.radiusMeters),
    reachedAt: strOrNull(raw.reachedAt),
  }))
}

/** `GET /super-admin/handovers/recent` — transferts chauffeur↔chauffeur récents. */
export async function getRecentHandovers(limit = 50): Promise<HandoverRow[]> {
  const { data } = await api.get('/super-admin/handovers/recent', { params: { limit } })
  const list = Array.isArray(data?.handovers) ? data.handovers : []
  return list.map((raw: Record<string, unknown>) => ({
    id: str(raw.id),
    parcelId: str(raw.parcelId),
    trackingNumber: strOrNull(raw.trackingNumber),
    fromDriverId: str(raw.fromDriverId),
    toDriverId: str(raw.toDriverId),
    status: str(raw.status),
    initiatedAt: strOrNull(raw.initiatedAt),
    confirmedAt: strOrNull(raw.confirmedAt),
    cancelledAt: strOrNull(raw.cancelledAt),
    cancellationReason: strOrNull(raw.cancellationReason),
  }))
}

/** `GET /health/integrations` — statut global des intégrations partenaires. */
export async function getIntegrationsHealth(): Promise<IntegrationsHealth> {
  const { data } = await api.get('/health/integrations')
  const payload = (data?.data ?? data ?? {}) as Record<string, unknown>
  return {
    status: str(payload.status) || 'unknown',
    integrations: (payload.integrations as Record<string, unknown>) ?? {},
    checkedAt: strOrNull(payload.checkedAt),
  }
}

// ── Fraude ────────────────────────────────────────────────────────────────

export type FraudLevel = 'safe' | 'low' | 'medium' | 'high'

export interface FraudScore {
  userId: string
  name: string
  email: string | null
  phone: string
  role: string
  score: number
  level: FraudLevel
  flags: string[]
}

export interface FraudAlertUser {
  id: string
  fullName: string
  email: string | null
  phone: string
  role: string
}

export interface FraudAlert {
  id: string
  userId: string
  user: FraudAlertUser | null
  score: number
  level: FraudLevel
  flags: string[]
  notes: string | null
  resolvedAt: string | null
  resolvedById: string | null
  resolvedBy: { id: string; fullName: string } | null
  createdAt: string
  updatedAt: string
}

export interface FraudRefreshResult {
  scanned: number
  created: number
  skipped: number
}

function normalizeLevel(raw: unknown): FraudLevel {
  const v = typeof raw === 'string' ? raw.toLowerCase() : ''
  if (v === 'high' || v === 'medium' || v === 'low') return v
  return 'safe'
}

function normalizeFlags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.map((f) => String(f)).filter((s) => s.length > 0)
}

/** `GET /super-admin/fraud/scores` — top-N utilisateurs scorés à la volée. */
export async function fetchFraudScores(level?: FraudLevel, limit = 50): Promise<FraudScore[]> {
  const params: Record<string, string | number> = { limit }
  if (level) params.level = level
  const { data } = await api.get('/super-admin/fraud/scores', { params })
  const list = Array.isArray(data?.scores) ? data.scores : []
  return list.map((raw: Record<string, unknown>) => ({
    userId: str(raw.userId),
    name: str(raw.name),
    email: strOrNull(raw.email),
    phone: str(raw.phone),
    role: str(raw.role),
    score: num(raw.score),
    level: normalizeLevel(raw.level),
    flags: normalizeFlags(raw.flags),
  }))
}

/** `GET /super-admin/fraud/alerts` — alertes persistées (ouvertes par défaut). */
export async function fetchFraudAlerts(status: 'open' | 'resolved' = 'open'): Promise<FraudAlert[]> {
  const { data } = await api.get('/super-admin/fraud/alerts', { params: { status } })
  const list = Array.isArray(data?.alerts) ? data.alerts : []
  return list.map((raw: Record<string, unknown>) => {
    const u = (raw.user ?? null) as Record<string, unknown> | null
    const r = (raw.resolvedBy ?? null) as Record<string, unknown> | null
    return {
      id: str(raw.id),
      userId: str(raw.userId),
      user: u
        ? {
            id: str(u.id),
            fullName: str(u.fullName),
            email: strOrNull(u.email),
            phone: str(u.phone),
            role: str(u.role),
          }
        : null,
      score: num(raw.score),
      level: normalizeLevel(raw.level),
      flags: normalizeFlags(raw.flags),
      notes: strOrNull(raw.notes),
      resolvedAt: strOrNull(raw.resolvedAt),
      resolvedById: strOrNull(raw.resolvedById),
      resolvedBy: r ? { id: str(r.id), fullName: str(r.fullName) } : null,
      createdAt: str(raw.createdAt),
      updatedAt: str(raw.updatedAt),
    }
  })
}

/** `POST /super-admin/fraud/alerts/:id/resolve` — clôt une alerte avec notes. */
export async function resolveFraudAlert(id: string, notes: string): Promise<FraudAlert> {
  const { data } = await api.post(`/super-admin/fraud/alerts/${id}/resolve`, { notes })
  const raw = (data?.alert ?? {}) as Record<string, unknown>
  const u = (raw.user ?? null) as Record<string, unknown> | null
  const r = (raw.resolvedBy ?? null) as Record<string, unknown> | null
  return {
    id: str(raw.id),
    userId: str(raw.userId),
    user: u
      ? {
          id: str(u.id),
          fullName: str(u.fullName),
          email: strOrNull(u.email),
          phone: str(u.phone),
          role: str(u.role),
        }
      : null,
    score: num(raw.score),
    level: normalizeLevel(raw.level),
    flags: normalizeFlags(raw.flags),
    notes: strOrNull(raw.notes),
    resolvedAt: strOrNull(raw.resolvedAt),
    resolvedById: strOrNull(raw.resolvedById),
    resolvedBy: r ? { id: str(r.id), fullName: str(r.fullName) } : null,
    createdAt: str(raw.createdAt),
    updatedAt: str(raw.updatedAt),
  }
}

/** `POST /super-admin/fraud/refresh` — recalcul + création d'alertes manquantes. */
export async function refreshFraudAlerts(): Promise<FraudRefreshResult> {
  const { data } = await api.post('/super-admin/fraud/refresh', {})
  return {
    scanned: num(data?.scanned),
    created: num(data?.created),
    skipped: num(data?.skipped),
  }
}
