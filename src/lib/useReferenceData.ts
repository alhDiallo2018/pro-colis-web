// Hooks React Query autour des referentiels editables.
//
// `useReferenceData` sert la version publique (lecture seule, mise en cache
// 10 min cote client, 5 min cote API). Les hooks admin exposent liste
// paginee + mutations avec invalidation automatique du cache public pour
// qu'une creation admin se propage immediatement aux ecrans drivers/colis.
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  createReferenceItem,
  deactivateReferenceItem,
  listAdminDocumentTypes,
  listAdminDriverStatuses,
  listAdminExpenseCategories,
  listAdminIncidentSeverities,
  listAdminParcelCategories,
  listAdminPaymentMethods,
  listAdminVehicleTypes,
  listPublicDocumentTypes,
  listPublicDriverStatuses,
  listPublicExpenseCategories,
  listPublicIncidentSeverities,
  listPublicParcelCategories,
  listPublicPaymentMethods,
  listPublicVehicleTypes,
  updateReferenceItem,
  type AdminListParams,
  type DocumentTypeItem,
  type DriverStatusItem,
  type ExpenseCategoryItem,
  type IncidentSeverityItem,
  type ParcelCategoryItem,
  type PaymentMethodItem,
  type ReferencePayload,
  type ReferenceType,
  type VehicleTypeItem,
} from './api/reference-data'
import { queryClient } from './queryClient'

// Les 7 types sont exposes derriere le meme hook generique : la specialisation
// se fait a l'appel via l'union discrimee `type`. Le type de retour est
// inference du type passe, ce qui evite les casts cote appelants.
type ReferenceItemFor<T extends ReferenceType> = T extends 'vehicle-types'
  ? VehicleTypeItem
  : T extends 'document-types'
    ? DocumentTypeItem
    : T extends 'expense-categories'
      ? ExpenseCategoryItem
      : T extends 'parcel-categories'
        ? ParcelCategoryItem
        : T extends 'payment-methods'
          ? PaymentMethodItem
          : T extends 'driver-statuses'
            ? DriverStatusItem
            : IncidentSeverityItem

interface UseReferenceDataOptions {
  // Filtre serveur optionnel (category pour vehicle-types, appliesTo pour
  // document-types, channel pour payment-methods). Ignore pour les listes
  // sans filtre.
  filter?: string
  enabled?: boolean
}

const PUBLIC_QUERY_KEY = (type: ReferenceType, filter?: string) =>
  ['reference', type, filter ?? null] as const

// 10 minutes cote client : un referentiel ne change pas souvent et les ecrans
// (dropdowns, formulaires) l'ouvrent frequemment. Les mutations admin
// invalident la cle explicitement.
const PUBLIC_STALE_TIME = 10 * 60_000

export function useReferenceData<T extends ReferenceType>(
  type: T,
  options: UseReferenceDataOptions = {},
) {
  return useQuery({
    queryKey: PUBLIC_QUERY_KEY(type, options.filter),
    queryFn: async (): Promise<ReferenceItemFor<T>[]> => {
      if (type === 'vehicle-types') {
        return (await listPublicVehicleTypes(options.filter)) as ReferenceItemFor<T>[]
      }
      if (type === 'document-types') {
        return (await listPublicDocumentTypes(options.filter)) as ReferenceItemFor<T>[]
      }
      if (type === 'expense-categories') {
        return (await listPublicExpenseCategories()) as ReferenceItemFor<T>[]
      }
      if (type === 'parcel-categories') {
        return (await listPublicParcelCategories()) as ReferenceItemFor<T>[]
      }
      if (type === 'payment-methods') {
        return (await listPublicPaymentMethods(options.filter)) as ReferenceItemFor<T>[]
      }
      if (type === 'driver-statuses') {
        return (await listPublicDriverStatuses()) as ReferenceItemFor<T>[]
      }
      return (await listPublicIncidentSeverities()) as ReferenceItemFor<T>[]
    },
    enabled: options.enabled !== false,
    staleTime: PUBLIC_STALE_TIME,
  })
}

// Raccourcis typés pour les consommateurs — evitent la casse cote appelants.
export const useParcelCategories = (options?: UseReferenceDataOptions) =>
  useReferenceData('parcel-categories', options)
export const usePaymentMethods = (options?: UseReferenceDataOptions) =>
  useReferenceData('payment-methods', options)
export const useDriverStatuses = (options?: UseReferenceDataOptions) =>
  useReferenceData('driver-statuses', options)
export const useIncidentSeverities = (options?: UseReferenceDataOptions) =>
  useReferenceData('incident-severities', options)

// --- Hooks admin ---

const ADMIN_QUERY_KEY = (type: ReferenceType, params?: AdminListParams) =>
  ['admin', 'reference', type, params ?? null] as const

export function useAdminReferenceList<T extends ReferenceType>(
  type: T,
  params?: AdminListParams,
) {
  return useQuery({
    queryKey: ADMIN_QUERY_KEY(type, params),
    queryFn: async () => {
      if (type === 'vehicle-types') return listAdminVehicleTypes(params)
      if (type === 'document-types') return listAdminDocumentTypes(params)
      if (type === 'expense-categories') return listAdminExpenseCategories(params)
      if (type === 'parcel-categories') return listAdminParcelCategories(params)
      if (type === 'payment-methods') return listAdminPaymentMethods(params)
      if (type === 'driver-statuses') return listAdminDriverStatuses(params)
      return listAdminIncidentSeverities(params)
    },
  })
}

function invalidate(type: ReferenceType) {
  queryClient.invalidateQueries({ queryKey: ['admin', 'reference', type] })
  queryClient.invalidateQueries({ queryKey: ['reference', type] })
}

export function useCreateReferenceItem<T extends ReferenceType>(type: T) {
  return useMutation({
    mutationFn: (payload: ReferencePayload) => createReferenceItem<ReferenceItemFor<T>>(type, payload),
    onSuccess: () => invalidate(type),
  })
}

export function useUpdateReferenceItem<T extends ReferenceType>(type: T) {
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ReferencePayload> }) =>
      updateReferenceItem<ReferenceItemFor<T>>(type, id, payload),
    onSuccess: () => invalidate(type),
  })
}

/** Suppression douce : l'API bascule simplement `isActive` a false. */
export function useDeactivateReferenceItem<T extends ReferenceType>(type: T) {
  return useMutation({
    mutationFn: (id: string) => deactivateReferenceItem<ReferenceItemFor<T>>(type, id),
    onSuccess: () => invalidate(type),
  })
}
