import { useState } from 'react'
import { Button, Card, Input, Select, Toast } from '@/ds'
import { LocationInput } from '@/components/LocationInput'
import { ApiError } from '@/lib/api/client'
import { uploadProfilePhoto } from '@/lib/api/uploads'
import type { User } from '@/lib/api/types'
import { useUpdateMyProfile } from './hooks'

const GENDER_OPTIONS = [
  { value: 'male', label: 'Homme' },
  { value: 'female', label: 'Femme' },
  { value: 'other', label: 'Autre' },
]

export type IdentityField = 'email' | 'gender' | 'city' | 'region' | 'address'

export interface IdentityCardProps {
  user: User
  /** Photo capturée dans l'en-tête, uploadée au moment de l'enregistrement. */
  photoDataUrl?: string | null
  onPhotoSaved?: () => void
  /** Champs éditables affichés (le nom et le téléphone le sont toujours). */
  fields?: IdentityField[]
}

/** Carte « Informations personnelles » commune à tous les rôles. */
export function IdentityCard({
  user,
  photoDataUrl = null,
  onPhotoSaved,
  fields = ['email', 'gender', 'city', 'region', 'address'],
}: IdentityCardProps) {
  const update = useUpdateMyProfile()
  const [fullName, setFullName] = useState(user.fullName ?? '')
  const [email, setEmail] = useState(user.email ?? '')
  const [gender, setGender] = useState(user.gender ?? '')
  const [city, setCity] = useState(user.city ?? '')
  const [region, setRegion] = useState(user.region ?? '')
  const [address, setAddress] = useState(user.address ?? '')
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)

  const has = (f: IdentityField) => fields.includes(f)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(false)

    let profilePhotoUrl = user.profilePhoto ?? undefined
    if (photoDataUrl !== null && photoDataUrl !== undefined) {
      if (photoDataUrl === '') {
        profilePhotoUrl = undefined
      } else {
        setUploading(true)
        try {
          profilePhotoUrl = await uploadProfilePhoto(photoDataUrl, `profile-${user.id}.jpg`)
        } catch {
          profilePhotoUrl = user.profilePhoto ?? undefined
        }
        setUploading(false)
      }
    }

    update.mutate(
      {
        fullName: fullName.trim(),
        ...(has('email') ? { email: email.trim() || null } : {}),
        ...(has('gender') ? { gender: gender || null } : {}),
        ...(has('city') ? { city: city.trim() || null } : {}),
        ...(has('region') ? { region: region.trim() || null } : {}),
        ...(has('address') ? { address: address.trim() || null } : {}),
        profilePhoto: profilePhotoUrl ?? null,
      },
      {
        onSuccess: () => {
          setSaved(true)
          onPhotoSaved?.()
        },
      },
    )
  }

  const error = update.error instanceof ApiError ? update.error.message : null
  const pending = update.isPending || uploading

  return (
    <Card padding="lg">
      <h3 style={{ margin: '0 0 16px', fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)', color: 'var(--text-strong)' }}>
        Informations personnelles
      </h3>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="pc-field-pair" style={{ gap: 16 }}>
          <Input label="Nom complet" icon="badge" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input label="Téléphone" icon="call" mono value={user.phone} disabled help="Le téléphone n'est pas modifiable" />
        </div>

        {(has('email') || has('gender')) && (
          <div className="pc-field-pair" style={{ gap: 16 }}>
            {has('email') && (
              <Input label="Email" icon="mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            )}
            {has('gender') && (
              <Select
                label="Genre"
                icon="wc"
                placeholder="Non renseigné"
                options={GENDER_OPTIONS}
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              />
            )}
          </div>
        )}

        {(has('city') || has('region')) && (
          <div className="pc-field-pair" style={{ gap: 16 }}>
            {has('city') && (
              <LocationInput label="Ville" icon="location_on" placeholder="Votre ville..." value={city} onChange={setCity} />
            )}
            {has('region') && (
              <Input label="Région" icon="map" value={region} onChange={(e) => setRegion(e.target.value)} />
            )}
          </div>
        )}

        {has('address') && (
          <LocationInput label="Adresse" icon="home" placeholder="Votre adresse..." value={address} onChange={setAddress} />
        )}

        {error && <Toast tone="error" message={error} />}
        {saved && !error && <Toast tone="success" message="Profil mis à jour." />}

        <div>
          <Button type="submit" icon="save" loading={pending} disabled={!fullName.trim()}>
            Enregistrer
          </Button>
        </div>
      </form>
    </Card>
  )
}
