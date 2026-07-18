import { useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Badge, Button, Dialog, IconButton, Input, Select, Switch, Toast } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import { ALL_COUNTRIES } from '@/components/CountryCodePicker'
import type { Garage } from '@/lib/api/types'
import { GarageFormDialog } from './GarageFormDialog'
import { useAdminGarages, useDeleteGarage, useUpdateGarage } from './hooks'

const flagOf = (country: string) =>
  ALL_COUNTRIES.find((c) => c.name.toLowerCase() === country.toLowerCase())?.flag ?? '🌍'

export function GaragesPage() {
  const query = useAdminGarages()
  const garages = useMemo(() => query.data ?? [], [query.data])

  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('')
  const [status, setStatus] = useState('')
  const [editing, setEditing] = useState<Garage | null>(null)
  const [deleting, setDeleting] = useState<Garage | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const createOpen = searchParams.get('new') === '1'
  const openCreate = () => setSearchParams({ new: '1' })
  const closeCreate = () => setSearchParams({})

  const updateMutation = useUpdateGarage()
  const deleteMutation = useDeleteGarage()

  const countries = useMemo(() => {
    const set = new Set<string>()
    for (const g of garages) if (g.country) set.add(g.country)
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'))
  }, [garages])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return garages.filter((g) => {
      if (country && (g.country ?? '') !== country) return false
      if (status === 'active' && g.isActive === false) return false
      if (status === 'inactive' && g.isActive !== false) return false
      if (!q) return true
      return [g.name, g.country, g.region, g.city, g.address, g.phone]
        .some((v) => (v ?? '').toLowerCase().includes(q))
    })
  }, [garages, search, country, status])

  const grouped = useMemo(() => {
    const map = new Map<string, Garage[]>()
    for (const g of filtered) {
      const key = g.country || 'Autre'
      const list = map.get(key) || []
      list.push(g)
      map.set(key, list)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b, 'fr'))
  }, [filtered])

  const handleToggle = async (g: Garage) => {
    setActionError(null)
    try {
      await updateMutation.mutateAsync({ garageId: g.id, payload: { isActive: g.isActive === false } })
    } catch {
      setActionError('Impossible de changer le statut de la zone.')
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    setActionError(null)
    try {
      await deleteMutation.mutateAsync(deleting.id)
      setDeleting(null)
    } catch {
      setActionError('Impossible de supprimer la zone.')
      setDeleting(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Input
          icon="search"
          placeholder="Rechercher une zone, ville, pays..."
          value={search}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 220 }}
        />
        <Select
          icon="public"
          placeholder="Pays"
          value={country}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setCountry(e.target.value)}
          options={[{ value: '', label: 'Tous les pays' }, ...countries.map((c) => ({ value: c, label: `${flagOf(c)} ${c}` }))]}
          style={{ minWidth: 180 }}
        />
        <Select
          icon="toggle_on"
          placeholder="Statut"
          value={status}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value)}
          options={[
            { value: '', label: 'Tous les statuts' },
            { value: 'active', label: 'Actives' },
            { value: 'inactive', label: 'Inactives' },
          ]}
          style={{ minWidth: 150 }}
        />
        <Button variant="primary" icon="add_location_alt" onClick={openCreate}>
          Nouvelle zone
        </Button>
      </div>

      {actionError && <Toast tone="error" message={actionError} onClose={() => setActionError(null)} />}

      <Panel
        title={`Zones · ${filtered.length}${countries.length ? ` · ${countries.length} pays` : ''}`}
        flush
      >
        <QueryState
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          isEmpty={filtered.length === 0}
          emptyTitle="Aucune zone"
          emptyMessage={
            garages.length === 0
              ? 'Aucune zone enregistrée pour le moment. Créez la première zone, n\'importe où dans le monde.'
              : 'Aucune zone ne correspond à ces filtres.'
          }
          onRetry={() => query.refetch()}
        >
          {grouped.map(([groupCountry, list]) => (
            <div key={groupCountry}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 18px',
                  background: 'var(--surface-sunken)',
                  borderBottom: '1px solid var(--slate-100)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: 12.5,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                <span style={{ fontSize: 16 }}>{flagOf(groupCountry)}</span>
                <span>{groupCountry}</span>
                <span style={{ fontWeight: 500 }}>· {list.length}</span>
              </div>
              {list.map((g) => (
                <div
                  key={g.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 18px',
                    borderBottom: '1px solid var(--slate-100)',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 42,
                      height: 42,
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--surface-sunken)',
                      color: 'var(--text-muted)',
                      flex: 'none',
                    }}
                  >
                    <span className="material-symbols-rounded fill" style={{ fontSize: 23 }}>garage</span>
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14.5, color: 'var(--text-strong)' }}>
                      {g.name}
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                      {[g.city, g.region].filter(Boolean).join(', ') || '—'}
                      {g.address && ` · ${g.address}`}
                      {g.phone && ` · ${g.phone}`}
                    </div>
                  </div>
                  <Badge tone={g.isActive === false ? 'neutral' : 'green'}>
                    {g.isActive === false ? 'Inactive' : 'Active'}
                  </Badge>
                  <Switch
                    checked={g.isActive !== false}
                    onChange={() => handleToggle(g)}
                    disabled={updateMutation.isPending}
                  />
                  <IconButton icon="edit" size="sm" title="Modifier la zone" onClick={() => setEditing(g)} />
                  <IconButton
                    icon="delete"
                    size="sm"
                    variant="danger"
                    title="Supprimer la zone"
                    onClick={() => setDeleting(g)}
                  />
                </div>
              ))}
            </div>
          ))}
        </QueryState>
      </Panel>

      <GarageFormDialog open={createOpen} onClose={closeCreate} />
      <GarageFormDialog open={!!editing} garage={editing} onClose={() => setEditing(null)} />

      <Dialog
        open={!!deleting}
        title="Supprimer la zone"
        icon="delete_forever"
        iconTone="danger"
        onClose={() => setDeleting(null)}
      >
        <p style={{ margin: 0 }}>
          Voulez-vous vraiment supprimer la zone <strong>{deleting?.name}</strong>
          {deleting?.city ? ` (${deleting.city})` : ''} ? Elle ne sera plus proposée dans les trajets.
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <Button variant="secondary" onClick={() => setDeleting(null)} block>
            Annuler
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            loading={deleteMutation.isPending}
            disabled={deleteMutation.isPending}
            block
          >
            Supprimer
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
