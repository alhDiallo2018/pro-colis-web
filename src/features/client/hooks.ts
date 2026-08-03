import { useMutation, useQuery } from '@tanstack/react-query'
import * as parcelsApi from '@/lib/api/parcels'
import * as bidsApi from '@/lib/api/bids'
import * as zonesApi from '@/lib/api/zones'
import * as rolesApi from '@/lib/api/roles'
import * as usersApi from '@/lib/api/users'
import * as adsApi from '@/lib/api/advertisements'
import * as ratingsApi from '@/lib/api/ratings'
import type { ListParams } from '@/lib/api/types'
import { useAuthStore } from '@/store/auth'
import { queryClient } from '@/lib/queryClient'

export function useTrackParcel(trackingNumber: string, enabled: boolean) {
  return useQuery({
    queryKey: ['track', trackingNumber],
    queryFn: () => parcelsApi.track(trackingNumber),
    enabled: enabled && trackingNumber.trim().length > 0,
    retry: false,
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
