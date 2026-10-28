import { locationLabel } from '@/lib/api/advertisements'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, Icon, Input } from '@/ds'
import { QueryState } from '@/components/QueryState'
import { ZoneFilter } from '@/components/ZoneFilter'
import { useZoneFilter } from '@/lib/useZoneFilter'
import { GarageSearchSelect } from '@/components/GarageSearchSelect'
import type { Zone } from '@/lib/api/types'
import { useZones } from './hooks'
import { useDriverAnnonces } from './hooks'
import { formatDate, formatFcfa, formatWeight } from '@/lib/format'
import type { Advertisement } from '@/lib/api/advertisements'

/** Client browses drivers' trip advertisements and can bid on them. */
export function ClientAnnoncesScreen() {
  const navigate = useNavigate()
  const [service,setService]=useState(''),[pickup,setPickup]=useState(''),[dropoff,setDropoff]=useState(''),[weight,setWeight]=useState(''),[line,setLine]=useState('')
  const zones=useZones(),[extra,setExtra]=useState<Zone[]>([])
  const [page,setPage]=useState(1)
  const query = useDriverAnnonces({page,limit:30,...(service?{serviceType:service}:{}),...(line.trim()?{lineNumber:line.trim()}:{}),...(pickup&&dropoff?{pickupZoneId:pickup,dropoffZoneId:dropoff,...(Number(weight)>0?{weight:Number(weight)}:{})}:{})})
  const all = useMemo(() => query.data ?? [], [query.data])
  const [search, setSearch] = useState('')
  const {
    items: inZone,
    mode: zoneMode,
    setMode: setZoneMode,
    hasZone,
    zone: homeZone,
  } = useZoneFilter(all)

  const annonces = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return inZone
    return inZone.filter((a) =>
      [a.itinerary?.lineNumber,...(a.itinerary?.stops.map(s=>s.name)??[]), locationLabel(a, 'departure'), locationLabel(a, 'arrival'), a.departureCity, a.arrivalCity, a.driver?.fullName, a.driverName, a.description].some(
        (v) => v && String(v).toLowerCase().includes(q),
      ),
    )
  }, [inZone, search])

  const hasAny = all.length > 0
  const filteredEmpty = hasAny && annonces.length === 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>
        Trajets proposés par les chauffeurs. Appuyez sur une annonce pour voir les détails et faire une offre.
      </p>

      <section className="transport-panel"><h2>Trouvez le trajet de votre colis</h2><div className="transport-choices">{[{value:'',label:'Tous les services'},{value:'trip',label:'Trajets'},{value:'shuttle',label:'Navettes'},{value:'gp',label:'GP'}].map(t=><button className="transport-choice" aria-pressed={service===t.value} key={t.value} onClick={()=>{setService(t.value);setPage(1)}}>{t.label}</button>)}</div><div className="transport-fields"><GarageSearchSelect label="Retrait du colis" zones={[...(zones.data??[]),...extra]} value={pickup} onChange={id=>{setPickup(id);setPage(1)}} onAddNew={z=>setExtra(old=>[...old,z])}/><GarageSearchSelect label="Remise du colis" zones={[...(zones.data??[]),...extra]} value={dropoff} onChange={id=>{setDropoff(id);setPage(1)}} onAddNew={z=>setExtra(old=>[...old,z])}/><Input label="Poids (kg)" type="number" min={0.01} value={weight} onChange={e=>{setWeight(e.target.value);setPage(1)}}/><Input label="Numéro de ligne" value={line} onChange={e=>{setLine(e.target.value);setPage(1)}}/></div>{Boolean(pickup)!==Boolean(dropoff)&&<p>Précisez le retrait et la remise pour filtrer les trajets compatibles.</p>}<a href="/client/vehicules">Voir les véhicules en direct sur la carte</a></section>
      {hasAny && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 260px', maxWidth: 420 }}>
            <Input icon="search" placeholder="Rechercher (ville, chauffeur…)" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <ZoneFilter mode={zoneMode} onChange={setZoneMode} zoneName={homeZone.name} hasZone={hasZone} />
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
            ? zoneMode === 'zone' && !search.trim()
              ? `Aucun trajet au départ ou à l’arrivée de ${homeZone.name}.`
              : 'Aucune annonce ne correspond à votre recherche.'
            : 'Aucun chauffeur n’a publié de trajet pour le moment.'
        }
        onRetry={() => query.refetch()}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--gap-card)' }}>
          {annonces.map((a) => (
            <AnnonceCard key={a.id} ad={a} onClick={() => navigate(`/client/annonces/${a.id}`)} />
          ))}
        </div>
      </QueryState><div className="transport-choices"><button className="transport-choice" disabled={page===1} onClick={()=>setPage(p=>p-1)}>Précédent</button><span>Page {page}</span><button className="transport-choice" disabled={all.length<30} onClick={()=>setPage(p=>p+1)}>Suivant</button></div>
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
      {ad.itinerary&&<p>{ad.itinerary.serviceType==='shuttle'?`Navette ${ad.itinerary.lineNumber}`:ad.itinerary.serviceType==='gp'?'GP':'Trajet'} · véhicule {ad.transport?.reference} · {ad.itinerary.stops.length} arrêts</p>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar name={driverName} src={ad.driver?.profilePhoto ?? undefined} size="sm" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {driverName}
          </div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{ad.driver?.zoneName ?? ad.driver?.city ?? 'Indépendant'}</div>
        </div>
        {(ad.offers?.length ?? 0) > 0 && (
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{ad.offers!.length} offre{ad.offers!.length > 1 ? 's' : ''}</span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '14px 0', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text-strong)' }}>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{locationLabel(ad, 'departure')}</span>
        <Icon name="local_shipping" size={18} style={{ color: 'var(--teal-500)' }} />
        <span style={{ flex: 1, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{locationLabel(ad, 'arrival')}</span>
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
