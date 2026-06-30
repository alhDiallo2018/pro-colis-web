import { useNavigate } from 'react-router-dom'
import { Avatar, Badge, Button, StatBox } from '@/ds'
import { Panel } from '@/components/Panel'
import { ParcelsTable } from '@/components/ParcelsTable'
import { useMyParcels, useReceivedBids, useScoreBalance } from './hooks'
import { formatFcfa, formatPoints } from '@/lib/format'

export function ClientDashboard() {
  const navigate = useNavigate()
  const { data } = useMyParcels()
  const parcels = data?.parcels ?? []
  const offers = useReceivedBids()
  const balance = useScoreBalance()

  const enCours = parcels.filter((p) => !['delivered', 'cancelled'].includes(p.status)).length
  const livres = parcels.filter((p) => p.status === 'delivered').length
  const libre = parcels.filter((p) => p.status === 'free').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <StatBox icon="package_2" tone="primary" value={enCours} label="Colis en cours" />
        <StatBox icon="task_alt" tone="green" value={livres} label="Colis livrés" />
        <StatBox icon="sell" tone="amber" value={libre} label="Annonces" />
        <StatBox icon="account_balance_wallet" tone="neutral" value={balance.data ?? '—'} label="Points" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 360px', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Panel
            title="Mes colis récents"
            flush
            action={
              <span style={{ color: 'var(--text-link)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }} onClick={() => navigate('/client/colis')}>
                Tout voir
              </span>
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
              <Button variant="amber" size="sm" block icon="add">
                Recharger
              </Button>
              <Button variant="secondary" size="sm" block icon="receipt_long">
                Historique
              </Button>
            </div>
          </div>

          {/* Offers */}
          <Panel title="Offres reçues" flush action={offers.data && offers.data.length > 0 ? <Badge tone="primary">{offers.data.length}</Badge> : undefined}>
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
                      {o.message && <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{o.message}</div>}
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
        </div>
      </div>
    </div>
  )
}
