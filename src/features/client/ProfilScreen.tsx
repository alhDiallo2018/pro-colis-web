import { useState } from 'react'
import { Badge, Button, Card, Input, Toast } from '@/ds'
import { useAuthStore } from '@/store/auth'
import { useUpdateProfile } from './hooks'
import { ProfilePhotoCapture } from '@/components/ProfilePhotoCapture'
import { uploadProfilePhoto } from '@/lib/api/uploads'
import { ApiError } from '@/lib/api/client'
import { LocationInput } from '@/components/LocationInput'

const ROLE_LABEL: Record<string, string> = {
  client: 'Client',
  driver: 'Chauffeur',
  admin: 'Admin zone',
  super_admin: 'Super admin',
}

export function ProfilScreen() {
  const user = useAuthStore((s) => s.user)
  const update = useUpdateProfile()
  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [city, setCity] = useState(user?.city ?? '')
  const [address, setAddress] = useState(user?.address ?? '')
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  if (!user) return null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(false)

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

    update.mutate(
      {
        fullName: fullName.trim(),
        email: email.trim() || null,
        city: city.trim() || null,
        address: address.trim() || null,
        profilePhoto: profilePhotoUrl ?? null,
      },
      {
        onSuccess: () => {
          setSaved(true)
          setPhotoDataUrl(null)
        },
      },
    )
  }

  const error = update.error instanceof ApiError ? update.error.message : null
  const isPending = update.isPending || uploadingPhoto
  const displayPhoto = photoDataUrl === '' ? null : photoDataUrl ?? user.profilePhoto ?? null

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
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
              <Badge tone="primary">{ROLE_LABEL[user.role] ?? user.role}</Badge>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
                {user.phone}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <h3 style={{ margin: '0 0 16px', fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)', color: 'var(--text-strong)' }}>
          Informations personnelles
        </h3>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Nom complet" icon="badge" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <div className="pc-field-pair" style={{ gap: 16 }}>
            <Input label="Email" icon="mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="Téléphone" icon="call" mono value={user.phone} disabled help="Le téléphone n'est pas modifiable" />
          </div>
          <div className="pc-field-pair" style={{ gap: 16 }}>
            <LocationInput label="Ville" icon="location_on" placeholder="Votre ville..." value={city} onChange={setCity} />
            <LocationInput label="Adresse" icon="home" placeholder="Votre adresse..." value={address} onChange={setAddress} />
          </div>

          {error && <Toast tone="error" message={error} />}
          {saved && !error && <Toast tone="success" message="Profil mis à jour." />}

          <div>
            <Button type="submit" icon="save" loading={isPending} disabled={!fullName.trim()}>
              Enregistrer
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
