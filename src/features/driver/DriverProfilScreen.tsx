import { useEffect, useState } from 'react'
import { Badge, Button, Card, Input, Select, Toast } from '@/ds'
import { useAuthStore } from '@/store/auth'
import { useDriverVehicle, useUpdateDriverProfile, useUpsertVehicle } from './hooks'
import { ProfilePhotoCapture } from '@/components/ProfilePhotoCapture'
import { uploadProfilePhoto } from '@/lib/api/uploads'
import { ApiError } from '@/lib/api/client'

const VEHICLE_TYPES = [
  { value: 'Minibus', label: 'Minibus' },
  { value: 'Van', label: 'Van' },
  { value: 'Berline', label: 'Berline' },
  { value: 'Pickup', label: 'Pickup' },
  { value: 'Camion', label: 'Camion' },
  { value: 'Moto', label: 'Moto' },
]

export function DriverProfilScreen() {
  const user = useAuthStore((s) => s.user)
  const updateProfile = useUpdateDriverProfile()
  const vehicleQ = useDriverVehicle()
  const upsertVehicle = useUpsertVehicle()

  // Identity form
  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [city, setCity] = useState(user?.city ?? '')
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
  const [profileSaved, setProfileSaved] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  // Vehicle form
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

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileSaved(false)

    let profilePhotoUrl = user.profilePhoto ?? undefined

    if (photoDataUrl !== null) {
      if (photoDataUrl === '') {
        profilePhotoUrl = undefined
      } else {
        setUploadingPhoto(true)
        try {
          profilePhotoUrl = await uploadProfilePhoto(photoDataUrl, `profile-${user.id}.jpg`)
        } catch {
          profilePhotoUrl = user.profilePhoto ?? undefined
        }
        setUploadingPhoto(false)
      }
    }

    updateProfile.mutate(
      {
        fullName: fullName.trim(),
        email: email.trim() || null,
        city: city.trim() || null,
        profilePhoto: profilePhotoUrl ?? null,
      },
      {
        onSuccess: () => {
          setProfileSaved(true)
          setPhotoDataUrl(null)
        },
      },
    )
  }

  const saveVehicle = (e: React.FormEvent) => {
    e.preventDefault()
    setVehicleSaved(false)
    upsertVehicle.mutate(
      { plateNumber: plateNumber.trim(), model: model.trim(), type: type.trim(), capacity: capacity ? Number(capacity) : 0 },
      { onSuccess: () => setVehicleSaved(true) },
    )
  }

  const profileError = updateProfile.error instanceof ApiError ? updateProfile.error.message : null
  const vehicleError = upsertVehicle.error instanceof ApiError ? upsertVehicle.error.message : null
  const vehicleValid = plateNumber.trim().length >= 2 && model.trim().length >= 1 && type.trim().length >= 1
  const isPending = updateProfile.isPending || uploadingPhoto

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card padding="lg">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <ProfilePhotoCapture
            currentPhotoUrl={user.profilePhoto}
            userName={user.fullName}
            onChange={(dataUrl) => setPhotoDataUrl(dataUrl ?? '')}
          />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--fs-h2)', color: 'var(--text-strong)' }}>
              {user.fullName}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
              <Badge tone="primary">Chauffeur</Badge>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
                {user.phone}
              </span>
              {user.garageName && <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>· {user.garageName}</span>}
            </div>
          </div>
        </div>
      </Card>

      {/* Identity */}
      <Card padding="lg">
        <h3 style={{ margin: '0 0 16px', fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)', color: 'var(--text-strong)' }}>Informations personnelles</h3>
        <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Nom complet" icon="badge" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <div className="pc-field-pair" style={{ gap: 16 }}>
            <Input label="Email" icon="mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="Ville" icon="location_on" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          {profileError && <Toast tone="error" message={profileError} />}
          {profileSaved && !profileError && <Toast tone="success" message="Profil mis à jour." />}
          <div>
            <Button type="submit" icon="save" loading={isPending} disabled={!fullName.trim()}>
              Enregistrer le profil
            </Button>
          </div>
        </form>
      </Card>

      {/* Vehicle */}
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
    </div>
  )
}
