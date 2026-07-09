import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Badge, Button, StatBox } from '@/ds'
import { Panel } from '@/components/Panel'
import { BarChart } from '@/components/BarChart'
import { OfferDialog } from './OfferDialog'
import { CreateAnnonceDialog } from './CreateAnnonceDialog'
import { RechargeDialog } from './RechargeDialog'
import { ItineraireDialog } from './ItineraireDialog'
import { useDriverBidsSent, useDriverFreeParcels, useDriverParcels, useMyAdvertisements, useScoreBalance } from './hooks'
import { formatDate, formatFcfa, formatPoints, formatWeight } from '@/lib/format'
import type { Parcel } from '@/lib/api/types'

const REVENUE_BARS = [46, 62, 40, 78, 55, 88, 100]
const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export function DriverDashboard() {
  const navigate = useNavigate()
  const mine = useDriverParcels()
  const free = useDriverFreeParcels()
  const sent = useDriverBidsSent()
  const ads = useMyAdvertisements()
  const balance = useScoreBalance()
  const [offerTarget, setOfferTarget] = useState<Parcel | null>(null)
  const [searchParams] = useSearchParams()
  const [showAnnonce, setShowAnnonce] = useState(searchParams.has('annonce'))
  const [showRecharge, setShowRecharge] = useState(false)
  const [showItineraire, setShowItineraire] = useState(false)

  const parcels = mine.data?.parcels ?? []
  const freeParcels = free.data?.parcels ?? []
  const active = parcels.find((p) => !['delivered', 'cancelled'].includes(p.status))
  const delivered = parcels.filter((p) => p.status === 'delivered').length

  const bidMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const b of sent.data ?? []) {
      if (b.parcelId) map.set(b.parcelId, b.id)
    }
    return map
  }, [sent.data])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <Button icon="campaign" onClick={() => setShowAnnonce(true)}>
          Créer une annonce
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
        <StatBox icon="local_shipping" tone="primary" value={parcels.length} label="Missions" />
        <StatBox icon="sell" tone="green" value={freeParcels.length} label="Annonces" />
        <StatBox icon="gavel" tone="amber" value={sent.data?.length ?? 0} label="Offres envoyées" />
        <StatBox icon="task_alt" tone="neutral" value={delivered} label="Colis livrés" />
        <StatBox icon="account_balance_wallet" tone="teal" value={balance.data ?? '—'} label="Points" />
      </div>

      <div className="pc-split">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Mission en cours */}
          <div style={{ background: 'var(--gradient-brand)', borderRadius: 'var(--radius-lg)', padding: 20, color: '#fff', boxShadow: 'var(--shadow-brand)' }}>
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
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19 }}>{active.departureCity ?? active.departureGarageName ?? '—'}</div>
                  </div>
                  <div style={{ flex: 1, position: 'relative', height: 2, background: 'rgba(255,255,255,0.4)' }}>
                    <span className="material-symbols-rounded" style={{ position: 'absolute', left: '52%', top: -12, fontSize: 24, color: '#fff' }}>
                      local_shipping
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Arrivée</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19 }}>{active.arrivalCity ?? active.arrivalGarageName ?? '—'}</div>
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

          {/* Annonces pool */}
          <Panel
            title="Annonces"
            flush
            action={
              <Button size="sm" variant="secondary" iconTrailing="chevron_right" onClick={() => navigate('/driver/libre')}>
                Tout voir
              </Button>
            }
          >
            {freeParcels.length === 0 ? (
              <div style={{ padding: 18, fontSize: 13.5, color: 'var(--text-muted)' }}>Aucun colis disponible pour le moment.</div>
            ) : (
              freeParcels.slice(0, 4).map((p) => {
                const hasBid = bidMap.has(p.id)
                return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: '1px solid var(--slate-100)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 42, height: 42, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-soft)', color: 'var(--color-primary)', flex: 'none' }}>
                    <span className="material-symbols-rounded fill" style={{ fontSize: 22 }}>
                      package_2
                    </span>
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14.5, color: 'var(--text-strong)' }}>
                      {p.departureCity ?? p.departureGarageName ?? '—'}
                      <span className="material-symbols-rounded" style={{ fontSize: 16, color: 'var(--text-faint)' }}>
                        arrow_right_alt
                      </span>
                      {p.arrivalCity ?? p.arrivalGarageName ?? '—'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{p.trackingNumber}</span>
                      {p.weight != null && ` · ${formatWeight(p.weight)}`}
                    </div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15, color: 'var(--teal-600)' }}>{formatFcfa(p.price)}</span>
                  <Button size="sm" icon={hasBid ? 'forum' : 'gavel'} onClick={() => setOfferTarget(p)}>
                    {hasBid ? 'Negocier' : 'Faire une offre'}
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

          <Panel title="Revenus · 7 jours" action={<Badge tone="green">+14%</Badge>}>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 26, color: 'var(--text-strong)', marginBottom: 14 }}>
              214 000 <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>FCFA</span>
            </div>
            <BarChart bars={REVENUE_BARS} labels={DAYS} highlightLast />
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
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 18px', borderBottom: '1px solid var(--slate-100)' }}>
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
      <CreateAnnonceDialog open={showAnnonce} onClose={() => setShowAnnonce(false)} />
      <RechargeDialog open={showRecharge} onClose={() => setShowRecharge(false)} />
      <ItineraireDialog parcel={active ?? null} open={showItineraire} onClose={() => setShowItineraire(false)} />
    </div>
  )
}
