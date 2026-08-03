import { api } from './client'

// Incidents plateforme — module support technique de l'API
// (ProColis-Api/src/modules/support/support.routes.js).

export type IncidentSeverity = 'sev1' | 'sev2' | 'sev3'

export interface PlatformIncident {
  id: string
  title: string
  scope: string
  severity: IncidentSeverity
  mitigated: boolean
  impactedUsers: number
  /** Durée écoulée depuis le début, calculée par le serveur. */
  sinceMinutes: number
  startedAt: string
  resolvedAt?: string | null
  createdAt?: string
}

export interface IncidentPayload {
  title: string
  scope: string
  severity: IncidentSeverity
  impactedUsers?: number
  mitigated?: boolean
}

export async function listIncidents(includeResolved = false): Promise<PlatformIncident[]> {
  const { data } = await api.get('/support-technique/incidents', {
    params: includeResolved ? { includeResolved: 'true' } : {},
  })
  return data.incidents ?? data.data ?? []
}

export async function createIncident(payload: IncidentPayload): Promise<PlatformIncident> {
  const { data } = await api.post('/support-technique/incidents', payload)
  return data.incident ?? data.data
}

/** `resolved` est distinct de `mitigated` : mitiger n'arrête pas le compteur. */
export async function updateIncident(
  incidentId: string,
  payload: Partial<IncidentPayload> & { resolved?: boolean },
): Promise<PlatformIncident> {
  const { data } = await api.patch(`/support-technique/incidents/${incidentId}`, payload)
  return data.incident ?? data.data
}
