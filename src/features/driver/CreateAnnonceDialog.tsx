import { TripEditor } from '@/features/transport/TripEditor'
import { vehicleTypes, type Stop } from '@/features/transport/domain'
import * as vehiclesApi from '@/lib/api/vehicles'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button, Dialog, Input, Textarea, Toast } from '@/ds'
import { useCreateAdvertisement } from './hooks'
import * as zonesApi from '@/lib/api/zones'
import { ApiError } from '@/lib/api/client'
import { GarageSearchSelect } from '@/components/GarageSearchSelect'
import { VoiceRecorder } from '@/components/VoiceRecorder'
import { DraftRestoreBanner } from '@/components/DraftRestoreBanner'
import { useFormDraft } from '@/lib/useFormDraft'
import type { Zone } from '@/lib/api/types'

interface Props {
  open: boolean
  onClose: () => void
}

/** Saisie conservée d'une annonce non publiée. */
interface DraftPayload {
  departureZoneId: string
  arrivalZoneId: string
  departureAt: string
  weight: string
  price: string
  description: string
  audioUrl: string | null
  extraZones: Zone[]
  stops?: Stop[]
  duration?: number
  line?: string
}

/** Modal for a driver to publish a trip advertisement (annonce de trajet). */
export function CreateAnnonceDialog({ open, onClose }: Props) {
  const createAd = useCreateAdvertisement()
  const vehicleQ = useQuery({queryKey:['driver','vehicle'],queryFn:vehiclesApi.getMine})
  const vehicle=vehicleQ.data
  const category=(vehicle?.type??'').toLowerCase()
  const serviceType=['bus','tata','horaire','minibus','autobus'].includes(category)?'shuttle':category==='gp'?'gp':'trip'
  const [stops,setStops]=useState<Stop[]>([]),[duration,setDuration]=useState(60),[line,setLine]=useState('')
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

  // Brouillon automatique de l'annonce : fermer la modale par mégarde ne doit
  // pas coûter la saisie. La note vocale est déjà téléversée à ce stade, son
  // URL se conserve donc sans surcoût.
  const draft = useFormDraft<DraftPayload>({
    slot: 'annonce',
    values: { departureZoneId, arrivalZoneId, departureAt, weight, price, description, audioUrl, extraZones, stops, duration, line },
    hasContent: Boolean(departureZoneId || arrivalZoneId || departureAt || weight || price || description || audioUrl),
    paused: !open,
  })

  if (!open) return null

  const restoreDraft = () => {
    const saved = draft.restore()
    if (!saved) return
    setDeparture(saved.departureZoneId)
    setArrival(saved.arrivalZoneId)
    setDepartureAt(saved.departureAt)
    setWeight(saved.weight)
    setPrice('')
    setDescription(saved.description)
    setAudioUrl(saved.audioUrl)
    setExtraZones(saved.extraZones ?? [])
    setStops(saved.stops??[]);setDuration(saved.duration??60);setLine(saved.line??'')
  }

  // Les zones issues de Places peuvent ne pas avoir de ville. Conserver un
  // libellé lisible sans remplacer leur UUID par celui du garage miroir.
  const cityOf = (id: string) => {
    const zone = zoneList.find((z) => z.id === id)
    return zone?.city?.trim() || zone?.displayName?.trim() || zone?.name?.trim() || undefined
  }
  const ordered=[{zoneId:departureZoneId,offsetMinutes:0},...stops,{zoneId:arrivalZoneId,offsetMinutes:duration}]
  const valid=!!vehicle && new Date(departureAt).getTime()>Date.now() && Number(weight||vehicle.capacity)>0 && (serviceType!=='shuttle'||!!line.trim()) && new Set(ordered.map(s=>s.zoneId)).size===ordered.length && ordered.every((s,i)=>!!s.zoneId&&Number.isInteger(s.offsetMinutes)&&(!i||s.offsetMinutes>ordered[i-1].offsetMinutes))

  const reset = () => {
    setDeparture('')
    setArrival('')
    setDepartureAt('')
    setWeight('')
    setPrice('')
    setDescription('')
    setAudioUrl(null)
    setStops([]);setDuration(60);setLine('')
  }

  const submit = () => {
    createAd.mutate(
      {
        vehicleId: vehicle?.id,
        itinerary: {serviceType,lineNumber:line.trim()||null,stops:ordered},
        departureZoneId,
        arrivalZoneId,
        departureCity: cityOf(departureZoneId),
        arrivalCity: cityOf(arrivalZoneId),
        departureAt: departureAt ? new Date(departureAt).toISOString() : null,
        availableWeight: Number(weight||vehicle?.capacity),
        // Le tarif sera négocié pour le colis réellement proposé.
        proposedPrice: null,
        description: description.trim() || null,
        audioUrl: audioUrl ?? undefined,
      },
      {
        onSuccess: () => {
          reset()
          // L'annonce est publiée : plus rien à reprendre.
          draft.clear()
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
        {draft.pending && (
          <DraftRestoreBanner savedAt={draft.pending.savedAt} onRestore={restoreDraft} onDiscard={draft.discard} />
        )}
        <p>{vehicle?`Véhicule enregistré : ${vehicle.model} · ${vehicleTypes.find(t=>t.value===category)?.label??vehicle.type}`:'Complétez votre véhicule dans le profil avant de publier.'}</p>
        {serviceType==='shuttle'&&<Input label="Numéro de ligne" value={line} maxLength={40} onChange={e=>setLine(e.target.value)}/>}
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
        <TripEditor stops={stops} onChange={setStops} zones={zoneList} onAddNew={addResolvedZone}/>
        <Input label="Durée jusqu’à l’arrivée (minutes)" type="number" min={1} value={String(duration)} onChange={e=>setDuration(Number(e.target.value))}/>
        <p>Ce trajet sera mémorisé automatiquement pour vos prochains départs.</p>
        <Input
          label="Date et heure de départ"
          icon="schedule"
          type="datetime-local"
          value={departureAt}
          onChange={(e) => setDepartureAt(e.target.value)}
        />
        <div className="pc-field-pair" style={{ gap: 12 }}>
          <Input label="Poids dispo. (kg)" icon="weight" type="number" inputMode="decimal" mono placeholder={String(vehicle?.capacity??'')} value={weight} onChange={(e) => setWeight(e.target.value)} />
          <p className="transport-note"><strong>Prix à négocier</strong><br/>Publiez votre trajet sans tarif. Vous conviendrez du prix après avoir reçu l’offre du client et les détails de son colis.</p>
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
