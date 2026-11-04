import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Badge, Button, Icon, StatusBadge } from '@/ds'
import { QueryState } from '@/components/QueryState'
import { Panel } from '@/components/Panel'
import { ProposalsPanel } from './ProposalsPanel'
import { BarChart } from '@/components/BarChart'
import { ParcelDetailDialog } from '@/components/ParcelDetailDialog'
import { OfferDialog } from './OfferDialog'
import { CreateAnnonceDialog } from './CreateAnnonceDialog'
import { RechargeDialog } from './RechargeDialog'
import { ItineraireDialog } from './ItineraireDialog'
import { useDriverBidsSent, useDriverFinancialState, useDriverFreeParcels, useDriverParcels, useDriverWallet, useMyAdvertisements, useScoreBalance } from './hooks'
import { CommissionDebtNotice } from './CommissionDebtNotice'
import { useMyDriverStats } from '@/features/shared/profile/hooks'
import { useAuthStore } from '@/store/auth'
import { formatDate, formatFcfa, formatPoints, formatWeight, toStatusKey } from '@/lib/format'
import type { Parcel } from '@/lib/api/types'
import { ZoneFilter } from '@/components/ZoneFilter'
import { useZoneFilter } from '@/lib/useZoneFilter'

const DAY_LETTERS = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

function parcelRevenue(p: Parcel): number {
  return Number(p.negotiatedPrice ?? p.price ?? p.totalAmount ?? 0)
}

function startOfDay(d: Date): Date {
  const copy = new Date(d)
  copy.setHours(0, 0, 0, 0)
  return copy
}

export function DriverDashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const mine = useDriverParcels({ limit: 200 })
  const stats = useMyDriverStats()
  const free = useDriverFreeParcels()
  const sent = useDriverBidsSent()
  const ads = useMyAdvertisements()
  const balance = useScoreBalance()
  const wallet = useDriverWallet()
  const fin = useDriverFinancialState()
  const [offerTarget, setOfferTarget] = useState<Parcel | null>(null)
  const [detailTarget, setDetailTarget] = useState<Parcel | null>(null)
  const [searchParams] = useSearchParams()
  const [showAnnonce, setShowAnnonce] = useState(searchParams.has('annonce'))
  const [showRecharge, setShowRecharge] = useState(false)
  const [showItineraire, setShowItineraire] = useState(false)

  const queries = [mine, stats, free, sent, ads, balance, wallet]
  const hasError = queries.some(query => query.isError)
  const retryFailed = () => { queries.filter(query => query.isError).forEach(query => { void query.refetch() }) }

  const parcels = useMemo(() => mine.data?.parcels ?? [], [mine.data])
  const allFreeParcels = useMemo(() => free.data?.parcels ?? [], [free.data])
  const {
    items: freeParcels,
    mode: zoneMode,
    setMode: setZoneMode,
    hasZone,
    zone: homeZone,
  } = useZoneFilter(allFreeParcels, 'zone')
  const active = parcels.find((p) => !['delivered', 'cancelled'].includes(p.status))
  const delivered = parcels.filter((p) => p.status === 'delivered').length
  const pendingBids = stats.data?.pendingBids ?? (sent.data ? sent.data.filter(bid => bid.status === 'pending').length : undefined)
  const freeCount = free.data ? allFreeParcels.length : undefined

  const bidMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const b of sent.data ?? []) {
      if (b.parcelId) map.set(b.parcelId, b.id)
    }
    return map
  }, [sent.data])

  const revenue = useMemo(() => {
    const today = startOfDay(new Date())
    const buckets = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(today)
      day.setDate(today.getDate() - (6 - i))
      return { day, total: 0 }
    })
    let previousWeek = 0

    for (const p of parcels) {
      if (p.status !== 'delivered') continue
      const raw = p.deliveryDate ?? p.updatedAt
      if (!raw) continue
      const date = startOfDay(new Date(raw))
      if (Number.isNaN(date.getTime())) continue
      const diffDays = Math.round((today.getTime() - date.getTime()) / 86_400_000)
      if (diffDays >= 0 && diffDays <= 6) buckets[6 - diffDays].total += parcelRevenue(p)
      else if (diffDays >= 7 && diffDays <= 13) previousWeek += parcelRevenue(p)
    }

    const total = buckets.reduce((sum, b) => sum + b.total, 0)
    const delta = previousWeek > 0 ? Math.round(((total - previousWeek) / previousWeek) * 100) : null
    return {
      total,
      delta,
      bars: buckets.map((b) => b.total),
      labels: buckets.map((b) => DAY_LETTERS[b.day.getDay()]),
      hasData: total > 0 || previousWeek > 0,
    }
  }, [parcels])

  const firstName = user?.fullName?.split(' ')[0] ?? ''

  return (
    <div className="cm-page">
      {/* ---- Hero header ---- */}
      <section className="cm-hero" aria-label="Accueil chauffeur">
        <p className="cm-hero-eyebrow">{getGreetingLabel()}</p>
        <h1 className="cm-hero-greeting">
          Bonjour <span className="cm-hero-greeting-accent">{firstName || 'à vous'}</span>,
          <br />prêt à prendre la route&nbsp;?
        </h1>
        <button
          type="button"
          className="cm-hero-search"
          onClick={() => navigate('/driver/libre')}
          aria-label="Trouver un colis"
        >
          <span className="cm-hero-search-icon">
            <Icon name="near_me" size={22} />
          </span>
          <span className="cm-hero-search-body">
            <span className="cm-hero-search-title">Trouver un colis</span>
            <span className="cm-hero-search-sub">Colis disponibles sur votre trajet</span>
          </span>
          <Icon name="arrow_forward" size={22} style={{ color: 'var(--text-muted)' }} />
        </button>
      </section>

      {hasError && (
        <div role="alert" className="pc-dashboard-feedback">
          <span>Certaines données n’ont pas pu être actualisées. Les dernières données disponibles restent affichées.</span>
          <Button size="sm" variant="secondary" icon="refresh" onClick={retryFailed}>Réessayer</Button>
        </div>
      )}

      {/* ---- Action tiles ---- */}
      <section aria-label="Raccourcis">
        <div className="cm-tiles">
          <ActionTile
            color="emerald"
            icon="sell"
            label="Colis libres"
            sub="Dans votre zone"
            badge={freeCount}
            onClick={() => navigate('/driver/libre')}
          />
          <ActionTile
            color="amber"
            icon="campaign"
            label="Publier"
            sub="Un trajet programmé"
            onClick={() => setShowAnnonce(true)}
          />
          <ActionTile
            color="indigo"
            icon="checklist"
            label="Missions"
            sub="Gérer les livraisons"
            onClick={() => navigate('/driver/missions')}
          />
          <ActionTile
            color="violet"
            icon="account_balance_wallet"
            label="Recharger"
            sub="Solde de points"
            onClick={() => setShowRecharge(true)}
          />
        </div>
      </section>

      {/* ---- Stats strip ---- */}
      <section aria-label="Statistiques">
        <div className="cm-stat-strip">
          <StatCell tone="teal"  icon="local_shipping"  value={stats.data?.assignedParcels ?? (mine.data ? parcels.length : '—')} label="Missions" />
          <StatCell tone="amber" icon="pending_actions" value={stats.data?.activeParcels ?? '—'} label="En cours" />
          <StatCell tone="green" icon="task_alt"        value={stats.data?.completedDeliveries ?? (mine.data ? delivered : '—')} label="Livrés" />
          <StatCell tone="rose"  icon="gavel"           value={pendingBids ?? '—'} label="Offres" />
          <StatCell tone="slate" icon="star"            value={stats.data?.rating ? stats.data.rating.toFixed(1) : '—'} label="Note" />
        </div>
      </section>

      {/* ---- Split ---- */}
      <div className="cm-split">
        <div className="cm-col">
          {/* Mission en cours — Citymapper journey */}
          <MissionCard
            loading={mine.isLoading}
            error={mine.isError && !mine.data}
            parcel={active ?? null}
            onItinerary={() => setShowItineraire(true)}
            onManage={() => navigate('/driver/missions')}
            onFind={() => navigate('/driver/libre')}
          />

          <ProposalsPanel />

          <Panel
            title={
              zoneMode === 'zone'
                ? `Colis à prendre · ${homeZone.name ?? 'Zone non renseignée'}`
                : 'Colis à prendre · toutes zones'
            }
            flush
            action={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ZoneFilter
                  mode={zoneMode}
                  onChange={setZoneMode}
                  zoneName={homeZone.name}
                  hasZone={hasZone}
                />
                <Button size="sm" variant="secondary" iconTrailing="chevron_right" onClick={() => navigate('/driver/libre')}>
                  Tout voir
                </Button>
              </div>
            }
          >
            <QueryState isLoading={free.isLoading} isError={free.isError && !free.data} onRetry={() => free.refetch()}>
              {freeParcels.length === 0 ? (
                <div style={{ padding: 18, fontSize: 13.5, color: 'var(--text-muted)' }}>
                  {!hasZone
                    ? 'Renseignez votre zone dans le profil pour filtrer les colis à prendre.'
                    : zoneMode === 'zone'
                      ? 'Aucun colis disponible dans votre zone pour le moment.'
                      : 'Aucun colis disponible pour le moment.'}
                </div>
              ) : (
                freeParcels.slice(0, 4).map((p) => {
                  const hasBid = bidMap.has(p.id)
                  return (
                    <div
                      key={p.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                      onClick={() => setDetailTarget(p)}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 42, height: 42, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-soft)', color: 'var(--color-primary)', flex: 'none' }}>
                        <Icon name="package_2" size={22} />
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14.5, color: 'var(--text-strong)' }}>
                          {p.departureCity ?? p.departureZoneName ?? '—'}
                          <Icon name="arrow_right_alt" size={16} style={{ color: 'var(--text-faint)' }} />
                          {p.arrivalCity ?? p.arrivalZoneName ?? '—'}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                          <span style={{ fontFamily: 'var(--font-mono)' }}>{p.trackingNumber}</span>
                          {p.weight != null && ` · ${formatWeight(p.weight)}`}
                        </div>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 15, color: 'var(--teal-700)' }}>{formatFcfa(p.price)}</span>
                      <Button size="sm" icon={hasBid ? 'forum' : 'gavel'} onClick={(e: React.MouseEvent) => { e.stopPropagation(); setOfferTarget(p); }}>
                        {hasBid ? 'Suivi offre' : 'Faire une offre'}
                      </Button>
                    </div>
                  )
                })
              )}
            </QueryState>
          </Panel>
        </div>

        <div className="cm-col">
          <CommissionDebtNotice showClearState={!fin.isLoading} />

          {/* Points card — gradient Citymapper */}
          <div className="cm-journey" style={{ background: 'linear-gradient(135deg, var(--deep-700) 0%, var(--teal-800) 100%)', color: '#fff', border: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.18)' }}>
                <Icon name="account_balance_wallet" size={22} />
              </span>
              <div>
                <div style={{ fontSize: 11, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>Solde de points</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, lineHeight: 1.1 }}>
                  {balance.data != null ? formatPoints(balance.data).replace(' pts', '') : '—'}
                  <span style={{ fontSize: 13, opacity: 0.8, fontWeight: 700 }}> pts</span>
                </div>
              </div>
            </div>
            {wallet.data && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, opacity: 0.92, marginTop: -4 }}>
                <span><Icon name="savings" size={13} /> Portefeuille · <strong>{formatFcfa(wallet.data.balance)}</strong></span>
                <span><Icon name="error_outline" size={13} /> Dette · <strong>{formatFcfa(fin.commissionDebt)}</strong></span>
              </div>
            )}
            <div className="cm-journey-actions">
              <Button variant="amber" icon="add" onClick={() => setShowRecharge(true)}>Recharger</Button>
              <Button variant="secondary" icon="receipt_long" onClick={() => navigate('/driver/points')}>Historique</Button>
            </div>
          </div>

          <Panel
            title="Revenus · 7 jours"
            action={
              revenue.delta != null ? (
                <Badge tone={revenue.delta >= 0 ? 'green' : 'red'}>
                  {revenue.delta >= 0 ? '+' : ''}
                  {revenue.delta}%
                </Badge>
              ) : undefined
            }
          >
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: 'var(--text-strong)', marginBottom: 14, letterSpacing: '-0.01em' }}>
              {mine.data ? formatFcfa(revenue.total) : '—'}
            </div>
            {!mine.data ? <p>Les revenus seront affichés après le chargement de vos livraisons.</p> : revenue.hasData ? (
              <BarChart bars={revenue.bars} labels={revenue.labels} highlightLast />
            ) : (
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Aucune livraison terminée sur les 14 derniers jours.
              </div>
            )}
          </Panel>

          <Panel title="Mes offres" flush>
            <QueryState isLoading={sent.isLoading} isError={sent.isError && !sent.data} onRetry={() => sent.refetch()}>
              {(sent.data ?? []).slice(0, 4).map((b) => (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 18px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--text-strong)', fontWeight: 700 }}>{b.parcelId.slice(0, 8)}…</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{formatFcfa(b.price)} proposés</div>
                  </div>
                  <Badge tone={b.status === 'accepted' ? 'green' : b.status === 'rejected' ? 'red' : 'amber'}>
                    {b.status === 'accepted' ? 'Acceptée' : b.status === 'rejected' ? 'Refusée' : 'En attente'}
                  </Badge>
                </div>
              ))}
              {(!sent.data || sent.data.length === 0) && <div style={{ padding: 18, fontSize: 13.5, color: 'var(--text-muted)' }}>Aucune offre envoyée.</div>}
            </QueryState>
          </Panel>

          <Panel
            title="Mes annonces"
            flush
            action={
              <Button size="sm" variant="ghost" icon="add" onClick={() => setShowAnnonce(true)}>
                Nouvelle
              </Button>
            }
          >
            <QueryState isLoading={ads.isLoading} isError={ads.isError && !ads.data} onRetry={() => ads.refetch()}>
              {(ads.data ?? []).slice(0, 4).map((a) => (
                <div
                  key={a.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 18px', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                  onClick={() => navigate('/driver/annonces')}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13.5, color: 'var(--text-strong)' }}>
                      {a.departureCity ?? '—'}
                      <Icon name="arrow_right_alt" size={15} style={{ color: 'var(--text-faint)' }} />
                      {a.arrivalCity ?? '—'}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{a.departureAt ? formatDate(a.departureAt) : 'Date flexible'}</div>
                  </div>
                  {a.proposedPrice != null && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 13.5, color: 'var(--teal-700)' }}>{formatFcfa(a.proposedPrice)}</span>
                  )}
                </div>
              ))}
              {(!ads.data || ads.data.length === 0) && (
                <div style={{ padding: 18, fontSize: 13.5, color: 'var(--text-muted)' }}>Aucune annonce. Publiez un trajet pour recevoir des colis.</div>
              )}
            </QueryState>
          </Panel>
        </div>
      </div>

      <OfferDialog
        parcel={offerTarget}
        onClose={() => setOfferTarget(null)}
        existingBidId={offerTarget ? bidMap.get(offerTarget.id) ?? null : null}
      />
      <ParcelDetailDialog parcel={detailTarget} onClose={() => setDetailTarget(null)} />
      <CreateAnnonceDialog open={showAnnonce} onClose={() => setShowAnnonce(false)} />
      <RechargeDialog open={showRecharge} onClose={() => setShowRecharge(false)} />
      <ItineraireDialog parcel={active ?? null} open={showItineraire} onClose={() => setShowItineraire(false)} />
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
  const showBadge = badge !== undefined && badge !== '' && badge !== '—' && Number(badge) !== 0
  return (
    <button type="button" className={`cm-tile cm-tile--${color}`} onClick={onClick}>
      {showBadge && <span className="cm-tile-badge">{badge}</span>}
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

function MissionCard({
  loading, error, parcel, onItinerary, onManage, onFind,
}: {
  loading: boolean
  error: boolean
  parcel: Parcel | null
  onItinerary: () => void
  onManage: () => void
  onFind: () => void
}) {
  if (loading) {
    return (
      <div className="cm-journey">
        <p role="status" style={{ margin: 0, color: 'var(--text-muted)' }}>Chargement de vos missions…</p>
      </div>
    )
  }
  if (error) {
    return (
      <div className="cm-journey">
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>Vos missions sont temporairement indisponibles. Réessayez pour les retrouver.</p>
      </div>
    )
  }
  if (!parcel) {
    return (
      <div className="cm-journey">
        <div className="cm-journey-head">
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--text-strong)' }}>
            Aucune mission en cours
          </h2>
        </div>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14 }}>
          Consultez les colis à prendre pour proposer un transport sur votre trajet.
        </p>
        <div className="cm-journey-actions">
          <Button variant="primary" icon="sell" onClick={onFind}>Trouver un colis</Button>
        </div>
      </div>
    )
  }

  const statusKey = toStatusKey(parcel.status)
  const routeTone = parcel.isUrgent ? 'cm-route--urgent' : ''

  return (
    <div className="cm-journey">
      <div className="cm-journey-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--text-strong)' }}>
            Mission en cours
          </h2>
          <StatusBadge status={statusKey} />
        </div>
        <span className="cm-journey-tracking">
          <Icon name="qr_code_2" size={13} />
          {parcel.trackingNumber}
        </span>
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
              En route
            </p>
            <p className="cm-route-step-sub">
              {parcel.senderName ? <>Expéditeur · <strong>{parcel.senderName}</strong></> : 'Livraison en cours'}
            </p>
          </div>
          <div className="cm-route-step">
            <p className="cm-route-step-label">{parcel.arrivalCity ?? parcel.arrivalZoneName ?? '—'}</p>
            <p className="cm-route-step-sub">Pour <strong>{parcel.receiverName}</strong></p>
          </div>
        </div>
      </div>

      <div className="cm-journey-actions">
        <Button variant="secondary" icon="navigation" onClick={onItinerary}>Itinéraire</Button>
        <Button variant="primary" icon="checklist" onClick={onManage}>Gérer la mission</Button>
      </div>
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
