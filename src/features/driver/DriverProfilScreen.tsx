import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, Card, Input, Select, StatBox, Toast } from '@/ds'
import { useAuthStore } from '@/store/auth'
import {
  useDriverVehicle,
  useDriverWallet,
  useMyAdvertisements,
  useMyRatings,
  useScoreBalance,
  useUpsertVehicle,
} from './hooks'
import { ProfileHeader } from '@/features/shared/profile/ProfileHeader'
import { IdentityCard } from '@/features/shared/profile/IdentityCard'
import { useMyDriverStats, useMyIdentityStatus } from '@/features/shared/profile/hooks'
import { ApiError } from '@/lib/api/client'
import { formatDate, formatFcfa } from '@/lib/format'

const VEHICLE_TYPES = [
  { value: 'Minibus', label: 'Minibus' },
  { value: 'Van', label: 'Van' },
  { value: 'Berline', label: 'Berline' },
  { value: 'Pickup', label: 'Pickup' },
  { value: 'Camion', label: 'Camion' },
  { value: 'Moto', label: 'Moto' },
]

const DRIVER_STATUS_LABEL: Record<string, { label: string; tone: 'green' | 'amber' | 'neutral' }> = {
  available: { label: 'Disponible', tone: 'green' },
  busy: { label: 'Occupé', tone: 'amber' },
  offline: { label: 'Hors ligne', tone: 'neutral' },
}

function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  const empty = 5 - full - (half ? 1 : 0)
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--amber-500)' }}>
      {'★'.repeat(full)}
      {half ? '½' : ''}
      {'☆'.repeat(Math.max(0, empty))}
    </span>
  )
}

export function DriverProfilScreen() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const vehicleQ = useDriverVehicle()
  const upsertVehicle = useUpsertVehicle()
  const walletQ = useDriverWallet()
  const pointsQ = useScoreBalance()
  const statsQ = useMyDriverStats()
  const identityQ = useMyIdentityStatus()
  const ratingsQ = useMyRatings(user?.id)
  const adsQ = useMyAdvertisements()

  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
  const [plateNumber, setPlate] = useState('')
  const [model, setModel] = useState('')
  const [type, setType] = useState('')
  const [capacity, setCapacity] = useState('')
  const [vehicleSaved, setVehicleSaved] = useState(false)

  useEffect(() => {
    if (vehicleQ.data) {
      setPlate(vehicleQ.data.plateNumber ?? '')
      setModel(vehicleQ.data.model ?? '')
      setType(vehicleQ.data.type ?? '')
      setCapacity(vehicleQ.data.capacity != null ? String(vehicleQ.data.capacity) : '')
    }
  }, [vehicleQ.data])

  if (!user) return null

  const stats = statsQ.data
  const wallet = walletQ.data
  const ratings = ratingsQ.data ?? []
  const avgRating = ratings.length
    ? ratings.reduce((sum, r) => sum + Number(r.rating ?? 0), 0) / ratings.length
    : (user.rating ?? 0)
  const statusInfo = DRIVER_STATUS_LABEL[user.driverStatus ?? ''] ?? {
    label: user.driverStatus ?? 'Inconnu',
    tone: 'neutral' as const,
  }
  const kycStatus = identityQ.data?.documents?.length ? identityQ.data.status : null

  const saveVehicle = (e: React.FormEvent) => {
    e.preventDefault()
    setVehicleSaved(false)
    upsertVehicle.mutate(
      { plateNumber: plateNumber.trim(), model: model.trim(), type: type.trim(), capacity: capacity ? Number(capacity) : 0 },
      { onSuccess: () => setVehicleSaved(true) },
    )
  }

  const vehicleError = upsertVehicle.error instanceof ApiError ? upsertVehicle.error.message : null
  const vehicleValid = plateNumber.trim().length >= 2 && model.trim().length >= 1 && type.trim().length >= 1

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <ProfileHeader
        user={user}
        onPhotoChange={setPhotoDataUrl}
        kycStatus={kycStatus}
        badges={
          <>
            <Badge tone={statusInfo.tone} icon="local_shipping">
              {statusInfo.label}
            </Badge>
            {avgRating > 0 && (
              <Badge tone="amber" icon="star">
                {avgRating.toFixed(1)} / 5
              </Badge>
            )}
          </>
        }
        meta={[
          { icon: 'directions_car', label: 'Véhicule', value: vehicleQ.data ? `${vehicleQ.data.model ?? '—'} · ${vehicleQ.data.plateNumber ?? '—'}` : 'Non renseigné' },
          { icon: 'task_alt', label: 'Livraisons terminées', value: stats?.completedDeliveries ?? user.completedDeliveries ?? 0 },
          { icon: 'account_balance_wallet', label: 'Solde portefeuille', value: wallet ? formatFcfa(wallet.balance) : '—' },
        ]}
      />

      {/* Activité */}
      <Card padding="lg">
        <h3 style={{ margin: '0 0 14px', fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)', color: 'var(--text-strong)' }}>
          Mon activité
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          <StatBox icon="inventory_2" tone="primary" value={stats?.assignedParcels ?? '—'} label="Missions totales" />
          <StatBox icon="local_shipping" tone="teal" value={stats?.activeParcels ?? '—'} label="En cours" />
          <StatBox icon="task_alt" tone="green" value={stats?.completedDeliveries ?? '—'} label="Livrées" />
          <StatBox icon="gavel" tone="amber" value={stats?.pendingBids ?? '—'} label="Offres en attente" />
          <StatBox icon="campaign" tone="neutral" value={stats?.openAdvertisements ?? adsQ.data?.length ?? '—'} label="Annonces ouvertes" />
          <StatBox icon="star" tone="amber" value={avgRating > 0 ? avgRating.toFixed(1) : '—'} label="Note moyenne" />
        </div>
      </Card>

      {/* Portefeuille & points */}
      <Card padding="lg">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)', color: 'var(--text-strong)' }}>
            Portefeuille & points
          </h3>
          <Button size="sm" variant="secondary" iconTrailing="chevron_right" onClick={() => navigate('/driver/points')}>
            Historique
          </Button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          <StatBox icon="account_balance_wallet" tone="teal" value={wallet ? formatFcfa(wallet.balance) : '—'} label="Solde disponible" />
          <StatBox icon="savings" tone="green" value={wallet?.totalEarned != null ? formatFcfa(wallet.totalEarned) : '—'} label="Total gagné" />
          <StatBox icon="receipt_long" tone="amber" value={wallet?.totalCommissionsPaid != null ? formatFcfa(wallet.totalCommissionsPaid) : '—'} label="Commissions payées" />
          <StatBox icon="payments" tone="neutral" value={wallet?.totalWithdrawn != null ? formatFcfa(wallet.totalWithdrawn) : '—'} label="Retraits" />
          <StatBox icon="stars" tone="primary" value={pointsQ.data ?? stats?.scoreBalance ?? '—'} label="Points" />
        </div>
      </Card>

      {/* Vérification d'identité */}
      <Card padding="lg">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)', color: 'var(--text-strong)' }}>
              Vérification d'identité
            </h3>
            <p style={{ margin: 0, fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
              {identityQ.data?.documents?.length
                ? `${identityQ.data.documents.length} document(s) envoyé(s)${
                    identityQ.data.identity?.updatedAt ? ` · dernier envoi le ${formatDate(identityQ.data.identity.updatedAt)}` : ''
                  }`
                : "Aucun document envoyé. Vos papiers sont requis pour recevoir des missions."}
            </p>
            {identityQ.data?.status === 'rejected' && identityQ.data.identity?.rejectionReason && (
              <p style={{ margin: '8px 0 0', fontSize: 'var(--fs-sm)', color: 'var(--red-500)' }}>
                Motif du refus : {identityQ.data.identity.rejectionReason}
              </p>
            )}
          </div>
          <Button size="sm" variant="secondary" icon="description" onClick={() => navigate('/driver/documents')}>
            Mes documents
          </Button>
        </div>
      </Card>

      <IdentityCard
        user={user}
        photoDataUrl={photoDataUrl}
        onPhotoSaved={() => setPhotoDataUrl(null)}
        fields={['email', 'gender', 'city', 'region', 'address']}
      />

      {/* Véhicule */}
      <Card padding="lg">
        <h3 style={{ margin: '0 0 4px', fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)', color: 'var(--text-strong)' }}>Mon véhicule</h3>
        <p style={{ margin: '0 0 16px', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
          Renseignez les informations de votre véhicule de livraison.
        </p>
        <form onSubmit={saveVehicle} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="pc-field-pair" style={{ gap: 16 }}>
            <Input label="Plaque d'immatriculation" icon="pin" mono placeholder="DK-2024-AB" value={plateNumber} onChange={(e) => setPlate(e.target.value)} />
            <Input label="Modèle" icon="directions_car" placeholder="Toyota Hiace" value={model} onChange={(e) => setModel(e.target.value)} />
          </div>
          <div className="pc-field-pair" style={{ gap: 16 }}>
            <Select label="Type" icon="category" placeholder="Type de véhicule" options={VEHICLE_TYPES} value={type} onChange={(e) => setType(e.target.value)} />
            <Input label="Capacité (places / kg)" icon="weight" type="number" inputMode="numeric" mono value={capacity} onChange={(e) => setCapacity(e.target.value)} />
          </div>
          {!user.garageId && (
            <Toast tone="info" message="Vous n'êtes rattaché à aucune zone — votre véhicule sera enregistré sans zone." />
          )}
          {vehicleError && <Toast tone="error" message={vehicleError} />}
          {vehicleSaved && !vehicleError && <Toast tone="success" message="Véhicule enregistré." />}
          <div>
            <Button type="submit" icon="save" loading={upsertVehicle.isPending} disabled={!vehicleValid}>
              {vehicleQ.data ? 'Mettre à jour le véhicule' : 'Enregistrer le véhicule'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Avis clients */}
      <Card padding="lg">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
          <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)', color: 'var(--text-strong)' }}>
            Avis clients
          </h3>
          {ratings.length > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Stars rating={avgRating} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13.5, color: 'var(--text-muted)' }}>
                {avgRating.toFixed(1)} · {ratings.length} avis
              </span>
            </span>
          )}
        </div>
        {ratings.length === 0 ? (
          <div style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 10 }}>
            Aucun avis pour le moment. Vos clients pourront vous noter après chaque livraison.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 10 }}>
            {ratings.slice(0, 6).map((r) => (
              <div key={r.id} style={{ padding: '12px 0', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <Stars rating={Number(r.rating ?? 0)} />
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--text-strong)' }}>
                    {r.author?.fullName ?? 'Client'}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>{formatDate(r.createdAt)}</span>
                </div>
                {r.comment && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{r.comment}</div>}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Renvoi vers les paramètres (PIN, disponibilité, notifications) */}
      <Card padding="lg">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)', color: 'var(--text-strong)' }}>
              Sécurité & préférences
            </h3>
            <p style={{ margin: 0, fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
              Code PIN, disponibilité et notifications.
            </p>
          </div>
          <Button size="sm" variant="secondary" icon="settings" onClick={() => navigate('/driver/parametres')}>
            Paramètres
          </Button>
        </div>
      </Card>
    </div>
  )
}
