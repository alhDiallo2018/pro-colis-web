/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  /** Remontée des erreurs navigateur : `false` la désactive complètement. */
  readonly VITE_FARO_ENABLED?: string
  /** Chemin du collecteur Faro, proxifié par Caddy (défaut `/collect/faro`). */
  readonly VITE_FARO_URL?: string
  /** Release estampillée sur les erreurs, alignée sur le dossier de source maps. */
  readonly VITE_APP_RELEASE?: string
  readonly VITE_APP_ENV?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
