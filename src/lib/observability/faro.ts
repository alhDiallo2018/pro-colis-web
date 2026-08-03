import { ErrorsInstrumentation, initializeFaro } from '@grafana/faro-web-sdk'
import type { TransportItem } from '@grafana/faro-web-sdk'
import { redactUrl, redactValue } from './redact'

/**
 * Remontée des erreurs du navigateur vers la chaîne d'observabilité.
 *
 * Le receiver Faro d'Alloy est atteint via `POST /collect/faro`, seul chemin
 * proxifié par Caddy (voir Caddyfile). Les erreurs ainsi collectées
 * réapparaissent dans les journaux techniques sous la source « Web ».
 *
 * Périmètre volontairement étroit, conforme au README d'observabilité de l'API :
 * exceptions et promesses rejetées uniquement. Ni console, ni web vitals, ni
 * corps de requêtes Axios — ces derniers transportent des données métier.
 */

const COLLECT_PATH = '/collect/faro'

interface FaroSettings {
  url: string
  release: string
  environment: string
}

function readSettings(): FaroSettings | null {
  // Désactivable sans redéploiement de l'image via la variable d'env de build.
  if (import.meta.env.VITE_FARO_ENABLED === 'false') return null
  // En développement, aucun collecteur n'écoute : l'envoi échouerait à chaque
  // erreur et polluerait la console avec ses propres erreurs réseau.
  if (!import.meta.env.PROD) return null

  return {
    url: import.meta.env.VITE_FARO_URL || COLLECT_PATH,
    release: import.meta.env.VITE_APP_RELEASE || 'dev',
    environment: import.meta.env.VITE_APP_ENV || 'production',
  }
}

/** Purge des champs sensibles avant l'envoi, y compris dans la stack. */
function sanitizeItem(item: TransportItem): TransportItem | null {
  const payload = redactValue(item.payload) as TransportItem['payload']
  const meta = { ...item.meta }

  if (meta.page?.url) meta.page = { ...meta.page, url: redactUrl(meta.page.url) }
  // L'utilisateur connecté est identifié par son id côté API ; nom, email et
  // téléphone n'ont aucune valeur de diagnostic ici.
  if (meta.user) meta.user = { id: meta.user.id }

  return { ...item, payload, meta }
}

let initialized = false

export function initErrorReporting(): void {
  if (initialized) return
  const settings = readSettings()
  if (!settings) return
  initialized = true

  try {
    initializeFaro({
      url: settings.url,
      app: {
        name: 'procolis-web',
        version: settings.release,
        environment: settings.environment,
      },
      // Seule l'instrumentation d'erreurs est chargée : window.onerror et
      // unhandledrejection, rien d'autre.
      instrumentations: [new ErrorsInstrumentation()],
      // Une session persistante reviendrait à poser un identifiant durable sur
      // le poste de l'utilisateur pour un bénéfice de diagnostic nul.
      sessionTracking: { enabled: false },
      // Les erreurs d'extensions de navigateur et les coupures réseau ne
      // relèvent pas de la plateforme.
      ignoreErrors: [
        /ResizeObserver loop/i,
        /Network Error/i,
        /Failed to fetch/i,
        /Load failed/i,
        /chrome-extension:/i,
        /moz-extension:/i,
      ],
      beforeSend: sanitizeItem,
    })
  } catch {
    // Une collecte d'erreurs qui casse l'application est pire que pas de
    // collecte du tout.
    initialized = false
  }
}
