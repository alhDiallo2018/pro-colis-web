import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Avatar, Badge, Button, Input, type AvatarStatus } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import { RecipientSelectionActions, useRecipientSelection } from '@/components/RecipientSelection'
import { listMessageRecipients } from '@/lib/api/manualMessages'
import { useAuthStore } from '@/store/auth'

const AVATAR_STATUS: Record<string, AvatarStatus> = { available: 'online', busy: 'busy', offline: 'offline' }
const STATUS_LABEL: Record<string, { label: string; tone: 'green' | 'amber' | 'neutral' }> = {
  available: { label: 'Disponible', tone: 'green' }, busy: { label: 'Occupé', tone: 'amber' }, offline: { label: 'Hors ligne', tone: 'neutral' },
}

export function ChauffeursPage() {
  const actor = useAuthStore(state => state.user)
  const selection = useRecipientSelection()
  const [search, setSearch] = useState('')
  const [term, setTerm] = useState('')
  const [page, setPage] = useState(1)
  useEffect(() => {
    // Une pagination sans changement de recherche ne doit pas être annulée
    // par le délai initial du champ de recherche.
    if (search.trim() === term) return
    const timer = setTimeout(() => { setTerm(search.trim()); setPage(1) }, 250)
    return () => clearTimeout(timer)
  }, [search, term])
  // Le filtre chauffeur et le périmètre de l'admin sont appliqués en BD, avant
  // pagination. Une recherche retrouve aussi les chauffeurs hors ligne.
  const query = useQuery({ queryKey: ['message-recipients', actor?.id, 'driver', term, page],
    queryFn: () => listMessageRecipients({ role: 'driver', search: term, page, limit: 20 }) })
  const drivers = query.data?.users ?? []
  const stale = query.isFetching || search.trim() !== term
  const base = actor?.role === 'super_admin' ? '/admin' : '/support-admin'
  return <Panel title={`Chauffeurs · ${query.data?.pagination.total ?? 0}`} flush>
    <div style={{ padding: '14px 18px' }}>
      <Input label="Rechercher un chauffeur" placeholder="Nom, e-mail ou téléphone" icon="search"
        value={search} onChange={event => setSearch(event.target.value)} />
    </div>
    <RecipientSelectionActions selected={selection.selected} onChange={selection.setSelected} pageUsers={drivers} disabled={stale} />
    <QueryState isLoading={query.isLoading} isError={query.isError} error={query.error}
      isEmpty={!drivers.length} emptyTitle="Aucun chauffeur trouvé" onRetry={() => query.refetch()}>
      {drivers.map(driver => {
        const status = STATUS_LABEL[driver.driverStatus ?? 'offline'] ?? STATUS_LABEL.offline
        return <div key={driver.id} style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)' }}>
          {selection.checkbox(driver, stale)}
          <Avatar name={driver.fullName} src={driver.profilePhoto ?? undefined} status={AVATAR_STATUS[driver.driverStatus ?? 'offline'] ?? 'offline'} />
          <div style={{ flex: '1 1 180px', minWidth: 0, overflowWrap: 'anywhere' }}>
            {actor?.role === 'admin' ? <strong>{driver.fullName}</strong> : <Link to={`${base}/chauffeurs/${driver.id}`}>{driver.fullName}</Link>}
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{driver.email || 'Sans email'} · {driver.phone} · {driver.city || '—'}</div>
          </div>
          <div style={{ fontSize: 12.5 }}>{Number(driver.rating ?? 0).toFixed(1)} ★ · {driver.completedDeliveries ?? 0} livraisons</div>
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>
      })}
    </QueryState>
    <div style={{ padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      <Button variant="secondary" disabled={page <= 1 || stale} onClick={() => setPage(value => value - 1)}>Précédent</Button>
      <span>Page {page} sur {Math.max(1, query.data?.pagination.totalPages ?? 1)}</span>
      <Button variant="secondary" disabled={stale || page >= (query.data?.pagination.totalPages ?? 1)} onClick={() => setPage(value => value + 1)}>Suivant</Button>
    </div>
  </Panel>
}
