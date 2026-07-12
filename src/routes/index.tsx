import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RequireAuth, RequireRole } from './guards'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { LandingPage } from '@/features/marketing/LandingPage'
import { DashboardLayout, type NavSection } from '@/layouts/DashboardLayout'
import { NavButton, NotifButton } from '@/components/actions'

import { ClientDashboard } from '@/features/client/ClientDashboard'
import { MesColisScreen } from '@/features/client/MesColisScreen'
import { ParcelDetailScreen } from '@/features/client/ParcelDetailScreen'
import { NewParcelScreen } from '@/features/client/NewParcelScreen'
import { OffresRecuesScreen } from '@/features/client/OffresRecuesScreen'
import { ClientAnnoncesScreen } from '@/features/client/ClientAnnoncesScreen'
import { AnnonceDetailScreen } from '@/features/client/AnnonceDetailScreen'
import { SuiviScreen } from '@/features/client/SuiviScreen'
import { ProfilScreen } from '@/features/client/ProfilScreen'
import { DriverDashboard } from '@/features/driver/DriverDashboard'
import { LibreServiceScreen } from '@/features/driver/LibreServiceScreen'
import { MissionsScreen } from '@/features/driver/MissionsScreen'
import { RevenusScreen } from '@/features/driver/RevenusScreen'
import { HistoriqueScreen } from '@/features/driver/HistoriqueScreen'
import { MonGarageScreen } from '@/features/driver/MonGarageScreen'
import { DriverProfilScreen } from '@/features/driver/DriverProfilScreen'
import { DriverParametresScreen } from '@/features/driver/DriverParametresScreen'
import { DriverPointsScreen } from '@/features/driver/PointsScreen'
import { MesAnnoncesScreen } from '@/features/driver/MesAnnoncesScreen'
import { MessagesScreen } from '@/features/shared/MessagesScreen'
import { AvailabilityToggle } from '@/features/driver/AvailabilityToggle'
import { SuperAdminDashboard } from '@/features/superAdmin/SuperAdminDashboard'
import { ColisPage } from '@/features/superAdmin/ColisPage'
import { ChauffeursPage } from '@/features/superAdmin/ChauffeursPage'
import { UtilisateursPage } from '@/features/superAdmin/UtilisateursPage'
import { GaragesPage } from '@/features/superAdmin/GaragesPage'
import { StatistiquesPage } from '@/features/superAdmin/StatistiquesPage'
import { ConfigConsommationPage } from '@/features/superAdmin/ConfigConsommationPage'
import { FinanceDashboardPage } from '@/features/superAdmin/FinanceDashboardPage'
import { WalletsPage } from '@/features/superAdmin/WalletsPage'
import { PaymentsPage } from '@/features/superAdmin/PaymentsPage'
import { ReputationDashboardPage } from '@/features/superAdmin/ReputationDashboardPage'
import { ScoresPage } from '@/features/superAdmin/ScoresPage'
import { ClassementPage } from '@/features/superAdmin/ClassementPage'
import { DriverDetailPage } from '@/features/superAdmin/DriverDetailPage'
import { GarageDashboard } from '@/features/garageAdmin/GarageDashboard'
import { GarageColisPage } from '@/features/garageAdmin/GarageColisPage'
import { GarageChauffeursPage } from '@/features/garageAdmin/GarageChauffeursPage'
import { GarageAssignationsPage } from '@/features/garageAdmin/GarageAssignationsPage'
import { GarageRapportsPage } from '@/features/garageAdmin/GarageRapportsPage'

const CLIENT_NAV: NavSection[] = [
  {
    items: [
      { label: 'Tableau de bord', icon: 'dashboard', to: '/client', end: true },
      { label: 'Mes Annonces', icon: 'package_2', to: '/client/colis' },
      { label: 'Annonces chauffeurs', icon: 'campaign', to: '/client/annonces' },
      { label: 'Suivi', icon: 'qr_code_2', to: '/client/suivi' },
      { label: 'Messages', icon: 'forum', to: '/client/messages' },
      { label: 'Profil', icon: 'person', to: '/client/profil' },
    ],
  },
]

const DRIVER_NAV: NavSection[] = [
  {
    items: [
      { label: 'Tableau de bord', icon: 'dashboard', to: '/driver', end: true },
      { label: 'Annonces', icon: 'sell', to: '/driver/libre' },
      { label: 'Mes annonces', icon: 'campaign', to: '/driver/annonces' },
      { label: 'Mes missions', icon: 'local_shipping', to: '/driver/missions' },
      { label: 'Revenus', icon: 'payments', to: '/driver/revenus' },
      { label: 'Points & paiements', icon: 'account_balance_wallet', to: '/driver/points' },
      { label: 'Messages', icon: 'forum', to: '/driver/messages' },
      { label: 'Historique', icon: 'history', to: '/driver/historique' },
      { label: 'Ma zone', icon: 'garage', to: '/driver/garage' },
      { label: 'Profil', icon: 'person', to: '/driver/profil' },
      { label: 'Paramètres', icon: 'settings', to: '/driver/parametres' },
    ],
  },
]

const GARAGE_NAV: NavSection[] = [
  {
    items: [
      { label: 'Tableau de bord', icon: 'dashboard', to: '/garage', end: true },
      { label: 'Colis', icon: 'package_2', to: '/garage/colis' },
      { label: 'Chauffeurs', icon: 'local_shipping', to: '/garage/chauffeurs' },
      { label: 'Assignations', icon: 'assignment_ind', to: '/garage/assignations' },
      { label: 'Rapports', icon: 'monitoring', to: '/garage/rapports' },
    ],
  },
]

const SUPER_NAV: NavSection[] = [
  {
    heading: 'Pilotage',
    items: [
      { label: 'Tableau de bord', icon: 'dashboard', to: '/admin', end: true },
      { label: 'Colis', icon: 'package_2', to: '/admin/colis' },
      { label: 'Chauffeurs', icon: 'local_shipping', to: '/admin/chauffeurs' },
      { label: 'Utilisateurs', icon: 'group', to: '/admin/users' },
    ],
  },
  {
    heading: 'Finance',
    items: [
      { label: 'Dashboard Finance', icon: 'monitoring', to: '/admin/finance' },
      { label: 'Wallets', icon: 'account_balance_wallet', to: '/admin/finance/wallets' },
      { label: 'Configuration', icon: 'settings', to: '/admin/finance/configuration' },
      { label: 'Paiements', icon: 'payments', to: '/admin/finance/payments' },
    ],
  },
  {
    heading: 'Réputation',
    items: [
      { label: 'Dashboard Réputation', icon: 'trending_up', to: '/admin/reputation' },
      { label: 'Scores', icon: 'stars', to: '/admin/reputation/scores' },
      { label: 'Classement', icon: 'leaderboard', to: '/admin/reputation/classement' },
    ],
  },
  {
    heading: 'Gestion',
    items: [
      { label: 'Zones', icon: 'garage', to: '/admin/garages' },
      { label: 'Statistiques', icon: 'monitoring', to: '/admin/stats' },
    ],
  },
]

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },

  // Client
  {
    path: '/client',
    element: (
      <RequireRole roles={['client']}>
        <DashboardLayout
          nav={CLIENT_NAV}
          roleLabel="Client"
          greetOnIndex
          searchPlaceholder="Rechercher un colis, un suivi…"
          actions={
            <>
              <NotifButton />
              <NavButton to="/client/nouveau" icon="add">
                Nouveau colis
              </NavButton>
            </>
          }
        />
      </RequireRole>
    ),
    children: [
      { index: true, element: <ClientDashboard /> },
      { path: 'colis', element: <MesColisScreen /> },
      { path: 'colis/:parcelId', element: <ParcelDetailScreen /> },
      { path: 'nouveau', element: <NewParcelScreen /> },
      { path: 'offres', element: <OffresRecuesScreen /> },
      { path: 'annonces', element: <ClientAnnoncesScreen /> },
      { path: 'annonces/:advertisementId', element: <AnnonceDetailScreen /> },
      { path: 'suivi', element: <SuiviScreen /> },
      { path: 'messages', element: <MessagesScreen /> },
      { path: 'profil', element: <ProfilScreen /> },
    ],
  },

  // Chauffeur
  {
    path: '/driver',
    element: (
      <RequireRole roles={['driver']}>
        <DashboardLayout
          nav={DRIVER_NAV}
          roleLabel="Chauffeur"
          greetOnIndex
          actions={
            <>
              <AvailabilityToggle />
              <NotifButton />
            </>
          }
        />
      </RequireRole>
    ),
    children: [
      { index: true, element: <DriverDashboard /> },
      { path: 'libre', element: <LibreServiceScreen /> },
      { path: 'annonces', element: <MesAnnoncesScreen /> },
      { path: 'missions', element: <MissionsScreen /> },
      { path: 'revenus', element: <RevenusScreen /> },
      { path: 'points', element: <DriverPointsScreen /> },
      { path: 'messages', element: <MessagesScreen /> },
      { path: 'historique', element: <HistoriqueScreen /> },
      { path: 'garage', element: <MonGarageScreen /> },
      { path: 'profil', element: <DriverProfilScreen /> },
      { path: 'parametres', element: <DriverParametresScreen /> },
    ],
  },

  // Admin garage
  {
    path: '/garage',
    element: (
      <RequireRole roles={['admin']}>
        <DashboardLayout
          nav={GARAGE_NAV}
           roleLabel="Admin zone"
          searchPlaceholder="Rechercher un colis, un chauffeur…"
          actions={<NotifButton />}
        />
      </RequireRole>
    ),
    children: [
      { index: true, element: <GarageDashboard /> },
      { path: 'colis', element: <GarageColisPage /> },
      { path: 'chauffeurs', element: <GarageChauffeursPage /> },
      { path: 'assignations', element: <GarageAssignationsPage /> },
      { path: 'rapports', element: <GarageRapportsPage /> },
    ],
  },

  // Super admin
  {
    path: '/admin',
    element: (
      <RequireRole roles={['super_admin']}>
        <DashboardLayout
          nav={SUPER_NAV}
          roleLabel="Super Admin"
           searchPlaceholder="Rechercher un colis, un chauffeur, une zone…"
          actions={
            <>
              <NotifButton />
              <NavButton to="/admin/garages" icon="add">
                 Nouvelle zone
              </NavButton>
            </>
          }
        />
      </RequireRole>
    ),
    children: [
      { index: true, element: <SuperAdminDashboard /> },
      { path: 'colis', element: <ColisPage /> },
      { path: 'chauffeurs', element: <ChauffeursPage /> },
      { path: 'users', element: <UtilisateursPage /> },
      { path: 'garages', element: <GaragesPage /> },
      { path: 'stats', element: <StatistiquesPage /> },
      { path: 'parametres', element: <Navigate to="/admin/finance/configuration" replace /> },
      { path: 'finance', element: <FinanceDashboardPage /> },
      { path: 'finance/wallets', element: <WalletsPage /> },
      { path: 'finance/commissions', element: <Navigate to="/admin/finance/configuration" replace /> },
      { path: 'finance/configuration', element: <ConfigConsommationPage /> },
      { path: 'finance/payments', element: <PaymentsPage /> },
      { path: 'reputation', element: <ReputationDashboardPage /> },
      { path: 'reputation/scores', element: <ScoresPage /> },
      { path: 'reputation/classement', element: <ClassementPage /> },
      { path: 'chauffeurs/:userId', element: <DriverDetailPage /> },
    ],
  },

  {
    path: '*',
    element: (
      <RequireAuth>
        <Navigate to="/" replace />
      </RequireAuth>
    ),
  },
])
