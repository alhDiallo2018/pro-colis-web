// Locale française — langue de référence de l'application. Toute nouvelle
// chaîne doit d'abord être ajoutée ici, puis répliquée en `en.ts` et `wo.ts`.
//
// Portée actuelle : shell applicatif (navigations par rôle, titres des
// paramètres, boutons communs). Les écrans métier historiques restent en
// français littéral — leur migration progressive est documentée dans
// `parity-mobile-web-pwa.md` sous « localisation ».

export const fr: TranslationShape = {
  common: {
    loading: 'Chargement…',
    retry: 'Réessayer',
    save: 'Enregistrer',
    cancel: 'Annuler',
    close: 'Fermer',
    confirm: 'Confirmer',
    delete: 'Supprimer',
    edit: 'Modifier',
    search: 'Rechercher',
    refresh: 'Rafraîchir',
    empty: 'Rien à afficher',
    error: 'Une erreur est survenue. Réessayez.',
  },
  settings: {
    title: 'Paramètres',
    appearance: 'Apparence',
    themeLight: 'Thème clair',
    themeDark: 'Thème sombre',
    themeSystem: 'Suivre le système',
    language: 'Langue',
    languageFr: 'Français',
    languageEn: 'English',
    languageWo: 'Wolof',
    notifications: 'Notifications',
  },
  nav: {
    // Client
    clientHome: 'Accueil',
    clientParcels: 'Mes colis',
    clientTools: 'Outils d’envoi',
    clientOffers: 'Offres reçues',
    clientTrack: 'Suivre un colis',
    clientLiveVehicles: 'Véhicules en direct',
    clientAnnonces: 'Annonces chauffeurs',
    clientMessages: 'Messages',
    clientWallet: 'Portefeuille',
    clientDebts: 'Mes dettes',
    clientApiKeys: 'Clés API',
    clientSettings: 'Paramètres',
    clientOffline: 'Historique hors connexion',
    clientProfile: 'Profil',
    headingMyShipments: 'Mes envois',
    headingFindDriver: 'Trouver un chauffeur',
    headingMyAccount: 'Mon compte',
    // Driver
    driverHome: 'Accueil',
    driverFreeParcels: 'Colis à prendre',
    driverMissions: 'Mes missions',
    driverHandoverReceive: 'Recevoir un transfert',
    driverAnnonces: 'Mes annonces',
    driverRouteImport: 'Importer des trajets',
    driverItinerary: 'Itinéraire',
    driverMessages: 'Messages',
    driverRevenue: 'Revenus',
    driverPoints: 'Points & paiements',
    driverDebts: 'Mes dettes',
    driverHistory: 'Historique',
    driverOffline: 'Historique hors connexion',
    driverDocuments: 'Documents',
    driverGarage: 'Ma zone',
    driverProfile: 'Profil',
    driverSettings: 'Paramètres',
    headingActivity: 'Mon activité',
    headingFinances: 'Finances et historique',
    // Garage admin
    garageDashboard: 'Tableau de bord',
    garageParcels: 'Colis',
    garageDrivers: 'Chauffeurs',
    garageSendMessage: 'Envoyer un message',
    garageAssignments: 'Assignations',
    garageReports: 'Rapports',
    garageSupport: 'Support',
    garageProfile: 'Profil',
    // Super admin — selected labels (en couverture progressive)
    adminDashboard: 'Tableau de bord',
    adminOpsHub: 'Hub opérationnel',
    adminPilotMetrics: 'Métriques pilote',
    adminUsers: 'Utilisateurs',
    adminDrivers: 'Chauffeurs',
    adminParcels: 'Colis',
  },
}

export interface TranslationShape {
  common: Record<
    | 'loading' | 'retry' | 'save' | 'cancel' | 'close' | 'confirm' | 'delete'
    | 'edit' | 'search' | 'refresh' | 'empty' | 'error',
    string
  >
  settings: Record<
    | 'title' | 'appearance' | 'themeLight' | 'themeDark' | 'themeSystem'
    | 'language' | 'languageFr' | 'languageEn' | 'languageWo' | 'notifications',
    string
  >
  nav: Record<
    | 'clientHome' | 'clientParcels' | 'clientTools' | 'clientOffers'
    | 'clientTrack' | 'clientLiveVehicles' | 'clientAnnonces' | 'clientMessages'
    | 'clientWallet' | 'clientDebts' | 'clientApiKeys' | 'clientSettings'
    | 'clientOffline' | 'clientProfile' | 'headingMyShipments'
    | 'headingFindDriver' | 'headingMyAccount' | 'driverHome' | 'driverFreeParcels'
    | 'driverMissions' | 'driverHandoverReceive' | 'driverAnnonces'
    | 'driverRouteImport' | 'driverItinerary' | 'driverMessages'
    | 'driverRevenue' | 'driverPoints' | 'driverDebts' | 'driverHistory'
    | 'driverOffline' | 'driverDocuments' | 'driverGarage' | 'driverProfile'
    | 'driverSettings' | 'headingActivity' | 'headingFinances'
    | 'garageDashboard' | 'garageParcels' | 'garageDrivers' | 'garageSendMessage'
    | 'garageAssignments' | 'garageReports' | 'garageSupport' | 'garageProfile'
    | 'adminDashboard' | 'adminOpsHub' | 'adminPilotMetrics' | 'adminUsers'
    | 'adminDrivers' | 'adminParcels',
    string
  >
}
