import { api } from './client'
import type { Pagination } from './types'

// Espaces métier des deux comptes support spécialisés
// (ProColis-Api/src/modules/support/support.routes.js). Les incidents
// plateforme, partagés avec la supervision, vivent dans `incidents.ts`.

// ============================================================
// Support technique — tickets
// ============================================================

export type TicketChannel = 'in_app' | 'phone' | 'email'
export type TicketPriority = 'critical' | 'high' | 'normal' | 'low'
export type TicketStatus = 'open' | 'pending' | 'in_progress' | 'resolved'

export interface SupportTicket {
  id: string
  reference: string
  subject: string
  body?: string | null
  channel: TicketChannel
  priority: TicketPriority
  status: TicketStatus
  category?: string | null
  /** Âge du ticket en minutes, calculé serveur — l'horloge du poste peut dériver. */
  ageMinutes: number
  /** Négatif quand l'échéance de première réponse est dépassée. */
  slaRemainingMinutes: number | null
  slaDueAt?: string | null
  firstResponseAt?: string | null
  resolvedAt?: string | null
  satisfactionScore?: number | null
  requesterId?: string | null
  requesterName?: string | null
  requesterRole?: string | null
  assigneeId?: string | null
  assigneeName?: string | null
  createdAt: string
  updatedAt?: string
}

/** Série à sept ou douze points renvoyée telle quelle par l'API. */
export interface RoleSeries {
  values: number[]
  labels: string[]
  unit: string
}

export interface RoleBreakdown {
  label: string
  count: number
}

export interface SupportTechniqueStats {
  openTickets: number
  resolvedToday: number
  resolvedThisMonth: number
  firstResponseMinutes: number
  resolutionHours: number
  /** `null` quand aucun avis n'a été laissé : afficher un tiret, pas un zéro. */
  satisfactionPercent: number | null
  slaAtRisk: number
  openIncidents: number
  weeklySeries: RoleSeries
  categories: RoleBreakdown[]
}

export interface TicketFilters {
  status?: TicketStatus
  priority?: TicketPriority
  /** Restreint aux tickets dont l'agent connecté est titulaire. */
  assignedToMe?: boolean
  page?: number
  limit?: number
}

export interface TicketList {
  tickets: SupportTicket[]
  pagination?: Pagination
}

export async function supportTechniqueStats(): Promise<SupportTechniqueStats> {
  const { data } = await api.get('/support-technique/stats')
  return data.stats ?? data.data?.stats
}

export async function listTickets(filters: TicketFilters = {}): Promise<TicketList> {
  const { data } = await api.get('/support-technique/tickets', {
    params: {
      status: filters.status,
      priority: filters.priority,
      assignee: filters.assignedToMe ? 'me' : undefined,
      page: filters.page,
      limit: filters.limit ?? 50,
    },
  })
  return { tickets: data.tickets ?? [], pagination: data.pagination }
}

/**
 * Détail d'un ticket (GET /support-technique/tickets/:id) : la liste est
 * paginée et filtrée, ce point d'entrée reste le seul moyen d'ouvrir un ticket
 * précis — depuis une notification ou un lien partagé.
 */
export async function getTicket(ticketId: string): Promise<SupportTicket> {
  const { data } = await api.get(`/support-technique/tickets/${ticketId}`)
  return data.ticket ?? data.data?.ticket
}

export interface TicketUpdatePayload {
  status?: TicketStatus
  priority?: TicketPriority
  category?: string
  /** `null` retire le titulaire ; omis, l'API assigne l'agent qui prend en charge. */
  assigneeId?: string | null
}

export async function updateTicket(ticketId: string, payload: TicketUpdatePayload): Promise<SupportTicket> {
  const { data } = await api.patch(`/support-technique/tickets/${ticketId}`, payload)
  return data.ticket ?? data.data?.ticket
}

// ============================================================
// Support commercial — pipeline et couverture
// ============================================================

export type LeadKind = 'garage' | 'business_client' | 'driver_fleet'
export type LeadStage = 'contacted' | 'qualified' | 'negotiation' | 'signed'

export interface CommercialLead {
  id: string
  name: string
  city?: string | null
  kind: LeadKind
  stage: LeadStage
  monthlyValue: number
  contactName?: string | null
  contactPhone?: string | null
  nextFollowUpAt?: string | null
  /** Jours calendaires avant la relance ; négatif quand elle est en retard. */
  daysToFollowUp: number | null
  signedAt?: string | null
  notes?: string | null
  ownerId?: string | null
  createdAt: string
  updatedAt?: string
}

export interface SupportCommercialStats {
  activeLeads: number
  signedThisMonth: number
  managedAccounts: number
  monthlyRevenue: number
  monthlyObjective: number
  /** `null` sur un portefeuille vide : 0 % se lirait comme un mauvais résultat. */
  conversionPercent: number | null
  overdueFollowUps: number
  newZonesSigned: number
  territory: string | null
  monthlySeries: RoleSeries
  sources: RoleBreakdown[]
}

export interface CoverageGap {
  id: string
  name: string
  city?: string | null
  region?: string | null
  activeDrivers: number
  reason: string
}

export interface NetworkCoverage {
  totalZones: number
  /** Seuil de chauffeurs actifs sous lequel une zone est jugée à densifier. */
  thinThreshold: number
  gaps: CoverageGap[]
}

export interface LeadList {
  leads: CommercialLead[]
  pagination?: Pagination
}

export async function supportCommercialStats(): Promise<SupportCommercialStats> {
  const { data } = await api.get('/support-commercial/stats')
  return data.stats ?? data.data?.stats
}

export async function listLeads(filters: { stage?: LeadStage; page?: number; limit?: number } = {}): Promise<LeadList> {
  const { data } = await api.get('/support-commercial/leads', {
    params: { stage: filters.stage, page: filters.page, limit: filters.limit ?? 50 },
  })
  return { leads: data.leads ?? [], pagination: data.pagination }
}

export interface LeadPayload {
  name: string
  city?: string
  kind?: LeadKind
  stage?: LeadStage
  monthlyValue?: number
  contactName?: string
  contactPhone?: string
  nextFollowUpAt?: string | null
  notes?: string
}

export async function createLead(payload: LeadPayload): Promise<CommercialLead> {
  const { data } = await api.post('/support-commercial/leads', payload)
  return data.lead ?? data.data?.lead
}

export async function updateLead(leadId: string, payload: Partial<LeadPayload>): Promise<CommercialLead> {
  const { data } = await api.patch(`/support-commercial/leads/${leadId}`, payload)
  return data.lead ?? data.data?.lead
}

export async function networkCoverage(): Promise<NetworkCoverage> {
  const { data } = await api.get('/support-commercial/coverage')
  return data.coverage ?? data.data?.coverage
}
