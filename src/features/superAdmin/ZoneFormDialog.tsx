import { useEffect, useState } from 'react'
import { Button, Dialog, Input, Select, Switch, Toast } from '@/ds'
import { LocationInput, type PlaceDetails, type PlaceResult } from '@/components/LocationInput'
import { MapPicker } from '@/components/MapPicker'
import type { Zone } from '@/lib/api/types'
import { useCreateZone, useUpdateZone } from './hooks'

interface FormState {
  name: string
  displayName: string
  placeId: string
  country: string
  city: string
  latitude: string
  longitude: string
  radius: number
  type: 'CIRCLE' | 'POLYGON'
  isActive: boolean
}

const EMPTY: FormState = {
  name: '', displayName: '', placeId: '',
  country: '', city: '', latitude: '', longitude: '',
  radius: 5000, type: 'CIRCLE', isActive: true,
}

interface Props {
  open: boolean
  zone?: Zone | null
  onClose: () => void
}

export function ZoneFormDialog({ open, zone, onClose }: Props) {
  const isEdit = !!zone
  const [form, setForm] = useState<FormState>(EMPTY)
  const [localError, setLocalError] = useState<string | null>(null)
  const [, setSelectedPlace] = useState<PlaceResult | null>(null)

  const createMutation = useCreateZone()
  const updateMutation = useUpdateZone()
  const pending = createMutation.isPending || updateMutation.isPending

  useEffect(() => {
    if (!open) return
    setLocalError(null)
    setSelectedPlace(null)
    setForm(
      zone
        ? {
            name: zone.name ?? '',
            displayName: zone.displayName ?? '',
            placeId: zone.placeId ?? '',
            country: zone.country ?? '',
            city: zone.city ?? '',
            latitude: String(zone.latitude ?? ''),
            longitude: String(zone.longitude ?? ''),
            radius: zone.radius ?? 5000,
            type: zone.type ?? 'CIRCLE',
            isActive: zone.isActive !== false,
          }
        : EMPTY,
    )
  }, [open, zone])

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }))

  const handlePlaceSelected = (_value: string, place?: PlaceResult) => {
    if (!place) return
    setSelectedPlace(place)
    if (!form.name) set({ name: place.mainText ?? place.description })
    if (!form.displayName) set({ displayName: place.description })
    set({ placeId: place.placeId ?? '' })
  }

  const handleCoordinates = (lat: number, lng: number, details?: PlaceDetails) => {
    setForm((f) => ({
      ...f,
      latitude: String(lat),
      longitude: String(lng),
      city: f.city || details?.city || '',
      country: f.country || details?.country || '',
    }))
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) return setLocalError('Le nom de la zone est requis.')
    const lat = Number(form.latitude)
    const lng = Number(form.longitude)
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return setLocalError('Coordonnées GPS invalides. Sélectionnez un lieu sur la carte.')
    }

    const payload = {
      name: form.name.trim(),
      displayName: form.displayName.trim() || form.name.trim(),
      placeId: form.placeId || null,
      country: form.country.trim() || null,
      city: form.city.trim() || null,
      latitude: lat,
      longitude: lng,
      radius: form.type === 'CIRCLE' ? form.radius : undefined,
      type: form.type,
      isActive: form.isActive,
    }

    setLocalError(null)
    try {
      if (isEdit && zone) {
        await updateMutation.mutateAsync({ zoneId: zone.id, payload })
      } else {
        await createMutation.mutateAsync(payload as any)
      }
      onClose()
    } catch (e) {
      const err = e as { response?: { data?: { message?: string }; status?: number } }
      if (err.response?.status === 409) {
        setLocalError('Une zone avec ce placeId existe déjà.')
      } else {
        setLocalError(err.response?.data?.message ?? "Erreur lors de l'enregistrement de la zone.")
      }
    }
  }

  const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ?? ''
  const previewLat = Number(form.latitude)
  const previewLng = Number(form.longitude)
  const hasCoords = !isNaN(previewLat) && !isNaN(previewLng)

  return (
    <Dialog
      open={open}
      title={isEdit ? 'Modifier la zone' : 'Nouvelle zone géographique'}
      icon={isEdit ? 'edit_location_alt' : 'add_location_alt'}
      iconTone="primary"
      onClose={pending ? undefined : onClose}
      style={{ maxWidth: 560, textAlign: 'left' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
        <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)', marginBottom: -4 }}>
          Recherchez un lieu avec Google Maps pour positionner la zone sur la carte.
        </div>

        <LocationInput
          label="Rechercher un lieu"
          placeholder="Ex: Dakar, Plateau..."
          onChange={handlePlaceSelected}
          onCoordinates={handleCoordinates}
          showGeolocate={!isEdit}
        />

        <Input
          label="Nom de la zone"
          placeholder="Ex: Dakar"
          value={form.name}
          onChange={(e) => set({ name: e.target.value })}
          icon="pin_drop"
        />

        <Input
          label="Nom affiché (optionnel)"
          placeholder="Ex: Zone Dakar Centre"
          value={form.displayName}
          onChange={(e) => set({ displayName: e.target.value })}
          icon="label"
        />

        <div className="pc-field-pair" style={{ gap: 10 }}>
          <Input label="Ville" value={form.city} onChange={(e) => set({ city: e.target.value })} />
          <Input label="Pays" value={form.country} onChange={(e) => set({ country: e.target.value })} />
        </div>

        <div className="pc-field-pair" style={{ gap: 10 }}>
          <Input label="Latitude" value={form.latitude} onChange={(e) => set({ latitude: e.target.value })} disabled />
          <Input label="Longitude" value={form.longitude} onChange={(e) => set({ longitude: e.target.value })} disabled />
        </div>

        <Select
          label="Type de zone"
          icon="category"
          value={form.type}
          onChange={(e) => set({ type: e.target.value as 'CIRCLE' | 'POLYGON' })}
          options={[
            { value: 'CIRCLE', label: 'Cercle (rayon autour du centre)' },
            { value: 'POLYGON', label: 'Polygone (zone dessinée)' },
          ]}
        />

        {form.type === 'CIRCLE' && (
          <Input
            label="Rayon (mètres)"
            icon="straighten"
            type="number"
            value={String(form.radius)}
            onChange={(e) => set({ radius: Number(e.target.value) || 5000 })}
            help={`${(form.radius / 1000).toFixed(1)} km`}
          />
        )}

        {form.type === 'POLYGON' && (
          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--amber-600)', background: 'var(--amber-50)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
            Le polygone pourra etre dessine sur la carte apres creation de la zone.
            Les coordonnees GPS du centre servent de reference initiale.
          </div>
        )}

        {apiKey && (
          <MapPicker
            value={hasCoords ? { lat: previewLat, lng: previewLng } : null}
            onChange={handleCoordinates}
            height={200}
          />
        )}

        <Switch
          checked={form.isActive}
          onChange={(isActive) => set({ isActive })}
          label="Zone active"
          description="Les zones inactives ne sont pas utilisees pour les recherches."
        />

        {localError && <Toast tone="error" message={localError} onClose={() => setLocalError(null)} />}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
        <Button variant="secondary" onClick={onClose} disabled={pending} block>Annuler</Button>
        <Button variant="primary" onClick={handleSubmit} loading={pending} disabled={pending} block>
          {isEdit ? 'Enregistrer' : 'Creer la zone'}
        </Button>
      </div>
    </Dialog>
  )
}
