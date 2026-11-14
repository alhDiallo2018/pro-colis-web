import { api } from './client'

/**
 * Self-service des clés API pour les expéditeurs professionnels.
 *
 * Toutes les routes passent par `authenticate` seulement : le backend filtre
 * les clés sur `createdById = req.user.id`, donc un expéditeur ne peut voir
 * ni muter les clés d'un autre compte. Le secret en clair n'est renvoyé que
 * lors de la création (`secretOnce`) et après rotation ; on ne le stocke
 * jamais ni on ne le réaffiche.
 */

export type BusinessApiKeyScope = 'parcel.read' | 'parcel.write' | 'webhook.receive'

export const BUSINESS_API_KEY_SCOPES: BusinessApiKeyScope[] = [
  'parcel.read',
  'parcel.write',
  'webhook.receive',
]

export interface BusinessApiKey {
  id: string
  keyId: string
  partnerName: string
  scopes: BusinessApiKeyScope[]
  active: boolean
  webhookUrl?: string | null
  /** Indique uniquement si un secret de webhook est configuré — la valeur n'est jamais réexposée. */
  hasWebhookSecret: boolean
  lastUsedAt?: string | null
  rotatedAt?: string | null
  createdAt: string
}

export interface BusinessApiKeyWithSecret extends BusinessApiKey {
  /** `keyId.secret` — affiché une fois seulement à la création/rotation. */
  secretOnce?: string
  /** Secret du webhook — généré si laissé vide côté client. */
  webhookSecretOnce?: string
}

export interface CreateBusinessApiKeyPayload {
  partnerName: string
  scopes: BusinessApiKeyScope[]
  webhookUrl?: string
  webhookSecret?: string
}

export interface UpdateBusinessApiKeyPayload {
  partnerName?: string
  scopes?: BusinessApiKeyScope[]
  webhookUrl?: string | null
  active?: boolean
}

export async function listBusinessApiKeys(): Promise<BusinessApiKey[]> {
  const { data } = await api.get('/business-shipper/api-keys')
  return (data.data?.keys ?? data.keys ?? []) as BusinessApiKey[]
}

export async function createBusinessApiKey(
  payload: CreateBusinessApiKeyPayload,
): Promise<BusinessApiKeyWithSecret> {
  const { data } = await api.post('/business-shipper/api-keys', payload)
  return (data.data?.key ?? data.key) as BusinessApiKeyWithSecret
}

export async function rotateBusinessApiKey(keyId: string): Promise<BusinessApiKeyWithSecret> {
  const { data } = await api.post(`/business-shipper/api-keys/${keyId}/rotate`)
  return (data.data?.key ?? data.key) as BusinessApiKeyWithSecret
}

export async function updateBusinessApiKey(
  keyId: string,
  payload: UpdateBusinessApiKeyPayload,
): Promise<BusinessApiKey> {
  const { data } = await api.patch(`/business-shipper/api-keys/${keyId}`, payload)
  return (data.data?.key ?? data.key) as BusinessApiKey
}

export async function deactivateBusinessApiKey(keyId: string): Promise<BusinessApiKey> {
  const { data } = await api.post(`/business-shipper/api-keys/${keyId}/deactivate`)
  return (data.data?.key ?? data.key) as BusinessApiKey
}
