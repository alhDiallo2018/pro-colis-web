// Précache des écrans d'un rôle après connexion.
//
// Le Service Worker intercepte déjà toute requête `/assets/*-hash.{js,css}` et
// la stocke dans le cache de version. En déclenchant les `import()` dynamiques
// des écrans d'un rôle dès que l'utilisateur ouvre sa session, on garantit que
// toute navigation ultérieure fonctionne hors connexion — pas seulement les
// pages déjà visitées.
//
// Chaque entrée reproduit exactement un `lazy(() => import(...))` de
// `routes/screens.tsx`. L'intention est de rester un miroir : si une entrée
// disparaît côté routes, elle peut disparaître ici sans impact (on perd juste
// un écran précaché).

type UserRole =
  | 'client'
  | 'driver'
  | 'admin'
  | 'super_admin'
  | 'support'
  | 'support_technique'
  | 'support_commercial'
  | 'shuttle_operator'

const PRELOADS: Partial<Record<UserRole, Array<() => Promise<unknown>>>> = {
  client: [
    () => import('@/features/client/ClientDashboard'),
    () => import('@/features/client/MesColisScreen'),
    () => import('@/features/client/ParcelDetailScreen'),
    () => import('@/features/client/NewParcelScreen'),
    () => import('@/features/client/OffresRecuesScreen'),
    () => import('@/features/client/ClientAnnoncesScreen'),
    () => import('@/features/client/SuiviScreen'),
    () => import('@/features/client/ClientWalletScreen'),
    () => import('@/features/client/ClientDebtsScreen'),
    () => import('@/features/experience/WorkspaceScreen'),
    () => import('@/features/shared/MessagesScreen'),
    () => import('@/features/pwa/OfflineHistory'),
  ],
  driver: [
    () => import('@/features/driver/DriverDashboard'),
    () => import('@/features/driver/LibreServiceScreen'),
    () => import('@/features/driver/MissionsScreen'),
    () => import('@/features/driver/MesAnnoncesScreen'),
    () => import('@/features/driver/HandoverConfirmScreen'),
    () => import('@/features/driver/RevenusScreen'),
    () => import('@/features/driver/HistoriqueScreen'),
    () => import('@/features/driver/ItineraireScreen'),
    () => import('@/features/driver/AdvertisementManifestScreen'),
    () => import('@/features/driver/AdvertisementReachedStopsScreen'),
    () => import('@/features/driver/VehicleDocumentsScreen'),
    () => import('@/features/shared/MessagesScreen'),
    () => import('@/features/pwa/OfflineHistory'),
  ],
  admin: [
    () => import('@/features/garageAdmin/GarageDashboard'),
    () => import('@/features/garageAdmin/GarageColisPage'),
    () => import('@/features/garageAdmin/GarageChauffeursPage'),
    () => import('@/features/garageAdmin/GarageAssignationsPage'),
    () => import('@/features/garageAdmin/GarageRapportsPage'),
  ],
  super_admin: [
    () => import('@/features/superAdmin/SuperAdminDashboard'),
    () => import('@/features/superAdmin/ColisPage'),
    () => import('@/features/superAdmin/ChauffeursPage'),
    () => import('@/features/superAdmin/UtilisateursPage'),
    () => import('@/features/superAdmin/ZonesPage'),
    () => import('@/features/superAdmin/FinanceDashboardPage'),
    () => import('@/features/superAdmin/PilotMetricsPage'),
    () => import('@/features/superAdmin/OperationsHubPage'),
    () => import('@/features/superAdmin/SystemePage'),
  ],
  support: [
    () => import('@/features/shared/SupportDashboard'),
    () => import('@/features/shared/SupportConversationsScreen'),
    () => import('@/features/shared/AdminSupportScreen'),
  ],
  support_technique: [
    () => import('@/features/shared/SupportDashboard'),
    () => import('@/features/shared/SupportConversationsScreen'),
    () => import('@/features/shared/supportRoles/TicketsScreen'),
    () => import('@/features/shared/observability/LogsScreen'),
    () => import('@/features/shared/observability/IncidentsScreen'),
    () => import('@/features/experience/QualityScreen'),
  ],
  support_commercial: [
    () => import('@/features/shared/SupportDashboard'),
    () => import('@/features/shared/SupportConversationsScreen'),
    () => import('@/features/shared/supportRoles/LeadsScreen'),
    () => import('@/features/shared/supportRoles/CoverageScreen'),
  ],
}

let lastPrecachedFor: string | null = null

/**
 * Déclenche en arrière-plan les imports dynamiques des écrans d'un rôle. Les
 * erreurs sont silencieuses : un échec de précache ne doit jamais interrompre
 * l'UX principale, l'écran sera simplement téléchargé à la première visite.
 * Mémorise la dernière clé (role+sessionId) pour éviter les re-précache après
 * un simple refetch du profil.
 */
export function precacheByRole(role: string | null | undefined, sessionId: string | null | undefined): void {
  if (!role || !sessionId) return
  const key = `${role}:${sessionId}`
  if (key === lastPrecachedFor) return
  const loaders = PRELOADS[role as UserRole]
  if (!loaders || loaders.length === 0) return
  lastPrecachedFor = key

  const runWhenIdle = (cb: () => void) => {
    const win = window as Window & { requestIdleCallback?: (fn: () => void, opts?: { timeout: number }) => number }
    if (typeof win.requestIdleCallback === 'function') {
      win.requestIdleCallback(cb, { timeout: 2000 })
    } else {
      setTimeout(cb, 500)
    }
  }

  runWhenIdle(() => {
    for (const load of loaders) {
      load().catch(() => {
        // Silencieux : l'écran sera chargé normalement à la navigation.
      })
    }
  })
}

/** Réinitialise la mémoire — utilisée par les tests. */
export function resetPrecacheMemory(): void {
  lastPrecachedFor = null
}
