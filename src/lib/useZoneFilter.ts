import { useMemo, useState } from 'react'
import { filterByHomeZone, getHomeZone, type RouteLike } from '@/lib/homeZone'
import { useAuthStore } from '@/store/auth'

export type ZoneFilterMode = 'all' | 'zone'

/**
 * Bascule « Toutes / Ma zone » commune aux listes de trajets.
 *
 * Chauffeurs comme clients parcourent des listes géographiques — colis libres
 * d'un côté, annonces de trajets de l'autre — et doivent pouvoir se limiter à
 * leur zone ou ouvrir la vue en grand. Le hook porte le filtrage, le composant
 * le contrôle : un écran peut placer le sélecteur où il veut dans son en-tête.
 *
 * Sans zone renseignée le mode « Ma zone » n'est pas proposé — il ne ramènerait
 * rien — et la liste reste en « Toutes ».
 */
export function useZoneFilter<T extends RouteLike>(items: T[], defaultMode: ZoneFilterMode = 'all') {
  const user = useAuthStore((s) => s.user)
  const zone = getHomeZone(user)
  const hasZone = !!(zone.id || zone.name)
  const [mode, setMode] = useState<ZoneFilterMode>(defaultMode)

  // Un compte qui perd sa zone ne doit pas rester bloqué sur une liste vide.
  const effectiveMode: ZoneFilterMode = hasZone ? mode : 'all'

  const filtered = useMemo(
    () => (effectiveMode === 'zone' ? filterByHomeZone(items, user) : items),
    [items, user, effectiveMode],
  )

  return { items: filtered, mode: effectiveMode, setMode, hasZone, zone }
}
