import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Badge, Button, StatBox } from '@/ds'
import { Panel } from '@/components/Panel'
import { BarChart } from '@/components/BarChart'
import { ParcelDetailDialog } from '@/components/ParcelDetailDialog'
import { OfferDialog } from './OfferDialog'
import { CreateAnnonceDialog } from './CreateAnnonceDialog'
import { RechargeDialog } from './RechargeDialog'
import { ItineraireDialog } from './ItineraireDialog'
import { useDriverBidsSent, useDriverFreeParcels, useDriverParcels, useMyAdvertisements, useScoreBalance } from './hooks'
import { useMyDriverStats } from '@/features/shared/profile/hooks'
import { formatDate, formatFcfa, formatPoints, formatWeight } from '@/lib/format'
import type { Parcel } from '@/lib/api/types'
import { useAuthStore } from '@/store/auth'
import { getDriverHomeZone } from './freeParcelZone'

const DAY_LETTERS = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

/** Montant encaissé par le chauffeur pour un colis livré. */
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
  const user = useAuthStore((state) => state.user)
  const mine = useDriverParcels({ limit: 200 })
  const stats = useMyDriverStats()
  const free = useDriverFreeParcels()
  const sent = useDriverBidsSent()
  const ads = useMyAdvertisements()
  const balance = useScoreBalance()
  const [offerTarget, setOfferTarget] = useState<Parcel | null>(null)
  const [detailTarget, setDetailTarget] = useState<Parcel | null>(null)
  const [searchParams] = useSearchParams()
  const [showAnnonce, setShowAnnonce] = useState(searchParams.has('annonce'))
  const [showRecharge, setShowRecharge] = useState(false)
  const [showItineraire, setShowItineraire] = useState(false)

  const parcels = useMemo(() => mine.data?.parcels ?? [], [mine.data])
  const freeParcels = free.data?.parcels ?? []
  const homeZone = getDriverHomeZone(user)
  const active = parcels.find((p) => !['delivered', 'cancelled'].includes(p.status))
  const delivered = parcels.filter((p) => p.status === 'delivered').length

  const bidMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const b of sent.data ?? []) {
      if (b.parcelId) map.set(b.parcelId, b.id)
    }
    return map
  }, [sent.data])

  // Revenus réels : colis livrés sur les 7 derniers jours, comparés aux 7 précédents.
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <Button icon="campaign" onClick={() => setShowAnnonce(true)}>
          Créer une annonce
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
        <StatBox icon="local_shipping" tone="primary" value={stats.data?.assignedParcels ?? parcels.length} label="Missions" />
        <StatBox icon="pending_actions" tone="teal" value={stats.data?.activeParcels ?? '—'} label="En cours" />
        <StatBox icon="sell" tone="green" value={freeParcels.length} label="Colis disponibles" />
        <StatBox icon="gavel" tone="amber" value={stats.data?.pendingBids ?? sent.data?.length ?? 0} label="Offres en attente" />
        <StatBox icon="task_alt" tone="neutral" value={stats.data?.completedDeliveries ?? delivered} label="Colis livrés" />
        <StatBox icon="star" tone="amber" value={stats.data?.rating ? stats.data.rating.toFixed(1) : '—'} label="Note moyenne" />
        <StatBox icon="account_balance_wallet" tone="teal" value={balance.data ?? stats.data?.scoreBalance ?? '—'} label="Points" />
      </div>

      <div className="pc-split">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Mission en cours */}
          <div
            style={{ background: 'var(--gradient-brand)', borderRadius: 'var(--radius-lg)', padding: 20, color: '#fff', boxShadow: 'var(--shadow-brand)', cursor: active ? 'pointer' : 'default' }}
            onClick={() => active && setDetailTarget(active)}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.9 }}>
                Mission en cours
              </span>
              {active && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13, background: 'rgba(255,255,255,0.16)', padding: '4px 10px', borderRadius: 'var(--radius-pill)' }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 15 }}>
                    qr_code_2
                  </span>
                  {active.trackingNumber}
                </span>
              )}
            </div>
            {active ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                  <div>
                    <div style={{ fontSize: 11, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Départ</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19 }}>{active.departureCity ?? active.departureZoneName ?? '—'}</div>
                  </div>
                  <div style={{ flex: 1, position: 'relative', height: 2, background: 'rgba(255,255,255,0.4)' }}>
                    <span className="material-symbols-rounded" style={{ position: 'absolute', left: '52%', top: -12, fontSize: 24, color: '#fff' }}>
                      local_shipping
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Arrivée</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19 }}>{active.arrivalCity ?? active.arrivalZoneName ?? '—'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Button variant="secondary" block icon="navigation" onClick={() => setShowItineraire(true)}>
                    Itinéraire
                  </Button>
                  <Button variant="amber" block icon="checklist" onClick={() => navigate('/driver/missions')}>
                    Gérer la mission
                  </Button>
                </div>
              </>
            ) : (
              <div style={{ fontSize: 14.5, opacity: 0.9 }}>Aucune mission en cours. Faites une offre sur une annonce.</div>
            )}
          </div>

          {/* Colis libres limités à la zone exacte du chauffeur connecté. */}
          <Panel
            title={`Colis à prendre · ${homeZone.name ?? 'Zone non renseignée'}`}
            flush
            action={
              <Button size="sm" variant="secondary" iconTrailing="chevron_right" onClick={() => navigate('/driver/libre')}>
                Tout voir
              </Button>
            }
          >
            {freeParcels.length === 0 ? (
              <div style={{ padding: 18, fontSize: 13.5, color: 'var(--text-muted)' }}>
                {homeZone.id || homeZone.name
                  ? 'Aucun colis disponible dans votre zone pour le moment.'
                  : 'Renseignez votre zone dans le profil pour voir les colis à prendre.'}
              </div>
            ) : (
              freeParcels.slice(0, 4).map((p) => {
                const hasBid = bidMap.has(p.id)
                return (
                <div
                  key={p.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: '1px solid var(--slate-100)', cursor: 'pointer' }}
                  onClick={() => setDetailTarget(p)}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 42, height: 42, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-soft)', color: 'var(--color-primary)', flex: 'none' }}>
                    <span className="material-symbols-rounded fill" style={{ fontSize: 22 }}>
                      package_2
                    </span>
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14.5, color: 'var(--text-strong)' }}>
                      {p.departureCity ?? p.departureZoneName ?? '—'}
                      <span className="material-symbols-rounded" style={{ fontSize: 16, color: 'var(--text-faint)' }}>
                        arrow_right_alt
                      </span>
                      {p.arrivalCity ?? p.arrivalZoneName ?? '—'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{p.trackingNumber}</span>
                      {p.weight != null && ` · ${formatWeight(p.weight)}`}
                    </div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15, color: 'var(--teal-600)' }}>{formatFcfa(p.price)}</span>
                  <Button size="sm" icon={hasBid ? 'forum' : 'gavel'} onClick={(e: React.MouseEvent) => { e.stopPropagation(); setOfferTarget(p); }}>
                    {hasBid ? 'Suivi offre' : 'Faire une offre'}
                  </Button>
                </div>
              )}))}
          </Panel>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Points card */}
          <div style={{ background: 'var(--gradient-brand)', borderRadius: 'var(--radius-lg)', padding: 20, color: '#fff', boxShadow: 'var(--shadow-brand)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 42, height: 42, borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.18)' }}>
                <span className="material-symbols-rounded fill" style={{ fontSize: 23 }}>
                  account_balance_wallet
                </span>
              </span>
              <div>
                <div style={{ fontSize: 11, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Solde de points</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 24 }}>
                  {balance.data != null ? formatPoints(balance.data).replace(' pts', '') : '—'}
                  <span style={{ fontSize: 13, opacity: 0.8 }}> pts</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <Button variant="amber" size="sm" block icon="add" onClick={() => setShowRecharge(true)}>
                Recharger
              </Button>
              <Button variant="secondary" size="sm" block icon="receipt_long" onClick={() => navigate('/driver/points')}>
                Historique
              </Button>
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
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 26, color: 'var(--text-strong)', marginBottom: 14 }}>
              {formatFcfa(revenue.total)}
            </div>
            {revenue.hasData ? (
              <BarChart bars={revenue.bars} labels={revenue.labels} highlightLast />
            ) : (
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Aucune livraison terminée sur les 14 derniers jours.
              </div>
            )}
          </Panel>

          <Panel title="Mes offres" flush>
            {(sent.data ?? []).slice(0, 4).map((b) => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 18px', borderBottom: '1px solid var(--slate-100)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--text-strong)' }}>{b.parcelId.slice(0, 8)}…</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{formatFcfa(b.price)} proposés</div>
                </div>
                <Badge tone={b.status === 'accepted' ? 'green' : b.status === 'rejected' ? 'red' : 'amber'}>
                  {b.status === 'accepted' ? 'Acceptée' : b.status === 'rejected' ? 'Refusée' : 'En attente'}
                </Badge>
              </div>
            ))}
            {(!sent.data || sent.data.length === 0) && <div style={{ padding: 18, fontSize: 13.5, color: 'var(--text-muted)' }}>Aucune offre envoyée.</div>}
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
            {(ads.data ?? []).slice(0, 4).map((a) => (
              <div
                key={a.id}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 18px', borderBottom: '1px solid var(--slate-100)', cursor: 'pointer' }}
                onClick={() => navigate('/driver/annonces')}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5, color: 'var(--text-strong)' }}>
                    {a.departureCity ?? '—'}
                    <span className="material-symbols-rounded" style={{ fontSize: 15, color: 'var(--text-faint)' }}>arrow_right_alt</span>
                    {a.arrivalCity ?? '—'}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{a.departureAt ? formatDate(a.departureAt) : 'Date flexible'}</div>
                </div>
                {a.proposedPrice != null && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13.5, color: 'var(--teal-600)' }}>{formatFcfa(a.proposedPrice)}</span>
                )}
              </div>
            ))}
            {(!ads.data || ads.data.length === 0) && (
              <div style={{ padding: 18, fontSize: 13.5, color: 'var(--text-muted)' }}>Aucune annonce. Publiez un trajet pour recevoir des colis.</div>
            )}
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
