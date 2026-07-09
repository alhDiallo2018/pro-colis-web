import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button, Dialog, Input, Select, Textarea, Toast } from '@/ds'
import { useCreateAdvertisement } from './hooks'
import * as garagesApi from '@/lib/api/garages'
import { ApiError } from '@/lib/api/client'

interface Props {
  open: boolean
  onClose: () => void
}

/** Modal for a driver to publish a trip advertisement (annonce de trajet). */
export function CreateAnnonceDialog({ open, onClose }: Props) {
  const createAd = useCreateAdvertisement()
  const garagesQ = useQuery({ queryKey: ['garages', 'public'], queryFn: () => garagesApi.listPublic(), staleTime: 5 * 60_000 })
  const garages = garagesQ.data ?? []
  const options = garages.map((g) => ({ value: g.id, label: `${g.name} — ${g.city ?? ''}`.trim() }))

  const [departureGarageId, setDeparture] = useState('')
  const [arrivalGarageId, setArrival] = useState('')
  const [departureAt, setDepartureAt] = useState('')
  const [weight, setWeight] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')

  if (!open) return null

  const cityOf = (id: string) => garages.find((g) => g.id === id)?.city ?? undefined
  const valid = !!departureGarageId && !!arrivalGarageId && departureGarageId !== arrivalGarageId

  const reset = () => {
    setDeparture('')
    setArrival('')
    setDepartureAt('')
    setWeight('')
    setPrice('')
    setDescription('')
  }

  const submit = () => {
    createAd.mutate(
      {
        departureGarageId,
        arrivalGarageId,
        departureCity: cityOf(departureGarageId),
        arrivalCity: cityOf(arrivalGarageId),
        departureAt: departureAt ? new Date(departureAt).toISOString() : null,
        availableWeight: weight ? Number(weight) : null,
        proposedPrice: price ? Number(price) : null,
        description: description.trim() || null,
      },
      {
        onSuccess: () => {
          reset()
          onClose()
        },
      },
    )
  }

  const error = createAd.error instanceof ApiError ? createAd.error.message : null

  return (
    <Dialog
      open
      onClose={onClose}
      icon="route"
      iconTone="primary"
      title="Créer une annonce de trajet"
      style={{ maxWidth: 560, textAlign: 'left' }}
      actions={
        <>
          <Button variant="secondary" block onClick={onClose}>
            Annuler
          </Button>
          <Button block icon="campaign" loading={createAd.isPending} disabled={!valid} onClick={submit}>
            Publier l’annonce
          </Button>
        </>
      }
    >
      <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="pc-field-pair" style={{ gap: 12 }}>
          <Select
            label="Départ"
            icon="garage"
            placeholder={garagesQ.isLoading ? 'Chargement…' : 'Garage'}
            options={options}
            value={departureGarageId}
            onChange={(e) => setDeparture(e.target.value)}
          />
          <Select
            label="Arrivée"
            icon="pin_drop"
            placeholder={garagesQ.isLoading ? 'Chargement…' : 'Garage'}
            options={options}
            value={arrivalGarageId}
            onChange={(e) => setArrival(e.target.value)}
          />
        </div>
        <Input
          label="Date et heure de départ"
          icon="schedule"
          type="datetime-local"
          value={departureAt}
          onChange={(e) => setDepartureAt(e.target.value)}
        />
        <div className="pc-field-pair" style={{ gap: 12 }}>
          <Input label="Poids dispo. (kg)" icon="weight" type="number" inputMode="decimal" mono value={weight} onChange={(e) => setWeight(e.target.value)} />
          <Input label="Prix proposé (FCFA)" icon="payments" type="number" inputMode="numeric" mono value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <Textarea label="Description (optionnel)" placeholder="Ex : véhicule climatisé, départ confirmé." maxLength={200} value={description} onChange={(e) => setDescription(e.target.value)} />
        {departureGarageId && departureGarageId === arrivalGarageId && (
          <Toast tone="warning" message="Le départ et l’arrivée doivent être différents." />
        )}
        {error && <Toast tone="error" message={error} />}
      </div>
    </Dialog>
  )
}
