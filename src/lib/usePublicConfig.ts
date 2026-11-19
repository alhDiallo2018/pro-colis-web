import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getPublicConfig,
  DEFAULT_TIMINGS,
  type PublicConfig,
  type TimingsConfig,
} from '@/lib/api/publicConfig'

/** Configuration publique partagée (commission, points, support et aide).
 *  Mise en cache par React Query ; rafraîchie à chaque démarrage de session. */
export function usePublicConfig() {
  return useQuery<PublicConfig>({
    queryKey: ['public', 'config'],
    queryFn: getPublicConfig,
    staleTime: 5 * 60_000,
  })
}

/** Politique configurée en cas de solde insuffisant. La valeur de repli
 *  (`block`) est conservatrice : sans config, aucun passage en dette. */
export function allowsDebt(policy: PublicConfig['insufficientPolicy'] | undefined): boolean {
  return policy === 'debt' || policy === 'warn'
}

/** Coordonnées du support, issues de la configuration publique. Les valeurs
 *  sont vides tant que `/public/config` n'a pas répondu (aucune valeur en dur). */
export function useSupportContact(): {
  email: string
  phone: string
  technicalEmail: string
  technicalPhone: string
  responseTime: string
  availability: string
} {
  const { data } = usePublicConfig()
  return {
    email: data?.support?.email ?? '',
    phone: data?.support?.phone ?? '',
    technicalEmail: data?.support?.technicalEmail ?? '',
    technicalPhone: data?.support?.technicalPhone ?? '',
    responseTime: data?.support?.responseTime ?? '',
    availability: data?.support?.availability ?? '',
  }
}

/** Phase 1 externalisation : paramètres d'authentification administrables.
 *  Les fallbacks (10 min / 5 tentatives) reflètent les anciennes valeurs en
 *  dur ; ils disparaîtront lorsque le seed aura alimenté `auth.*` partout. */
export function useAuthConfig(): {
  otpExpiryMinutes: number
  otpMaxAttempts: number
} {
  const { data } = usePublicConfig()
  return {
    otpExpiryMinutes: data?.auth?.otpExpiryMinutes ?? 10,
    otpMaxAttempts: data?.auth?.otpMaxAttempts ?? 5,
  }
}

/** Phase 1 externalisation : devise par défaut + liste autorisée.
 *  Remplace les `currency = 'XOF'` codés en dur dans les écrans. Le fallback
 *  conserve la devise historique pour ne pas casser l'affichage. */
export function useCurrencyConfig(): {
  default: string
  supported: string[]
} {
  const { data } = usePublicConfig()
  return {
    default: data?.currency?.default ?? 'XOF',
    supported:
      data?.currency?.supported && data.currency.supported.length > 0
        ? data.currency.supported
        : ['XOF', 'EUR', 'USD'],
  }
}

/** Phase 1 externalisation : tarification internationale. Retourne la liste
 *  des paires desservies et la limite de poids pour les formulaires de devis. */
export function useInternationalConfig(): {
  maxWeightKg: number
  countryPairs: string[]
  requiredDocuments: Record<string, string[]>
} {
  const { data } = usePublicConfig()
  return {
    maxWeightKg: data?.international?.maxWeightKg ?? 50,
    countryPairs: data?.international?.countryPairs ?? [],
    requiredDocuments: data?.international?.requiredDocuments ?? {},
  }
}

/** Identité légale (raison sociale, adresse, immatriculation, autorisation CDP,
 *  contact protection des données) issue de la configuration publique. Les
 *  champs vides indiquent que l'administrateur n'a pas encore renseigné la
 *  valeur : les pages légales affichent alors « [À COMPLÉTER] ». */
export function useLegalConfig(): {
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
} {
  const { data } = usePublicConfig()
  return {
    companyName: data?.legal?.companyName ?? '',
    address: data?.legal?.address ?? '',
    registrationNumber: data?.legal?.registrationNumber ?? '',
    cdpAuthorization: data?.legal?.cdpAuthorization ?? '',
    privacyEmail: data?.legal?.privacyEmail ?? '',
    publisherName: data?.legal?.publisherName ?? '',
    hostName: data?.legal?.hostName ?? '',
    directorName: data?.legal?.directorName ?? '',
    directorEmail: data?.legal?.directorEmail ?? '',
    technicalDirectorName: data?.legal?.technicalDirectorName ?? '',
    technicalDirectorEmail: data?.legal?.technicalDirectorEmail ?? '',
  }
}

/** Snapshot courant des timings. Fusion defaults + overrides reçus de l'API.
 *  Utilisé comme valeur de référence par les composants/hooks qui ne veulent
 *  pas abonner React à `/public/config` (ex. un `refetchInterval` dynamique
 *  recalculé à chaque render causerait des resets de timer). */
export function useTimings(): TimingsConfig {
  const { data } = usePublicConfig()
  return { ...DEFAULT_TIMINGS, ...(data?.timings ?? {}) }
}

/** Alias explicite — `usePollingConfig` est le nom exposé aux composants qui
 *  règlent uniquement leurs `refetchInterval`. */
export function usePollingConfig(): TimingsConfig {
  return useTimings()
}

/** Accès synchrone au dernier snapshot connu des timings, sans dépendre d'un
 *  rendu React. Pour les modules hors-React (axios client, Google Identity,
 *  helpers imperatifs). Doit être amorcé via `primeTimingsCache()` (appelé
 *  au boot une fois `/public/config` résolu). */
let cachedTimings: TimingsConfig = { ...DEFAULT_TIMINGS }
export function getTimings(): TimingsConfig {
  return cachedTimings
}
export function primeTimingsCache(timings: Partial<TimingsConfig> | undefined) {
  cachedTimings = { ...DEFAULT_TIMINGS, ...(timings ?? {}) }
}

/** Hook à monter une fois (dans `App.tsx`) pour pousser automatiquement les
 *  timings reçus dans le cache sync dès qu'ils arrivent. */
export function useSyncTimingsCache(): void {
  const { data } = usePublicConfig()
  if (data?.timings) primeTimingsCache(data.timings)
}

/** Permet aux tests d'injecter un snapshot complet via React Query sans
 *  passer par l'API réelle. */
export function seedPublicConfig(queryClient: ReturnType<typeof useQueryClient>, config: PublicConfig) {
  queryClient.setQueryData(['public', 'config'], config)
  if (config.timings) primeTimingsCache(config.timings)
}
