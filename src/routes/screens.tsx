import { lazy } from "react";
// Chaque espace est chargé à son ouverture, tout en gardant les mêmes routes et droits.
export const QualityScreen = lazy(() =>
  import("@/features/experience/QualityScreen").then((m) => ({
    default: m.QualityScreen,
  })),
);
export const WorkspaceScreen = lazy(() =>
  import("@/features/experience/WorkspaceScreen").then((module) => ({
    default: module.WorkspaceScreen,
  })),
);
export const OfflineHistory = lazy(() =>
  import("@/features/pwa/OfflineHistory").then((module) => ({
    default: module.OfflineHistory,
  })),
);
export const LiveJourneys = lazy(() =>
  import("@/features/transport/LiveJourneys").then((module) => ({
    default: module.LiveJourneys,
  })),
);
export const ClientDebtsScreen = lazy(() =>
  import("@/features/client/ClientDebtsScreen").then((module) => ({
    default: module.ClientDebtsScreen,
  })),
);
export const DriverDebtsScreen = lazy(() =>
  import("@/features/driver/DriverDebtsScreen").then((module) => ({
    default: module.DriverDebtsScreen,
  })),
);
export const LoginPage = lazy(() =>
  import("@/features/auth/LoginPage").then((module) => ({
    default: module.LoginPage,
  })),
);
export const RegisterPage = lazy(() =>
  import("@/features/auth/RegisterPage").then((module) => ({
    default: module.RegisterPage,
  })),
);
export const ForgotPinPage = lazy(() =>
  import("@/features/auth/ForgotPinPage").then((module) => ({
    default: module.ForgotPinPage,
  })),
);
export const LandingPage = lazy(() =>
  import("@/features/marketing/LandingPage").then((module) => ({
    default: module.LandingPage,
  })),
);
export const InstallPage = lazy(() =>
  import("@/features/pwa/InstallPage").then((module) => ({
    default: module.InstallPage,
  })),
);
export const AProposPage = lazy(() =>
  import("@/features/marketing/AProposPage").then((module) => ({
    default: module.AProposPage,
  })),
);
export const ContactPage = lazy(() =>
  import("@/features/marketing/ContactPage").then((module) => ({
    default: module.ContactPage,
  })),
);
export const MentionsLegalesPage = lazy(() =>
  import("@/features/marketing/MentionsLegalesPage").then((module) => ({
    default: module.MentionsLegalesPage,
  })),
);
export const ConfidentialitePage = lazy(() =>
  import("@/features/marketing/ConfidentialitePage").then((module) => ({
    default: module.ConfidentialitePage,
  })),
);
export const CGUPage = lazy(() =>
  import("@/features/marketing/CGUPage").then((module) => ({
    default: module.CGUPage,
  })),
);
export const ConditionsTransportPage = lazy(() =>
  import("@/features/marketing/ConditionsTransportPage").then((module) => ({
    default: module.ConditionsTransportPage,
  })),
);
export const PaiementPage = lazy(() =>
  import("@/features/marketing/PaiementPage").then((module) => ({
    default: module.PaiementPage,
  })),
);
export const RemboursementPage = lazy(() =>
  import("@/features/marketing/RemboursementPage").then((module) => ({
    default: module.RemboursementPage,
  })),
);
export const ReclamationsPage = lazy(() =>
  import("@/features/marketing/ReclamationsPage").then((module) => ({
    default: module.ReclamationsPage,
  })),
);
export const ColisInterditsPage = lazy(() =>
  import("@/features/marketing/ColisInterditsPage").then((module) => ({
    default: module.ColisInterditsPage,
  })),
);
export const HelpScreen = lazy(() =>
  import("@/features/shared/HelpScreen").then((module) => ({
    default: module.HelpScreen,
  })),
);
export const PaymentStatusPage = lazy(() =>
  import("@/features/shared/PaymentStatusPage").then((module) => ({
    default: module.PaymentStatusPage,
  })),
);
export const ClientDashboard = lazy(() =>
  import("@/features/client/ClientDashboard").then((module) => ({
    default: module.ClientDashboard,
  })),
);
export const MesColisScreen = lazy(() =>
  import("@/features/client/MesColisScreen").then((module) => ({
    default: module.MesColisScreen,
  })),
);
export const ParcelDetailScreen = lazy(() =>
  import("@/features/client/ParcelDetailScreen").then((module) => ({
    default: module.ParcelDetailScreen,
  })),
);
export const NewParcelScreen = lazy(() =>
  import("@/features/client/NewParcelScreen").then((module) => ({
    default: module.NewParcelScreen,
  })),
);
export const OffresRecuesScreen = lazy(() =>
  import("@/features/client/OffresRecuesScreen").then((module) => ({
    default: module.OffresRecuesScreen,
  })),
);
export const ClientAnnoncesScreen = lazy(() =>
  import("@/features/client/ClientAnnoncesScreen").then((module) => ({
    default: module.ClientAnnoncesScreen,
  })),
);
export const AnnonceDetailScreen = lazy(() =>
  import("@/features/client/AnnonceDetailScreen").then((module) => ({
    default: module.AnnonceDetailScreen,
  })),
);
export const DriverProfileScreen = lazy(() =>
  import("@/features/client/DriverProfileScreen").then((module) => ({
    default: module.DriverProfileScreen,
  })),
);
export const SuiviScreen = lazy(() =>
  import("@/features/client/SuiviScreen").then((module) => ({
    default: module.SuiviScreen,
  })),
);
export const ProfilScreen = lazy(() =>
  import("@/features/client/ProfilScreen").then((module) => ({
    default: module.ProfilScreen,
  })),
);
export const TripDetailScreen = lazy(() =>
  import("@/features/client/TripDetailScreen").then((module) => ({
    default: module.TripDetailScreen,
  })),
);
export const ConfirmDeliveryScreen = lazy(() =>
  import("@/features/shared/ConfirmDeliveryScreen").then((module) => ({
    default: module.ConfirmDeliveryScreen,
  })),
);
export const DriverDashboard = lazy(() =>
  import("@/features/driver/DriverDashboard").then((module) => ({
    default: module.DriverDashboard,
  })),
);
export const LibreServiceScreen = lazy(() =>
  import("@/features/driver/LibreServiceScreen").then((module) => ({
    default: module.LibreServiceScreen,
  })),
);
export const MissionsScreen = lazy(() =>
  import("@/features/driver/MissionsScreen").then((module) => ({
    default: module.MissionsScreen,
  })),
);
export const RevenusScreen = lazy(() =>
  import("@/features/driver/RevenusScreen").then((module) => ({
    default: module.RevenusScreen,
  })),
);
export const HistoriqueScreen = lazy(() =>
  import("@/features/driver/HistoriqueScreen").then((module) => ({
    default: module.HistoriqueScreen,
  })),
);
export const MonGarageScreen = lazy(() =>
  import("@/features/driver/MonGarageScreen").then((module) => ({
    default: module.MonGarageScreen,
  })),
);
export const DriverProfilScreen = lazy(() =>
  import("@/features/driver/DriverProfilScreen").then((module) => ({
    default: module.DriverProfilScreen,
  })),
);
export const DriverParametresScreen = lazy(() =>
  import("@/features/driver/DriverParametresScreen").then((module) => ({
    default: module.DriverParametresScreen,
  })),
);
export const DriverPointsScreen = lazy(() =>
  import("@/features/driver/PointsScreen").then((module) => ({
    default: module.DriverPointsScreen,
  })),
);
export const MesAnnoncesScreen = lazy(() =>
  import("@/features/driver/MesAnnoncesScreen").then((module) => ({
    default: module.MesAnnoncesScreen,
  })),
);
export const VehicleDocumentsScreen = lazy(() =>
  import("@/features/driver/VehicleDocumentsScreen").then((module) => ({
    default: module.VehicleDocumentsScreen,
  })),
);
export const ItineraireScreen = lazy(() =>
  import("@/features/driver/ItineraireScreen").then((module) => ({
    default: module.ItineraireScreen,
  })),
);
export const MessagesScreen = lazy(() =>
  import("@/features/shared/MessagesScreen").then((module) => ({
    default: module.MessagesScreen,
  })),
);
export const AdminSupportScreen = lazy(() =>
  import("@/features/shared/AdminSupportScreen").then((module) => ({
    default: module.AdminSupportScreen,
  })),
);
export const SupportDashboard = lazy(() =>
  import("@/features/shared/SupportDashboard").then((module) => ({
    default: module.SupportDashboard,
  })),
);
export const SupportConversationsScreen = lazy(() =>
  import("@/features/shared/SupportConversationsScreen").then((module) => ({
    default: module.SupportConversationsScreen,
  })),
);
export const ModerationScreen = lazy(() =>
  import("@/features/shared/ModerationScreen").then((module) => ({
    default: module.ModerationScreen,
  })),
);
export const StaffProfilScreen = lazy(() =>
  import("@/features/shared/StaffProfilScreen").then((module) => ({
    default: module.StaffProfilScreen,
  })),
);
export const LogsScreen = lazy(() =>
  import("@/features/shared/observability/LogsScreen").then((module) => ({
    default: module.LogsScreen,
  })),
);
export const AuditLogsScreen = lazy(() =>
  import("@/features/shared/observability/AuditLogsScreen").then((module) => ({
    default: module.AuditLogsScreen,
  })),
);
export const IncidentsScreen = lazy(() =>
  import("@/features/shared/observability/IncidentsScreen").then((module) => ({
    default: module.IncidentsScreen,
  })),
);
export const TicketsScreen = lazy(() =>
  import("@/features/shared/supportRoles/TicketsScreen").then((module) => ({
    default: module.TicketsScreen,
  })),
);
export const LeadsScreen = lazy(() =>
  import("@/features/shared/supportRoles/LeadsScreen").then((module) => ({
    default: module.LeadsScreen,
  })),
);
export const CoverageScreen = lazy(() =>
  import("@/features/shared/supportRoles/CoverageScreen").then((module) => ({
    default: module.CoverageScreen,
  })),
);
export const SuperAdminDashboard = lazy(() =>
  import("@/features/superAdmin/SuperAdminDashboard").then((module) => ({
    default: module.SuperAdminDashboard,
  })),
);
export const ColisPage = lazy(() =>
  import("@/features/superAdmin/ColisPage").then((module) => ({
    default: module.ColisPage,
  })),
);
export const ChauffeursPage = lazy(() =>
  import("@/features/superAdmin/ChauffeursPage").then((module) => ({
    default: module.ChauffeursPage,
  })),
);
export const UtilisateursPage = lazy(() =>
  import("@/features/superAdmin/UtilisateursPage").then((module) => ({
    default: module.UtilisateursPage,
  })),
);
export const ZonesPage = lazy(() =>
  import("@/features/superAdmin/ZonesPage").then((module) => ({
    default: module.ZonesPage,
  })),
);
export const StatistiquesPage = lazy(() =>
  import("@/features/superAdmin/StatistiquesPage").then((module) => ({
    default: module.StatistiquesPage,
  })),
);
export const RapportsPage = lazy(() =>
  import("@/features/superAdmin/RapportsPage").then((module) => ({
    default: module.RapportsPage,
  })),
);
export const SystemePage = lazy(() =>
  import("@/features/superAdmin/SystemePage").then((module) => ({
    default: module.SystemePage,
  })),
);
export const ConfigConsommationPage = lazy(() =>
  import("@/features/superAdmin/ConfigConsommationPage").then((module) => ({
    default: module.ConfigConsommationPage,
  })),
);
export const FinanceDashboardPage = lazy(() =>
  import("@/features/superAdmin/FinanceDashboardPage").then((module) => ({
    default: module.FinanceDashboardPage,
  })),
);
export const WalletsPage = lazy(() =>
  import("@/features/superAdmin/WalletsPage").then((module) => ({
    default: module.WalletsPage,
  })),
);
export const PaymentsPage = lazy(() =>
  import("@/features/superAdmin/PaymentsPage").then((module) => ({
    default: module.PaymentsPage,
  })),
);
export const CashDeclarationsPage = lazy(() =>
  import("@/features/superAdmin/CashDeclarationsPage").then((module) => ({
    default: module.CashDeclarationsPage,
  })),
);
export const PaymentNotificationsPage = lazy(() =>
  import("@/features/superAdmin/PaymentNotificationsPage").then((module) => ({
    default: module.PaymentNotificationsPage,
  })),
);
export const ReputationDashboardPage = lazy(() =>
  import("@/features/superAdmin/ReputationDashboardPage").then((module) => ({
    default: module.ReputationDashboardPage,
  })),
);
export const ScoresPage = lazy(() =>
  import("@/features/superAdmin/ScoresPage").then((module) => ({
    default: module.ScoresPage,
  })),
);
export const ClassementPage = lazy(() =>
  import("@/features/superAdmin/ClassementPage").then((module) => ({
    default: module.ClassementPage,
  })),
);
export const DriverDetailPage = lazy(() =>
  import("@/features/superAdmin/DriverDetailPage").then((module) => ({
    default: module.DriverDetailPage,
  })),
);
export const BrevoConfigScreen = lazy(() =>
  import("@/features/superAdmin/BrevoConfigScreen").then((module) => ({
    default: module.BrevoConfigScreen,
  })),
);
export const PaydunyaConfigScreen = lazy(() =>
  import("@/features/superAdmin/PaydunyaConfigScreen").then((module) => ({
    default: module.PaydunyaConfigScreen,
  })),
);
export const BroadcastsPage = lazy(
  () => import("@/features/superAdmin/BroadcastsPage"),
);
export const WalletDetailPage = lazy(() =>
  import("@/features/superAdmin/WalletDetailPage").then((module) => ({
    default: module.WalletDetailPage,
  })),
);
export const ScoreDetailPage = lazy(() =>
  import("@/features/superAdmin/ScoreDetailPage").then((module) => ({
    default: module.ScoreDetailPage,
  })),
);
export const WithdrawalsPage = lazy(() =>
  import("@/features/superAdmin/WithdrawalsPage").then((module) => ({
    default: module.WithdrawalsPage,
  })),
);
export const AssistancesPage = lazy(() =>
  import("@/features/superAdmin/AssistancesPage").then((module) => ({
    default: module.AssistancesPage,
  })),
);
export const ExpensesPage = lazy(() =>
  import("@/features/superAdmin/ExpensesPage").then((module) => ({
    default: module.ExpensesPage,
  })),
);
export const IdentityVerificationsPage = lazy(() =>
  import("@/features/superAdmin/IdentityVerificationsPage").then((module) => ({
    default: module.IdentityVerificationsPage,
  })),
);
export const NotificationsScreen = lazy(() =>
  import("@/features/shared/NotificationsScreen").then((module) => ({
    default: module.NotificationsScreen,
  })),
);
export const GarageDashboard = lazy(() =>
  import("@/features/garageAdmin/GarageDashboard").then((module) => ({
    default: module.GarageDashboard,
  })),
);
export const GarageColisPage = lazy(() =>
  import("@/features/garageAdmin/GarageColisPage").then((module) => ({
    default: module.GarageColisPage,
  })),
);
export const GarageChauffeursPage = lazy(() =>
  import("@/features/garageAdmin/GarageChauffeursPage").then((module) => ({
    default: module.GarageChauffeursPage,
  })),
);
export const GarageAssignationsPage = lazy(() =>
  import("@/features/garageAdmin/GarageAssignationsPage").then((module) => ({
    default: module.GarageAssignationsPage,
  })),
);
export const GarageRapportsPage = lazy(() =>
  import("@/features/garageAdmin/GarageRapportsPage").then((module) => ({
    default: module.GarageRapportsPage,
  })),
);
export const GarageParcelDetailPage = lazy(() =>
  import("@/features/garageAdmin/GarageParcelDetailPage").then((module) => ({
    default: module.GarageParcelDetailPage,
  })),
);
