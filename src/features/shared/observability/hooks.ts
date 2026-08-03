import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import * as observabilityApi from '@/lib/api/observability'
import * as incidentsApi from '@/lib/api/incidents'
import { queryClient } from '@/lib/queryClient'

/** Cadence imposée par la spec : rafraîchissement auto toutes les 30 s. */
export const LOG_REFRESH_MS = 30_000

/**
 * Ancre temporelle du flux de journaux. Elle avance d'un cran toutes les 30 s
 * quand l'auto-refresh est actif et que l'onglet est visible, ce qui suffit à
 * relancer les requêtes : la clé React Query change avec `from`.
 *
 * L'ancre est figée dès qu'un curseur de pagination est actif — le backend
 * rejette en 400 un curseur sorti de la période demandée, ce qui arriverait à
 * chaque tick si la fenêtre glissait sous les pieds de l'utilisateur.
 */
export function useLogAnchor(autoRefresh: boolean, frozen: boolean) {
  const [anchor, setAnchor] = useState(() => Date.now())

  useEffect(() => {
    if (!autoRefresh || frozen) return
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') setAnchor(Date.now())
    }, LOG_REFRESH_MS)
    return () => window.clearInterval(id)
  }, [autoRefresh, frozen])

  return { anchor, refresh: () => setAnchor(Date.now()) }
}

export function useObservabilitySummary(filters: observabilityApi.LogFilters) {
  return useQuery({
    queryKey: ['observability', 'summary', filters],
    queryFn: () => observabilityApi.observabilitySummary(filters),
    // Une panne Loki renvoie un 503 métier : réessayer en boucle ne ferait
    // qu'alourdir un backend déjà en difficulté.
    retry: false,
    placeholderData: (previous) => previous,
  })
}

export function useObservabilityLogs(filters: observabilityApi.LogFilters) {
  return useQuery({
    queryKey: ['observability', 'logs', filters],
    queryFn: () => observabilityApi.observabilityLogs(filters),
    retry: false,
    // Garder la page précédente évite un écran vide à chaque tick de
    // rafraîchissement et à chaque changement de filtre.
    placeholderData: (previous) => previous,
  })
}

export function useObservabilityServices(autoRefresh = true) {
  return useQuery({
    queryKey: ['observability', 'services'],
    queryFn: () => observabilityApi.observabilityServices(),
    refetchInterval: autoRefresh ? LOG_REFRESH_MS : false,
    retry: false,
  })
}

export function useAuditLogs(filters: observabilityApi.AuditLogFilters) {
  return useQuery({
    queryKey: ['observability', 'audit', filters],
    queryFn: () => observabilityApi.auditLogs(filters),
    placeholderData: (previous) => previous,
  })
}

// --- Incidents plateforme ---

function invalidateIncidents() {
  queryClient.invalidateQueries({ queryKey: ['observability', 'incidents'] })
}

export function useIncidents(includeResolved: boolean) {
  return useQuery({
    queryKey: ['observability', 'incidents', includeResolved],
    queryFn: () => incidentsApi.listIncidents(includeResolved),
  })
}

export function useCreateIncident() {
  return useMutation({
    mutationFn: (payload: incidentsApi.IncidentPayload) => incidentsApi.createIncident(payload),
    onSuccess: invalidateIncidents,
  })
}

export function useUpdateIncident() {
  return useMutation({
    mutationFn: ({
      incidentId,
      payload,
    }: {
      incidentId: string
      payload: Partial<incidentsApi.IncidentPayload> & { resolved?: boolean }
    }) => incidentsApi.updateIncident(incidentId, payload),
    onSuccess: invalidateIncidents,
  })
}
