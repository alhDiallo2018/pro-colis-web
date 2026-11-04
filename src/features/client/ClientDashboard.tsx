import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, Button, Icon, StatusBadge } from '@/ds'
import { QueryState } from '@/components/QueryState'
import { Panel } from '@/components/Panel'
import { ParcelsTable } from '@/components/ParcelsTable'
import { useMyParcels, useReceivedBids } from './hooks'
import { useMyBidStats, useMyStats } from '@/features/shared/profile/hooks'
import { useAuthStore } from '@/store/auth'
import { formatDate, formatFcfa, toStatusKey } from '@/lib/format'
import type { Parcel } from '@/lib/api/types'

const ACTIVE_EXCLUDED = ['delivered', 'cancelled']

export function ClientDashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const parcelsQuery = useMyParcels({ limit: 200 })
  const data = parcelsQuery.data
  const offers = useReceivedBids()
  const stats = useMyStats()
  const bidStats = useMyBidStats()

  const hasError = parcelsQuery.isError || offers.isError || stats.isError || bidStats.isError
  const retryAll = () => {
    if (parcelsQuery.isError) parcelsQuery.refetch()
    if (offers.isError) offers.refetch()
    if (stats.isError) stats.refetch()
    if (bidStats.isError) bidStats.refetch()
  }

  const parcels = useMemo(() => data?.parcels ?? [], [data])

  const enCours = parcels.filter((p) => !ACTIVE_EXCLUDED.includes(p.status)).length
  const livres = parcels.filter((p) => p.status === 'delivered').length
  const libre = parcels.filter((p) => p.status === 'free').length
  const totalSpent = parcels
    .filter((p) => p.status === 'delivered')
    .reduce((sum, p) => sum + Number(p.totalAmount ?? p.negotiatedPrice ?? p.price ?? 0), 0)

  const tracked = useMemo(() => {
    const active = parcels.filter((p) => !ACTIVE_EXCLUDED.includes(p.status) && p.status !== 'free')
    const order = ['out_for_delivery', 'arrived', 'in_transit', 'picked_up', 'confirmed', 'pending']
    const rank = (status: string) => { const index = order.indexOf(status); return index < 0 ? order.length : index }
    return [...active].sort((a, b) => rank(a.status) - rank(b.status))[0] ?? null
  }, [parcels])

  const firstName = user?.fullName?.split(' ')[0] ?? ''
  const pendingOffersCount = bidStats.data?.pending ?? offers.data?.length ?? 0

  return (
    <div className="cm-page">
      {/* ---- Hero header : salutation + search action ---- */}
      <section className="cm-hero" aria-label="Accueil">
        <p className="cm-hero-eyebrow">{getGreetingLabel()}</p>
        <h1 className="cm-hero-greeting">
          Bonjour <span className="cm-hero-greeting-accent">{firstName || 'à vous'}</span>,
          <br />où envoyez-vous aujourd’hui&nbsp;?
        </h1>
        <button
          type="button"
          className="cm-hero-search"
          onClick={() => navigate('/client/nouveau')}
          aria-label="Créer un nouvel envoi"
        >
          <span className="cm-hero-search-icon">
            <Icon name="near_me" size={22} />
          </span>
          <span className="cm-hero-search-body">
            <span className="cm-hero-search-title">Nouvel envoi</span>
            <span className="cm-hero-search-sub">Choisissez un départ et une destination</span>
          </span>
          <Icon name="arrow_forward" size={22} style={{ color: 'var(--text-muted)' }} />
        </button>
      </section>

      {hasError && (
        <div role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            padding: '14px 18px',
            background: 'var(--red-50)',
            border: '1px solid var(--red-100)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <span style={{ flex: 1, fontSize: 13.5, color: 'var(--red-600)', fontWeight: 600 }}>
            Impossible de charger vos données. Vérifiez votre connexion.
          </span>
          <Button size="sm" variant="secondary" icon="refresh" onClick={retryAll}>
            Réessayer
          </Button>
        </div>
      )}

      {/* ---- Action tiles (Citymapper-style colored tiles) ---- */}
      <section aria-label="Raccourcis">
        <div className="cm-tiles">
          <ActionTile
            color="emerald"
            icon="add"
            label="Envoyer"
            sub="Créer un colis"
            onClick={() => navigate('/client/nouveau')}
          />
          <ActionTile
            color="indigo"
            icon="qr_code_2"
            label="Scanner"
            sub="Suivre un code QR"
            onClick={() => navigate('/client/suivi')}
          />
          <ActionTile
            color="amber"
            icon="gavel"
            label="Offres"
            sub="Chauffeurs intéressés"
            badge={pendingOffersCount > 0 ? pendingOffersCount : undefined}
            onClick={() => navigate('/client/offres')}
          />
          <ActionTile
            color="cyan"
            icon="package_2"
            label="Mes colis"
            sub="Historique complet"
            onClick={() => navigate('/client/colis')}
          />
        </div>
      </section>

      {/* ---- Stats strip ---- */}
      <section aria-label="Statistiques">
        <div className="cm-stat-strip">
          <StatCell tone="teal"   icon="package_2" value={stats.data?.activeParcels ?? (data ? enCours : '—')} label="En cours" />
          <StatCell tone="green"  icon="task_alt"  value={stats.data?.deliveredParcels ?? (data ? livres : '—')} label="Livrés" />
          <StatCell tone="amber"  icon="sell"      value={data ? libre : '—'} label="Annonces" />
          <StatCell tone="rose"   icon="gavel"     value={pendingOffersCount || '—'} label="À traiter" />
          <StatCell tone="slate"  icon="payments"  value={data ? formatFcfa(totalSpent) : '—'} label="Dépensé" />
        </div>
      </section>

      {/* ---- Split : colis suivi + feed ---- */}
      <div className="cm-split">
        <div className="cm-col">
          <JourneyCard
            loading={parcelsQuery.isLoading}
            error={parcelsQuery.isError && !data}
            parcel={tracked}
            onTrack={(p) => navigate(`/client/suivi?tracking=${encodeURIComponent(p.trackingNumber)}`)}
            onDetails={(p) => navigate(`/client/colis/${p.id}`)}
            onCreate={() => navigate('/client/nouveau')}
          />

          <Panel
            title="Mes colis récents"
            flush
            action={
              <Button size="sm" variant="secondary" iconTrailing="chevron_right" onClick={() => navigate('/client/colis')}>
                Tout voir
              </Button>
            }
          >
            <QueryState isLoading={parcelsQuery.isLoading} isError={parcelsQuery.isError && !data} onRetry={() => parcelsQuery.refetch()}>
              <ParcelsTable
                parcels={parcels.slice(0, 5)}
                loading={parcelsQuery.isLoading}
                onRowClick={(p) => navigate(`/client/colis/${p.id}`)}
                emptyHint="Créez votre premier colis pour le voir ici."
              />
            </QueryState>
          </Panel>
        </div>

        <div className="cm-col">
          <Panel
            title={`Offres reçues${offers.data && offers.data.length > 0 ? ` · ${offers.data.length}` : ''}`}
            flush
            action={
              <Button size="sm" variant="secondary" iconTrailing="chevron_right" onClick={() => navigate('/client/offres')}>
                Voir tout
              </Button>
            }
          >
            {offers.isLoading ? (
              <p role="status" style={{ padding: 18 }}>Chargement des offres…</p>
            ) : offers.isError ? (
              <div style={{ padding: 18, fontSize: 13.5, color: 'var(--red-600)' }}>
                Impossible de charger les offres reçues.
                <Button size="sm" variant="secondary" icon="refresh" onClick={() => offers.refetch()} style={{ marginTop: 10 }}>
                  Réessayer
                </Button>
              </div>
            ) : !offers.data || offers.data.length === 0 ? (
              <div style={{ padding: 18, fontSize: 13.5, color: 'var(--text-muted)' }}>Aucune offre reçue pour le moment.</div>
            ) : (
              <div className="cm-offer-list">
                {offers.data.slice(0, 4).map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    className="cm-offer-row"
                    onClick={() => navigate('/client/offres')}
                  >
                    <Avatar name={o.driverName ?? 'Chauffeur'} size="sm" status="online" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="cm-offer-name">{o.driverName ?? 'Chauffeur'}</p>
                      <p className="cm-offer-meta">{o.parcel?.trackingNumber ?? o.message ?? 'Offre reçue'}</p>
                    </div>
                    <span className="cm-offer-price">{formatFcfa(o.price)}</span>
                  </button>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Mon compte">
            <div style={{ display: 'grid', gap: 12 }}>
              <AccountRow icon="stars" label="Points fidélité" value={stats.data ? `${stats.data.scoreBalance} pts` : '—'} />
              <AccountRow icon="notifications" label="Notifications non lues" value={stats.data?.unreadNotifications ?? '—'} />
              <AccountRow icon="inbox" label="Offres reçues au total" value={bidStats.data?.received ?? '—'} />
              <AccountRow icon="thumb_up" label="Offres acceptées" value={bidStats.data?.accepted ?? '—'} />
              <AccountRow icon="event" label="Membre depuis" value={formatDate(user?.createdAt)} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <Button size="sm" variant="secondary" block icon="person" onClick={() => navigate('/client/profil')}>
                Profil
              </Button>
              <Button size="sm" variant="ghost" block icon="notifications" onClick={() => navigate('/client/notifications')}>
                Notifications
              </Button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Pieces                                                             */
/* ------------------------------------------------------------------ */

type TileColor = 'emerald' | 'amber' | 'rose' | 'indigo' | 'cyan' | 'violet' | 'teal' | 'slate'

function ActionTile({
  color, icon, label, sub, badge, onClick,
}: {
  color: TileColor
  icon: string
  label: string
  sub?: string
  badge?: number | string
  onClick: () => void
}) {
  return (
    <button type="button" className={`cm-tile cm-tile--${color}`} onClick={onClick}>
      {badge !== undefined && badge !== '' && <span className="cm-tile-badge">{badge}</span>}
      <span className="cm-tile-icon"><Icon name={icon} size={20} /></span>
      <span>
        <span className="cm-tile-label" style={{ display: 'block' }}>{label}</span>
        {sub && <span className="cm-tile-sub" style={{ display: 'block' }}>{sub}</span>}
      </span>
    </button>
  )
}

function StatCell({ tone, icon, value, label }: { tone: 'teal' | 'green' | 'amber' | 'rose' | 'slate'; icon: string; value: React.ReactNode; label: string }) {
  return (
    <div className="cm-stat">
      <span className={`cm-stat-icon cm-stat-icon--${tone}`}><Icon name={icon} size={20} /></span>
      <div style={{ minWidth: 0 }}>
        <div className="cm-stat-value">{value}</div>
        <div className="cm-stat-label">{label}</div>
      </div>
    </div>
  )
}

function JourneyCard({
  loading, error, parcel, onTrack, onDetails, onCreate,
}: {
  loading: boolean
  error: boolean
  parcel: Parcel | null
  onTrack: (p: Parcel) => void
  onDetails: (p: Parcel) => void
  onCreate: () => void
}) {
  if (loading) {
    return (
      <div className="cm-journey">
        <p role="status" style={{ margin: 0, color: 'var(--text-muted)' }}>Chargement de vos colis…</p>
      </div>
    )
  }
  if (error) {
    return (
      <div className="cm-journey">
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>Votre suivi est temporairement indisponible. Réessayez pour retrouver vos colis.</p>
      </div>
    )
  }
  if (!parcel) {
    return (
      <div className="cm-journey">
        <div className="cm-journey-head">
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--text-strong)' }}>
            Aucun colis en cours
          </h2>
        </div>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14 }}>
          Créez un envoi et recevez des offres de chauffeurs disponibles sur votre trajet.
        </p>
        <div className="cm-journey-actions">
          <Button variant="primary" icon="add" onClick={onCreate}>Créer un colis</Button>
        </div>
      </div>
    )
  }

  const statusKey = toStatusKey(parcel.status)
  const routeTone = parcel.isUrgent ? 'cm-route--urgent' : ''
  const estimated = parcel.estimatedDeliveryDate ? formatDate(parcel.estimatedDeliveryDate) : null

  return (
    <div className="cm-journey">
      <div className="cm-journey-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--text-strong)' }}>
            Colis en cours
          </h2>
          <StatusBadge status={statusKey} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {estimated && (
            <span className="cm-journey-eta">
              <Icon name="schedule" size={14} />
              ETA · {estimated}
            </span>
          )}
          <span className="cm-journey-tracking">
            <Icon name="qr_code_2" size={13} />
            {parcel.trackingNumber}
          </span>
        </div>
      </div>

      <div className={`cm-route ${routeTone}`}>
        <div className="cm-route-rail">
          <div className="cm-route-node cm-route-node--filled"><div className="cm-route-node-dot" /></div>
          <div className="cm-route-spacer" />
          <div className="cm-route-node">
            <div className="cm-route-node-vehicle"><Icon name="local_shipping" size={16} /></div>
          </div>
          <div className="cm-route-spacer" />
          <div className="cm-route-node"><div className="cm-route-node-dot" /></div>
        </div>
        <div>
          <div className="cm-route-step">
            <p className="cm-route-step-label">{parcel.departureCity ?? parcel.departureZoneName ?? '—'}</p>
            <p className="cm-route-step-sub">Départ</p>
          </div>
          <div className="cm-route-step">
            <p className="cm-route-step-label" style={{ fontSize: 14, color: 'var(--text-body)' }}>
              En transit
            </p>
            <p className="cm-route-step-sub">
              {parcel.driverName ? <>Chauffeur · <strong>{parcel.driverName}</strong></> : 'En cours de livraison'}
            </p>
          </div>
          <div className="cm-route-step">
            <p className="cm-route-step-label">{parcel.arrivalCity ?? parcel.arrivalZoneName ?? '—'}</p>
            <p className="cm-route-step-sub">
              Pour <strong>{parcel.receiverName}</strong>
              {estimated && <> · livraison estimée <strong>{estimated}</strong></>}
            </p>
          </div>
        </div>
      </div>

      <div className="cm-journey-actions">
        <Button variant="primary" icon="qr_code_2" onClick={() => onTrack(parcel)}>Suivre</Button>
        <Button variant="secondary" icon="visibility" onClick={() => onDetails(parcel)}>Voir le détail</Button>
      </div>
    </div>
  )
}

function AccountRow({ icon, label, value }: { icon: string; label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Icon name={icon} size={18} style={{ color: 'var(--text-faint)' }} />
      <span style={{ flex: 1, fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13, color: 'var(--text-strong)' }}>{value}</span>
    </div>
  )
}

function getGreetingLabel(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Bonne nuit'
  if (h < 12) return 'Bonne matinée'
  if (h < 18) return 'Bon après-midi'
  return 'Bonne soirée'
}
