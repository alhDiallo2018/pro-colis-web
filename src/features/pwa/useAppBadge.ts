import { useEffect } from 'react'

// Badging API (W3C).
//   Chrome/Edge desktop + Android : pleinement supporté quand l'app est installée.
//   Safari iOS : supporté depuis iOS 16.4 pour les PWA installées.
//   Firefox / Safari macOS non PWA : non supporté — l'appel échoue
//   silencieusement grâce au feature-detect, aucun fallback n'est utile.

// Les lib.dom récentes déclarent déjà `setAppBadge` sur Navigator avec un
// retour `Promise<void>` non-optionnel : on ne redéfinit donc que l'accès
// typé pour les navigateurs qui ne l'implémentent pas, via un simple cast
// à la lecture du prototype.
interface NavigatorWithBadge {
  setAppBadge?: (count?: number) => Promise<void>
  clearAppBadge?: () => Promise<void>
}

function supportsBadging(): boolean {
  if (typeof navigator === 'undefined') return false
  return 'setAppBadge' in navigator
}

/**
 * Applique un badge numérique sur l'icône installée.
 *
 * `count <= 0` efface le badge au lieu d'afficher "0" : un zéro visible est
 * du bruit qui pousse l'utilisateur à ouvrir l'app pour rien.
 */
export function useAppBadge(count: number | null | undefined) {
  useEffect(() => {
    if (!supportsBadging()) return
    const nav = navigator as unknown as NavigatorWithBadge
    const safe = typeof count === 'number' && count > 0 ? count : 0
    const task = safe > 0 ? nav.setAppBadge?.(safe) : nav.clearAppBadge?.()
    // Les navigateurs renvoient une Promise ; on ignore un éventuel rejet
    // (user a révoqué la permission, mode privé) pour ne pas remonter une
    // erreur côté UI qui ne peut rien y faire.
    task?.catch(() => {})
  }, [count])
}

/** Impératif : utile depuis un callback d'événement (clic marquer-tout-lu). */
export function clearAppBadge() {
  if (!supportsBadging()) return
  const nav = navigator as unknown as NavigatorWithBadge
  nav.clearAppBadge?.().catch(() => {})
}
