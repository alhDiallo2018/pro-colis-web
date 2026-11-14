import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { Badge, Button, Icon, StatBox } from '@/ds'
import { QueryState } from '@/components/QueryState'
import { fetchManifest, type ManifestOfferSummary, type ManifestStop } from '@/lib/api/advertisements'
import { formatFcfa } from '@/lib/format'

export function AdvertisementManifestScreen() {
  const { advertisementId = '' } = useParams<{ advertisementId: string }>()
  const query = useQuery({
    queryKey: ['driver', 'advertisement', advertisementId, 'manifest'],
    queryFn: () => fetchManifest(advertisementId),
    enabled: Boolean(advertisementId),
  })
  const manifest = query.data
  const isEmpty = !!manifest && manifest.stops.length === 0 && manifest.unassigned.length === 0

  return (
    <div className="cm-detail-page" style={{ maxWidth: 820 }}>
      <div className="cm-page-head">
        <div className="cm-page-head-body">
          <h1>Manifeste navette</h1>
          <p className="cm-page-head-sub">
            Ordre des arrêts avec les colis à embarquer et à remettre pour ce trajet.
          </p>
        </div>
        <Button variant="secondary" icon="refresh" onClick={() => query.refetch()} loading={query.isFetching && !query.isLoading}>
          Rafraîchir
        </Button>
      </div>

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        isEmpty={isEmpty}
        emptyTitle="Manifeste vide"
        emptyMessage="Aucune offre acceptée à afficher pour ce trajet."
        onRetry={() => query.refetch()}
      >
        {manifest && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              <StatBox label="Arrêts" value={manifest.stops.length} icon="place" />
              <StatBox label="Offres totales" value={manifest.totalOffers} icon="receipt_long" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {manifest.stops.map((stop) => (
                <StopCard key={stop.order} stop={stop} />
              ))}
            </div>

            {manifest.unassigned.length > 0 && <UnassignedSection offers={manifest.unassigned} />}
          </div>
        )}
      </QueryState>
    </div>
  )
}

function StopCard({ stop }: { stop: ManifestStop }) {
  const isEmpty = stop.picked.length === 0 && stop.dropOffs.length === 0
  return (
    <details
      open={!isEmpty}
      style={{
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--surface-card)',
        padding: 0,
      }}
    >
      <summary
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 16px',
          cursor: 'pointer',
          listStyle: 'none',
        }}
      >
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'var(--teal-100)',
            color: 'var(--teal-800)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
          }}
        >
          {stop.order}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600 }}>{stop.label ?? `Arrêt ${stop.order}`}</div>
          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
            {stop.picked.length} à embarquer · {stop.dropOffs.length} à remettre
          </div>
        </div>
      </summary>

      <div style={{ padding: '0 16px 14px' }}>
        {stop.picked.length > 0 && <OfferGroup title="À embarquer" icon="upload" offers={stop.picked} />}
        {stop.dropOffs.length > 0 && <OfferGroup title="À remettre" icon="download" offers={stop.dropOffs} />}
        {isEmpty && (
          <div style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-sm)', padding: 8 }}>
            Aucun colis à cet arrêt.
          </div>
        )}
      </div>
    </details>
  )
}

function OfferGroup({ title, icon, offers }: { title: string; icon: string; offers: ManifestOfferSummary[] }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: 'var(--text-muted)',
          fontSize: 'var(--fs-xs)',
          fontWeight: 700,
          textTransform: 'uppercase',
          marginBottom: 6,
        }}
      >
        <Icon name={icon} size={16} />
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {offers.map((offer) => (
          <div
            key={offer.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              padding: '8px 10px',
              background: 'var(--surface-sunken)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--fs-sm)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <code style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xs)' }}>
                {offer.trackingNumber ?? offer.id}
              </code>
              {offer.receiverName && (
                <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-xs)' }}>{offer.receiverName}</span>
              )}
            </div>
            {offer.price != null && <span style={{ fontWeight: 700 }}>{formatFcfa(offer.price)}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

function UnassignedSection({ offers }: { offers: ManifestOfferSummary[] }) {
  return (
    <div
      style={{
        border: '1px dashed var(--border-strong)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--surface-sunken)',
        padding: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Icon name="help_outline" size={18} />
        <strong>Offres sans arrêt ({offers.length})</strong>
        <Badge tone="amber">non affectées</Badge>
      </div>
      <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)', margin: '0 0 8px' }}>
        Ces offres ont été acceptées sans affectation d&apos;arrêt embarquement/descente.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {offers.map((offer) => (
          <div
            key={offer.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 10,
              fontSize: 'var(--fs-sm)',
              padding: '6px 10px',
              background: 'var(--surface-card)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <code style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xs)' }}>
              {offer.trackingNumber ?? offer.id}
            </code>
            {offer.receiverName && <span style={{ color: 'var(--text-muted)' }}>{offer.receiverName}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
