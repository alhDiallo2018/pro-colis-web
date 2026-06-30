import { useMutation, useQuery } from '@tanstack/react-query'
import * as roles from '@/lib/api/roles'
import type { ListParams } from '@/lib/api/types'
import { queryClient } from '@/lib/queryClient'

export function useAdminParcels(params: ListParams = {}) {
  return useQuery({ queryKey: ['admin', 'parcels', params], queryFn: () => roles.adminParcels(params) })
}

export function useAdminGarages() {
  return useQuery({ queryKey: ['admin', 'garages'], queryFn: () => roles.adminGarages() })
}

export function useAdminDrivers() {
  return useQuery({ queryKey: ['admin', 'drivers'], queryFn: () => roles.searchDrivers() })
}

export function useAdminUsers(params: ListParams = {}) {
  return useQuery({ queryKey: ['admin', 'users', params], queryFn: () => roles.adminUsers(params) })
}

export function useUpdateUserStatus() {
  return useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: 'active' | 'suspended' }) =>
      roles.adminUpdateUserStatus(userId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}

export function useAdminStats() {
  return useQuery({ queryKey: ['admin', 'stats'], queryFn: () => roles.adminStats() })
}

export function useAdminConfig() {
  return useQuery({ queryKey: ['admin', 'config'], queryFn: () => roles.adminGetConfig() })
}

export function useUpdateConfig() {
  return useMutation({
    mutationFn: (config: Record<string, unknown>) => roles.adminUpdateConfig(config),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'config'] }),
  })
}
