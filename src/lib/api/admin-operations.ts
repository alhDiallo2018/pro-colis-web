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
