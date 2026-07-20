import { useMutation, useQuery } from '@tanstack/react-query'
import * as roles from '@/lib/api/roles'
import type { ListParams } from '@/lib/api/types'
import * as adminFinance from '@/lib/api/admin-finance'
import * as adminReputation from '@/lib/api/admin-reputation'
import * as garagesApi from '@/lib/api/garages'
import * as zonesApi from '@/lib/api/zones'
import * as withdrawalsApi from '@/lib/api/withdrawals'
import { queryClient } from '@/lib/queryClient'

export function useAdminParcels(params: ListParams = {}) {
  return useQuery({ queryKey: ['admin', 'parcels', params], queryFn: () => roles.adminParcels(params) })
}

export function useDeleteAdminParcel() {
  return useMutation({
    mutationFn: (parcelId: string) => roles.adminDeleteParcel(parcelId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'parcels'] }),
  })
}

export function useAdminGarages() {
  return useQuery({ queryKey: ['admin', 'garages'], queryFn: () => roles.adminGarages() })
}

function invalidateGarages() {
  queryClient.invalidateQueries({ queryKey: ['admin', 'garages'] })
  queryClient.invalidateQueries({ queryKey: ['garages', 'public'] })
}

export function useCreateGarage() {
  return useMutation({
    mutationFn: (payload: garagesApi.GaragePayload) => garagesApi.createGarage(payload),
    onSuccess: invalidateGarages,
  })
}

export function useUpdateGarage() {
  return useMutation({
    mutationFn: ({ garageId, payload }: { garageId: string; payload: Partial<garagesApi.GaragePayload> }) =>
      garagesApi.updateGarage(garageId, payload),
    onSuccess: invalidateGarages,
  })
}

export function useDeleteGarage() {
  return useMutation({
    mutationFn: (garageId: string) => garagesApi.deleteGarage(garageId),
    onSuccess: invalidateGarages,
  })
}

// --- Zones ---

function invalidateZones() {
  queryClient.invalidateQueries({ queryKey: ['admin', 'zones'] })
  queryClient.invalidateQueries({ queryKey: ['zones', 'public'] })
}

export function useAdminZones(params?: {
  page?: number; limit?: number; country?: string; city?: string;
  type?: string; isActive?: boolean; search?: string;
}) {
  return useQuery({
    queryKey: ['admin', 'zones', params],
    queryFn: () => zonesApi.listZones(params),
  })
}

export function useZone(zoneId: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'zone', zoneId],
    queryFn: () => zonesApi.getZone(zoneId!),
    enabled: !!zoneId,
  })
}

export function useCreateZone() {
  return useMutation({
    mutationFn: (payload: zonesApi.ZonePayload) => zonesApi.createZone(payload),
    onSuccess: invalidateZones,
  })
}

export function useUpdateZone() {
  return useMutation({
    mutationFn: ({ zoneId, payload }: { zoneId: string; payload: Partial<zonesApi.ZonePayload> }) =>
      zonesApi.updateZone(zoneId, payload),
    onSuccess: invalidateZones,
  })
}

export function useDeleteZone() {
  return useMutation({
    mutationFn: (zoneId: string) => zonesApi.deleteZone(zoneId),
    onSuccess: invalidateZones,
  })
}

export function useZoneDrivers(zoneId: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'zone', zoneId, 'drivers'],
    queryFn: () => zonesApi.getZoneDrivers(zoneId!),
    enabled: !!zoneId,
  })
}

export function useAssignDriverToZone() {
  return useMutation({
    mutationFn: ({ zoneId, driverId, isPrimary }: { zoneId: string; driverId: string; isPrimary?: boolean }) =>
      zonesApi.assignDriver(zoneId, driverId, isPrimary),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'zone'] })
    },
  })
}

export function useRemoveDriverFromZone() {
  return useMutation({
    mutationFn: ({ zoneId, driverId }: { zoneId: string; driverId: string }) =>
      zonesApi.removeDriver(zoneId, driverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'zone'] })
    },
  })
}

export function useMigrateGaragesToZones() {
  return useMutation({
    mutationFn: () => zonesApi.migrateGaragesToZones(),
    onSuccess: invalidateZones,
  })
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

const invalidateUsers = () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })

export function useCreateUser() {
  return useMutation({
    mutationFn: (payload: roles.AdminUserPayload) => roles.adminCreateUser(payload),
    onSuccess: invalidateUsers,
  })
}

export function useUpdateUser() {
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: Partial<roles.AdminUserPayload> }) =>
      roles.adminUpdateUser(userId, payload),
    onSuccess: invalidateUsers,
  })
}

export function useDeleteUser() {
  return useMutation({
    mutationFn: (userId: string) => roles.adminDeleteUser(userId),
    onSuccess: invalidateUsers,
  })
}

export function useResetUserPin() {
  return useMutation({ mutationFn: (userId: string) => roles.adminResetUserPin(userId) })
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

// --- Finance ---

export function useFinanceDashboard() {
  return useQuery({ queryKey: ['admin', 'finance', 'dashboard'], queryFn: () => adminFinance.financeDashboard() })
}

export function useWallets(params: ListParams = {}) {
  return useQuery({ queryKey: ['admin', 'wallets', params], queryFn: () => adminFinance.listWallets(params) })
}

export function useWallet(userId: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'wallet', userId],
    queryFn: () => adminFinance.getWallet(userId!),
    enabled: !!userId,
  })
}

export function useWalletTransactions(userId: string | undefined, params: ListParams = {}) {
  return useQuery({
    queryKey: ['admin', 'wallet', userId, 'transactions', params],
    queryFn: () => adminFinance.walletTransactions(userId!, params),
    enabled: !!userId,
  })
}

export function useRechargeWallet(userId: string) {
  return useMutation({
    mutationFn: (payload: { amount: number; type?: string; description?: string; origin?: string }) =>
      adminFinance.rechargeWallet(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallet', userId] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallets'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'finance', 'dashboard'] })
    },
  })
}

export function useDebitWallet(userId: string) {
  return useMutation({
    mutationFn: (payload: { amount: number; type?: string; description?: string; origin?: string }) =>
      adminFinance.debitWallet(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallet', userId] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallets'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'finance', 'dashboard'] })
    },
  })
}

export function useCommissionConfig() {
  return useQuery({ queryKey: ['admin', 'commissions', 'config'], queryFn: () => adminFinance.getCommissionConfig() })
}

export function useUpdateCommissionConfig() {
  return useMutation({
    mutationFn: (payload: { profile: string; percentage?: number; minAmount?: number; maxAmount?: number; isActive?: boolean }) =>
      adminFinance.updateCommissionConfig(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'commissions', 'config'] }),
  })
}

export function useSimulateCommission() {
  return useMutation({ mutationFn: (amount: number) => adminFinance.simulateCommission(amount) })
}

export function useAdminPayments(params: ListParams = {}) {
  return useQuery({ queryKey: ['admin', 'payments', params], queryFn: () => adminFinance.listPayments(params) })
}

/** Live payment feed: latest payments first, polled every 15s (notifications page). */
export function usePaymentFeed(status = '', limit = 30) {
  const params: ListParams = { page: 1, limit, sortBy: 'createdAt', sortOrder: 'desc' }
  if (status) params.status = status
  return useQuery({
    queryKey: ['admin', 'payments', 'feed', status, limit],
    queryFn: () => adminFinance.listPayments(params),
    refetchInterval: 15_000,
  })
}

// --- Reputation ---

export function useReputationDashboard() {
  return useQuery({ queryKey: ['admin', 'reputation', 'dashboard'], queryFn: () => adminReputation.reputationDashboard() })
}

export function useScores(params: ListParams = {}) {
  return useQuery({ queryKey: ['admin', 'scores', params], queryFn: () => adminReputation.listScores(params) })
}

export function useScore(userId: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'score', userId],
    queryFn: () => adminReputation.getScore(userId!),
    enabled: !!userId,
  })
}

export function useScoreHistory(userId: string | undefined, params: ListParams = {}) {
  return useQuery({
    queryKey: ['admin', 'score', userId, 'history', params],
    queryFn: () => adminReputation.scoreHistory(userId!, params),
    enabled: !!userId,
  })
}

export function useAddPoints(userId: string) {
  return useMutation({
    mutationFn: (payload: adminReputation.AddPointsPayload) => adminReputation.addPoints(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'score', userId] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'scores'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'reputation', 'dashboard'] })
    },
  })
}

export function useRemovePoints(userId: string) {
  return useMutation({
    mutationFn: (payload: { amount: number; description: string }) => adminReputation.removePoints(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'score', userId] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'scores'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'reputation', 'dashboard'] })
    },
  })
}

export function useDriverRanking() {
  return useQuery({ queryKey: ['admin', 'ranking'], queryFn: () => adminReputation.driverRanking() })
}

export function useDriverDetail(userId: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'driver', userId],
    queryFn: () => adminReputation.driverDetail(userId!),
    enabled: !!userId,
  })
}

// --- Withdrawals ---

export function useWithdrawals(params: ListParams = {}) {
  return useQuery({
    queryKey: ['admin', 'withdrawals', params],
    queryFn: () => withdrawalsApi.listWithdrawals(params),
  })
}

export function useApproveWithdrawal() {
  return useMutation({
    mutationFn: (id: string) => withdrawalsApi.approveWithdrawal(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'withdrawals'] }),
  })
}

export function useRejectWithdrawal() {
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => withdrawalsApi.rejectWithdrawal(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'withdrawals'] }),
  })
}

export function useCompleteWithdrawal() {
  return useMutation({
    mutationFn: (id: string) => withdrawalsApi.completeWithdrawal(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'withdrawals'] }),
  })
}
