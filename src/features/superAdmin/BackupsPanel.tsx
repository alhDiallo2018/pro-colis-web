import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge, Button, Dialog, IconButton, Input, Toast } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import * as systemApi from '@/lib/api/system'
import type { Backup } from '@/lib/api/system'
import { ApiError } from '@/lib/api/client'
import { formatDateTime } from '@/lib/format'
import { useAuthStore } from '@/store/auth'

const STATUS_TONE: Record<systemApi.BackupStatus, 'green' | 'amber' | 'red' | 'neutral'> = {
  completed: 'green',
  running: 'amber',
  pending: 'neutral',
  failed: 'red',
}

const STATUS_LABEL: Record<systemApi.BackupStatus, string> = {
  completed: 'Terminée',
  running: 'En cours',
  pending: 'En attente',
  failed: 'Échouée',
}

const RESTORE_WORD = 'RESTAURER'

function formatSize(bytes: number | null): string {
  if (!bytes) return '—'
  const units = ['o', 'Ko', 'Mo', 'Go']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`
}

/**
 * Historique des sauvegardes PostgreSQL.
 *
 * Un dump contient l'intégralité des données personnelles : seul le super admin
 * peut en lancer un, le télécharger ou le restaurer — le support ne voit que
 * l'historique, pour vérifier que la cadence est tenue.
 */
export function BackupsPanel() {
  const qc = useQueryClient()
  const role = useAuthStore((s) => s.user?.role)
  const isSuperAdmin = role === 'super_admin'
  const [restoring, setRestoring] = useState<Backup | null>(null)
  const [confirmText, setConfirmText] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['admin', 'backups'],
    queryFn: () => systemApi.listBackups(),
    // Le dump tourne en arrière-plan : on rafraîchit tant qu'une ligne est en
    // cours, puis on arrête d'interroger l'API.
    refetchInterval: (q) => (q.state.data?.backups.some((b) => b.status === 'running') ? 3000 : false),
  })

  const create = useMutation({
    mutationFn: () => systemApi.createBackup(),
    onSuccess: () => {
      setNotice('Sauvegarde lancée. Elle apparaîtra comme terminée une fois le dump écrit.')
      qc.invalidateQueries({ queryKey: ['admin', 'backups'] })
    },
  })

  const restore = useMutation({
    mutationFn: (backupId: string) => systemApi.restoreBackup(backupId),
    onSuccess: () => {
      setNotice("Restauration lancée. L'API est indisponible le temps de l'opération.")
      setRestoring(null)
      setConfirmText('')
    },
  })

  const download = async (backup: Backup) => {
    setDownloadingId(backup.id)
    try {
      await systemApi.downloadBackup(backup)
    } catch {
      setNotice('Téléchargement impossible : le fichier a peut-être été purgé.')
    } finally {
      setDownloadingId(null)
    }
  }

  const createError = create.error instanceof ApiError ? create.error.message : null
  const restoreError = restore.error instanceof ApiError ? restore.error.message : null

  return (
    <>
      <Panel
        title={`Sauvegardes${query.data ? ` · ${query.data.backups.length}` : ''}`}
        action={
          isSuperAdmin && (
            <Button
              size="sm"
              icon="backup"
              loading={create.isPending}
              disabled={query.data?.backups.some((b) => b.status === 'running')}
              onClick={() => create.mutate()}
            >
              Sauvegarder maintenant
            </Button>
          )
        }
        flush
      >
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--slate-100)', fontSize: 12.5, color: 'var(--text-muted)' }}>
          Dump PostgreSQL complet (<code>pg_dump</code>, format compressé).
          {query.data ? ` Les ${query.data.retention} dernières sauvegardes sont conservées, les plus anciennes sont purgées automatiquement.` : ''}
          {query.data && !query.data.restoreEnabled && ' La restauration est désactivée sur ce déploiement.'}
        </div>

        {notice && <Toast tone="info" message={notice} onClose={() => setNotice(null)} style={{ margin: 16 }} />}
        {createError && <Toast tone="error" message={createError} style={{ margin: 16 }} />}

        <QueryState
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          isEmpty={(query.data?.backups.length ?? 0) === 0}
          emptyTitle="Aucune sauvegarde"
          emptyMessage="Lancez une première sauvegarde pour disposer d'un point de restauration."
          onRetry={() => query.refetch()}
        >
          {(query.data?.backups ?? []).map((backup) => (
            <div
              key={backup.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                padding: '13px 16px', borderBottom: '1px solid var(--slate-100)',
              }}
            >
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Badge tone={STATUS_TONE[backup.status]}>{STATUS_LABEL[backup.status]}</Badge>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)' }}>
                    {formatDateTime(backup.completedAt ?? backup.createdAt)}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                    {formatSize(backup.sizeBytes)}
                  </span>
                </div>
                {backup.requesterName && (
                  <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>
                    Déclenchée par {backup.requesterName}
                  </div>
                )}
                {backup.errorMessage && (
                  <div style={{ fontSize: 12, color: 'var(--color-danger)', marginTop: 4, overflowWrap: 'anywhere' }}>
                    {backup.errorMessage}
                  </div>
                )}
              </div>

              {isSuperAdmin && backup.status === 'completed' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <IconButton
                    icon={downloadingId === backup.id ? 'progress_activity' : 'download'}
                    size="sm"
                    title="Télécharger le dump"
                    disabled={downloadingId === backup.id}
                    onClick={() => download(backup)}
                  />
                  {query.data?.restoreEnabled && (
                    <IconButton
                      icon="settings_backup_restore"
                      size="sm"
                      variant="danger"
                      title="Restaurer cette sauvegarde"
                      onClick={() => { setRestoring(backup); setConfirmText('') }}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </QueryState>
      </Panel>

      {restoring && (
        <Dialog
          open
          onClose={() => setRestoring(null)}
          icon="warning"
          iconTone="danger"
          title="Restaurer cette sauvegarde ?"
          style={{ maxWidth: 460 }}
          actions={
            <>
              <Button variant="secondary" block onClick={() => { setRestoring(null); setConfirmText('') }}>
                Annuler
              </Button>
              <Button
                variant="danger"
                block
                loading={restore.isPending}
                disabled={confirmText.trim().toUpperCase() !== RESTORE_WORD}
                onClick={() => restore.mutate(restoring.id)}
              >
                Restaurer
              </Button>
            </>
          }
        >
          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ margin: 0, fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
              Toutes les données créées depuis le {formatDateTime(restoring.completedAt ?? restoring.createdAt)} seront
              perdues : colis, paiements, messages et comptes reviennent à l'état de la sauvegarde.
              L'API est indisponible pendant l'opération.
            </p>
            <Input
              label={`Tapez « ${RESTORE_WORD} » pour confirmer`}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={RESTORE_WORD}
            />
            {restoreError && <Toast tone="error" message={restoreError} />}
          </div>
        </Dialog>
      )}
    </>
  )
}
