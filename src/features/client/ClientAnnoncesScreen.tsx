import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, Icon, Input } from '@/ds'
import { QueryState } from '@/components/QueryState'
import { useDriverAnnonces } from './hooks'
import { formatDate, formatFcfa, formatWeight } from '@/lib/format'
import type { Advertisement } from '@/lib/api/advertisements'

/** Client browses drivers' trip advertisements and can bid on them. */
export function ClientAnnoncesScreen() {
  const navigate = useNavigate()
  const query = useDriverAnnonces()
  const all = useMemo(() => query.data ?? [], [query.data])
  const [search, setSearch] = useState('')

  const annonces = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((a) =>
      [a.departureCity, a.arrivalCity, a.driver?.fullName, a.driverName, a.description].some(
        (v) => v && String(v).toLowerCase().includes(q),
      ),
    )
  }, [all, search])

  const hasAny = all.length > 0
  const filteredEmpty = hasAny && annonces.length === 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>
        Trajets proposés par les chauffeurs. Appuyez sur une annonce pour voir les détails et faire une offre.
      </p>

      {hasAny && (
        <div style={{ maxWidth: 420 }}>
          <Input icon="search" placeholder="Rechercher (ville, chauffeur…)" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      )}

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        isEmpty={annonces.length === 0}
        emptyTitle={filteredEmpty ? 'Aucun résultat' : 'Aucune annonce'}
        emptyMessage={
          filteredEmpty
            ? 'Aucune annonce ne correspond à votre recherche.'
            : 'Aucun chauffeur n’a publié de trajet pour le moment.'
        }
        onRetry={() => query.refetch()}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--gap-card)' }}>
          {annonces.map((a) => (
            <AnnonceCard key={a.id} ad={a} onClick={() => navigate(`/client/annonces/${a.id}`)} />
          ))}
        </div>
      </QueryState>
    </div>
  )
}

function AnnonceCard({ ad, onClick }: { ad: Advertisement; onClick: () => void }) {
  const [hover, setHover] = useState(false)
  const driverName = ad.driver?.fullName ?? ad.driverName ?? 'Chauffeur'
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        textAlign: 'left',
        background: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4)',
        boxShadow: hover ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        transform: hover ? 'translateY(-2px)' : 'none',
        cursor: 'pointer',
        transition: 'box-shadow var(--dur-base), transform var(--dur-base)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar name={driverName} src={ad.driver?.profilePhoto ?? undefined} size="sm" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {driverName}
          </div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{ad.driver?.garageName ?? ad.driver?.city ?? 'Indépendant'}</div>
        </div>
        {(ad.offers?.length ?? 0) > 0 && (
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{ad.offers!.length} offre{ad.offers!.length > 1 ? 's' : ''}</span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '14px 0', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text-strong)' }}>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ad.departureCity ?? '—'}</span>
        <Icon name="local_shipping" size={18} style={{ color: 'var(--teal-500)' }} />
        <span style={{ flex: 1, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ad.arrivalCity ?? '—'}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
        {ad.departureAt && <Meta icon="event" text={formatDate(ad.departureAt)} />}
        {ad.availableWeight != null && <Meta icon="weight" text={formatWeight(ad.availableWeight)} />}
        {ad.proposedPrice != null && (
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16, color: 'var(--teal-600)' }}>{formatFcfa(ad.proposedPrice)}</span>
        )}
      </div>
    </button>
  )
}

function Meta({ icon, text }: { icon: string; text: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 500 }}>
      <Icon name={icon} size={16} style={{ color: 'var(--text-faint)' }} />
      {text}
    </span>
  )
}
