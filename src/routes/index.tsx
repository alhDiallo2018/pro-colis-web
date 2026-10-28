import { QualityScreen, WorkspaceScreen, OfflineHistory, LiveJourneys, ClientDebtsScreen, DriverDebtsScreen, LoginPage, RegisterPage, ForgotPinPage, LandingPage, InstallPage, AProposPage, ContactPage, MentionsLegalesPage, ConfidentialitePage, CGUPage, ConditionsTransportPage, PaiementPage, RemboursementPage, ReclamationsPage, ColisInterditsPage, HelpScreen, PaymentStatusPage, ClientDashboard, MesColisScreen, ParcelDetailScreen, NewParcelScreen, OffresRecuesScreen, ClientAnnoncesScreen, AnnonceDetailScreen, DriverProfileScreen, SuiviScreen, ProfilScreen, TripDetailScreen, ConfirmDeliveryScreen, DriverDashboard, LibreServiceScreen, MissionsScreen, RevenusScreen, HistoriqueScreen, MonGarageScreen, DriverProfilScreen, DriverParametresScreen, DriverPointsScreen, MesAnnoncesScreen, VehicleDocumentsScreen, ItineraireScreen, MessagesScreen, AdminSupportScreen, SupportDashboard, SupportConversationsScreen, ModerationScreen, StaffProfilScreen, LogsScreen, AuditLogsScreen, IncidentsScreen, TicketsScreen, LeadsScreen, CoverageScreen, SuperAdminDashboard, ColisPage, ChauffeursPage, UtilisateursPage, ZonesPage, StatistiquesPage, RapportsPage, SystemePage, ConfigConsommationPage, FinanceDashboardPage, WalletsPage, PaymentsPage, CashDeclarationsPage, PaymentNotificationsPage, ReputationDashboardPage, ScoresPage, ClassementPage, DriverDetailPage, BrevoConfigScreen, PaydunyaConfigScreen, BroadcastsPage, WalletDetailPage, ScoreDetailPage, WithdrawalsPage, AssistancesPage, ExpensesPage, IdentityVerificationsPage, NotificationsScreen, GarageDashboard, GarageColisPage, GarageChauffeursPage, GarageAssignationsPage, GarageRapportsPage, GarageParcelDetailPage } from './screens';
import { createBrowserRouter, Navigate } from "react-router-dom";
import { RequireAuth, RequireRole } from "./guards";
import { DashboardLayout, type NavSection } from "@/layouts/DashboardLayout";
import { NavButton, NotifButton } from "@/components/actions";

import { SupportChatWrapper } from "@/features/shared/SupportChatWrapper";
import { RoleHomeRedirect } from "./RoleHomeRedirect";
import { SupportShell } from "./SupportShell";
import { AvailabilityToggle } from "@/features/driver/AvailabilityToggle";
import { ManualMessagePanel } from "@/features/superAdmin/ManualMessagePanel";
import { BroadcastBanner } from "@/components/BroadcastBanner";

const CLIENT_NAV: NavSection[] = [
  {
    heading: "Mes envois",
    items: [
      { label: "Accueil", icon: "dashboard", to: "/client", end: true },
      { label: "Mes colis", icon: "package_2", to: "/client/colis" },
      { label: "Outils d’envoi", icon: "work", to: "/client/outils" },
      { label: "Offres reçues", icon: "gavel", to: "/client/offres" },
      { label: "Suivre un colis", icon: "qr_code_2", to: "/client/suivi" },
    ],
  },
  {
    heading: "Trouver un chauffeur",
    items: [
      { label: "Véhicules en direct", icon: "map", to: "/client/vehicules" },
      {
        label: "Annonces chauffeurs",
        icon: "campaign",
        to: "/client/annonces",
      },
    ],
  },
  {
    heading: "Mon compte",
    items: [
      { label: "Messages", icon: "forum", to: "/client/messages" },
      { label: "Mes dettes", icon: "receipt_long", to: "/client/dettes" },
      {
        label: "Historique hors connexion",
        icon: "offline_pin",
        to: "/client/hors-ligne",
      },
      { label: "Profil", icon: "person", to: "/client/profil" },
    ],
  },
];

const DRIVER_NAV: NavSection[] = [
  {
    heading: "Mon activité",
    items: [
      { label: "Accueil", icon: "dashboard", to: "/driver", end: true },
      { label: "Colis à prendre", icon: "sell", to: "/driver/libre" },
      { label: "Mes missions", icon: "local_shipping", to: "/driver/missions" },
      { label: "Mes annonces", icon: "campaign", to: "/driver/annonces" },
      { label: "Itinéraire", icon: "map", to: "/driver/itinerary" },
      { label: "Messages", icon: "forum", to: "/driver/messages" },
    ],
  },
  {
    heading: "Finances et historique",
    items: [
      { label: "Revenus", icon: "payments", to: "/driver/revenus" },
      {
        label: "Points & paiements",
        icon: "account_balance_wallet",
        to: "/driver/points",
      },
      { label: "Mes dettes", icon: "receipt_long", to: "/driver/dettes" },
      { label: "Historique", icon: "history", to: "/driver/historique" },
      {
        label: "Historique hors connexion",
        icon: "offline_pin",
        to: "/driver/hors-ligne",
      },
    ],
  },
  {
    heading: "Mon compte",
    items: [
      { label: "Documents", icon: "description", to: "/driver/documents" },
      { label: "Ma zone", icon: "garage", to: "/driver/garage" },
      { label: "Profil", icon: "person", to: "/driver/profil" },
      { label: "Paramètres", icon: "settings", to: "/driver/parametres" },
    ],
  },
];

const GARAGE_NAV: NavSection[] = [
  {
    items: [
      { label: "Tableau de bord", icon: "dashboard", to: "/garage", end: true },
      { label: "Colis", icon: "package_2", to: "/garage/colis" },
      { label: "Chauffeurs", icon: "local_shipping", to: "/garage/chauffeurs" },
      {
        label: "Envoyer un message",
        icon: "mail",
        to: "/garage/envoyer-message",
      },
      {
        label: "Assignations",
        icon: "assignment_ind",
        to: "/garage/assignations",
      },
      { label: "Rapports", icon: "monitoring", to: "/garage/rapports" },
      { label: "Support", icon: "support_agent", to: "/garage/support" },
      { label: "Profil", icon: "person", to: "/garage/profil" },
    ],
  },
];

const SUPER_NAV: NavSection[] = [
  {
    heading: "Pilotage",
    items: [
      { label: "Tableau de bord", icon: "dashboard", to: "/admin", end: true },
      { label: "Colis", icon: "package_2", to: "/admin/colis" },
      { label: "Chauffeurs", icon: "local_shipping", to: "/admin/chauffeurs" },
      { label: "Utilisateurs", icon: "group", to: "/admin/users" },
      {
        label: "Envoyer un message",
        icon: "mail",
        to: "/admin/envoyer-message",
      },
    ],
  },
  {
    heading: "Finance",
    items: [
      { label: "Dashboard Finance", icon: "monitoring", to: "/admin/finance" },
      {
        label: "Wallets",
        icon: "account_balance_wallet",
        to: "/admin/finance/wallets",
      },
      { label: "Retraits", icon: "money", to: "/admin/finance/withdrawals" },
      {
        label: "Configuration",
        icon: "settings",
        to: "/admin/finance/configuration",
      },
      { label: "Paiements", icon: "payments", to: "/admin/finance/payments" },
      {
        label: "Espèces à valider",
        icon: "price_check",
        to: "/admin/finance/payments-cash",
      },
      {
        label: "Notifications paiement",
        icon: "notifications_active",
        to: "/admin/finance/payments-notifications",
      },
      {
        label: "Dépenses",
        icon: "receipt_long",
        to: "/admin/finance/expenses",
      },
      {
        label: "Configuration PayDunya",
        icon: "credit_card",
        to: "/admin/paydunya",
      },
    ],
  },
  {
    heading: "Réputation",
    items: [
      {
        label: "Dashboard Réputation",
        icon: "trending_up",
        to: "/admin/reputation",
      },
      { label: "Scores", icon: "stars", to: "/admin/reputation/scores" },
      {
        label: "Classement",
        icon: "leaderboard",
        to: "/admin/reputation/classement",
      },
    ],
  },
  {
    heading: "Gestion",
    items: [
      { label: "Zones", icon: "map", to: "/admin/zones" },
      { label: "Support", icon: "support_agent", to: "/admin/support" },
      { label: "Modération", icon: "shield", to: "/admin/moderation" },
      {
        label: "Assistances",
        icon: "contact_support",
        to: "/admin/assistances",
      },
      {
        label: "Vérifications identité",
        icon: "verified_user",
        to: "/admin/verifications",
      },
      { label: "Qualité de service", icon: "monitoring", to: "/admin/qualite" },
      { label: "Statistiques", icon: "monitoring", to: "/admin/stats" },
      { label: "Rapports", icon: "summarize", to: "/admin/rapports" },
      {
        label: "Notifications Brevo",
        icon: "mail",
        to: "/admin/notifications-brevo",
      },
      { label: "Bandeaux", icon: "campaign", to: "/admin/broadcasts" },
    ],
  },
  {
    heading: "Supervision",
    items: [
      { label: "Journaux techniques", icon: "terminal", to: "/admin/logs" },
      { label: "Incidents", icon: "bolt", to: "/admin/incidents" },
      { label: "Journal d'audit", icon: "history", to: "/admin/audit" },
      { label: "Système & webhooks", icon: "dns", to: "/admin/systeme" },
    ],
  },
  {
    heading: "Mon compte",
    items: [{ label: "Profil", icon: "person", to: "/admin/profil" }],
  },
];

export const router = createBrowserRouter([
  { path: "/installer", element: <InstallPage /> },
  { path: "/app", element: <RoleHomeRedirect /> },
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/pin-oublie", element: <ForgotPinPage /> },
  { path: "/help", element: <HelpScreen /> },
  {
    path: "/support",
    element: (
      <RequireAuth>
        <SupportChatWrapper />
      </RequireAuth>
    ),
  },
  { path: "/track", element: <SuiviScreen /> },
  { path: "/track/:trackingNumber", element: <SuiviScreen /> },
  { path: "/payment-status", element: <PaymentStatusPage /> },
  { path: "/payment-status.php", element: <PaymentStatusPage /> },
  { path: "/a-propos", element: <AProposPage /> },
  { path: "/contact", element: <ContactPage /> },
  { path: "/mentions-legales", element: <MentionsLegalesPage /> },
  { path: "/confidentialite", element: <ConfidentialitePage /> },
  { path: "/cgu", element: <CGUPage /> },
  { path: "/conditions-transport", element: <ConditionsTransportPage /> },
  { path: "/paiement", element: <PaiementPage /> },
  { path: "/remboursement", element: <RemboursementPage /> },
  { path: "/reclamations", element: <ReclamationsPage /> },
  { path: "/colis-interdits", element: <ColisInterditsPage /> },

  // Client
  {
    path: "/client",
    element: (
      <RequireRole roles={["client"]}>
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
      { path: "colis", element: <MesColisScreen /> },
      { path: "colis/:parcelId", element: <ParcelDetailScreen /> },
      { path: "nouveau", element: <NewParcelScreen /> },
      { path: "outils", element: <WorkspaceScreen /> },
      { path: "offres", element: <OffresRecuesScreen /> },
      { path: "vehicules", element: <LiveJourneys /> },
      { path: "hors-ligne", element: <OfflineHistory /> },
      { path: "annonces", element: <ClientAnnoncesScreen /> },
      { path: "annonces/:advertisementId", element: <AnnonceDetailScreen /> },
      { path: "chauffeurs/:driverId", element: <DriverProfileScreen /> },
      { path: "trip/:advertisementId", element: <TripDetailScreen /> },
      { path: "colis/:parcelId/confirm", element: <ConfirmDeliveryScreen /> },
      { path: "suivi", element: <SuiviScreen /> },
      { path: "messages", element: <MessagesScreen /> },
      { path: "dettes", element: <ClientDebtsScreen /> },
      { path: "profil", element: <ProfilScreen /> },
      { path: "notifications", element: <NotificationsScreen /> },
    ],
  },
  {
    path: "/driver",
    element: (
      <RequireRole roles={["driver"]}>
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
      { path: "libre", element: <LibreServiceScreen /> },
      { path: "hors-ligne", element: <OfflineHistory /> },
      { path: "annonces", element: <MesAnnoncesScreen /> },
      { path: "missions", element: <MissionsScreen /> },
      { path: "revenus", element: <RevenusScreen /> },
      { path: "points", element: <DriverPointsScreen /> },
      { path: "messages", element: <MessagesScreen /> },
      { path: "historique", element: <HistoriqueScreen /> },
      { path: "garage", element: <MonGarageScreen /> },
      { path: "dettes", element: <DriverDebtsScreen /> },
      { path: "profil", element: <DriverProfilScreen /> },
      { path: "parametres", element: <DriverParametresScreen /> },
      { path: "notifications", element: <NotificationsScreen /> },
      { path: "documents", element: <VehicleDocumentsScreen /> },
      { path: "itinerary", element: <ItineraireScreen /> },
      { path: "parcels/:parcelId/confirm", element: <ConfirmDeliveryScreen /> },
    ],
  },

  // Admin garage
  {
    path: "/garage",
    element: (
      <RequireRole roles={["admin"]}>
        <DashboardLayout
          nav={GARAGE_NAV}
          roleLabel="Admin zone"
          greetOnIndex
          banner={<BroadcastBanner />}
          actions={<NotifButton />}
        />
      </RequireRole>
    ),
    children: [
      { index: true, element: <GarageDashboard /> },
      { path: "colis", element: <GarageColisPage /> },
      { path: "colis/:parcelId", element: <GarageParcelDetailPage /> },
      { path: "chauffeurs", element: <GarageChauffeursPage /> },
      { path: "envoyer-message", element: <ManualMessagePanel /> },
      { path: "assignations", element: <GarageAssignationsPage /> },
      { path: "rapports", element: <GarageRapportsPage /> },
      { path: "support", element: <AdminSupportScreen /> },
      { path: "profil", element: <StaffProfilScreen /> },
      { path: "notifications", element: <NotificationsScreen /> },
    ],
  },

  // Super admin
  {
    path: "/admin",
    element: (
      <RequireRole roles={["super_admin"]}>
        <DashboardLayout
          nav={SUPER_NAV}
          roleLabel="Super Admin"
          banner={<BroadcastBanner />}
          actions={
            <>
              <NotifButton />
              <NavButton to="/admin/zones?new=1" icon="add">
                Nouvelle zone
              </NavButton>
            </>
          }
        />
      </RequireRole>
    ),
    children: [
      { index: true, element: <SuperAdminDashboard /> },
      { path: "colis", element: <ColisPage /> },
      { path: "chauffeurs", element: <ChauffeursPage /> },
      { path: "users", element: <UtilisateursPage /> },
      { path: "zones", element: <ZonesPage /> },
      { path: "stats", element: <StatistiquesPage /> },
      {
        path: "parametres",
        element: <Navigate to="/admin/finance/configuration" replace />,
      },
      { path: "finance", element: <FinanceDashboardPage /> },
      { path: "finance/wallets", element: <WalletsPage /> },
      { path: "finance/wallets/:userId", element: <WalletDetailPage /> },
      {
        path: "finance/commissions",
        element: <Navigate to="/admin/finance/configuration" replace />,
      },
      { path: "finance/configuration", element: <ConfigConsommationPage /> },
      { path: "finance/payments", element: <PaymentsPage /> },
      { path: "finance/payments-cash", element: <CashDeclarationsPage /> },
      {
        path: "finance/payments-notifications",
        element: <PaymentNotificationsPage />,
      },
      { path: "finance/withdrawals", element: <WithdrawalsPage /> },
      { path: "finance/expenses", element: <ExpensesPage /> },
      { path: "assistances", element: <AssistancesPage /> },
      { path: "verifications", element: <IdentityVerificationsPage /> },
      { path: "reputation", element: <ReputationDashboardPage /> },
      { path: "reputation/scores", element: <ScoresPage /> },
      { path: "reputation/scores/:userId", element: <ScoreDetailPage /> },
      { path: "reputation/classement", element: <ClassementPage /> },
      { path: "notifications-brevo", element: <BrevoConfigScreen /> },
      { path: "envoyer-message", element: <ManualMessagePanel /> },
      { path: "paydunya", element: <PaydunyaConfigScreen /> },
      { path: "broadcasts", element: <BroadcastsPage /> },
      { path: "chauffeurs/:userId", element: <DriverDetailPage /> },
      { path: "logs", element: <LogsScreen /> },
      { path: "audit", element: <AuditLogsScreen /> },
      { path: "incidents", element: <IncidentsScreen /> },
      { path: "rapports", element: <RapportsPage /> },
      { path: "systeme", element: <SystemePage /> },
      { path: "qualite", element: <QualityScreen /> },
      { path: "support", element: <SupportConversationsScreen /> },
      { path: "moderation", element: <ModerationScreen /> },
      { path: "profil", element: <StaffProfilScreen /> },
      { path: "notifications", element: <NotificationsScreen /> },
    ],
  },

  // Support admin (super_admin ou rôles support, UI restreinte)
  {
    path: "/support-admin",
    element: (
      <RequireRole
        roles={[
          "super_admin",
          "support",
          "support_technique",
          "support_commercial",
        ]}
      >
        <SupportShell />
      </RequireRole>
    ),
    children: [
      {
        path: "qualite",
        element: (
          <RequireRole roles={["super_admin", "support_technique"]}>
            <QualityScreen />
          </RequireRole>
        ),
      },
      { index: true, element: <SupportDashboard /> },
      { path: "conversations", element: <SupportConversationsScreen /> },
      { path: "envoyer-message", element: <ManualMessagePanel /> },
      { path: "chauffeurs/:userId", element: <DriverDetailPage /> },
      {
        path: "moderation",
        element: (
          <RequireRole
            roles={[
              "super_admin",
              "admin",
              "support_technique",
              "support_commercial",
            ]}
          >
            <ModerationScreen />
          </RequireRole>
        ),
      },
      { path: "assistances", element: <AssistancesPage /> },
      { path: "colis", element: <ColisPage /> },
      { path: "chauffeurs", element: <ChauffeursPage /> },
      { path: "users", element: <UtilisateursPage /> },
      // Les tickets, les journaux techniques et les incidents suivent le
      // périmètre du backend : mandat technique uniquement, le support
      // commercial est exclu.
      {
        path: "tickets",
        element: (
          <RequireRole roles={["super_admin", "support_technique"]}>
            <TicketsScreen />
          </RequireRole>
        ),
      },
      // Symétriquement, le pipeline et la couverture réseau sont réservés au
      // mandat commercial.
      {
        path: "prospects",
        element: (
          <RequireRole roles={["super_admin", "support_commercial"]}>
            <LeadsScreen />
          </RequireRole>
        ),
      },
      {
        path: "couverture",
        element: (
          <RequireRole roles={["super_admin", "support_commercial"]}>
            <CoverageScreen />
          </RequireRole>
        ),
      },
      {
        path: "logs",
        element: (
          <RequireRole roles={["super_admin", "support_technique"]}>
            <LogsScreen />
          </RequireRole>
        ),
      },
      {
        path: "incidents",
        element: (
          <RequireRole roles={["super_admin", "support_technique"]}>
            <IncidentsScreen />
          </RequireRole>
        ),
      },
      {
        path: "audit",
        element: (
          <RequireRole roles={["super_admin", "support", "support_technique"]}>
            <AuditLogsScreen />
          </RequireRole>
        ),
      },
      { path: "profil", element: <StaffProfilScreen /> },
      { path: "notifications", element: <NotificationsScreen /> },
    ],
  },

  {
    path: "*",
    element: (
      <RequireAuth>
        <RoleHomeRedirect />
      </RequireAuth>
    ),
  },
]);
