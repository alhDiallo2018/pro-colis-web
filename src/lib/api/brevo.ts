import { api } from './client'

export interface BrevoEmailParams {
  to: string
  toName?: string
  subject: string
  htmlContent: string
  textContent?: string
  cc?: string[]
  bcc?: string[]
  templateId?: number
  params?: Record<string, string>
}

export interface BrevoSmsParams {
  to: string
  content: string
  senderName?: string
}

export interface BrevoConfig {
  provider: 'brevo'
  apiKey: string
  senderEmail: string
  senderName: string
  smsSender: string
}

export interface SendResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Envoie un email transactionnel via Brevo (via le backend API).
 * L'API backend se charge d'appeler l'API Brevo avec la clé serveur.
 */
export async function sendEmail(params: BrevoEmailParams): Promise<SendResult> {
  const { data } = await api.post('/notifications/email/send', params)
  return data as SendResult
}

/**
 * Envoie un SMS transactionnel via Brevo (via le backend API).
 */
export async function sendSms(params: BrevoSmsParams): Promise<SendResult> {
  const { data } = await api.post('/notifications/sms/send', params)
  return data as SendResult
}

/**
 * Envoie un email de manière groupée (bulk) via Brevo.
 */
export async function sendBulkEmail(
  recipients: Array<{ email: string; name?: string }>,
  subject: string,
  htmlContent: string,
): Promise<SendResult> {
  const { data } = await api.post('/notifications/email/send-bulk', {
    recipients,
    subject,
    htmlContent,
  })
  return data as SendResult
}

/**
 * Récupère la configuration Brevo (super admin uniquement).
 */
export async function getBrevoConfig(): Promise<BrevoConfig | null> {
  const { data } = await api.get('/admin/notifications/brevo-config')
  return (data.config ?? null) as BrevoConfig | null
}

/**
 * Met à jour la configuration Brevo (super admin uniquement).
 */
export async function updateBrevoConfig(config: Partial<BrevoConfig>): Promise<BrevoConfig> {
  const { data } = await api.put('/admin/notifications/brevo-config', config)
  return data.config as BrevoConfig
}

/**
 * Teste la connexion Brevo en envoyant un email de test.
 */
export async function testBrevoConnection(testEmail: string): Promise<SendResult> {
  const { data } = await api.post('/admin/notifications/brevo-test', { email: testEmail })
  return data as SendResult
}
