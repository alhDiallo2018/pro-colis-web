import { useMutation, useQuery } from '@tanstack/react-query'
import * as usersApi from '@/lib/api/users'
import * as statsApi from '@/lib/api/stats'
import * as addressesApi from '@/lib/api/addresses'
import * as identityApi from '@/lib/api/identity'
import * as notificationsApi from '@/lib/api/notifications'
import { useAuthStore } from '@/store/auth'
import { queryClient } from '@/lib/queryClient'

/** Met à jour le profil du rôle courant et rafraîchit la session. */
export function useUpdateMyProfile() {
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

export function useChangeMyPin() {
  return useMutation({
    mutationFn: (payload: { currentPin: string; newPin: string }) => usersApi.changePin(payload),
  })
}

/** Compteurs personnels (colis, offres, points, notifications non lues). */
export function useMyStats() {
  return useQuery({ queryKey: ['me', 'stats'], queryFn: () => statsApi.userStats(), staleTime: 30_000 })
}

export function useMyBidStats(enabled = true) {
  return useQuery({ queryKey: ['me', 'bid-stats'], queryFn: () => statsApi.clientBidStats(), enabled, staleTime: 30_000 })
}

export function useMyDriverStats(enabled = true) {
  return useQuery({ queryKey: ['me', 'driver-stats'], queryFn: () => statsApi.driverStats(), enabled, staleTime: 30_000 })
}

export function useMyGarageStats(enabled = true) {
  return useQuery({ queryKey: ['me', 'garage-stats'], queryFn: () => statsApi.garageStats(), enabled, staleTime: 30_000 })
}

export function usePlatformStats(enabled = true) {
  return useQuery({ queryKey: ['admin', 'global-stats'], queryFn: () => statsApi.globalStats(), enabled, staleTime: 30_000 })
}

export function useMyAdvertisementStats(enabled = true) {
  return useQuery({ queryKey: ['me', 'ad-stats'], queryFn: () => statsApi.advertisementStats(), enabled, staleTime: 30_000 })
}

/** Statut KYC de l'utilisateur connecté. */
export function useMyIdentityStatus(enabled = true) {
  return useQuery({
    queryKey: ['me', 'identity'],
    queryFn: () => identityApi.myIdentityStatus(),
    enabled,
    retry: false,
    staleTime: 60_000,
  })
}

export function useUnreadNotificationsCount() {
  return useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationsApi.unreadCount(),
    staleTime: 30_000,
  })
}

/* ---------------------------------------------------------------- adresses */

export function useMyAddresses() {
  return useQuery({ queryKey: ['me', 'addresses'], queryFn: () => addressesApi.listAddresses(), retry: false })
}

function invalidateAddresses() {
  queryClient.invalidateQueries({ queryKey: ['me', 'addresses'] })
}

export function useCreateAddress() {
  return useMutation({
    mutationFn: (payload: addressesApi.AddressPayload) => addressesApi.createAddress(payload),
    onSuccess: invalidateAddresses,
  })
}

export function useDeleteAddress() {
  return useMutation({ mutationFn: (id: string) => addressesApi.deleteAddress(id), onSuccess: invalidateAddresses })
}

export function useSetDefaultAddress() {
  return useMutation({ mutationFn: (id: string) => addressesApi.setDefaultAddress(id), onSuccess: invalidateAddresses })
}

/* ------------------------------------------------------------ zones favorites */

export function useFavoriteZones() {
  return useQuery({ queryKey: ['me', 'favorite-zones'], queryFn: () => addressesApi.favoriteZones(), retry: false })
}

export function useRemoveFavoriteZone() {
  return useMutation({
    mutationFn: (zoneId: string) => addressesApi.removeFavoriteZone(zoneId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me', 'favorite-zones'] }),
  })
}
