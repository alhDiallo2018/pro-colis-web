import type { BrandingConfig } from '@/lib/api/publicConfig'

/**
 * Applique le branding reçu de l'API (`/public/config.branding`) à la page
 * courante :
 *  - `--color-primary` / `--color-theme` exposées à tout le CSS applicatif
 *    (DS, composants) pour piloter boutons, accents et bordures sans
 *    redéploiement.
 *  - `--color-primary-rgb` (`"r g b"`) exposée pour les utilisations en
 *    opacité : `rgb(var(--color-primary-rgb) / 0.1)`.
 *  - Alias teintes `--teal-500/600/700/800` + `--color-primary-hover/-active
 *    /-soft` dérivés de la couleur admin pour que tous les composants qui
 *    consomment encore les tokens bruts du scale `teal-*` (ex. citymapper
 *    tokens, écrans dashboard) suivent la couleur choisie. L'alternative (migrer
 *    146 usages un par un) a été jugée trop invasive pour la Phase 7B.
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
    const primary = branding.primaryColor
    root.style.setProperty('--color-primary', primary)

    // Exposer la forme RGB pour les usages en opacité
    // (`rgb(var(--color-primary-rgb) / 0.1)`).
    const rgb = hexToRgb(primary)
    if (rgb) root.style.setProperty('--color-primary-rgb', rgb)

    // Dériver une échelle courte (500/600/700/800) + hover/active/soft à
    // partir de la couleur admin. Objectif : tous les composants qui
    // consomment encore `--teal-*` (DS tokens citymapper, badges, etc.)
    // suivent la couleur choisie sans migration ligne à ligne.
    const scale = deriveTealScale(primary)
    if (scale) {
      root.style.setProperty('--teal-500', scale.base)
      root.style.setProperty('--teal-600', scale.d10)
      root.style.setProperty('--teal-700', scale.d20)
      root.style.setProperty('--teal-800', scale.d30)
      root.style.setProperty('--color-primary-hover', scale.d10)
      root.style.setProperty('--color-primary-active', scale.d20)
      root.style.setProperty('--color-primary-soft', scale.soft)
    }
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

/** `#RRGGBB` → `"R G B"` (format compatible `rgb(var(--…) / <alpha>)`).
 *  Retourne `null` si l'entrée n'est pas un hex valide 6 chiffres. */
function hexToRgb(hex: string): string | null {
  const clean = hex.trim().replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  return `${r} ${g} ${b}`
}

/** `#RRGGBB` → nuances dérivées. Les shades plus foncées sont obtenues par
 *  multiplication linéaire (0.8/0.65/0.5) : pas parfait colorimétriquement
 *  mais suffisant pour préserver une hiérarchie hover/active cohérente avec
 *  l'ancienne échelle teal (500/600/700/800). `soft` est une teinte très
 *  claire (5 % d'opacité) utilisée pour les fonds de bouton ghost. */
function deriveTealScale(hex: string): { base: string; d10: string; d20: string; d30: string; soft: string } | null {
  const clean = hex.trim().replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  const darken = (factor: number): string => {
    const dr = Math.max(0, Math.min(255, Math.round(r * factor)))
    const dg = Math.max(0, Math.min(255, Math.round(g * factor)))
    const db = Math.max(0, Math.min(255, Math.round(b * factor)))
    return `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`
  }
  return {
    base: `#${clean.toLowerCase()}`,
    d10: darken(0.8),
    d20: darken(0.65),
    d30: darken(0.5),
    soft: `rgba(${r}, ${g}, ${b}, 0.1)`,
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
