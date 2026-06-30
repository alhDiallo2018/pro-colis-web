import { useMutation, useQuery } from '@tanstack/react-query'
import * as roles from '@/lib/api/roles'
import type { ListParams } from '@/lib/api/types'
import { queryClient } from '@/lib/queryClient'

export function useGarageParcels(params: ListParams = {}) {
  return useQuery({ queryKey: ['garage', 'parcels', params], queryFn: () => roles.garageParcels(params) })
}

export function useGarageDrivers() {
  return useQuery({ queryKey: ['garage', 'drivers'], queryFn: () => roles.garageDrivers() })
}

export function useAssignDriver() {
  return useMutation({
    mutationFn: ({ parcelId, driverId }: { parcelId: string; driverId: string }) => roles.garageAssignDriver(parcelId, driverId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['garage', 'parcels'] }),
  })
}
