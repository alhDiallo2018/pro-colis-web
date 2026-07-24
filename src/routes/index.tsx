import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RequireAuth, RequireRole } from './guards'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { LandingPage } from '@/features/marketing/LandingPage'
import { AProposPage } from '@/features/marketing/AProposPage'
import { ContactPage } from '@/features/marketing/ContactPage'
import { MentionsLegalesPage } from '@/features/marketing/MentionsLegalesPage'
import { ConfidentialitePage } from '@/features/marketing/ConfidentialitePage'
import { CGUPage } from '@/features/marketing/CGUPage'
import { ConditionsTransportPage } from '@/features/marketing/ConditionsTransportPage'
import { PaiementPage } from '@/features/marketing/PaiementPage'
import { RemboursementPage } from '@/features/marketing/RemboursementPage'
import { ReclamationsPage } from '@/features/marketing/ReclamationsPage'
import { ColisInterditsPage } from '@/features/marketing/ColisInterditsPage'
import { HelpScreen } from '@/features/shared/HelpScreen'
import { PaymentStatusPage } from '@/features/shared/PaymentStatusPage'
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
import { TripDetailScreen } from '@/features/client/TripDetailScreen'
import { ConfirmDeliveryScreen } from '@/features/shared/ConfirmDeliveryScreen'
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
import { VehicleDocumentsScreen } from '@/features/driver/VehicleDocumentsScreen'
import { ItineraireScreen } from '@/features/driver/ItineraireScreen'
import { MessagesScreen } from '@/features/shared/MessagesScreen'
import { SupportChatScreen } from '@/features/shared/SupportChatScreen'
import { SupportChatWrapper } from '@/features/shared/SupportChatWrapper'
import { AdminSupportScreen } from '@/features/shared/AdminSupportScreen'
import { SupportAdminRedirect } from './SupportRedirect'
import { AvailabilityToggle } from '@/features/driver/AvailabilityToggle'
import { SuperAdminDashboard } from '@/features/superAdmin/SuperAdminDashboard'
import { ColisPage } from '@/features/superAdmin/ColisPage'
import { ChauffeursPage } from '@/features/superAdmin/ChauffeursPage'
import { UtilisateursPage } from '@/features/superAdmin/UtilisateursPage'
import { GaragesPage } from '@/features/superAdmin/GaragesPage'
import { ZonesPage } from '@/features/superAdmin/ZonesPage'
import { StatistiquesPage } from '@/features/superAdmin/StatistiquesPage'
import { ConfigConsommationPage } from '@/features/superAdmin/ConfigConsommationPage'
import { FinanceDashboardPage } from '@/features/superAdmin/FinanceDashboardPage'
import { WalletsPage } from '@/features/superAdmin/WalletsPage'
import { PaymentsPage } from '@/features/superAdmin/PaymentsPage'
import { PaymentNotificationsPage } from '@/features/superAdmin/PaymentNotificationsPage'
import { ReputationDashboardPage } from '@/features/superAdmin/ReputationDashboardPage'
import { ScoresPage } from '@/features/superAdmin/ScoresPage'
import { ClassementPage } from '@/features/superAdmin/ClassementPage'
import { DriverDetailPage } from '@/features/superAdmin/DriverDetailPage'
import { BrevoConfigScreen } from '@/features/superAdmin/BrevoConfigScreen'
import { PaydunyaConfigScreen } from '@/features/superAdmin/PaydunyaConfigScreen'
import BroadcastsPage from '@/features/superAdmin/BroadcastsPage'
import { BroadcastBanner } from '@/components/BroadcastBanner'
import { WalletDetailPage } from '@/features/superAdmin/WalletDetailPage'
import { ScoreDetailPage } from '@/features/superAdmin/ScoreDetailPage'
import { WithdrawalsPage } from '@/features/superAdmin/WithdrawalsPage'
import { AssistancesPage } from '@/features/superAdmin/AssistancesPage'
import { ExpensesPage } from '@/features/superAdmin/ExpensesPage'
import { IdentityVerificationsPage } from '@/features/superAdmin/IdentityVerificationsPage'
import { GarageDriversPage } from '@/features/superAdmin/GarageDriversPage'
import { NotificationsScreen } from '@/features/shared/NotificationsScreen'
import { GarageDashboard } from '@/features/garageAdmin/GarageDashboard'
import { GarageColisPage } from '@/features/garageAdmin/GarageColisPage'
import { GarageChauffeursPage } from '@/features/garageAdmin/GarageChauffeursPage'
import { GarageAssignationsPage } from '@/features/garageAdmin/GarageAssignationsPage'
import { GarageRapportsPage } from '@/features/garageAdmin/GarageRapportsPage'
import { GarageParcelDetailPage } from '@/features/garageAdmin/GarageParcelDetailPage'

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
      { label: 'Documents', icon: 'description', to: '/driver/documents' },
      { label: 'Itinéraire', icon: 'map', to: '/driver/itinerary' },
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
      { label: 'Support', icon: 'support_agent', to: '/garage/support' },
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
      { label: 'Retraits', icon: 'money', to: '/admin/finance/withdrawals' },
      { label: 'Configuration', icon: 'settings', to: '/admin/finance/configuration' },
      { label: 'Paiements', icon: 'payments', to: '/admin/finance/payments' },
      { label: 'Notifications paiement', icon: 'notifications_active', to: '/admin/finance/payments-notifications' },
      { label: 'Dépenses', icon: 'receipt_long', to: '/admin/finance/expenses' },
      { label: 'Configuration PayDunya', icon: 'credit_card', to: '/admin/paydunya' },
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
      { label: 'Zones (garages)', icon: 'garage', to: '/admin/garages' },
      { label: 'Zones géographiques', icon: 'map', to: '/admin/zones' },
      { label: 'Support', icon: 'support_agent', to: '/admin/support' },
      { label: 'Assistances', icon: 'contact_support', to: '/admin/assistances' },
      { label: 'Vérifications identité', icon: 'verified_user', to: '/admin/verifications' },
      { label: 'Statistiques', icon: 'monitoring', to: '/admin/stats' },
      { label: 'Notifications Brevo', icon: 'mail', to: '/admin/notifications-brevo' },
      { label: 'Bandeaux', icon: 'campaign', to: '/admin/broadcasts' },
    ],
  },
]

const SUPPORT_NAV: NavSection[] = [
  {
    items: [
      { label: 'Tableau de bord', icon: 'dashboard', to: '/support-admin', end: true },
      { label: 'Support', icon: 'support_agent', to: '/support-admin/conversations' },
      { label: 'Colis', icon: 'package_2', to: '/support-admin/colis' },
      { label: 'Chauffeurs', icon: 'local_shipping', to: '/support-admin/chauffeurs' },
      { label: 'Utilisateurs', icon: 'group', to: '/support-admin/users' },
    ],
  },
]

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/help', element: <HelpScreen /> },
  {
    path: '/support',
    element: (
      <RequireAuth>
        <SupportChatWrapper />
      </RequireAuth>
    ),
  },
  { path: '/track', element: <SuiviScreen /> },
  { path: '/track/:trackingNumber', element: <SuiviScreen /> },
  { path: '/payment-status', element: <PaymentStatusPage /> },
  { path: '/payment-status.php', element: <PaymentStatusPage /> },
  { path: '/a-propos', element: <AProposPage /> },
  { path: '/contact', element: <ContactPage /> },
  { path: '/mentions-legales', element: <MentionsLegalesPage /> },
  { path: '/confidentialite', element: <ConfidentialitePage /> },
  { path: '/cgu', element: <CGUPage /> },
  { path: '/conditions-transport', element: <ConditionsTransportPage /> },
  { path: '/paiement', element: <PaiementPage /> },
  { path: '/remboursement', element: <RemboursementPage /> },
  { path: '/reclamations', element: <ReclamationsPage /> },
  { path: '/colis-interdits', element: <ColisInterditsPage /> },

  // Client
  {
    path: '/client',
    element: (
      <RequireRole roles={['client']}>
        <DashboardLayout
          nav={CLIENT_NAV}
          roleLabel="Client"
          greetOnIndex
          banner={<BroadcastBanner />}
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
      { path: 'trip/:advertisementId', element: <TripDetailScreen /> },
      { path: 'colis/:parcelId/confirm', element: <ConfirmDeliveryScreen /> },
      { path: 'suivi', element: <SuiviScreen /> },
      { path: 'messages', element: <MessagesScreen /> },
      { path: 'profil', element: <ProfilScreen /> },
      { path: 'notifications', element: <NotificationsScreen /> },
    ],
  },
  {
    path: '/driver',
    element: (
      <RequireRole roles={['driver']}>
        <DashboardLayout
          nav={DRIVER_NAV}
          roleLabel="Chauffeur"
          greetOnIndex
          banner={<BroadcastBanner />}
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
      { path: 'notifications', element: <NotificationsScreen /> },
      { path: 'documents', element: <VehicleDocumentsScreen /> },
      { path: 'itinerary', element: <ItineraireScreen /> },
      { path: 'parcels/:parcelId/confirm', element: <ConfirmDeliveryScreen /> },
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
          banner={<BroadcastBanner />}
          actions={<NotifButton />}
        />
      </RequireRole>
    ),
    children: [
      { index: true, element: <GarageDashboard /> },
      { path: 'colis', element: <GarageColisPage /> },
      { path: 'colis/:parcelId', element: <GarageParcelDetailPage /> },
      { path: 'chauffeurs', element: <GarageChauffeursPage /> },
      { path: 'assignations', element: <GarageAssignationsPage /> },
      { path: 'rapports', element: <GarageRapportsPage /> },
      { path: 'support', element: <AdminSupportScreen /> },
      { path: 'notifications', element: <NotificationsScreen /> },
    ],
  },

  // Super admin
  {
    path: '/admin',
    element: (
      <RequireRole roles={['super_admin']}>
        <SupportAdminRedirect>
          <DashboardLayout
            nav={SUPER_NAV}
            roleLabel="Super Admin"
            banner={<BroadcastBanner />}
            actions={
              <>
                <NotifButton />
                <NavButton to="/admin/garages?new=1" icon="add">
                   Nouvelle zone
                </NavButton>
              </>
            }
          />
        </SupportAdminRedirect>
      </RequireRole>
    ),
    children: [
      { index: true, element: <SuperAdminDashboard /> },
      { path: 'colis', element: <ColisPage /> },
      { path: 'chauffeurs', element: <ChauffeursPage /> },
      { path: 'users', element: <UtilisateursPage /> },
      { path: 'garages', element: <GaragesPage /> },
      { path: 'zones', element: <ZonesPage /> },
      { path: 'stats', element: <StatistiquesPage /> },
      { path: 'parametres', element: <Navigate to="/admin/finance/configuration" replace /> },
      { path: 'finance', element: <FinanceDashboardPage /> },
      { path: 'finance/wallets', element: <WalletsPage /> },
      { path: 'finance/wallets/:userId', element: <WalletDetailPage /> },
      { path: 'finance/commissions', element: <Navigate to="/admin/finance/configuration" replace /> },
      { path: 'finance/configuration', element: <ConfigConsommationPage /> },
      { path: 'finance/payments', element: <PaymentsPage /> },
      { path: 'finance/payments-notifications', element: <PaymentNotificationsPage /> },
      { path: 'finance/withdrawals', element: <WithdrawalsPage /> },
      { path: 'finance/expenses', element: <ExpensesPage /> },
      { path: 'assistances', element: <AssistancesPage /> },
      { path: 'verifications', element: <IdentityVerificationsPage /> },
      { path: 'reputation', element: <ReputationDashboardPage /> },
      { path: 'reputation/scores', element: <ScoresPage /> },
      { path: 'reputation/scores/:userId', element: <ScoreDetailPage /> },
      { path: 'reputation/classement', element: <ClassementPage /> },
      { path: 'notifications-brevo', element: <BrevoConfigScreen /> },
      { path: 'paydunya', element: <PaydunyaConfigScreen /> },
      { path: 'broadcasts', element: <BroadcastsPage /> },
      { path: 'chauffeurs/:userId', element: <DriverDetailPage /> },
      { path: 'garages/:garageId/drivers', element: <GarageDriversPage /> },
      { path: 'support', element: <AdminSupportScreen /> },
      { path: 'notifications', element: <NotificationsScreen /> },
    ],
  },

  // Support admin (super_admin or support role with limited UI)
  {
    path: '/support-admin',
    element: (
      <RequireRole roles={['super_admin', 'support']}>
        <DashboardLayout
          nav={SUPPORT_NAV}
          roleLabel="Support"
          banner={<BroadcastBanner />}
          actions={<NotifButton />}
        />
      </RequireRole>
    ),
    children: [
      { index: true, element: <AdminSupportScreen /> },
      { path: 'conversations', element: <AdminSupportScreen /> },
      { path: 'colis', element: <ColisPage /> },
      { path: 'chauffeurs', element: <ChauffeursPage /> },
      { path: 'users', element: <UtilisateursPage /> },
      { path: 'notifications', element: <NotificationsScreen /> },
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
