import { useMutation, useQuery } from '@tanstack/react-query'
import * as roles from '@/lib/api/roles'
import type { ListParams } from '@/lib/api/types'
import * as adminFinance from '@/lib/api/admin-finance'
import * as adminReputation from '@/lib/api/admin-reputation'
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
    mutationFn: (payload: { amount: number; description: string }) => adminReputation.addPoints(userId, payload),
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
