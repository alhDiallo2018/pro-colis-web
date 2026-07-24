import { useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Badge, Button, Dialog, IconButton, Input, Select, Switch, Toast } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import type { Zone } from '@/lib/api/types'
import { ZoneFormDialog } from './ZoneFormDialog'
import { useAdminZones, useDeleteZone, useUpdateZone, useSetZoneStatus } from './hooks'

const flagOf = (country: string): string => {
  const codes: Record<string, string> = {
    'Sénégal': '🇸🇳', 'Mali': '🇲🇱', 'Côte d\'Ivoire': '🇨🇮', 'Guinée': '🇬🇳',
    'Burkina Faso': '🇧🇫', 'Bénin': '🇧🇯', 'Togo': '🇹🇬', 'Niger': '🇳🇪',
    'Gambie': '🇬🇲', 'Ghana': '🇬🇭', 'Nigeria': '🇳🇬', 'France': '🇫🇷',
    'Mauritanie': '🇲🇷', 'Guinée-Bissau': '🇬🇼',
  }
  return codes[country] ?? '🌍'
}

export function ZonesPage() {
  const { data: zonesData } = useAdminZones()
  const zones = useMemo(() => zonesData?.zones ?? [], [zonesData])

  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('')
  const [zoneType, setZoneType] = useState('')
  const [status, setStatus] = useState('')
  const [editing, setEditing] = useState<Zone | null>(null)
  const [deleting, setDeleting] = useState<Zone | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [, setDriversZoneId] = useState<string | null>(null)

  const createOpen = searchParams.get('new') === '1'
  const openCreate = () => setSearchParams({ new: '1' })
  const closeCreate = () => setSearchParams({})

  const updateMutation = useUpdateZone()
  const deleteMutation = useDeleteZone()
  const statusMutation = useSetZoneStatus()

  const pendingCount = useMemo(() => zones.filter((z) => z.status === 'pending').length, [zones])

  const countries = useMemo(() => {
    const set = new Set<string>()
    for (const z of zones) if (z.country) set.add(z.country)
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'))
  }, [zones])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return zones.filter((z) => {
      if (country && (z.country ?? '') !== country) return false
      if (zoneType && z.type !== zoneType) return false
      if (status === 'active' && z.isActive === false) return false
      if (status === 'inactive' && z.isActive !== false) return false
      if (status === 'pending' && z.status !== 'pending') return false
      if (status === 'rejected' && z.status !== 'rejected') return false
      if (!q) return true
      return [z.name, z.displayName, z.country, z.city, z.placeId]
        .some((v) => (v ?? '').toLowerCase().includes(q))
    })
  }, [zones, search, country, zoneType, status])

  const grouped = useMemo(() => {
    const map = new Map<string, Zone[]>()
    for (const z of filtered) {
      const key = z.country || 'Autre'
      const list = map.get(key) || []
      list.push(z)
      map.set(key, list)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b, 'fr'))
  }, [filtered])

  const handleToggle = async (z: Zone) => {
    setActionError(null)
    try {
      await updateMutation.mutateAsync({ zoneId: z.id, payload: { isActive: !z.isActive } })
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
          style={{ minWidth: 160 }}
        />
        <Select
          icon="category"
          placeholder="Type"
          value={zoneType}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setZoneType(e.target.value)}
          options={[
            { value: '', label: 'Tous les types' },
            { value: 'CIRCLE', label: 'Cercle' },
            { value: 'POLYGON', label: 'Polygone' },
          ]}
          style={{ minWidth: 130 }}
        />
        <Select
          icon="toggle_on"
          placeholder="Statut"
          value={status}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value)}
          options={[
            { value: '', label: 'Tous les statuts' },
            { value: 'pending', label: '⏳ À valider' },
            { value: 'rejected', label: '⛔ Rejetées' },
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

      {pendingCount > 0 && status !== 'pending' && (
        <div
          onClick={() => setStatus('pending')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', marginBottom: 12, borderRadius: 'var(--radius-md)', background: 'var(--amber-50)', border: '1px solid var(--amber-200)', color: 'var(--amber-700)', fontWeight: 600, fontSize: 13 }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 20 }}>pending_actions</span>
          {pendingCount} zone{pendingCount > 1 ? 's' : ''} créée{pendingCount > 1 ? 's' : ''} automatiquement à valider — cliquez pour filtrer.
        </div>
      )}

      <Panel
        title={`Zones géographiques · ${filtered.length}${countries.length ? ` · ${countries.length} pays` : ''}`}
        flush
      >
        <QueryState
          isLoading={false}
          isError={false}
          error={null}
          isEmpty={filtered.length === 0}
          emptyTitle="Aucune zone"
          emptyMessage={
            zones.length === 0
              ? 'Aucune zone géographique enregistrée. Créez la première zone en utilisant la carte.'
              : 'Aucune zone ne correspond à ces filtres.'
          }
          onRetry={() => {}}
        >
          {grouped.map(([groupCountry, list]) => (
            <div key={groupCountry}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 18px', background: 'var(--surface-sunken)',
                borderBottom: '1px solid var(--slate-100)',
                fontFamily: 'var(--font-display)', fontWeight: 700,
                fontSize: 12.5, color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: 0.5,
              }}>
                <span style={{ fontSize: 16 }}>{flagOf(groupCountry)}</span>
                <span>{groupCountry}</span>
                <span style={{ fontWeight: 500 }}>· {list.length}</span>
              </div>
              {list.map((z) => (
                <div key={z.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 18px', borderBottom: '1px solid var(--slate-100)',
                }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 42, height: 42, borderRadius: 'var(--radius-md)',
                    background: z.type === 'POLYGON' ? 'var(--purple-50)' : 'var(--teal-50)',
                    color: z.type === 'POLYGON' ? 'var(--purple-500)' : 'var(--teal-500)',
                    flex: 'none',
                  }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 22 }}>
                      {z.type === 'POLYGON' ? 'draw' : 'circle'}
                    </span>
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14.5, color: 'var(--text-strong)' }}>
                      {z.displayName || z.name}
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                      {z.city && `${z.city}`}
                      {z.type === 'CIRCLE' && ` · Rayon ${(z.radius / 1000).toFixed(1)} km`}
                      {z._count && ` · ${z._count.driverZones ?? 0} chauffeur(s)`}
                    </div>
                  </div>
                  <Badge tone={z.type === 'CIRCLE' ? 'teal' : 'neutral'}>
                    {z.type === 'CIRCLE' ? 'Cercle' : 'Polygone'}
                  </Badge>
                  {z.status === 'pending' && <Badge tone="amber">⏳ À valider</Badge>}
                  {z.status === 'rejected' && <Badge tone="red">⛔ Rejetée</Badge>}
                  {z.source === 'places' && z.status !== 'pending' && <Badge tone="neutral">Places</Badge>}
                  <Badge tone={z.isActive === false ? 'neutral' : 'green'}>
                    {z.isActive === false ? 'Inactive' : 'Active'}
                  </Badge>
                  {z.status === 'pending' ? (
                    <>
                      <IconButton icon="check_circle" size="sm" variant="soft" title="Approuver la zone"
                        onClick={() => statusMutation.mutate({ zoneId: z.id, status: 'approved' })} />
                      <IconButton icon="cancel" size="sm" variant="danger" title="Rejeter la zone"
                        onClick={() => statusMutation.mutate({ zoneId: z.id, status: 'rejected' })} />
                    </>
                  ) : (
                    <Switch
                      checked={z.isActive !== false}
                      onChange={() => handleToggle(z)}
                      disabled={updateMutation.isPending}
                    />
                  )}
                  <IconButton
                    icon="group"
                    size="sm"
                    variant="soft"
                    title="Voir les chauffeurs"
                    onClick={() => setDriversZoneId(z.id)}
                  />
                  <IconButton icon="edit" size="sm" title="Modifier la zone" onClick={() => setEditing(z)} />
                  <IconButton icon="delete" size="sm" variant="danger" title="Supprimer la zone" onClick={() => setDeleting(z)} />
                </div>
              ))}
            </div>
          ))}
        </QueryState>
      </Panel>

      <ZoneFormDialog open={createOpen} onClose={closeCreate} />
      <ZoneFormDialog open={!!editing} zone={editing} onClose={() => setEditing(null)} />

      <Dialog
        open={!!deleting}
        title="Supprimer la zone"
        icon="delete_forever"
        iconTone="danger"
        onClose={() => setDeleting(null)}
      >
        <p style={{ margin: 0 }}>
          Voulez-vous vraiment supprimer la zone <strong>{deleting?.name}</strong> ?
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <Button variant="secondary" onClick={() => setDeleting(null)} block>Annuler</Button>
          <Button variant="danger" onClick={handleDelete} loading={deleteMutation.isPending} disabled={deleteMutation.isPending} block>
            Supprimer
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
