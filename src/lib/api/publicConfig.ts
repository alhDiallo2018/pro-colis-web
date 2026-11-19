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

export async function getPublicConfig(): Promise<PublicConfig> {
  const { data } = await api.get('/public/config')
  return (data.config ?? data.data ?? {}) as PublicConfig
}
