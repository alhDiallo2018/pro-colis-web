import { api } from './client'

/** GET /super-admin/system/health — sonde applicative (API + base). */
export interface SystemHealth {
  status: 'healthy' | 'degraded'
  database: string
  /** Durée depuis le dernier démarrage du process API, en secondes. */
  uptime: number
  timestamp: string
}

export async function systemHealth(): Promise<SystemHealth> {
  const { data } = await api.get('/super-admin/system/health')
  return {
    status: (data.status ?? 'degraded') as SystemHealth['status'],
    database: data.database ?? 'unknown',
    uptime: Number(data.uptime ?? 0),
    timestamp: data.timestamp ?? new Date().toISOString(),
  }
}

/** Abonnement sortant : l'API poste les événements choisis vers `url`. */
export interface Webhook {
  id: string
  url: string
  events: string[]
  /** Le secret de signature n'est jamais relu : seule sa présence est exposée. */
  hasSecret?: boolean
  isActive?: boolean
  createdAt?: string
}

export async function listWebhooks(): Promise<Webhook[]> {
  const { data } = await api.get('/webhooks')
  return (data.webhooks ?? data.data ?? []) as Webhook[]
}

export async function createWebhook(payload: { url: string; events: string[]; secret?: string }): Promise<Webhook> {
  const { data } = await api.post('/webhooks', payload)
  return (data.webhook ?? data.data) as Webhook
}

export async function deleteWebhook(webhookId: string): Promise<void> {
  await api.delete(`/webhooks/${webhookId}`)
}

// --- Sauvegardes PostgreSQL ---

export type BackupStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface Backup {
  id: string
  status: BackupStatus
  /** Nom du dump sur le volume ; le téléchargement passe par la route dédiée. */
  fileName: string | null
  sizeBytes: number | null
  requestedBy?: string | null
  requesterName?: string | null
  errorMessage?: string | null
  completedAt?: string | null
  createdAt: string
}

export interface BackupList {
  backups: Backup[]
  /** Faux quand `BACKUP_ALLOW_RESTORE` n'est pas activé sur le déploiement. */
  restoreEnabled: boolean
  retention: number
}

export async function listBackups(): Promise<BackupList> {
  const { data } = await api.get('/super-admin/backups')
  return {
    backups: (data.backups ?? []) as Backup[],
    restoreEnabled: Boolean(data.restoreEnabled),
    retention: Number(data.retention ?? 0),
  }
}

/** Lance un `pg_dump` : l'API répond 202, le dump se poursuit en arrière-plan. */
export async function createBackup(): Promise<Backup> {
  const { data } = await api.post('/super-admin/backup')
  return (data.backup ?? data.data) as Backup
}

/**
 * Télécharge le dump. La route exige le jeton de session : on récupère un blob
 * plutôt que d'ouvrir un lien direct, qui partirait sans en-tête d'autorisation.
 */
export async function downloadBackup(backup: Backup): Promise<void> {
  const response = await api.get(`/super-admin/backups/${backup.id}/download`, { responseType: 'blob' })
  const url = URL.createObjectURL(response.data as Blob)
  const link = document.createElement('a')
  link.href = url
  link.download = backup.fileName ?? `procolis-${backup.id}.dump`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/** Restauration : écrase la base entière, d'où la confirmation littérale. */
export async function restoreBackup(backupId: string): Promise<void> {
  await api.post('/super-admin/restore', { backupId, confirmation: 'RESTORE' })
}
