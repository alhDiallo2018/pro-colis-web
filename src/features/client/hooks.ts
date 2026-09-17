import { useMutation, useQuery } from '@tanstack/react-query'
import * as parcelsApi from '@/lib/api/parcels'
import * as bidsApi from '@/lib/api/bids'
import * as proposalsApi from '@/lib/api/proposals'
import * as zonesApi from '@/lib/api/zones'
import * as rolesApi from '@/lib/api/roles'
import * as usersApi from '@/lib/api/users'
import * as adsApi from '@/lib/api/advertisements'
import * as ratingsApi from '@/lib/api/ratings'
import * as cancellationApi from '@/lib/api/cancellation'
import type { ListParams } from '@/lib/api/types'
import { useAuthStore } from '@/store/auth'
import { queryClient } from '@/lib/queryClient'
import type { ApiParcelStatus } from '@/lib/api/types'

/**
 * Intervalle de rafraîchissement du suivi (polling), configurable via
 * `VITE_TRACKING_REFRESH_MS`. Défaut raisonnable : 15 s. Le backend n'expose
 * pas encore la position GPS en SSE/WebSocket, d'où le polling du endpoint
 * de tracking.
 */
const TRACKING_REFRESH_MS = Number(import.meta.env.VITE_TRACKING_REFRESH_MS) || 15_000

/** Statuts terminaux : le suivi (et donc le polling) s'arrête. */
const TERMINAL_STATUSES: readonly ApiParcelStatus[] = ['delivered', 'cancelled']

export function useTrackParcel(trackingNumber: string, enabled: boolean) {
  return useQuery({
    queryKey: ['track', trackingNumber],
    queryFn: () => parcelsApi.track(trackingNumber),
    enabled: enabled && trackingNumber.trim().length > 0,
    retry: false,
    // Polling léger : s'arrête dès que la livraison est terminée/annulée pour
    // ne pas surcharger le backend inutilement.
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status && TERMINAL_STATUSES.includes(status) ? false : TRACKING_REFRESH_MS
    },
  })
}

export function useUpdateProfile() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  return useMutation({
    mutationFn: (payload: usersApi.ProfilePayload) => usersApi.updateProfile(user!.role, payload),
    onSuccess: (updated) => {
      setUser(updated)
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })
}

export function useMyParcels(params: ListParams = {}) {
  return useQuery({
    queryKey: ['client', 'parcels', params],
    queryFn: () => parcelsApi.listMine(params),
  })
}

export function useSentParcels(params: ListParams = {}) {
  return useQuery({
    queryKey: ['client', 'parcels', 'sent', params],
    queryFn: () => parcelsApi.listSent(params),
  })
}

export function useReceivedParcels(params: ListParams = {}) {
  return useQuery({
    queryKey: ['client', 'parcels', 'received', params],
    queryFn: () => parcelsApi.listReceived(params),
  })
}

export function useParcel(parcelId: string | undefined) {
  return useQuery({
    queryKey: ['client', 'parcel', parcelId],
    queryFn: () => parcelsApi.getClientParcel(parcelId as string),
    enabled: !!parcelId,
  })
}

export function useDeliveryCode(parcelId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['client', 'parcel', parcelId, 'delivery-code'],
    queryFn: () => parcelsApi.deliveryCode(parcelId as string),
    enabled: !!parcelId && enabled,
    staleTime: 5 * 60_000,
  })
}

export function useFreeParcels(params: ListParams = {}) {
  return useQuery({
    queryKey: ['parcels', 'free', params],
    queryFn: () => parcelsApi.listFree(params),
  })
}

export function useReceivedBids() {
  return useQuery({
    queryKey: ['client', 'bids', 'received'],
    queryFn: () => bidsApi.listReceived(),
    refetchInterval: 15_000,
  })
}

/** Drivers' trip advertisements that the client can browse and bid on. */
export function useDriverAnnonces() {
  return useQuery({ queryKey: ['annonces', 'list'], queryFn: () => adsApi.list({ status: 'open' }) })
}

export function useAnnonce(advertisementId: string | undefined) {
  return useQuery({
    queryKey: ['annonces', 'detail', advertisementId],
    queryFn: () => adsApi.detail(advertisementId as string),
    enabled: !!advertisementId,
  })
}

export function useCreateAnnonceOffer(advertisementId: string) {
  return useMutation({
    mutationFn: (payload: { price: number; message?: string; parcelId?: string }) => adsApi.createOffer(advertisementId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['annonces', 'detail', advertisementId] }),
  })
}

export function useZones() {
  return useQuery({ queryKey: ['zones', 'public'], queryFn: () => zonesApi.listPublic(), staleTime: 5 * 60_000 })
}

export function useDrivers() {
  return useQuery({ queryKey: ['drivers', 'public'], queryFn: () => rolesApi.searchDrivers(), staleTime: 5 * 60_000 })
}

/** Chauffeurs actifs desservant une zone donnée (choix par localité). */
export function useZoneDrivers(zoneId: string | undefined) {
  return useQuery({
    queryKey: ['drivers', 'zone', zoneId],
    queryFn: () => rolesApi.zoneDrivers(zoneId as string),
    enabled: !!zoneId,
    staleTime: 5 * 60_000,
  })
}

/** Fiche publique d'un chauffeur, consultable par le client. */
export function usePublicDriver(driverId: string | undefined) {
  return useQuery({
    queryKey: ['drivers', 'public', driverId],
    queryFn: () => rolesApi.publicDriverDetail(driverId as string),
    enabled: !!driverId,
    staleTime: 5 * 60_000,
  })
}

export function useCreateParcel() {
  return useMutation({
    mutationFn: (payload: parcelsApi.CreateParcelPayload) => parcelsApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client', 'parcels'] }),
  })
}

export function useUpdateParcel() {
  return useMutation({
    mutationFn: ({ parcelId, payload }: { parcelId: string; payload: parcelsApi.UpdateParcelPayload }) =>
      parcelsApi.update(parcelId, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['client', 'parcels'] })
      queryClient.invalidateQueries({ queryKey: ['client', 'parcel', updated.id] })
    },
  })
}

export function useAcceptBid(parcelId: string) {
  return useMutation({
    mutationFn: (bidId: string) => bidsApi.accept(parcelId, bidId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', 'bids'] })
      queryClient.invalidateQueries({ queryKey: ['client', 'parcels'] })
    },
  })
}

export function useRejectBid(parcelId: string) {
  return useMutation({
    mutationFn: (bidId: string) => bidsApi.reject(parcelId, bidId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client', 'bids'] }),
  })
}

export function useNegotiateBid() {
  return useMutation({
    mutationFn: ({ bidId, price, message }: { bidId: string; price: number; message?: string }) =>
      bidsApi.negotiate(bidId, { price, message }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client', 'bids'] }),
  })
}

/**
 * Devis d'annulation d'un colis (conséquences financières calculées par le
 * backend). Désactivé tant qu'aucun identifiant n'est fourni ; en cas d'échec
 * (ex. endpoint non encore exposé), l'appelant affiche une confirmation neutre.
 */
export function useCancellationQuote(parcelId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['client', 'parcel', parcelId, 'cancel-quote'],
    queryFn: () => cancellationApi.getCancellationQuote(parcelId as string),
    enabled: !!parcelId && enabled,
    retry: false,
  })
}

/**
 * Annulation d'un colis client. Après succès, le détail du colis et la liste
 * sont resynchronisés ; la confirmation est verrouillée côté composant tant que
 * la mutation est en cours pour empêcher les doubles soumissions.
 */
export function useCancelParcel(parcelId: string) {
  return useMutation({
    mutationFn: (payload: { reason?: string }) => cancellationApi.cancelParcel(parcelId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', 'parcels'] })
      queryClient.invalidateQueries({ queryKey: ['client', 'parcel', parcelId] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useCreateRating() {
  return useMutation({
    mutationFn: (payload: ratingsApi.CreateRatingPayload) => ratingsApi.createRating(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client', 'parcels'] })
      if (variables.driverId) {
        queryClient.invalidateQueries({ queryKey: ['ratings', 'driver', variables.driverId] })
      }
    },
  })
}

export function useDriverRatings(driverId: string | undefined) {
  return useQuery({
    queryKey: ['ratings', 'driver', driverId],
    queryFn: () => ratingsApi.getDriverRatings(driverId!),
    enabled: !!driverId,
  })
}

/**
 * Réponse du client à la contre-offre d'un chauffeur sur une proposition
 * directe. Le client ne peut accepter que si le dernier prix vient du
 * chauffeur : l'API renvoie 409 sinon, et `proposal.canClientAccept` porte la
 * même information pour l'affichage.
 */
export function useRespondToProposal() {
  return useMutation({
    mutationFn: ({
      parcelId,
      action,
      price,
      message,
    }: {
      parcelId: string
      action: proposalsApi.ClientProposalAction
      price?: number
      message?: string
    }) => proposalsApi.clientRespond(parcelId, action, { price, message }),
    onSuccess: (_parcel, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client', 'parcels'] })
      queryClient.invalidateQueries({ queryKey: ['client', 'parcel', variables.parcelId] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
