import { useEffect, useState } from 'react'
import { Button, Dialog, Input, Switch, Toast } from '@/ds'
import { CountrySelect } from '@/components/CountrySelect'
import type { Garage } from '@/lib/api/types'
import { useCreateGarage, useUpdateGarage } from './hooks'

interface GarageFormDialogProps {
  open: boolean
  garage?: Garage | null
  onClose: () => void
}

interface FormState {
  name: string
  country: string
  region: string
  city: string
  address: string
  phone: string
  isActive: boolean
}

const EMPTY: FormState = {
  name: '',
  country: '',
  region: '',
  city: '',
  address: '',
  phone: '',
  isActive: true,
}

/** Création / édition d'une zone — couvre tous les pays du monde. */
export function GarageFormDialog({ open, garage, onClose }: GarageFormDialogProps) {
  const isEdit = !!garage
  const [form, setForm] = useState<FormState>(EMPTY)
  const [localError, setLocalError] = useState<string | null>(null)

  const createMutation = useCreateGarage()
  const updateMutation = useUpdateGarage()
  const pending = createMutation.isPending || updateMutation.isPending

  useEffect(() => {
    if (!open) return
    setLocalError(null)
    setForm(
      garage
        ? {
            name: garage.name ?? '',
            country: garage.country ?? '',
            region: garage.region ?? '',
            city: garage.city ?? '',
            address: garage.address ?? '',
            phone: garage.phone ?? '',
            isActive: garage.isActive !== false,
          }
        : EMPTY,
    )
  }, [open, garage])

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }))

  const handleSubmit = async () => {
    if (!form.name.trim()) return setLocalError('Le nom de la zone est requis.')
    if (!form.country.trim()) return setLocalError('Veuillez choisir un pays.')
    if (!form.region.trim()) return setLocalError('La région est requise.')
    if (!form.city.trim()) return setLocalError('La ville est requise.')

    const payload = {
      name: form.name.trim(),
      country: form.country.trim(),
      region: form.region.trim(),
      city: form.city.trim(),
      address: form.address.trim() || null,
      phone: form.phone.trim() || null,
      isActive: form.isActive,
    }

    setLocalError(null)
    try {
      if (isEdit && garage) {
        await updateMutation.mutateAsync({ garageId: garage.id, payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      onClose()
    } catch (e) {
      const err = e as { response?: { data?: { message?: string }; status?: number } }
      if (err.response?.status === 409) {
        setLocalError('Une zone avec ce nom existe déjà dans cette ville.')
      } else {
        setLocalError(err.response?.data?.message ?? "Erreur lors de l'enregistrement de la zone.")
      }
    }
  }

  return (
    <Dialog
      open={open}
      title={isEdit ? 'Modifier la zone' : 'Nouvelle zone'}
      icon={isEdit ? 'edit_location_alt' : 'add_location_alt'}
      iconTone="primary"
      onClose={pending ? undefined : onClose}
      style={{ maxWidth: 440, textAlign: 'left' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
        <Input
          label="Nom de la zone"
          placeholder="Ex: Hub Dakar Centre"
          value={form.name}
          onChange={(e) => set({ name: e.target.value })}
          icon="garage"
        />
        <CountrySelect
          label="Pays"
          required
          value={form.country}
          onChange={(country) => set({ country })}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Input
            label="Région / État"
            placeholder="Ex: Dakar, Île-de-France…"
            value={form.region}
            onChange={(e) => set({ region: e.target.value })}
          />
          <Input
            label="Ville"
            placeholder="Ex: Dakar, Paris…"
            value={form.city}
            onChange={(e) => set({ city: e.target.value })}
          />
        </div>
        <Input
          label="Adresse (optionnel)"
          placeholder="Rue, quartier…"
          value={form.address}
          onChange={(e) => set({ address: e.target.value })}
          icon="location_on"
        />
        <Input
          label="Téléphone (optionnel)"
          placeholder="Ex: +221 77 000 00 00"
          value={form.phone}
          onChange={(e) => set({ phone: e.target.value })}
          icon="call"
        />
        <Switch
          checked={form.isActive}
          onChange={(isActive) => set({ isActive })}
          label="Zone active"
          description="Les zones inactives n'apparaissent plus dans les sélecteurs de trajet."
        />
        {localError && <Toast tone="error" message={localError} onClose={() => setLocalError(null)} />}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
        <Button variant="secondary" onClick={onClose} disabled={pending} block>
          Annuler
        </Button>
        <Button variant="primary" onClick={handleSubmit} loading={pending} disabled={pending} block>
          {isEdit ? 'Enregistrer' : 'Créer la zone'}
        </Button>
      </div>
    </Dialog>
  )
}
