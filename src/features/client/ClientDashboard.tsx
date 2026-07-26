import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, Badge, Button, Icon, StatBox } from '@/ds'
import { Panel } from '@/components/Panel'
import { ParcelsTable } from '@/components/ParcelsTable'
import { useMyParcels, useReceivedBids } from './hooks'
import { useMyBidStats, useMyStats } from '@/features/shared/profile/hooks'
import { useAuthStore } from '@/store/auth'
import { formatDate, formatFcfa } from '@/lib/format'

const ACTIVE_EXCLUDED = ['delivered', 'cancelled']

export function ClientDashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { data } = useMyParcels({ limit: 200 })
  const offers = useReceivedBids()
  const stats = useMyStats()
  const bidStats = useMyBidStats()

  const parcels = useMemo(() => data?.parcels ?? [], [data])

  const enCours = parcels.filter((p) => !ACTIVE_EXCLUDED.includes(p.status)).length
  const livres = parcels.filter((p) => p.status === 'delivered').length
  const libre = parcels.filter((p) => p.status === 'free').length
  const totalSpent = parcels
    .filter((p) => p.status === 'delivered')
    .reduce((sum, p) => sum + Number(p.totalAmount ?? p.negotiatedPrice ?? p.price ?? 0), 0)

  // Le colis « suivi » : le plus avancé parmi ceux en cours.
  const tracked = useMemo(() => {
    const active = parcels.filter((p) => !ACTIVE_EXCLUDED.includes(p.status) && p.status !== 'free')
    const order = ['out_for_delivery', 'arrived', 'in_transit', 'picked_up', 'confirmed', 'pending']
    return [...active].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status))[0] ?? null
  }, [parcels])

  const firstName = user?.fullName?.split(' ')[0] ?? ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
        <StatBox icon="package_2" tone="primary" value={stats.data?.activeParcels ?? enCours} label="Colis en cours" />
        <StatBox icon="task_alt" tone="green" value={stats.data?.deliveredParcels ?? livres} label="Colis livrés" />
        <StatBox icon="sell" tone="amber" value={libre} label="Annonces publiées" />
        <StatBox icon="gavel" tone="teal" value={bidStats.data?.pending ?? offers.data?.length ?? 0} label="Offres à traiter" />
        <StatBox icon="payments" tone="neutral" value={formatFcfa(totalSpent)} label="Total dépensé" />
      </div>

      <div className="pc-split">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Colis suivi en direct */}
          <div
            style={{
              background: 'var(--gradient-brand)',
              borderRadius: 'var(--radius-lg)',
              padding: 20,
              color: '#fff',
              boxShadow: 'var(--shadow-brand)',
              cursor: tracked ? 'pointer' : 'default',
            }}
            onClick={() => tracked && navigate(`/client/colis/${tracked.id}`)}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 10 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.9 }}>
                {tracked ? 'Colis en cours' : `Bienvenue ${firstName}`}
              </span>
              {tracked && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13, background: 'rgba(255,255,255,0.16)', padding: '4px 10px', borderRadius: 'var(--radius-pill)' }}>
                  <Icon name="qr_code_2" size={15} />
                  {tracked.trackingNumber}
                </span>
              )}
            </div>

            {tracked ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Départ</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>
                      {tracked.departureCity ?? tracked.departureGarageName ?? '—'}
                    </div>
                  </div>
                  <div style={{ flex: 1, position: 'relative', height: 2, background: 'rgba(255,255,255,0.4)' }}>
                    <Icon name="local_shipping" size={24} style={{ position: 'absolute', left: '52%', top: -12, color: '#fff' }} />
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Arrivée</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>
                      {tracked.arrivalCity ?? tracked.arrivalGarageName ?? '—'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13, opacity: 0.92, marginBottom: 16 }}>
                  <span>Destinataire · {tracked.receiverName}</span>
                  {tracked.driverName && <span>Chauffeur · {tracked.driverName}</span>}
                  {tracked.estimatedDeliveryDate && <span>Livraison estimée · {formatDate(tracked.estimatedDeliveryDate)}</span>}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Button variant="secondary" block icon="qr_code_2" onClick={() => navigate('/client/suivi')}>
                    Suivre
                  </Button>
                  <Button variant="amber" block icon="visibility" onClick={() => navigate(`/client/colis/${tracked.id}`)}>
                    Voir le détail
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 14.5, opacity: 0.92, marginBottom: 16 }}>
                  Aucun colis en cours. Créez un envoi et recevez des offres de chauffeurs.
                </div>
                <Button variant="amber" icon="add" onClick={() => navigate('/client/nouveau')}>
                  Créer un colis
                </Button>
              </>
            )}
          </div>

          <Panel
            title="Mes colis récents"
            flush
            action={
              <Button size="sm" variant="secondary" iconTrailing="chevron_right" onClick={() => navigate('/client/colis')}>
                Tout voir
              </Button>
            }
          >
            <ParcelsTable
              parcels={parcels.slice(0, 5)}
              loading={!data}
              onRowClick={(p) => navigate(`/client/colis/${p.id}`)}
              emptyHint="Créez votre premier colis pour le voir ici."
            />
          </Panel>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Panel
            title="Offres reçues"
            flush
            action={offers.data && offers.data.length > 0 ? <Badge tone="primary">{offers.data.length}</Badge> : undefined}
          >
            {!offers.data || offers.data.length === 0 ? (
              <div style={{ padding: 18, fontSize: 13.5, color: 'var(--text-muted)' }}>Aucune offre reçue pour le moment.</div>
            ) : (
              <>
                {offers.data.slice(0, 3).map((o) => (
                  <div key={o.id} style={{ padding: '13px 18px', borderBottom: '1px solid var(--slate-100)', display: 'flex', alignItems: 'center', gap: 11 }}>
                    <Avatar name={o.driverName ?? 'Chauffeur'} size="sm" status="online" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5, color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {o.driverName ?? 'Chauffeur'}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                        {o.parcel?.trackingNumber ?? o.message ?? 'Offre reçue'}
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: 'var(--teal-600)' }}>{formatFcfa(o.price)}</div>
                  </div>
                ))}
                <div style={{ padding: '12px 18px' }}>
                  <Button size="sm" variant="secondary" block iconTrailing="chevron_right" onClick={() => navigate('/client/offres')}>
                    Voir toutes les offres
                  </Button>
                </div>
              </>
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
                Mon profil
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

function AccountRow({ icon, label, value }: { icon: string; label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Icon name={icon} size={18} style={{ color: 'var(--text-faint)' }} />
      <span style={{ flex: 1, fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13, color: 'var(--text-strong)' }}>{value}</span>
    </div>
  )
}
