import type { User } from '@/lib/api/types'

/**
 * Filtrage « ma zone » partagé par les chauffeurs et les clients.
 *
 * Les deux parcourent des listes de trajets — colis libres pour le chauffeur,
 * annonces de chauffeurs pour le client — et veulent pouvoir se limiter à leur
 * zone ou tout voir. La règle de rapprochement est la même des deux côtés, elle
 * vit donc ici plutôt que dans l'espace d'un seul rôle.
 */

type UserZoneFields = Pick<
  User,
  'primaryZoneId' | 'primaryZoneName' | 'zoneId' | 'zoneName' | 'city'
>

/** Tout objet portant un trajet : un colis comme une annonce. */
export interface RouteLike {
  zoneId?: string | null
  departureZoneId?: string | null
  arrivalZoneId?: string | null
  departureZoneName?: string | null
  arrivalZoneName?: string | null
  departureCity?: string | null
  arrivalCity?: string | null
}

export interface HomeZone {
  id: string | null
  name: string | null
}

/** Normalise uniquement la casse et les espaces afin de conserver une correspondance de zone exacte. */
function normalizeZoneName(value: string | null | undefined): string {
  return value?.normalize('NFC').trim().toLocaleLowerCase('fr') ?? ''
}

/**
 * Utilise la zone principale de l'utilisateur, puis son ancienne zone/garage et
 * enfin sa ville de résidence lorsque le compte ne possède pas encore de zone.
 */
export function getHomeZone(user: UserZoneFields | null | undefined): HomeZone {
  if (!user) return { id: null, name: null }

  // 1. Zone principale
  if (user.primaryZoneId || user.primaryZoneName) {
    return {
      id: user.primaryZoneId ?? null,
      name: user.primaryZoneName?.trim() || null,
    }
  }

  // 2. Zone secondaire
  if (user.zoneId || user.zoneName) {
    return {
      id: user.zoneId ?? null,
      name: user.zoneName?.trim() || null,
    }
  }

  // 3. Ville par défaut (fallback)
  return { id: null, name: user.city?.trim() || null }
}

export function hasHomeZone(user: UserZoneFields | null | undefined): boolean {
  const zone = getHomeZone(user)
  return !!(zone.id || zone.name)
}

/**
 * Un trajet correspond quand sa zone de départ ou d'arrivée est exactement
 * celle de l'utilisateur, par identifiant ou par nom. La comparaison des noms
 * ignore la casse et les espaces externes, mais pas les variantes :
 * « Dakar Plateau » n'est pas « Dakar ».
 *
 * Un utilisateur sans zone ne correspond à rien : on préfère une liste vide,
 * qui l'invite à renseigner sa zone, plutôt que tout le catalogue. Le besoin de
 * tout voir est couvert par le mode « Toutes » du filtre.
 */
export function isInHomeZone(item: RouteLike, user: UserZoneFields | null | undefined): boolean {
  const zone = getHomeZone(user)
  if (!zone.id && !zone.name) return false

  // Correspondance par identifiant (prioritaire, insensible aux libellés)
  const matchesZoneId =
    !!zone.id &&
    (item.zoneId === zone.id || item.departureZoneId === zone.id || item.arrivalZoneId === zone.id)

  // Correspondance par nom de zone, ou par ville quand la zone n'est pas nommée
  const normalizedZoneName = normalizeZoneName(zone.name)
  const matchesZoneName =
    !!normalizedZoneName &&
    [item.departureZoneName, item.departureCity, item.arrivalZoneName, item.arrivalCity].some(
      (value) => normalizeZoneName(value) === normalizedZoneName,
    )

  return matchesZoneId || matchesZoneName
}

/** Ne garde que les trajets rattachés à la zone de l'utilisateur. */
export function filterByHomeZone<T extends RouteLike>(
  items: T[],
  user: UserZoneFields | null | undefined,
): T[] {
  return items.filter((item) => isInHomeZone(item, user))
}
