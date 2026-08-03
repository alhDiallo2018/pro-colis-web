import { useMutation, useQuery } from '@tanstack/react-query'
import * as supportRolesApi from '@/lib/api/support-roles'
import { queryClient } from '@/lib/queryClient'
import { useAuthStore } from '@/store/auth'

// Les deux espaces sont ouverts à leur agent et au super admin (cf. RBAC de
// `support.routes.js`) : c'est ce même test qui décide d'activer les requêtes,
// sinon un compte support commercial déclencherait des 403 sur l'espace
// technique en arrivant sur le tableau de bord partagé.

function useHasTechniqueAccess() {
  const role = useAuthStore((state) => state.user?.role)
  return role === 'support_technique' || role === 'super_admin'
}

function useHasCommercialAccess() {
  const role = useAuthStore((state) => state.user?.role)
  return role === 'support_commercial' || role === 'super_admin'
}

export { useHasCommercialAccess, useHasTechniqueAccess }

// --- Support technique ---

export function useSupportTechniqueStats() {
  const enabled = useHasTechniqueAccess()
  return useQuery({
    queryKey: ['support-roles', 'technique', 'stats'],
    queryFn: () => supportRolesApi.supportTechniqueStats(),
    enabled,
  })
}

export function useTickets(filters: supportRolesApi.TicketFilters) {
  const enabled = useHasTechniqueAccess()
  return useQuery({
    queryKey: ['support-roles', 'technique', 'tickets', filters],
    queryFn: () => supportRolesApi.listTickets(filters),
    enabled,
    placeholderData: (previous) => previous,
  })
}

/** Détail d'un ticket, chargé à l'ouverture du panneau. */
export function useTicket(ticketId: string | undefined) {
  const enabled = useHasTechniqueAccess()
  return useQuery({
    queryKey: ['support-roles', 'technique', 'ticket', ticketId],
    queryFn: () => supportRolesApi.getTicket(ticketId!),
    enabled: enabled && Boolean(ticketId),
  })
}

export function useUpdateTicket() {
  return useMutation({
    mutationFn: ({ ticketId, payload }: { ticketId: string; payload: supportRolesApi.TicketUpdatePayload }) =>
      supportRolesApi.updateTicket(ticketId, payload),
    onSuccess: () => {
      // Résoudre ou prendre en charge déplace aussi les compteurs du tableau
      // de bord : on invalide l'espace entier plutôt que la seule liste.
      queryClient.invalidateQueries({ queryKey: ['support-roles', 'technique'] })
    },
  })
}

// --- Support commercial ---

export function useSupportCommercialStats() {
  const enabled = useHasCommercialAccess()
  return useQuery({
    queryKey: ['support-roles', 'commercial', 'stats'],
    queryFn: () => supportRolesApi.supportCommercialStats(),
    enabled,
  })
}

export function useLeads(stage?: supportRolesApi.LeadStage) {
  const enabled = useHasCommercialAccess()
  return useQuery({
    queryKey: ['support-roles', 'commercial', 'leads', stage ?? 'all'],
    queryFn: () => supportRolesApi.listLeads({ stage }),
    enabled,
    placeholderData: (previous) => previous,
  })
}

function invalidateCommercial() {
  queryClient.invalidateQueries({ queryKey: ['support-roles', 'commercial'] })
}

export function useCreateLead() {
  return useMutation({
    mutationFn: (payload: supportRolesApi.LeadPayload) => supportRolesApi.createLead(payload),
    onSuccess: invalidateCommercial,
  })
}

export function useUpdateLead() {
  return useMutation({
    mutationFn: ({ leadId, payload }: { leadId: string; payload: Partial<supportRolesApi.LeadPayload> }) =>
      supportRolesApi.updateLead(leadId, payload),
    onSuccess: invalidateCommercial,
  })
}

export function useNetworkCoverage() {
  const enabled = useHasCommercialAccess()
  return useQuery({
    queryKey: ['support-roles', 'commercial', 'coverage'],
    queryFn: () => supportRolesApi.networkCoverage(),
    enabled,
  })
}
