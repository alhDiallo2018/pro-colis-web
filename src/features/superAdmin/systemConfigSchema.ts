/**
 * Schéma UI des ~90 clés `SystemConfig`.
 *
 * Chaque clé est décrite par un objet `FieldDef` qui indique à la page
 * admin comment la rendre (color picker, number input, textarea JSON, …),
 * sa section d'appartenance et une description humaine. Toute clé absente
 * du schéma reste visible dans l'onglet « Avancé — clés brutes » en
 * éditeur JSON générique, de sorte qu'ajouter une clé en DB ne casse
 * jamais l'UI.
 *
 * Ce fichier est la source de vérité pour l'ordre d'affichage et les
 * unités. Il doit rester synchronisé avec :
 *  - `DEFAULT_TIMINGS` / `DEFAULT_LIMITS` / `DEFAULT_BRANDING` /
 *    `DEFAULT_NOTIFICATIONS` dans `src/lib/api/publicConfig.ts` ;
 *  - les readers correspondants côté API (`src/utils/*-config.js`).
 */

export type FieldKind =
  | 'number'
  | 'text'
  | 'url'
  | 'color'
  | 'boolean'
  | 'textarea'
  | 'json'
  | 'select'
  | 'string-array'

export interface FieldDef {
  /** Clé complète telle qu'elle existe en DB (`timings.parcelStatusPollMs`). */
  key: string
  /** Label court affiché dans le formulaire. */
  label: string
  /** Description longue (affichée en secondaire ou tooltip). */
  description?: string
  /** Type d'input attendu. */
  kind: FieldKind
  /** Unité suffixée (ms, s, Kg, %, …). Facultatif. */
  unit?: string
  /** Pour `kind: 'select'` uniquement. */
  options?: { value: string; label: string }[]
  /** Valeur min/max pour les number inputs (indicatif, pas de validation serveur). */
  min?: number
  max?: number
  /** Marque la clé comme readonly (p.ex. gérée par un endpoint dédié). */
  readOnly?: boolean
}

export interface SectionDef {
  /** Identifiant stable (pour les ancres / tests). */
  id: string
  /** Titre affiché. */
  title: string
  /** Résumé court sous le titre. */
  subtitle?: string
  /** Icône Material Symbols. */
  icon: string
  /** Champs de la section (ordre affiché). */
  fields: FieldDef[]
}

/** Section 1 — Authentification OTP. */
const AUTH: SectionDef = {
  id: 'auth',
  title: 'Authentification',
  subtitle: 'Durée OTP et nombre de tentatives maximum.',
  icon: 'key',
  fields: [
    {
      key: 'auth.otpExpiryMinutes',
      label: 'Durée de validité OTP',
      kind: 'number',
      unit: 'min',
      min: 1,
      description: 'Durée pendant laquelle le code OTP reste valide après envoi.',
    },
    {
      key: 'auth.otpMaxAttempts',
      label: 'Tentatives OTP maximum',
      kind: 'number',
      min: 1,
      description: 'Nombre de saisies erronées avant verrouillage du code.',
    },
  ],
}

/** Section 2 — Commission plateforme & politique de dette. */
const COMMISSION: SectionDef = {
  id: 'commission',
  title: 'Commission & Dette',
  subtitle: 'Politique en cas de solde insuffisant et plafond de dette cumulée.',
  icon: 'percent',
  fields: [
    {
      key: 'insufficientPolicy',
      label: 'Politique solde insuffisant',
      kind: 'select',
      options: [
        { value: 'block', label: 'Bloquer la transaction (recommandé)' },
        { value: 'warn', label: 'Prévenir sans bloquer' },
        { value: 'debt', label: 'Passer en dette' },
      ],
      description: 'Comportement si le solde est insuffisant pour la commission.',
    },
    {
      key: 'debtLimit',
      label: 'Plafond de dette',
      kind: 'number',
      unit: 'FCFA',
      min: 0,
      description: 'Montant cumulé de dette au-delà duquel les mutations sont bloquées.',
    },
    {
      key: 'commission.debtLimit',
      label: 'Plafond de dette (alias commission.*)',
      kind: 'number',
      unit: 'FCFA',
      min: 0,
      description: 'Alias historique — garder synchronisé avec debtLimit.',
    },
    {
      key: 'commission.insufficient_rule',
      label: 'Règle solde insuffisant (alias)',
      kind: 'select',
      options: [
        { value: 'block', label: 'Bloquer' },
        { value: 'warn', label: 'Prévenir' },
        { value: 'debt', label: 'Passer en dette' },
      ],
    },
  ],
}

/** Section 3 — PayDunya (lecture-only ici : secrets gérés par l'écran dédié). */
const PAYDUNYA: SectionDef = {
  id: 'paydunya',
  title: 'PayDunya',
  subtitle: 'Les clés privées sont gérées dans l\'écran dédié (masquées).',
  icon: 'credit_card',
  fields: [
    {
      key: 'paydunya.mode',
      label: 'Mode',
      kind: 'select',
      options: [
        { value: 'test', label: 'Test (sandbox)' },
        { value: 'live', label: 'Live (production)' },
      ],
    },
    { key: 'paydunya.storeName', label: 'Nom de la boutique', kind: 'text' },
    { key: 'paydunya.debitAccountNumber', label: 'Numéro de compte de débit', kind: 'text' },
    {
      key: 'paydunya.minAmount',
      label: 'Montant minimum paiement',
      kind: 'number',
      unit: 'FCFA',
      min: 0,
    },
    {
      key: 'paydunya.minWithdrawal',
      label: 'Retrait minimum',
      kind: 'number',
      unit: 'FCFA',
      min: 0,
    },
  ],
}

/** Section 4 — Devises & International CEDEAO. */
const CURRENCY: SectionDef = {
  id: 'currency',
  title: 'Devises & International',
  subtitle: 'Devise par défaut, liste autorisée et tarification CEDEAO.',
  icon: 'public',
  fields: [
    { key: 'currency.default', label: 'Devise par défaut', kind: 'text', description: 'Code ISO 4217 (ex. XOF).' },
    {
      key: 'currency.supported',
      label: 'Devises supportées',
      kind: 'string-array',
      description: 'Codes ISO autorisés (XOF, EUR, USD…).',
    },
    {
      key: 'international.enabled',
      label: 'International activé',
      kind: 'boolean',
      description: 'Active la tarification + les paires CEDEAO.',
    },
    {
      key: 'international.maxWeightKg',
      label: 'Poids maximum',
      kind: 'number',
      unit: 'kg',
      min: 0,
    },
    {
      key: 'international.customsSurchargeXof',
      label: 'Surcharge douane',
      kind: 'number',
      unit: 'FCFA',
      min: 0,
    },
    {
      key: 'international.exchangeRates',
      label: 'Taux de change',
      kind: 'json',
      description: 'JSON { "EUR": 655.957, ... }',
    },
    {
      key: 'international.countryPairs',
      label: 'Paires de pays',
      kind: 'json',
      description: 'JSON { "SN-CI": { "baseXof": ..., ... } }',
    },
    {
      key: 'international.requiredDocuments',
      label: 'Documents requis',
      kind: 'json',
      description: 'JSON { "SN-CI": ["invoice", "passport"] }',
    },
  ],
}

/** Section 5 — Timings (polling, timeouts, fenêtres métier). */
const TIMINGS: SectionDef = {
  id: 'timings',
  title: 'Temporisation',
  subtitle: 'Polling clients, timeouts HTTP, fenêtres d\'édition.',
  icon: 'timer',
  fields: [
    { key: 'timings.parcelStatusPollMs', label: 'Poll statut colis', kind: 'number', unit: 'ms', min: 1000 },
    { key: 'timings.parcelsListPollMs', label: 'Poll liste colis', kind: 'number', unit: 'ms', min: 1000 },
    { key: 'timings.announcementsFeedPollMs', label: 'Poll annonces', kind: 'number', unit: 'ms', min: 1000 },
    { key: 'timings.journeyPositionsPollMs', label: 'Poll positions GPS', kind: 'number', unit: 'ms', min: 1000 },
    { key: 'timings.operationsDashboardPollMs', label: 'Poll dashboard ops', kind: 'number', unit: 'ms', min: 1000 },
    { key: 'timings.driverDiscoveryPollMs', label: 'Poll découverte chauffeurs', kind: 'number', unit: 'ms', min: 1000 },
    { key: 'timings.apiRequestTimeoutMs', label: 'Timeout requête API', kind: 'number', unit: 'ms', min: 1000 },
    { key: 'timings.geolocationTimeoutMs', label: 'Timeout géolocalisation', kind: 'number', unit: 'ms', min: 1000 },
    { key: 'timings.googleAuthTimeoutMs', label: 'Timeout Google Auth', kind: 'number', unit: 'ms', min: 1000 },
    { key: 'timings.locationUploadIntervalSec', label: 'Intervalle upload GPS', kind: 'number', unit: 's', min: 1 },
    { key: 'timings.locationFreshnessSec', label: 'Fraîcheur GPS acceptée', kind: 'number', unit: 's', min: 1 },
    { key: 'timings.messageEditWindowMs', label: 'Fenêtre édition message', kind: 'number', unit: 'ms', min: 0 },
    { key: 'timings.broadcastSnoozeHours', label: 'Durée snooze bandeau', kind: 'number', unit: 'h', min: 0 },
    { key: 'timings.positionTtlMs', label: 'TTL position GPS', kind: 'number', unit: 'ms', min: 1000 },
    { key: 'timings.webhookRetryBackoffBaseMs', label: 'Backoff webhook de base', kind: 'number', unit: 'ms', min: 1000 },
    { key: 'timings.webhookPollIntervalMs', label: 'Poll webhook (worker)', kind: 'number', unit: 'ms', min: 1000 },
    { key: 'timings.webhookMaxAttempts', label: 'Tentatives webhook max', kind: 'number', min: 1 },
    { key: 'timings.pwaSyncMaxAttempts', label: 'Tentatives sync PWA max', kind: 'number', min: 1 },
  ],
}

/** Section 6 — Limites formulaires & imports. */
const LIMITS: SectionDef = {
  id: 'limits',
  title: 'Limites formulaires',
  subtitle: 'Tailles max de champs, imports CSV, photos.',
  icon: 'rule',
  fields: [
    { key: 'limits.csvMaxLines', label: 'Lignes CSV max', kind: 'number', min: 1 },
    { key: 'limits.csvMaxBytes', label: 'Taille CSV max', kind: 'number', unit: 'octets', min: 1024 },
    { key: 'limits.routesCsvMaxBytes', label: 'Taille CSV routes max', kind: 'number', unit: 'octets', min: 1024 },
    { key: 'limits.maxStopsPerRoute', label: 'Arrêts max / route', kind: 'number', min: 1 },
    { key: 'limits.maxDeparturesPerPublish', label: 'Départs max / publication', kind: 'number', min: 1 },
    { key: 'limits.parcelWeightLightKg', label: 'Poids seuil "léger"', kind: 'number', unit: 'kg', min: 0 },
    { key: 'limits.parcelPhotosMax', label: 'Photos max / colis', kind: 'number', min: 0 },
    { key: 'limits.parcelDescriptionMaxChars', label: 'Description colis — max', kind: 'number', unit: 'chars', min: 1 },
    { key: 'limits.parcelDescriptionLongMaxChars', label: 'Description longue — max', kind: 'number', unit: 'chars', min: 1 },
    { key: 'limits.addressMaxChars', label: 'Adresse — max', kind: 'number', unit: 'chars', min: 1 },
    { key: 'limits.phoneMaxChars', label: 'Téléphone — max', kind: 'number', unit: 'chars', min: 1 },
    { key: 'limits.annonceDescriptionMaxChars', label: 'Description annonce — max', kind: 'number', unit: 'chars', min: 1 },
    { key: 'limits.cashJustificationMaxChars', label: 'Justification espèces — max', kind: 'number', unit: 'chars', min: 1 },
    { key: 'limits.disputeDescriptionMaxChars', label: 'Description litige — max', kind: 'number', unit: 'chars', min: 1 },
    { key: 'limits.imageMaxDimension', label: 'Dimension image max', kind: 'number', unit: 'px', min: 100 },
    { key: 'limits.imageJpegQuality', label: 'Qualité JPEG', kind: 'number', min: 0.1, max: 1 },
    { key: 'limits.zonePageSize', label: 'Pagination zones', kind: 'number', min: 1 },
    { key: 'limits.zoneMaxPages', label: 'Pages max (zones)', kind: 'number', min: 1 },
  ],
}

/** Section 7 — Branding & Notifications. */
const BRANDING: SectionDef = {
  id: 'branding',
  title: 'Branding & Notifications',
  subtitle: 'Nom de l\'app, couleurs, logos, favicon, icônes notification.',
  icon: 'palette',
  fields: [
    { key: 'branding.appName', label: 'Nom de l\'application', kind: 'text' },
    { key: 'branding.shortName', label: 'Nom court (PWA)', kind: 'text' },
    { key: 'branding.themeColor', label: 'Couleur thème', kind: 'color' },
    { key: 'branding.backgroundColor', label: 'Couleur de fond', kind: 'color' },
    { key: 'branding.primaryColor', label: 'Couleur primaire', kind: 'color' },
    { key: 'branding.secondaryColor', label: 'Couleur secondaire', kind: 'color' },
    { key: 'branding.logoUrl', label: 'URL du logo', kind: 'url' },
    { key: 'branding.logoDarkUrl', label: 'URL du logo (dark)', kind: 'url' },
    { key: 'branding.faviconUrl', label: 'URL du favicon', kind: 'url' },
    { key: 'branding.iconUrl', label: 'URL icône notification', kind: 'url' },
    { key: 'branding.badgeUrl', label: 'URL badge notification', kind: 'url' },
    { key: 'notifications.fallbackTitle', label: 'Titre notification par défaut', kind: 'text' },
    { key: 'notifications.fallbackBody', label: 'Corps notification par défaut', kind: 'text' },
    { key: 'notifications.defaultIconUrl', label: 'URL icône par défaut', kind: 'url' },
    { key: 'notifications.defaultBadgeUrl', label: 'URL badge par défaut', kind: 'url' },
    {
      key: 'notifications.highPriorityValues',
      label: 'Valeurs haute priorité',
      kind: 'string-array',
      description: 'Valeurs de `payload.priority` déclenchant `requireInteraction`.',
    },
  ],
}

/** Section 8 — Support & Légal. */
const SUPPORT: SectionDef = {
  id: 'support',
  title: 'Support & Légal',
  subtitle: 'Coordonnées support, mentions légales et aide.',
  icon: 'support_agent',
  fields: [
    { key: 'support.phone', label: 'Téléphone support', kind: 'text' },
    { key: 'support.email', label: 'Email support', kind: 'text' },
    { key: 'support.technicalPhone', label: 'Téléphone support technique', kind: 'text' },
    { key: 'support.technicalEmail', label: 'Email support technique', kind: 'text' },
    { key: 'support.responseTime', label: 'Délai de réponse affiché', kind: 'text' },
    { key: 'support.availability', label: 'Horaires affichés', kind: 'text' },
    { key: 'legal.companyName', label: 'Raison sociale', kind: 'text' },
    { key: 'legal.address', label: 'Adresse siège', kind: 'textarea' },
    { key: 'legal.registrationNumber', label: 'RCCM / SIREN', kind: 'text' },
    { key: 'legal.cdpAuthorization', label: 'Autorisation CDP', kind: 'text' },
    { key: 'legal.privacyEmail', label: 'Email délégué RGPD', kind: 'text' },
    { key: 'legal.publisherName', label: 'Nom du directeur de publication', kind: 'text' },
    { key: 'legal.hostName', label: 'Nom de l\'hébergeur', kind: 'text' },
    { key: 'legal.directorName', label: 'Nom du directeur', kind: 'text' },
    { key: 'legal.directorEmail', label: 'Email du directeur', kind: 'text' },
    { key: 'legal.technicalDirectorName', label: 'Nom du directeur technique', kind: 'text' },
    { key: 'legal.technicalDirectorEmail', label: 'Email du directeur technique', kind: 'text' },
    { key: 'help.topics', label: 'Thèmes d\'aide', kind: 'json', description: 'Liste [{ icon, title }]' },
    { key: 'help.faqs', label: 'FAQ', kind: 'json', description: 'Liste [{ question, answer }]' },
    { key: 'help.guides', label: 'Guides audio', kind: 'json', description: 'Liste [{ id, language, title, text, audioUrl, published }]' },
  ],
}

/** Section 9 — Annulation, retraits, soldes. */
const CANCELLATION: SectionDef = {
  id: 'cancellation',
  title: 'Annulation & Retraits',
  subtitle: 'Motifs d\'annulation et plafonds de retrait.',
  icon: 'cancel',
  fields: [
    {
      key: 'cancellation.reasons',
      label: 'Motifs d\'annulation',
      kind: 'json',
      description: 'Liste [{ value, label }] exposée au client.',
    },
    { key: 'withdrawal.minAmount', label: 'Retrait minimum', kind: 'number', unit: 'FCFA', min: 0 },
    { key: 'withdrawal.maxAmount', label: 'Retrait maximum', kind: 'number', unit: 'FCFA', min: 0 },
    { key: 'withdrawal.maxPerDay', label: 'Retrait max / jour', kind: 'number', unit: 'FCFA', min: 0 },
  ],
}

/** Section 10 — Points, score, fidélité, parrainage. */
const POINTS: SectionDef = {
  id: 'points',
  title: 'Points & Fidélité',
  subtitle: 'Barème de points, parrainage et score chauffeur.',
  icon: 'stars',
  fields: [
    { key: 'score.deliveryCompleted', label: 'Points livraison réussie', kind: 'number', min: 0 },
    { key: 'score.signupBonus', label: 'Bonus inscription', kind: 'number', min: 0 },
    { key: 'score.cfaPerPoint', label: 'Valeur du point', kind: 'number', unit: 'FCFA/pt', min: 0 },
    { key: 'score.commitmentFee', label: 'Frais d\'engagement', kind: 'number', unit: 'FCFA', min: 0 },
    {
      key: 'score.packs',
      label: 'Packs de points achetables',
      kind: 'json',
      description: 'Liste [100, 500, 1000, …] exposée au driver.',
    },
    { key: 'points.deliveryCompleted', label: 'Points livraison (alias)', kind: 'number', min: 0 },
    { key: 'points.signupBonus', label: 'Bonus inscription (alias)', kind: 'number', min: 0 },
    { key: 'referral.rewardPoints', label: 'Points parrain', kind: 'number', min: 0 },
    { key: 'referral.referreeRewardPoints', label: 'Points filleul', kind: 'number', min: 0 },
    { key: 'referral.minParcelsBeforeReward', label: 'Colis min avant récompense', kind: 'number', min: 0 },
  ],
}

/** Section 11 — Avancé (fraude, anomalies, scoring, finance, brevo). */
const ADVANCED: SectionDef = {
  id: 'advanced',
  title: 'Avancé',
  subtitle: 'Fraude, anomalies, scoring chauffeur, finance, Brevo.',
  icon: 'tune',
  fields: [
    { key: 'fraud.enabled', label: 'Fraude — activée', kind: 'boolean' },
    { key: 'fraud.scoreThreshold', label: 'Fraude — seuil de score', kind: 'number', min: 0, max: 100 },
    { key: 'fraud.ipRateLimit', label: 'Fraude — limite /IP', kind: 'number', min: 0 },
    { key: 'anomaly.enabled', label: 'Anomalies — activées', kind: 'boolean' },
    { key: 'anomaly.gpsSilenceMinutes', label: 'Silence GPS alerte', kind: 'number', unit: 'min', min: 1 },
    { key: 'anomaly.deviationThresholdKm', label: 'Déviation route alerte', kind: 'number', unit: 'km', min: 0 },
    { key: 'anomaly.stopRadiusMeters', label: 'Rayon arrêt', kind: 'number', unit: 'm', min: 0 },
    { key: 'driverScoring.enabled', label: 'Scoring chauffeur — activé', kind: 'boolean' },
    {
      key: 'driverScoring.weights',
      label: 'Poids des critères',
      kind: 'json',
      description: 'JSON { ponctualite: 0.3, note: 0.4, … }',
    },
    { key: 'finance.autoRepayDebt', label: 'Remboursement auto dette', kind: 'boolean' },
    { key: 'brevo.sender', label: 'Expéditeur Brevo (email)', kind: 'text' },
    { key: 'brevo.senderName', label: 'Nom de l\'expéditeur', kind: 'text' },
    { key: 'brevo.smsSender', label: 'Expéditeur SMS Brevo', kind: 'text' },
    { key: 'brevo.enabled', label: 'Brevo activé', kind: 'boolean' },
  ],
}

export const SYSTEM_CONFIG_SECTIONS: SectionDef[] = [
  AUTH,
  COMMISSION,
  PAYDUNYA,
  CURRENCY,
  TIMINGS,
  LIMITS,
  BRANDING,
  SUPPORT,
  CANCELLATION,
  POINTS,
  ADVANCED,
]

/** Liste à plat de toutes les clés référencées par le schéma. Utile pour
 *  calculer les clés "orphelines" (en DB mais pas dans le schéma) et les
 *  afficher dans l'onglet « Avancé — clés brutes ». */
export const SCHEMA_KEYS: Set<string> = new Set(
  SYSTEM_CONFIG_SECTIONS.flatMap((s) => s.fields.map((f) => f.key)),
)

/** Récupère la valeur stockée en DB pour une clé donnée, en tolérant les
 *  deux conventions historiques : valeur directe OU enveloppée `{ value }`. */
export function unwrapValue(raw: unknown): unknown {
  if (raw && typeof raw === 'object' && !Array.isArray(raw) && 'value' in raw) {
    return (raw as { value: unknown }).value
  }
  return raw
}

/** Normalise une entrée utilisateur pour un champ donné avant envoi API.
 *  Jette si la valeur est invalide pour le `kind` du champ (ex. couleur
 *  non-hex, nombre négatif, JSON parseable). */
export function parseFieldInput(field: FieldDef, raw: string): unknown {
  switch (field.kind) {
    case 'number': {
      const n = Number(raw)
      if (!Number.isFinite(n)) throw new Error('Valeur numérique attendue')
      if (field.min != null && n < field.min) throw new Error(`Doit être ≥ ${field.min}`)
      if (field.max != null && n > field.max) throw new Error(`Doit être ≤ ${field.max}`)
      return n
    }
    case 'color': {
      const s = raw.trim()
      if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(s)) {
        throw new Error('Couleur hex attendue (#RGB, #RRGGBB, #RRGGBBAA)')
      }
      return s
    }
    case 'url': {
      const s = raw.trim()
      if (s.length === 0) return ''
      if (!s.startsWith('/') && !/^https?:\/\//i.test(s)) {
        throw new Error('URL absolue (http(s)://) ou chemin (/...) attendu')
      }
      return s
    }
    case 'boolean':
      return raw === 'true' || raw === '1' || raw === 'on'
    case 'json': {
      const s = raw.trim()
      if (s.length === 0) return null
      try {
        return JSON.parse(s)
      } catch {
        throw new Error('JSON invalide')
      }
    }
    case 'string-array': {
      // Entrées séparées par virgule ou retour ligne.
      return raw
        .split(/[\n,]/)
        .map((v) => v.trim())
        .filter((v) => v.length > 0)
    }
    case 'select':
    case 'text':
    case 'textarea':
    default:
      return raw
  }
}

/** Sérialise une valeur venue de l'API en chaîne affichable dans l'input. */
export function stringifyFieldValue(field: FieldDef, value: unknown): string {
  const unwrapped = unwrapValue(value)
  if (unwrapped == null) return ''
  switch (field.kind) {
    case 'boolean':
      return unwrapped === true || unwrapped === 'true' ? 'true' : 'false'
    case 'json':
      try {
        return JSON.stringify(unwrapped, null, 2)
      } catch {
        return String(unwrapped)
      }
    case 'string-array':
      return Array.isArray(unwrapped) ? unwrapped.map(String).join(', ') : String(unwrapped)
    case 'number':
      return typeof unwrapped === 'number' ? String(unwrapped) : String(unwrapped)
    default:
      return typeof unwrapped === 'string' ? unwrapped : String(unwrapped)
  }
}
