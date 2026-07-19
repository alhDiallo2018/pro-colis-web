import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, ParcelCard, SegmentedControl, Select } from '@/ds'
import { QueryState } from '@/components/QueryState'
import { useSentParcels, useReceivedParcels } from './hooks'
import { formatDate, formatFcfa, formatWeight, toStatusKey } from '@/lib/format'
import { queryClient } from '@/lib/queryClient'

const STATUS_GROUPS = [
  { value: '', label: 'Tous', match: [] as string[] },
  { value: 'pending', label: 'En attente', match: ['pending', 'free', 'confirmed'] },
  { value: 'transit', label: 'En transit', match: ['picked_up', 'in_transit', 'arrived', 'out_for_delivery'] },
  { value: 'delivered', label: 'Livrés', match: ['delivered'] },
  { value: 'cancelled', label: 'Annulés', match: ['cancelled'] },
]

const TYPE_FILTERS = [
  { value: '', label: 'Tous les types' },
  { value: 'document', label: 'Document' },
  { value: 'package', label: 'Colis standard' },
  { value: 'fragile', label: 'Fragile' },
  { value: 'perishable', label: 'Alimentaire / Périssable' },
  { value: 'valuable', label: 'Objet de valeur' },
]

const SORTS = [
  { value: 'recent', label: 'Plus récents' },
  { value: 'old', label: 'Plus anciens' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'price_asc', label: 'Prix croissant' },
]

const SENDER_TABS = [
  { value: 'sent', label: '📦 Envoyés' },
  { value: 'received', label: '📥 Reçus' },
]

export function MesColisScreen() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('sent')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [sort, setSort] = useState('recent')

  // Force refresh when switching tabs to avoid stale cache
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['client', 'parcels', tab] })
  }, [tab])

  const sentQuery = useSentParcels({ limit: 100 })
  const receivedQuery = useReceivedParcels({ limit: 100 })

  const tabQuery = tab === 'sent' ? sentQuery : receivedQuery
  const all = useMemo(() => tabQuery.data?.parcels ?? [], [tabQuery.data?.parcels, tab])

  const parcels = useMemo(() => {
    const q = search.trim().toLowerCase()
    const group = STATUS_GROUPS.find((g) => g.value === status)
    const ts = (iso?: string) => (iso ? new Date(iso).getTime() : 0)
    const filtered = all.filter((p) => {
      if (group && group.match.length && !group.match.includes(p.status)) return false
      if (type && p.type !== type) return false
      if (!q) return true
      return [p.trackingNumber, p.arrivalCity, p.arrivalGarageName, p.departureCity, p.departureGarageName, p.receiverName, p.senderName]
        .some((v) => v && String(v).toLowerCase().includes(q))
    })
    return [...filtered].sort((a, b) => {
      if (sort === 'old') return ts(a.createdAt) - ts(b.createdAt)
      if (sort === 'price_desc') return (b.price ?? 0) - (a.price ?? 0)
      if (sort === 'price_asc') return (a.price ?? 0) - (b.price ?? 0)
      return ts(b.createdAt) - ts(a.createdAt)
    })
  }, [all, status, search, type, sort])

  const hasParcels = all.length > 0
  const filteredEmpty = hasParcels && parcels.length === 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Sent/Received tabs */}
      <SegmentedControl
        block
        size="sm"
        options={SENDER_TABS}
        value={tab}
        onChange={setTab}
      />

      <SegmentedControl
        block
        size="sm"
        options={STATUS_GROUPS.map((g) => ({ value: g.value, label: g.label }))}
        value={status}
        onChange={setStatus}
      />

      {hasParcels && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            background: 'var(--surface-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: 14,
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div style={{ flex: '1 1 220px', minWidth: 180 }}>
            <Input icon="search" placeholder="Rechercher (suivi, ville, nom…)" value={search} onChange={(e) => setSearch(e.target.value)} />
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
        isLoading={tabQuery.isLoading}
        isError={tabQuery.isError}
        error={tabQuery.error}
        isEmpty={parcels.length === 0}
        emptyTitle={filteredEmpty ? 'Aucun résultat' : tab === 'sent' ? 'Aucun colis envoyé' : 'Aucun colis reçu'}
        emptyMessage={
          filteredEmpty
            ? 'Aucun colis ne correspond à votre recherche.'
            : tab === 'sent'
              ? "Vous n'avez pas encore envoyé de colis. Créez votre premier envoi."
              : "Vous n'avez pas encore de colis qui vous sont destinés."
        }
        emptyAction={
          filteredEmpty ? (
            <Button
              variant="secondary"
              icon="restart_alt"
              onClick={() => {
                setSearch('')
                setType('')
                setStatus('')
              }}
            >
              Réinitialiser les filtres
            </Button>
          ) : tab === 'sent' ? (
            <Button icon="add" onClick={() => navigate('/client/nouveau')}>
              Créer un colis
            </Button>
          ) : undefined
        }
        onRetry={() => tabQuery.refetch()}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--gap-card)' }}>
          {parcels.map((p) => (
            <ParcelCard
              key={p.id}
              onClick={() => navigate(`/client/colis/${p.id}`)}
              parcel={{
                tracking: p.trackingNumber,
                from: p.departureCity ?? p.departureGarageName ?? '—',
                to: p.arrivalCity ?? p.arrivalGarageName ?? '—',
                status: toStatusKey(p.status),
                price: p.price != null ? formatFcfa(p.price) : undefined,
                weight: p.weight != null ? formatWeight(p.weight) : undefined,
                type: p.type ?? undefined,
                eta: formatDate(p.createdAt),
                express: p.isUrgent,
              }}
            />
          ))}
        </div>
      </QueryState>
    </div>
  )
}
