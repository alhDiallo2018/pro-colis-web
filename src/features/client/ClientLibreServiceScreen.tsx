import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, ParcelCard, Select } from '@/ds'
import { QueryState } from '@/components/QueryState'
import { useMyParcels } from './hooks'
import { formatDate, formatFcfa, formatWeight, toStatusKey } from '@/lib/format'

const TYPE_FILTERS = [
  { value: '', label: 'Tous les types' },
  { value: 'document', label: 'Document' },
  { value: 'package', label: 'Colis standard' },
  { value: 'fragile', label: 'Fragile' },
  { value: 'perishable', label: 'Alimentaire / Périssable' },
  { value: 'valuable', label: 'Objet de valeur' },
]

const SORTS = [
  { value: 'recent', label: 'Plus récentes' },
  { value: 'old', label: 'Plus anciennes' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'price_asc', label: 'Prix croissant' },
]

/** Client's parcels currently published as open-bidding announcements. */
export function ClientLibreServiceScreen() {
  const navigate = useNavigate()
  const query = useMyParcels({ status: 'free' })
  const all = useMemo(() => query.data?.parcels ?? [], [query.data?.parcels])

  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [sort, setSort] = useState('recent')

  const parcels = useMemo(() => {
    const q = search.trim().toLowerCase()
    const ts = (iso?: string) => (iso ? new Date(iso).getTime() : 0)
    const filtered = all.filter((p) => {
      if (type && p.type !== type) return false
      if (!q) return true
      return [p.trackingNumber, p.arrivalCity, p.arrivalZoneName, p.departureCity, p.departureZoneName, p.receiverName]
        .some((v) => v && String(v).toLowerCase().includes(q))
    })
    return [...filtered].sort((a, b) => {
      if (sort === 'old') return ts(a.createdAt) - ts(b.createdAt)
      if (sort === 'price_desc') return (b.price ?? 0) - (a.price ?? 0)
      if (sort === 'price_asc') return (a.price ?? 0) - (b.price ?? 0)
      return ts(b.createdAt) - ts(a.createdAt) // recent (default)
    })
  }, [all, search, type, sort])

  const hasParcels = all.length > 0
  const filteredEmpty = hasParcels && parcels.length === 0

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {hasParcels && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            alignItems: 'flex-end',
            background: 'var(--surface-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: 14,
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div style={{ flex: '1 1 220px', minWidth: 180 }}>
            <Input
              icon="search"
              placeholder="Rechercher (suivi, ville, destinataire…)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ flex: '0 1 200px' }}>
            <Select icon="category" options={TYPE_FILTERS} value={type} onChange={(e) => setType(e.target.value)} />
          </div>
          <div style={{ flex: '0 1 190px' }}>
            <Select icon="sort" options={SORTS} value={sort} onChange={(e) => setSort(e.target.value)} />
          </div>
        </div>
      )}

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        isEmpty={parcels.length === 0}
        emptyTitle={filteredEmpty ? 'Aucun résultat' : 'Aucune annonce'}
        emptyMessage={
          filteredEmpty
            ? 'Aucune annonce ne correspond à votre recherche.'
            : 'Publiez une annonce pour recevoir des offres de chauffeurs.'
        }
        emptyAction={
          filteredEmpty ? (
            <Button
              variant="secondary"
              icon="restart_alt"
              onClick={() => {
                setSearch('')
                setType('')
              }}
            >
              Réinitialiser les filtres
            </Button>
          ) : (
            <Button icon="add" onClick={() => navigate('/client/nouveau')}>
              Créer une annonce
            </Button>
          )
        }
        onRetry={() => query.refetch()}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--gap-card)' }}>
          {parcels.map((p) => (
            <ParcelCard
              key={p.id}
              onClick={() => navigate(`/client/colis/${p.id}`)}
              parcel={{
                tracking: p.trackingNumber,
                from: p.departureCity ?? p.departureZoneName ?? '—',
                to: p.arrivalCity ?? p.arrivalZoneName ?? '—',
                status: toStatusKey(p.status),
                price: p.price != null ? formatFcfa(p.price) : undefined,
                weight: p.weight != null ? formatWeight(p.weight) : undefined,
                type: p.type ?? undefined,
                eta: formatDate(p.createdAt),
                express: p.isUrgent,
              }}
              footer={
                <Button block size="sm" variant="secondary" iconTrailing="chevron_right" onClick={() => navigate('/client/offres')}>
                  Voir les offres reçues
                </Button>
              }
            />
          ))}
        </div>
      </QueryState>
    </div>
  )
}
