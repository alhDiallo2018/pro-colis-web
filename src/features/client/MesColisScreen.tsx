import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Icon, Input, ParcelCard, Select } from '@/ds'
import { QueryState } from '@/components/QueryState'
import { useSentParcels, useReceivedParcels } from './hooks'
import { formatDate, formatFcfa, formatWeight, toStatusKey } from '@/lib/format'
import { queryClient } from '@/lib/queryClient'

const STATUS_GROUPS = [
  { value: '', label: 'Tous', match: [] as string[] },
  { value: 'pending', label: 'En attente', match: ['pending', 'free', 'confirmed', 'negotiating', 'proposal_sent'] },
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

const SENDER_TABS: { value: string; label: string; icon: string }[] = [
  { value: 'sent', label: 'Envoyés', icon: 'outbox' },
  { value: 'received', label: 'Reçus', icon: 'inbox' },
]

export function MesColisScreen() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('sent')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [sort, setSort] = useState('recent')

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['client', 'parcels', tab] })
  }, [tab])

  const sentQuery = useSentParcels({ limit: 100 })
  const receivedQuery = useReceivedParcels({ limit: 100 })

  const tabQuery = tab === 'sent' ? sentQuery : receivedQuery
  const all = useMemo(() => tabQuery.data?.parcels ?? [], [tabQuery.data?.parcels])

  const parcels = useMemo(() => {
    const q = search.trim().toLowerCase()
    const group = STATUS_GROUPS.find((g) => g.value === status)
    const ts = (iso?: string) => (iso ? new Date(iso).getTime() : 0)
    const filtered = all.filter((p) => {
      if (group && group.match.length && !group.match.includes(p.status)) return false
      if (type && p.type !== type) return false
      if (!q) return true
      return [p.trackingNumber, p.arrivalCity, p.arrivalZoneName, p.departureCity, p.departureZoneName, p.receiverName, p.senderName]
        .some((v) => v && String(v).toLowerCase().includes(q))
    })
    return [...filtered].sort((a, b) => {
      if (sort === 'old') return ts(a.createdAt) - ts(b.createdAt)
      if (sort === 'price_desc') return (b.price ?? 0) - (a.price ?? 0)
      if (sort === 'price_asc') return (a.price ?? 0) - (b.price ?? 0)
      return ts(b.createdAt) - ts(a.createdAt)
    })
  }, [all, status, search, type, sort])

  const statusCounts: Record<string, number> = useMemo(() => {
    const counts: Record<string, number> = { '': all.length }
    for (const g of STATUS_GROUPS) {
      if (!g.value) continue
      counts[g.value] = all.filter((p) => g.match.includes(p.status)).length
    }
    return counts
  }, [all])

  const hasParcels = all.length > 0
  const filteredEmpty = hasParcels && parcels.length === 0

  return (
    <div className="cm-detail-page" style={{ maxWidth: 1100 }}>
      {/* ---- Header ---- */}
      <div className="cm-page-head">
        <div className="cm-page-head-body">
          <h1>Mes colis</h1>
          <p className="cm-page-head-sub">
            {tab === 'sent' ? 'Colis que vous avez envoyés' : 'Colis qui vous sont destinés'}
            {' · '}
            <strong>{parcels.length}</strong> {parcels.length > 1 ? 'résultats' : 'résultat'}
          </p>
        </div>
        <Button icon="add" onClick={() => navigate('/client/nouveau')}>
          Créer un colis
        </Button>
      </div>

      {/* ---- Tabs envoyés/reçus ---- */}
      <div className="cm-chip-row">
        {SENDER_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            className="cm-chip"
            aria-pressed={tab === t.value}
            onClick={() => setTab(t.value)}
          >
            <Icon name={t.icon} size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ---- Status filter chips ---- */}
      <div className="cm-chip-row">
        {STATUS_GROUPS.map((g) => (
          <button
            key={g.value || 'all'}
            type="button"
            className="cm-chip"
            aria-pressed={status === g.value}
            onClick={() => setStatus(g.value)}
          >
            {g.label}
            <span className="cm-chip-count">{statusCounts[g.value] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* ---- Filter box ---- */}
      {hasParcels && (
        <div className="cm-filter-box">
          <Input
            aria-label="Rechercher un colis"
            icon="search"
            placeholder="Rechercher (suivi, ville, nom…)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            aria-label="Type de colis"
            icon="category"
            options={TYPE_FILTERS}
            value={type}
            onChange={(e) => setType(e.target.value)}
          />
          <Select
            aria-label="Trier les colis"
            icon="sort"
            options={SORTS}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          />
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
                from: p.departureCity ?? p.departureZoneName ?? '—',
                to: p.arrivalCity ?? p.arrivalZoneName ?? '—',
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
