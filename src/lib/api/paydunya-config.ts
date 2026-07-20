import { api } from './client'

export type PaydunyaMode = 'test' | 'live'

export interface PaydunyaConfig {
  masterKey: string
  privateKey: string
  token: string
  mode: PaydunyaMode
  storeName: string
  configured: boolean
}

export interface PaydunyaConfigUpdate {
  masterKey?: string
  privateKey?: string
  token?: string
  mode?: PaydunyaMode
  storeName?: string
}

/**
 * Récupère la configuration PayDunya (super admin uniquement).
 * Les clés sont renvoyées masquées (`****XXXX`).
 */
export async function getPaydunyaConfig(): Promise<PaydunyaConfig | null> {
  const { data } = await api.get('/admin/payments/paydunya-config')
  return (data.config ?? null) as PaydunyaConfig | null
}

/**
 * Met à jour la configuration PayDunya (super admin uniquement).
 * Toute valeur commençant par `****` est ignorée côté serveur.
 */
export async function updatePaydunyaConfig(update: PaydunyaConfigUpdate): Promise<PaydunyaConfig> {
  const { data } = await api.put('/admin/payments/paydunya-config', update)
  return data.config as PaydunyaConfig
}
