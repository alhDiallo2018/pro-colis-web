import type { BrandingConfig } from '@/lib/api/publicConfig'

/**
 * Applique le branding reçu de l'API (`/public/config.branding`) à la page
 * courante :
 *  - `--color-primary` / `--color-theme` exposées à tout le CSS applicatif
 *    (DS, composants) pour piloter boutons, accents et bordures sans
 *    redéploiement.
 *  - `<meta name="theme-color">` mis à jour dynamiquement pour que la barre
 *    système du navigateur (mobile) reflète la couleur choisie par l'admin.
 *  - `<link rel="icon">` remplacé si `faviconUrl` diverge du défaut compilé :
 *    on évite une rafale de requêtes en cas d'URL identique.
 *
 * Null-safe : si `branding` est absent ou partiel, les champs manquants sont
 * ignorés et la page garde son état précédent (évite le flash of unstyled
 * content au boot, où seul `DEFAULT_BRANDING` est appliqué).
 *
 * Idempotent : peut être appelé plusieurs fois (chaque update de config), ne
 * crée pas de doublon de `<meta>` ou `<link>`.
 */
export function applyBranding(branding: Partial<BrandingConfig> | undefined | null): void {
  if (typeof document === 'undefined') return // SSR/tests Node sans DOM.
  if (!branding) return

  const root = document.documentElement

  // CSS variables : la DS les consomme via `var(--color-primary, #018982)`
  // (fallback inline au cas où la variable n'existe pas). On n'écrase pas
  // si la valeur est falsy pour tolérer un seed partiel.
  if (branding.primaryColor) {
    root.style.setProperty('--color-primary', branding.primaryColor)
  }
  if (branding.themeColor) {
    root.style.setProperty('--color-theme', branding.themeColor)
    updateMetaThemeColor(branding.themeColor)
  }
  if (branding.backgroundColor) {
    root.style.setProperty('--color-background', branding.backgroundColor)
  }
  if (branding.secondaryColor) {
    root.style.setProperty('--color-secondary', branding.secondaryColor)
  }

  if (branding.faviconUrl) {
    updateFavicon(branding.faviconUrl)
  }
}

/** Met à jour (ou crée) le `<meta name="theme-color">`. Chrome Android utilise
 *  ce meta pour la couleur de la barre d'URL ; iOS Safari l'ignore mais la
 *  valeur est aussi lue par le manifest pour les navigateurs non installés. */
function updateMetaThemeColor(color: string): void {
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'theme-color'
    document.head.appendChild(meta)
  }
  if (meta.content !== color) meta.content = color
}

/** Remplace le `<link rel="icon">` principal. On garde les autres (`type=svg`,
 *  `apple-touch-icon`) intacts : ils représentent des formats différents.
 *  Pas de nettoyage si l'URL est identique, pour éviter un rechargement inutile. */
function updateFavicon(href: string): void {
  // Préférer un `<link rel="icon">` sans `type=svg` pour écraser le favicon
  // par défaut pointant vers `/logo-procolis.png`.
  const selectors = [
    'link[rel="icon"][type="image/png"]',
    'link[rel="icon"]:not([type="image/svg+xml"])',
  ]
  let link: HTMLLinkElement | null = null
  for (const selector of selectors) {
    link = document.querySelector<HTMLLinkElement>(selector)
    if (link) break
  }
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  if (link.href.endsWith(href) || link.getAttribute('href') === href) return
  link.setAttribute('href', href)
}
