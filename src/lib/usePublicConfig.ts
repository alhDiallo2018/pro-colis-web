import { useQuery } from '@tanstack/react-query'
import { getPublicConfig, type PublicConfig } from '@/lib/api/publicConfig'

/** Configuration publique partagée (commission, points, contacts support).
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
} {
  const { data } = usePublicConfig()
  return {
    email: data?.support?.email ?? '',
    phone: data?.support?.phone ?? '',
    technicalEmail: data?.support?.technicalEmail ?? '',
    technicalPhone: data?.support?.technicalPhone ?? '',
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
