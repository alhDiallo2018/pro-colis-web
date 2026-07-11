import { Avatar, Badge, Button } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import { useAdminUsers, useUpdateUserStatus } from './hooks'
import type { Role, UserStatus } from '@/lib/api/types'

const ROLE_LABEL: Record<Role, string> = {
  client: 'Client',
  driver: 'Chauffeur',
  admin: 'Admin garage',
  super_admin: 'Super admin',
}

const STATUS_TONE: Record<UserStatus, 'green' | 'red' | 'neutral'> = {
  active: 'green',
  suspended: 'red',
  deleted: 'neutral',
}

const GRID = '1fr 130px 110px 130px'
const cell: React.CSSProperties = { display: 'flex', alignItems: 'center', minWidth: 0 }

export function UtilisateursPage() {
  const query = useAdminUsers()
  const updateStatus = useUpdateUserStatus()
  const users = query.data?.users ?? []

  return (
    <Panel title={`Utilisateurs${query.data?.pagination ? ` · ${query.data.pagination.total}` : ''}`} flush>
      <div className="pc-table-scroll">
      <div style={{ minWidth: 620 }}>
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
        <span style={{ textAlign: 'right', justifyContent: 'flex-end' }}>Action</span>
      </div>

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        isEmpty={users.length === 0}
        emptyTitle="Aucun utilisateur"
        onRetry={() => query.refetch()}
      >
        {users.map((u) => {
          const suspended = u.status === 'suspended'
          return (
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
                <Badge tone={STATUS_TONE[u.status]}>{u.status === 'active' ? 'Actif' : u.status === 'suspended' ? 'Suspendu' : 'Supprimé'}</Badge>
              </span>
              <span style={{ ...cell, justifyContent: 'flex-end' }}>
                {u.role !== 'super_admin' && (
                  <Button
                    size="sm"
                    variant={suspended ? 'secondary' : 'danger'}
                    icon={suspended ? 'check' : 'block'}
                    loading={updateStatus.isPending && updateStatus.variables?.userId === u.id}
                    onClick={() => updateStatus.mutate({ userId: u.id, status: suspended ? 'active' : 'suspended' })}
                  >
                    {suspended ? 'Réactiver' : 'Suspendre'}
                  </Button>
                )}
              </span>
            </div>
          )
        })}
      </QueryState>
      </div>
      </div>
    </Panel>
  )
}
