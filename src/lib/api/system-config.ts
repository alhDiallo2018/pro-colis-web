import { api } from './client'

/** Une clé à plat telle qu'elle existe en DB. */
export interface SystemConfigKey {
  key: string
  value: unknown
  updatedAt: string | null
  updatedBy: string | null
}

/** Réponse de `GET /admin/system-config` :
 *  - `groups` regroupe les clés par préfixe (ex. `timings`, `limits`, …).
 *  - `keys` liste à plat (utile pour un éditeur avancé "clé par clé"). */
export interface SystemConfigDump {
  groups: Record<string, unknown>
  keys: SystemConfigKey[]
  count: number
}

/** Entrée d'une mutation batch. */
export interface SystemConfigUpdate {
  key: string
  value: unknown
}

/** Lit toute la table `system_configs` (super admin uniquement).
 *  Les valeurs sont renvoyées en JSON brut : le mapping UI (color picker,
 *  number input, …) est côté client dans `systemConfigSchema.ts`. */
export async function getSystemConfig(): Promise<SystemConfigDump> {
  const { data } = await api.get('/admin/system-config')
  return {
    groups: (data?.groups ?? {}) as Record<string, unknown>,
    keys: Array.isArray(data?.keys) ? (data.keys as SystemConfigKey[]) : [],
    count: typeof data?.count === 'number' ? data.count : 0,
  }
}

/** Met à jour une clé unique. Ignore les clés protégées (paydunya.masterKey,
 *  brevo.apiKey, …) côté serveur : utiliser les endpoints dédiés. */
export async function updateSystemConfigKey(
  key: string,
  value: unknown,
): Promise<{ key: string; value: unknown; cacheInvalidated: boolean }> {
  const { data } = await api.put(`/admin/system-config/${encodeURIComponent(key)}`, { value })
  return {
    key: data?.key ?? key,
    value: data?.value ?? value,
    cacheInvalidated: Boolean(data?.cacheInvalidated),
  }
}

/** Supprime une clé (retour aux defaults). */
export async function deleteSystemConfigKey(
  key: string,
): Promise<{ key: string; cacheInvalidated: boolean }> {
  const { data } = await api.delete(`/admin/system-config/${encodeURIComponent(key)}`)
  return {
    key: data?.key ?? key,
    cacheInvalidated: Boolean(data?.cacheInvalidated),
  }
}

/** Mutation batch : plusieurs clés en une seule transaction + invalidation
 *  dédupliquée par groupe. Préférer à N appels unitaires pour les écrans
 *  "section" qui enregistrent 10-20 clés d'un coup. */
export async function batchUpdateSystemConfig(
  updates: SystemConfigUpdate[],
): Promise<{ keys: string[]; count: number; cacheInvalidatedGroups: string[] }> {
  const { data } = await api.put('/admin/system-config/batch', { updates })
  return {
    keys: Array.isArray(data?.keys) ? data.keys : updates.map((u) => u.key),
    count: typeof data?.count === 'number' ? data.count : updates.length,
    cacheInvalidatedGroups: Array.isArray(data?.cacheInvalidatedGroups)
      ? data.cacheInvalidatedGroups
      : [],
  }
}
