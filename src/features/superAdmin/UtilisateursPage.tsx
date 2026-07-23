import { useState } from 'react'
import { Avatar, Badge, Button, Dialog, IconButton, Toast } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import { UserFormDialog } from './UserFormDialog'
import { useAdminUsers, useDeleteUser, useResetUserPin, useUpdateUserStatus } from './hooks'
import { useIsMobile } from '@/lib/useMediaQuery'
import type { Role, User, UserStatus } from '@/lib/api/types'

const ROLE_LABEL: Record<Role, string> = {
  client: 'Client',
  driver: 'Chauffeur',
  admin: 'Admin zone',
  super_admin: 'Super admin',
  support: 'Support',
}

const STATUS_TONE: Record<UserStatus, 'green' | 'red' | 'neutral'> = {
  active: 'green',
  suspended: 'red',
  deleted: 'neutral',
}

const GRID = '1fr 110px 100px 210px'
const cell: React.CSSProperties = { display: 'flex', alignItems: 'center', minWidth: 0 }

export function UtilisateursPage() {
  const isMobile = useIsMobile()
  const query = useAdminUsers()
  const updateStatus = useUpdateUserStatus()
  const deleteMutation = useDeleteUser()
  const resetPin = useResetUserPin()
  const users = query.data?.users ?? []

  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [deleting, setDeleting] = useState<User | null>(null)
  const [resetting, setResetting] = useState<User | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!deleting) return
    try {
      await deleteMutation.mutateAsync(deleting.id)
      setNotice(`Utilisateur « ${deleting.fullName} » supprimé.`)
      setDeleting(null)
    } catch {
      setNotice('Erreur lors de la suppression.')
      setDeleting(null)
    }
  }

  const handleResetPin = async () => {
    if (!resetting) return
    try {
      const pin = await resetPin.mutateAsync(resetting.id)
      setNotice(
        pin
          ? `PIN de ${resetting.fullName} réinitialisé : ${pin}`
          : `PIN de ${resetting.fullName} réinitialisé — communiqué par SMS.`,
      )
      setResetting(null)
    } catch {
      setNotice('Erreur lors de la réinitialisation du PIN.')
      setResetting(null)
    }
  }

  const queryStateProps = {
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isEmpty: users.length === 0,
    emptyTitle: 'Aucun utilisateur',
    onRetry: () => query.refetch(),
  }

  const statusLabel = (u: User) => (u.status === 'active' ? 'Actif' : u.status === 'suspended' ? 'Suspendu' : 'Supprimé')

  const renderActions = (u: User) => {
    const suspended = u.status === 'suspended'
    const protectedUser = u.role === 'super_admin'
    return (
      <>
        <IconButton icon="edit" size="sm" title="Modifier" onClick={() => setEditing(u)} />
        <IconButton icon="lock_reset" size="sm" title="Réinitialiser le PIN" onClick={() => setResetting(u)} />
        {!protectedUser && (
          <>
            <IconButton
              icon={suspended ? 'check' : 'block'}
              size="sm"
              title={suspended ? 'Réactiver' : 'Suspendre'}
              onClick={() => updateStatus.mutate({ userId: u.id, status: suspended ? 'active' : 'suspended' })}
            />
            <IconButton icon="delete" size="sm" variant="danger" title="Supprimer" onClick={() => setDeleting(u)} />
          </>
        )}
      </>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {notice && <Toast tone="info" message={notice} onClose={() => setNotice(null)} />}

      <Panel
        title={`Utilisateurs${query.data?.pagination ? ` · ${query.data.pagination.total}` : ''}`}
        action={
          <Button size="sm" variant="primary" icon="person_add" onClick={() => setCreateOpen(true)}>
            Nouvel utilisateur
          </Button>
        }
        flush
      >
        {isMobile ? (
          <QueryState {...queryStateProps}>
            {users.map((u) => (
              <div key={u.id} style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '13px 16px', borderBottom: '1px solid var(--slate-100)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <Avatar name={u.fullName} src={u.profilePhoto ?? undefined} size="sm" />
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5, color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.fullName}
                    </span>
                    <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.email ?? u.phone}
                    </span>
                  </span>
                  <Badge tone={STATUS_TONE[u.status]}>{statusLabel(u)}</Badge>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <Badge tone="neutral">{ROLE_LABEL[u.role]}</Badge>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{renderActions(u)}</span>
                </div>
              </div>
            ))}
          </QueryState>
        ) : (
        <div className="pc-table-scroll">
        <div style={{ minWidth: 680 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: GRID,
            padding: '11px 18px',
            borderBottom: '1px solid var(--border-subtle)',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--text-faint)',
          }}
        >
          <span>Utilisateur</span>
          <span>Rôle</span>
          <span>Statut</span>
          <span style={{ textAlign: 'right', justifyContent: 'flex-end' }}>Actions</span>
        </div>

        <QueryState {...queryStateProps}>
          {users.map((u) => (
            <div key={u.id} style={{ display: 'grid', gridTemplateColumns: GRID, alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid var(--slate-100)' }}>
              <span style={{ ...cell, gap: 11 }}>
                <Avatar name={u.fullName} src={u.profilePhoto ?? undefined} size="sm" />
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5, color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {u.fullName}
                  </span>
                  <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-muted)' }}>{u.email ?? u.phone}</span>
                </span>
              </span>
              <span style={cell}>
                <Badge tone="neutral">{ROLE_LABEL[u.role]}</Badge>
              </span>
              <span style={cell}>
                <Badge tone={STATUS_TONE[u.status]}>{statusLabel(u)}</Badge>
              </span>
              <span style={{ ...cell, justifyContent: 'flex-end', gap: 6 }}>{renderActions(u)}</span>
            </div>
          ))}
        </QueryState>
        </div>
        </div>
        )}
      </Panel>

      <UserFormDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <UserFormDialog open={!!editing} user={editing} onClose={() => setEditing(null)} />

      <Dialog
        open={!!deleting}
        title="Supprimer l'utilisateur"
        icon="delete_forever"
        iconTone="danger"
        onClose={() => setDeleting(null)}
      >
        <p style={{ margin: 0 }}>
          Voulez-vous vraiment supprimer <strong>{deleting?.fullName}</strong> ({deleting?.email ?? deleting?.phone}) ?
          Cette action est définitive.
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <Button variant="secondary" onClick={() => setDeleting(null)} block>
            Annuler
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={deleteMutation.isPending} disabled={deleteMutation.isPending} block>
            Supprimer
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={!!resetting}
        title="Réinitialiser le PIN"
        icon="lock_reset"
        iconTone="primary"
        onClose={() => setResetting(null)}
      >
        <p style={{ margin: 0 }}>
          Réinitialiser le code PIN de <strong>{resetting?.fullName}</strong> ? L'ancien PIN ne fonctionnera plus.
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <Button variant="secondary" onClick={() => setResetting(null)} block>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleResetPin} loading={resetPin.isPending} disabled={resetPin.isPending} block>
            Réinitialiser
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
