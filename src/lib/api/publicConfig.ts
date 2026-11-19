import { api } from './client'

/** Configuration publique exposée par `/public/config` (commission, points,
 *  packs, retraits, politique d'insuffisance, contacts support). Aucune valeur
 *  métier n'est codée en dur côté web : tout provient de la configuration API. */
export interface PublicConfig {
  commission: {
    percentage: number
    minAmount: number
    maxAmount: number
  }
  points: {
    deliveryCompleted: number
    signupBonus: number
    cfaPerPoint: number
    commitmentFee: number
    packs: number[]
  }
  withdrawal: {
    minAmount: number
    maxAmount: number
    maxPerDay: number
  }
  insufficientPolicy: 'block' | 'warn' | 'debt'
  debtLimit: number
  support: {
    phone: string
    email: string
    technicalEmail: string
    technicalPhone: string
    responseTime: string
    availability: string
  }
  /** Contenu du centre d'aide administrable depuis le backend. */
  help: {
    guides?: { id: string; language: 'fr' | 'wo'; title: string; text: string; audioUrl: string | null }[]
    topics: { icon: string; title: string }[]
    faqs: { question: string; answer: string }[]
  }
  /** Motifs d'annulation (value/label uniquement). Les règles financières ne
   *  sont jamais exposées ici : la responsabilité reste calculée côté serveur. */
  cancellation: {
    reasons: { value: string; label: string }[]
  }
  /** Identité légale configurée par l'administrateur (affichée dans les pages
   *  Mentions légales / Confidentialité / CGU). Champs vides = « à compléter ». */
  legal: {
    companyName: string
    address: string
    registrationNumber: string
    cdpAuthorization: string
    privacyEmail: string
    publisherName: string
    hostName: string
    directorName: string
    directorEmail: string
    technicalDirectorName: string
    technicalDirectorEmail: string
  }
  /** Timings (polling, timeouts, fenêtres métier) pilotés par l'administrateur.
   *  Optionnel : les clients conservent des fallbacks statiques si l'API tourne
   *  sur une version antérieure ou si la config n'est pas encore chargée. */
  timings?: Partial<TimingsConfig>
  /** Phase 4 externalisation : limites de formulaires et imports (CSV,
   *  longueurs max, dimensions photo, pagination). Les hot paths conservent
   *  un fallback compile-time (`DEFAULT_LIMITS`). */
  limits?: Partial<LimitsConfig>
  /** Phase 1 externalisation : paramètres d'authentification administrables.
   *  Permet au web de borner la saisie OTP sans valeur magique en dur. */
  auth?: {
    otpExpiryMinutes: number
    otpMaxAttempts: number
  }
  /** Phase 1 externalisation : tarification internationale CEDEAO. Les paires
   *  desservies, la limite de poids et les documents requis proviennent de la
   *  config admin (`international.*`). */
  international?: {
    maxWeightKg: number
    countryPairs: string[]
    requiredDocuments: Record<string, string[]>
  }
  /** Phase 1 externalisation : devise d'affichage par défaut + liste autorisée.
   *  Remplace les `currency = 'XOF'` codés en dur dans les écrans. */
  currency?: {
    default: string
    supported: string[]
  }
  /** Phase 6 externalisation : branding PWA + Web (nom, couleurs, logo,
   *  favicon, icônes notification). Optionnel pour tolérer une API ancienne.
   *  Les clients conservent des fallbacks statiques (`DEFAULT_BRANDING`). */
  branding?: BrandingConfig
  /** Phase 6 externalisation : fallbacks de notifications (titre/corps,
   *  icône/badge, priorités déclenchant `requireInteraction`). */
  notifications?: NotificationsConfig
}

/** Branding PWA + Web administrable depuis SystemConfig (`branding.*`).
 *  Consommé par `applyBranding()` (CSS variables + meta theme-color + favicon)
 *  et par `GET /manifest.webmanifest`. Toutes les URLs peuvent être relatives
 *  (`/icons/...`) ou absolues (`https://...`). */
export interface BrandingConfig {
  appName: string
  shortName: string
  themeColor: string
  backgroundColor: string
  logoUrl: string
  logoDarkUrl: string | null
  faviconUrl: string
  iconUrl: string
  badgeUrl: string
  primaryColor: string
  secondaryColor: string | null
}

/** Fallbacks notifications administrables depuis SystemConfig
 *  (`notifications.*`). Consommé par `pwa/sw.js` via le pont IndexedDB
 *  (`BrandingBridge`). */
export interface NotificationsConfig {
  fallbackTitle: string
  fallbackBody: string
  defaultIconUrl: string
  defaultBadgeUrl: string
  /** Valeurs de `payload.priority` qui déclenchent `requireInteraction`
   *  (notification persistante jusqu'au clic). */
  highPriorityValues: string[]
}

/** Timings pilotables en runtime depuis l'admin (SystemConfig `timings.*`).
 *  Les valeurs par défaut sont dupliquées côté web dans `DEFAULT_TIMINGS` pour
 *  garantir un boot fonctionnel avant la première réponse `/public/config`. */
export interface TimingsConfig {
  // Polling
  parcelStatusPollMs: number
  parcelsListPollMs: number
  announcementsFeedPollMs: number
  journeyPositionsPollMs: number
  operationsDashboardPollMs: number
  driverDiscoveryPollMs: number
  // Timeouts
  apiRequestTimeoutMs: number
  geolocationTimeoutMs: number
  googleAuthTimeoutMs: number
  // GPS
  locationUploadIntervalSec: number
  locationFreshnessSec: number
  // Messaging
  messageEditWindowMs: number
  broadcastSnoozeHours: number
  // Discovery
  positionTtlMs: number
  // Webhooks (internes API — exposés en lecture pour les tableaux de bord)
  webhookRetryBackoffBaseMs: number
  webhookPollIntervalMs: number
  webhookMaxAttempts: number
  // PWA
  pwaSyncMaxAttempts: number
}

/** Fallback statique : valeurs utilisées tant que `/public/config` n'a pas
 *  répondu (boot, offline, ancienne version d'API). Doit rester synchronisé
 *  avec `TIMINGS_DEFAULTS` dans `src/utils/timings-config.js` côté API. */
export const DEFAULT_TIMINGS: TimingsConfig = {
  parcelStatusPollMs: 60_000,
  parcelsListPollMs: 15_000,
  announcementsFeedPollMs: 5_000,
  journeyPositionsPollMs: 15_000,
  operationsDashboardPollMs: 60_000,
  driverDiscoveryPollMs: 60_000,
  apiRequestTimeoutMs: 30_000,
  geolocationTimeoutMs: 15_000,
  googleAuthTimeoutMs: 15_000,
  locationUploadIntervalSec: 10,
  locationFreshnessSec: 60,
  messageEditWindowMs: 900_000,
  broadcastSnoozeHours: 2,
  positionTtlMs: 600_000,
  webhookRetryBackoffBaseMs: 30_000,
  webhookPollIntervalMs: 15_000,
  webhookMaxAttempts: 6,
  pwaSyncMaxAttempts: 10,
}

/** Limites administrables (longueurs de champ, tailles d'import, dimensions
 *  photo, pagination zones) pilotées en runtime depuis l'admin (SystemConfig
 *  `limits.*`). Les valeurs par défaut sont dupliquées dans `DEFAULT_LIMITS`
 *  pour garantir un boot fonctionnel avant la première réponse `/public/config`. */
export interface LimitsConfig {
  // CSV / imports
  csvMaxLines: number
  csvMaxBytes: number
  routesCsvMaxBytes: number
  maxStopsPerRoute: number
  maxDeparturesPerPublish: number
  // Colis
  parcelWeightLightKg: number
  parcelPhotosMax: number
  parcelDescriptionMaxChars: number
  parcelDescriptionLongMaxChars: number
  addressMaxChars: number
  phoneMaxChars: number
  // Annonces / cash / messages courts
  annonceDescriptionMaxChars: number
  cashJustificationMaxChars: number
  disputeDescriptionMaxChars: number
  // Médias
  imageMaxDimension: number
  imageJpegQuality: number
  // Pagination API (zones)
  zonePageSize: number
  zoneMaxPages: number
}

/** Fallback statique : valeurs utilisées tant que `/public/config` n'a pas
 *  répondu (boot, offline, ancienne version d'API). Doit rester synchronisé
 *  avec `LIMITS_DEFAULTS` dans `src/utils/limits-config.js` côté API. */
export const DEFAULT_LIMITS: LimitsConfig = {
  csvMaxLines: 50,
  csvMaxBytes: 2_097_152,
  routesCsvMaxBytes: 131_072,
  maxStopsPerRoute: 38,
  maxDeparturesPerPublish: 100,
  parcelWeightLightKg: 10,
  parcelPhotosMax: 4,
  parcelDescriptionMaxChars: 280,
  parcelDescriptionLongMaxChars: 100_000,
  addressMaxChars: 500,
  phoneMaxChars: 30,
  annonceDescriptionMaxChars: 200,
  cashJustificationMaxChars: 200,
  disputeDescriptionMaxChars: 2000,
  imageMaxDimension: 1600,
  imageJpegQuality: 0.8,
  zonePageSize: 100,
  zoneMaxPages: 20,
}

/** Fallback statique : valeurs utilisées tant que `/public/config` n'a pas
 *  répondu. Doit rester synchronisé avec `BRANDING_DEFAULTS` dans
 *  `src/utils/branding-config.js` côté API. Les hot paths évitent le flash of
 *  unstyled content en lisant ces valeurs au premier render. */
export const DEFAULT_BRANDING: BrandingConfig = {
  appName: 'ProColis',
  shortName: 'ProColis',
  themeColor: '#018982',
  backgroundColor: '#FFFFFF',
  logoUrl: '/icons/icon-192.png',
  logoDarkUrl: null,
  faviconUrl: '/favicon.ico',
  iconUrl: '/icons/icon-192.png',
  badgeUrl: '/icons/icon-72.png',
  primaryColor: '#018982',
  secondaryColor: null,
}

/** Fallback statique : valeurs utilisées tant que `/public/config` n'a pas
 *  répondu. Doit rester synchronisé avec `NOTIFICATIONS_DEFAULTS` dans
 *  `src/utils/branding-config.js` côté API. */
export const DEFAULT_NOTIFICATIONS: NotificationsConfig = {
  fallbackTitle: 'ProColis',
  fallbackBody: 'Nouvelle activité',
  defaultIconUrl: '/icons/icon-192.png',
  defaultBadgeUrl: '/icons/icon-72.png',
  highPriorityValues: ['high', 'urgent'],
}

export async function getPublicConfig(): Promise<PublicConfig> {
  const { data } = await api.get('/public/config')
  return (data.config ?? data.data ?? {}) as PublicConfig
}
