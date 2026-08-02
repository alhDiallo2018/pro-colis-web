import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button, Dialog, Input, Textarea, Toast } from '@/ds'
import { useCreateAdvertisement } from './hooks'
import * as zonesApi from '@/lib/api/zones'
import { ApiError } from '@/lib/api/client'
import { GarageSearchSelect } from '@/components/GarageSearchSelect'
import { VoiceRecorder } from '@/components/VoiceRecorder'
import type { Zone } from '@/lib/api/types'

interface Props {
  open: boolean
  onClose: () => void
}

/** Modal for a driver to publish a trip advertisement (annonce de trajet). */
export function CreateAnnonceDialog({ open, onClose }: Props) {
  const createAd = useCreateAdvertisement()
  const zonesQ = useQuery({ queryKey: ['zones', 'public'], queryFn: () => zonesApi.listPublic(), staleTime: 5 * 60_000 })
  const zones = zonesQ.data ?? []

  const [departureZoneId, setDeparture] = useState('')
  const [arrivalZoneId, setArrival] = useState('')
  const [departureAt, setDepartureAt] = useState('')
  const [weight, setWeight] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  const [extraZones, setExtraZones] = useState<Zone[]>([])
  const zoneList = [...zones, ...extraZones]

  if (!open) return null

  const cityOf = (id: string) => zoneList.find((z) => z.id === id)?.city ?? undefined
  const valid = !!departureZoneId && !!arrivalZoneId && departureZoneId !== arrivalZoneId

  const reset = () => {
    setDeparture('')
    setArrival('')
    setDepartureAt('')
    setWeight('')
    setPrice('')
    setDescription('')
    setAudioUrl(null)
  }

  const submit = () => {
    createAd.mutate(
      {
        departureZoneId,
        arrivalZoneId,
        departureCity: cityOf(departureZoneId),
        arrivalCity: cityOf(arrivalZoneId),
        departureAt: departureAt ? new Date(departureAt).toISOString() : null,
        availableWeight: weight ? Number(weight) : null,
        proposedPrice: price ? Number(price) : null,
        description: description.trim() || null,
        audioUrl: audioUrl ?? undefined,
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

  const addResolvedZone = (z: Zone) =>
    setExtraZones((prev) => [...prev.filter((x) => x.id !== z.id), z])

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
          <GarageSearchSelect
            label="Départ"
            icon="garage"
            placeholder={zonesQ.isLoading ? 'Chargement…' : 'Rechercher une zone...'}
            zones={zoneList}
            value={departureZoneId}
            onChange={setDeparture}
            onAddNew={addResolvedZone}
          />
          <GarageSearchSelect
            label="Arrivée"
            icon="pin_drop"
            placeholder={zonesQ.isLoading ? 'Chargement…' : 'Rechercher une zone...'}
            zones={zoneList}
            value={arrivalZoneId}
            onChange={setArrival}
            onAddNew={addResolvedZone}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: 'var(--text-body)' }}>Note vocale (optionnel)</div>
          <VoiceRecorder onUploaded={setAudioUrl} existingUrl={audioUrl} />
        </div>
        {departureZoneId && departureZoneId === arrivalZoneId && (
          <Toast tone="warning" message="Le départ et l’arrivée doivent être différents." />
        )}
        {error && <Toast tone="error" message={error} />}
      </div>
    </Dialog>
  )
}
