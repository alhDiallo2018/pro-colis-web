import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button, Checkbox, Input, Select } from '@/ds'
import { QueryState } from './QueryState'
import { listMessageRecipients } from '@/lib/api/manualMessages'
import type { AssistanceUser } from '@/lib/api/assistances'

/** Le répertoire reste paginé côté serveur. La sélection conserve les comptes
 * des pages précédentes, sans transformer « cette page » en envoi global. */
export function RecipientPicker({ selected, onChange, onlyDrivers = false }: {
  selected: AssistanceUser[]; onChange: (users: AssistanceUser[]) => void; onlyDrivers?: boolean
}) {
  const [search, setSearch] = useState('')
  const [term, setTerm] = useState('')
  const [role, setRole] = useState(onlyDrivers ? 'driver' : '')
  const [page, setPage] = useState(1)
  useEffect(() => {
    // Une pagination sans changement de recherche ne doit pas être annulée
    // par le délai initial du champ de recherche.
    if (search.trim() === term) return
    const timer = setTimeout(() => { setTerm(search.trim()); setPage(1) }, 250)
    return () => clearTimeout(timer)
  }, [search, term])
  const query = useQuery({ queryKey: ['message-recipients', term, role, page],
    queryFn: () => listMessageRecipients({ search: term, role: role || undefined, page, limit: 20 }) })
  const users = query.data?.users ?? []
  const ids = new Set(selected.map(user => user.id))
  const all = users.length > 0 && users.every(user => ids.has(user.id))
  const combined = [...new Map([...selected, ...users].map(user => [user.id, user])).values()]
  const stale = search.trim() !== term || query.isFetching
  return <div style={{ display: 'grid', gap: 12 }}>
    <Input label={onlyDrivers ? 'Rechercher un chauffeur' : 'Rechercher dans le répertoire'}
      placeholder="Nom, e-mail ou téléphone" value={search} onChange={event => setSearch(event.target.value)} />
    {!onlyDrivers && <Select label="Filtrer les destinataires par profil" value={role}
      onChange={event => { setRole(event.target.value); setPage(1) }} options={[
        { value: '', label: 'Tous les profils' }, { value: 'client', label: 'Clients' },
        { value: 'driver', label: 'Chauffeurs' }, { value: 'support', label: 'Support' },
        { value: 'support_technique', label: 'Support technique' }, { value: 'support_commercial', label: 'Support commercial' },
        { value: 'admin', label: 'Admins zone' }, { value: 'super_admin', label: 'Super admins' },
      ]} />}
    <Checkbox label="Sélectionner cette page" checked={all} disabled={stale || !users.length || (!all && combined.length > 50)}
      onChange={checked => onChange(checked ? combined : selected.filter(user => !users.some(item => item.id === user.id)))} />
    <QueryState isLoading={query.isLoading} isError={query.isError} error={query.error}
      isEmpty={!users.length} emptyTitle="Aucun compte trouvé" onRetry={() => query.refetch()}>
      {users.map(user => <div key={user.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', overflowWrap: 'anywhere' }}>
        <Checkbox label={`${user.fullName} · ${user.email || user.phone}`} checked={ids.has(user.id)}
          disabled={stale || (!ids.has(user.id) && selected.length >= 50)}
          onChange={checked => onChange(checked ? [...selected, user] : selected.filter(item => item.id !== user.id))} />
      </div>)}
    </QueryState>
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      <Button variant="secondary" disabled={page <= 1 || stale} onClick={() => setPage(value => value - 1)}>Page précédente</Button>
      <span>Page {page} / {Math.max(1, query.data?.pagination.totalPages ?? 1)}</span>
      <Button variant="secondary" disabled={stale || page >= (query.data?.pagination.totalPages ?? 1)} onClick={() => setPage(value => value + 1)}>Page suivante</Button>
      <span>{selected.length}/50 sélectionnés</span>
    </div>
  </div>
}
