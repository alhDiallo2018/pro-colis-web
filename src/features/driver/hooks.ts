import { useMutation, useQuery } from '@tanstack/react-query'
import * as roles from '@/lib/api/roles'
import * as parcelsApi from '@/lib/api/parcels'
import * as bidsApi from '@/lib/api/bids'
import * as paymentsApi from '@/lib/api/payments'
import * as adsApi from '@/lib/api/advertisements'
import * as vehiclesApi from '@/lib/api/vehicles'
import * as usersApi from '@/lib/api/users'
import * as scoreApi from '@/lib/api/score'
import * as withdrawalsApi from '@/lib/api/withdrawals'
import * as ratingsApi from '@/lib/api/ratings'
import type { ListParams } from '@/lib/api/types'
import { useAuthStore } from '@/store/auth'
import { queryClient } from '@/lib/queryClient'

export function useScoreBalance() {
  return useQuery({ queryKey: ['score', 'balance'], queryFn: () => scoreApi.getBalance() })
}

export function useScoreHistory() {
  return useQuery({ queryKey: ['score', 'history'], queryFn: () => scoreApi.history() })
}

export function usePurchaseScore() {
  return useMutation({
    mutationFn: (payload: scoreApi.PurchasePayload) => scoreApi.purchase(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['score', 'balance'] })
      queryClient.invalidateQueries({ queryKey: ['score', 'history'] })
    },
  })
}

export function useDriverWallet() {
  return useQuery({ queryKey: ['driver', 'wallet'], queryFn: () => scoreApi.getWallet() })
}

export function useWithdrawWallet() {
  return useMutation({
    mutationFn: (payload: scoreApi.WithdrawPayload) => scoreApi.withdrawWallet(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver', 'wallet'] })
      queryClient.invalidateQueries({ queryKey: ['driver', 'withdrawals'] })
    },
  })
}

export function useMyWithdrawals() {
  return useQuery({ queryKey: ['driver', 'withdrawals'], queryFn: () => withdrawalsApi.myWithdrawals() })
}

export function useCancelWithdrawal() {
  return useMutation({
    mutationFn: (id: string) => withdrawalsApi.cancelWithdrawal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver', 'wallet'] })
      queryClient.invalidateQueries({ queryKey: ['driver', 'withdrawals'] })
    },
  })
}

/** Avis laissés par les clients sur le chauffeur connecté. */
export function useMyRatings(driverId: string | undefined) {
  return useQuery({
    queryKey: ['ratings', 'driver', driverId],
    queryFn: () => ratingsApi.getDriverRatings(driverId as string),
    enabled: !!driverId,
    retry: false,
  })
}

export function useDriverPayments() {
  return useQuery({ queryKey: ['driver', 'payments'], queryFn: () => paymentsApi.history() })
}

export function useMyAdvertisements() {
  return useQuery({ queryKey: ['driver', 'advertisements'], queryFn: () => adsApi.listMine() })
}

export function useCreateAdvertisement() {
  return useMutation({
    mutationFn: (payload: adsApi.CreateAdvertisementPayload) => adsApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['driver', 'advertisements'] }),
  })
}

export function useDriverVehicle() {
  return useQuery({ queryKey: ['driver', 'vehicle'], queryFn: () => vehiclesApi.getMine() })
}

export function useUpsertVehicle() {
  return useMutation({
    mutationFn: (payload: vehiclesApi.VehiclePayload) => vehiclesApi.upsert(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['driver', 'vehicle'] }),
  })
}

export function useChangePin() {
  return useMutation({ mutationFn: (p: { currentPin: string; newPin: string }) => usersApi.changePin(p) })
}

export function useUpdateDriverStatus() {
  const setUser = useAuthStore((s) => s.setUser)
  return useMutation({
    mutationFn: (status: 'available' | 'busy' | 'offline') => usersApi.updateDriverStatus(status),
    onSuccess: (user) => setUser(user),
  })
}

export function useUpdateDriverProfile() {
  const setUser = useAuthStore((s) => s.setUser)
  return useMutation({
    mutationFn: (payload: usersApi.ProfilePayload) => usersApi.updateProfile('driver', payload),
    onSuccess: (user) => {
      setUser(user)
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })
}

export function useDriverParcels(params: ListParams = {}) {
  return useQuery({ queryKey: ['driver', 'parcels', params], queryFn: () => roles.driverParcels(params) })
}

export function useDriverFreeParcels(params: ListParams = {}) {
  return useQuery({ queryKey: ['parcels', 'free', params], queryFn: () => parcelsApi.listFree(params) })
}

export function useDriverBidsSent() {
  return useQuery({
    queryKey: ['driver', 'bids', 'sent'],
    queryFn: () => roles.driverBidsSent(),
    refetchInterval: 15_000,
  })
}

export function useCreateBid() {
  return useMutation({
    mutationFn: (payload: bidsApi.CreateBidPayload) => bidsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parcels', 'free'] })
      queryClient.invalidateQueries({ queryKey: ['driver', 'bids'] })
    },
  })
}

export function useRespondToBid() {
  return useMutation({
    mutationFn: ({ bidId, action, price, message }: { bidId: string; action: 'accept' | 'counter'; price?: number; message?: string }) =>
      bidsApi.driverRespond(bidId, { action, price, message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parcels', 'free'] })
      queryClient.invalidateQueries({ queryKey: ['driver', 'bids'] })
      queryClient.invalidateQueries({ queryKey: ['driver', 'parcels'] })
    },
  })
}

export function useAdvanceParcel() {
  return useMutation({
    mutationFn: ({ parcelId, step }: { parcelId: string; step: roles.DriverStep }) => roles.driverAdvance(parcelId, step),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['driver', 'parcels'] }),
  })
}

export function useDeliverParcel() {
  return useMutation({
    mutationFn: ({ parcelId, ...payload }: { parcelId: string } & roles.DeliverPayload) =>
      roles.driverDeliver(parcelId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['driver', 'parcels'] }),
  })
}
