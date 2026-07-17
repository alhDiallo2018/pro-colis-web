import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, Badge, Avatar } from '@/ds'
import { Panel } from '@/components/Panel'
import * as adsApi from '@/lib/api/advertisements'
import { formatFcfa, formatDate, formatWeight } from '@/lib/format'
import { useAuthStore } from '@/store/auth'

export function TripDetailScreen() {
  const { advertisementId } = useParams<{ advertisementId: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const { data: trip, isLoading, error } = useQuery({
    queryKey: ['advertisement', advertisementId],
    queryFn: () => adsApi.detail(advertisementId!),
    enabled: !!advertisementId,
  })

  const audioRef = useMemo(() => (trip?.audioUrl ? new Audio(trip.audioUrl) : null), [trip?.audioUrl])

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <span className="material-symbols-rounded" style={{ fontSize: 32, color: 'var(--color-primary)', animation: 'spin 1.5s linear infinite', '@keyframes spin': '0% {transform:rotate(0)} 100% {transform:rotate(360deg)}' } as unknown as React.CSSProperties}>
            progress_activity
          </span>
          <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Chargement du voyage...</span>
        </div>
      </div>
    )
  }

  if (error || !trip) {
    return (
      <div style={{ maxWidth: 520, margin: '60px auto', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: 20, background: 'var(--amber-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <span className="material-symbols-rounded" style={{ fontSize: 40, color: 'var(--amber-500)' }}>travel_explore</span>
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--text-strong)', margin: '0 0 8px' }}>
          Voyage introuvable
        </h2>
        <p style={{ color: 'var(--text-muted)', margin: '0 0 20px', fontSize: 14.5 }}>
          Cette annonce n'existe plus ou a expiré.
        </p>
        <Button variant="secondary" icon="arrow_back" onClick={() => navigate(-1)}>Retour</Button>
      </div>
    )
  }

  const from = trip.departureCity || '—'
  const to = trip.arrivalCity || '—'
  const driver = trip.driverName || trip.driver?.fullName || 'Chauffeur'
  const description = trip.description?.trim() || ''
  const price = trip.proposedPrice
  const availableWeight = trip.availableWeight ?? trip.maxWeight
  const isOwnAd = user?.id === trip.driverId

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ===== BACK ===== */}
      <div>
        <Button variant="ghost" size="sm" icon="arrow_back" onClick={() => navigate(-1)}>
          Retour aux annonces
        </Button>
      </div>

      {/* ===== ROUTE HEADER ===== */}
      <div style={{
        background: 'var(--gradient-brand)', borderRadius: 20, padding: '28px 28px 24px', color: '#fff',
        boxShadow: 'var(--shadow-brand)', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 30 }}>local_shipping</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-display)', marginBottom: 4 }}>
                Voyage proposé
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(20px, 3vw, 24px)', letterSpacing: '-0.01em' }}>
                {from} <span style={{ opacity: 0.6, margin: '0 4px' }}>→</span> {to}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {trip.departureAt && (
              <div style={{ background: 'rgba(255,255,255,0.12)', padding: '6px 14px', borderRadius: 'var(--radius-pill)', fontSize: 12.5, fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 15, verticalAlign: 'middle', marginRight: 4 }}>calendar_today</span>
                {formatDate(trip.departureAt)}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 20 }}>{price != null ? formatFcfa(price) : '—'}</div>
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>Prix</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 20 }}>{availableWeight != null ? `${availableWeight} kg` : '—'}</div>
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>Capacité</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 20 }}>{trip.offersCount ?? 0}</div>
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>Offres reçues</div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== DRIVER CARD ===== */}
      <Card padding="lg">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: '#fff' }}>
              {driver.charAt(0).toUpperCase()}
            </span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--text-strong)', marginBottom: 2 }}>
              {driver}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Badge tone="teal">Chauffeur vérifié</Badge>
              {trip.driver?.rating != null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 13, color: 'var(--amber-500)' }}>
                  <span className="material-symbols-rounded fill" style={{ fontSize: 16 }}>star</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-strong)' }}>{Number(trip.driver.rating).toFixed(1)}</span>
                  <span style={{ color: 'var(--text-muted)' }}>({trip.driver.totalDeliveries ?? 0} livraisons)</span>
                </div>
              )}
            </div>
          </div>
          {trip.driver?.phone && (
            <div style={{ display: 'flex', gap: 8 }}>
              <a href={`tel:${trip.driver.phone}`} style={{ textDecoration: 'none' }}>
                <Button variant="secondary" size="sm" icon="call">Appeler</Button>
              </a>
              {!isOwnAd && trip.driverId && (
                <Button size="sm" icon="forum" onClick={() => navigate('/client/messages')}>
                  Message
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* ===== DETAILS GRID ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="pc-trip-detail-grid">
        <Panel title="Détails du trajet">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <Row label="Départ" value={from} />
            <Row label="Arrivée" value={to} />
            <Row label="Date de départ" value={trip.departureAt ? formatDate(trip.departureAt) : 'Date flexible'} />
            <Row label="Poids disponible" value={availableWeight != null ? formatWeight(availableWeight) : 'Non spécifié'} />
            {trip.maxLength != null && <Row label="Dimensions max" value={`${trip.maxLength}×${trip.maxWidth ?? '—'}×${trip.maxHeight ?? '—'} cm`} />}
            <Row label="Statut" value={<Badge tone={trip.isActive ? 'green' : 'neutral'}>{trip.isActive ? 'Actif' : 'Clôturé'}</Badge>} />
          </div>
        </Panel>

        <Panel title="Tarification">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <Row label="Prix proposé" value={price != null ? formatFcfa(price) : 'À négocier'} mono />
            <Row label="Prix par kg" value={price != null && availableWeight != null && availableWeight > 0 ? formatFcfa(Math.round(price / availableWeight)) : '—'} mono />
            <Row label="Commission plateforme" value="10%" />
            <Row label="Net chauffeur" value={price != null ? formatFcfa(Math.round(price * 0.9)) : '—'} mono />
          </div>
        </Panel>
      </div>

      {/* ===== DESCRIPTION ===== */}
      {description && (
        <Panel title="Informations du voyage">
          <div style={{ fontSize: 14, color: 'var(--text-body)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
            {description}
          </div>
        </Panel>
      )}

      {/* ===== AUDIO ===== */}
      {trip.audioUrl && (
        <Panel title="Note vocale du chauffeur">
          <button
            type="button"
            onClick={() => {
              if (!audioRef) return
              if (audioRef.paused) {
                audioRef.play()
              } else {
                audioRef.pause()
                audioRef.currentTime = 0
              }
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
              background: 'var(--color-primary-soft)', border: '1px solid var(--border-subtle)',
              borderRadius: 14, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14.5,
              fontWeight: 600, color: 'var(--color-primary)', width: '100%',
            }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 28 }}>play_circle</span>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div>Message vocal du chauffeur</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 400 }}>Cliquez pour écouter</div>
            </div>
            <span className="material-symbols-rounded" style={{ fontSize: 20, color: 'var(--text-muted)' }}>headphones</span>
          </button>
        </Panel>
      )}

      {/* ===== ACTIONS ===== */}
      <div style={{
        position: 'sticky', bottom: 20, background: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)', borderRadius: 16, padding: 16,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)', display: 'flex', gap: 12,
        alignItems: 'center',
      }}>
        <div style={{ flex: 1, fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 18, color: 'var(--color-primary)' }}>
          {price != null ? formatFcfa(price) : 'À négocier'}
        </div>
        {!isOwnAd && (
          <>
            {trip.driver?.phone && (
              <a href={`tel:${trip.driver.phone}`} style={{ textDecoration: 'none' }}>
                <Button variant="secondary" icon="call">Appeler</Button>
              </a>
            )}
            {trip.driverId && (
              <Button icon="forum" onClick={() => navigate('/client/messages')}>Contacter</Button>
            )}
            {trip.isActive && (
              <Button variant="amber" icon="gavel" onClick={() => navigate(`/client/nouveau?ad=${trip.id}`)}>
                Faire une offre
              </Button>
            )}
          </>
        )}
        {isOwnAd && trip.isActive && (
          <Button variant="secondary" icon="cancel" onClick={() => adsApi.close(trip.id).then(() => window.location.reload())}>
            Clôturer l'annonce
          </Button>
        )}
      </div>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <span style={{ fontSize: 13.5, color: 'var(--text-muted)', flex: 'none' }}>{label}</span>
      <span style={{
        fontSize: 13.5, color: 'var(--text-strong)', fontWeight: 600, textAlign: 'right',
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-body)',
      }}>
        {value}
      </span>
    </div>
  )
}
