import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Button, Checkbox, Dialog, Input, Select, Textarea } from '@/ds'
import { GarageSearchSelect } from '@/components/GarageSearchSelect'
import { ApiError } from '@/lib/api/client'
import type { Parcel, Zone } from '@/lib/api/types'
import type { UpdateParcelPayload } from '@/lib/api/parcels'
import { useUpdateParcel, useZones } from './hooks'

// Doit rester aligné sur l'enum `ParcelType` de l'API, sinon la mise à jour
// part en 400.
const TYPES = [
  { value: 'document', label: 'Document' },
  { value: 'package', label: 'Colis standard' },
  { value: 'fragile', label: 'Fragile' },
  { value: 'perishable', label: 'Alimentaire / Périssable' },
  { value: 'valuable', label: 'Objet de valeur' },
]

const CHANNELS = [
  { value: 'cash', label: 'Espèces' },
  { value: 'platform', label: 'En ligne (plateforme)' },
]

const COLLECTION_POINTS = [
  { value: 'receiver_delivery', label: 'Le destinataire paie à la livraison' },
  { value: 'sender_pickup', label: "L'expéditeur paie au ramassage" },
]

interface FormState {
  receiverName: string
  receiverPhone: string
  receiverEmail: string
  receiverAddress: string
  description: string
  weight: string
  type: string
  price: string
  isUrgent: boolean
  isInsured: boolean
  departureZoneId: string
  arrivalZoneId: string
  paymentChannel: string
  cashCollectionPoint: string
}

function toForm(parcel: Parcel): FormState {
  return {
    receiverName: parcel.receiverName ?? '',
    receiverPhone: parcel.receiverPhone ?? '',
    receiverEmail: parcel.receiverEmail ?? '',
    receiverAddress: parcel.receiverAddress ?? '',
    description: parcel.description ?? '',
    weight: parcel.weight != null ? String(parcel.weight) : '',
    type: parcel.type ?? 'package',
    price: parcel.price != null ? String(Math.round(parcel.price)) : '',
    isUrgent: Boolean(parcel.isUrgent),
    isInsured: Boolean(parcel.isInsured),
    departureZoneId: parcel.departureZoneId ?? '',
    arrivalZoneId: parcel.arrivalZoneId ?? '',
    paymentChannel: parcel.paymentChannel ?? (parcel.paymentMethod === 'cash' ? 'cash' : 'cash'),
    cashCollectionPoint: parcel.cashCollectionPoint ?? 'receiver_delivery',
  }
}

/**
 * N'envoie que les champs réellement modifiés — l'API journalise chaque
 * changement dans la chronologie du colis, réémettre l'existant y créerait du
 * bruit et rouvrirait inutilement les enchères en cours.
 */
function buildPayload(initial: FormState, current: FormState): UpdateParcelPayload {
  const payload: UpdateParcelPayload = {}
  const changed = (key: keyof FormState) => initial[key] !== current[key]

  if (changed('receiverName')) payload.receiverName = current.receiverName.trim()
  if (changed('receiverPhone')) payload.receiverPhone = current.receiverPhone.trim()
  if (changed('receiverEmail')) payload.receiverEmail = current.receiverEmail.trim() || null
  if (changed('receiverAddress')) payload.receiverAddress = current.receiverAddress.trim() || null
  if (changed('description')) payload.description = current.description.trim()
  if (changed('weight')) payload.weight = Number(current.weight) || null
  if (changed('type')) payload.type = current.type
  if (changed('isUrgent')) payload.isUrgent = current.isUrgent
  if (changed('isInsured')) payload.isInsured = current.isInsured
  if (changed('departureZoneId')) payload.departureZoneId = current.departureZoneId || null
  if (changed('arrivalZoneId')) payload.arrivalZoneId = current.arrivalZoneId || null

  // Le prix demandé et le prix proposé restent alignés tant qu'aucune
  // négociation n'a eu lieu, exactement comme à la création.
  if (changed('price')) {
    const price = current.price.trim() === '' ? null : Number(current.price)
    payload.price = price
    payload.proposedPrice = price
  }

  if (changed('paymentChannel')) {
    payload.paymentChannel = current.paymentChannel
    payload.paymentMethod = current.paymentChannel === 'cash' ? 'cash' : 'mobile_money'
  }
  // Le point d'encaissement n'a de sens qu'en espèces : on l'efface en repassant
  // en ligne pour ne pas laisser une consigne orpheline.
  if (changed('cashCollectionPoint') || changed('paymentChannel')) {
    payload.cashCollectionPoint = current.paymentChannel === 'cash' ? current.cashCollectionPoint : null
  }

  return payload
}

/** Édition d'un colis — pendant web de `edit_colis_sheet.dart`. */
export function EditParcelDialog({ parcel, onClose }: { parcel: Parcel | null; onClose: () => void }) {
  const zones = useZones()
  const update = useUpdateParcel()
  const [initial, setInitial] = useState<FormState | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [extraZones, setExtraZones] = useState<Zone[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!parcel) {
      setInitial(null)
      setForm(null)
      return
    }
    const next = toForm(parcel)
    setInitial(next)
    setForm(next)
    setError(null)
  }, [parcel])

  if (!parcel || !form || !initial) return null

  const zoneList = [...(zones.data ?? []), ...extraZones]
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm({ ...form, [key]: value })
  const payload = buildPayload(initial, form)
  const hasChanges = Object.keys(payload).length > 0

  const submit = () => {
    if (!hasChanges) {
      onClose()
      return
    }
    if (form.receiverName.trim().length < 2 || form.receiverPhone.trim().length < 8) {
      setError('Le nom et le téléphone du destinataire sont obligatoires.')
      return
    }
    if (!form.description.trim() || !(Number(form.weight) > 0)) {
      setError('La description et le poids sont obligatoires.')
      return
    }
    if (!form.departureZoneId || !form.arrivalZoneId) {
      setError('Les zones de départ et d’arrivée sont obligatoires.')
      return
    }
    setError(null)
    update.mutate(
      { parcelId: parcel.id, payload },
      {
        onSuccess: () => onClose(),
        onError: (submitError) => {
          setError(submitError instanceof ApiError ? submitError.message : 'Modification impossible.')
        },
      },
    )
  }

  return (
    <Dialog
      open
      onClose={onClose}
      icon="edit"
      iconTone="primary"
      size="xl"
      title="Modifier le colis"
      actions={
        <>
          <Button variant="secondary" block onClick={onClose}>
            Annuler
          </Button>
          <Button block icon="check" loading={update.isPending} disabled={!hasChanges} onClick={submit}>
            Enregistrer
          </Button>
        </>
      }
    >
      <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="pc-field-pair" style={{ gap: 12 }}>
          <Input
            label="Nom du destinataire"
            value={form.receiverName}
            onChange={(e: ChangeEvent<HTMLInputElement>) => set('receiverName', e.target.value)}
          />
          <Input
            label="Téléphone"
            value={form.receiverPhone}
            onChange={(e: ChangeEvent<HTMLInputElement>) => set('receiverPhone', e.target.value)}
          />
        </div>
        <div className="pc-field-pair" style={{ gap: 12 }}>
          <Input
            label="Email (optionnel)"
            type="email"
            value={form.receiverEmail}
            onChange={(e: ChangeEvent<HTMLInputElement>) => set('receiverEmail', e.target.value)}
          />
          <Input
            label="Adresse de livraison (optionnel)"
            value={form.receiverAddress}
            onChange={(e: ChangeEvent<HTMLInputElement>) => set('receiverAddress', e.target.value)}
          />
        </div>

        <GarageSearchSelect
          label="Zone de départ"
          icon="garage"
          zones={zoneList}
          value={form.departureZoneId}
          onChange={(id) => set('departureZoneId', id)}
          onAddNew={(zone) => {
            setExtraZones((prev) => [...prev.filter((z) => z.id !== zone.id), zone])
            set('departureZoneId', zone.id)
          }}
        />
        <GarageSearchSelect
          label="Zone d’arrivée"
          icon="pin_drop"
          zones={zoneList}
          value={form.arrivalZoneId}
          onChange={(id) => set('arrivalZoneId', id)}
          onAddNew={(zone) => {
            setExtraZones((prev) => [...prev.filter((z) => z.id !== zone.id), zone])
            set('arrivalZoneId', zone.id)
          }}
        />

        <Textarea
          label="Description"
          rows={2}
          value={form.description}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => set('description', e.target.value)}
        />

        <div className="pc-field-pair" style={{ gap: 12 }}>
          <Input
            label="Poids (kg)"
            type="number"
            value={form.weight}
            onChange={(e: ChangeEvent<HTMLInputElement>) => set('weight', e.target.value)}
          />
          <Select
            label="Type de colis"
            value={form.type}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => set('type', e.target.value)}
            options={TYPES}
          />
        </div>

        <div className="pc-field-pair" style={{ gap: 12 }}>
          <Input
            label="Prix proposé (FCFA)"
            type="number"
            mono
            value={form.price}
            onChange={(e: ChangeEvent<HTMLInputElement>) => set('price', e.target.value)}
          />
          <Select
            label="Mode de règlement"
            value={form.paymentChannel}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => set('paymentChannel', e.target.value)}
            options={CHANNELS}
          />
        </div>

        {form.paymentChannel === 'cash' && (
          <Select
            label="Qui remet l’argent"
            value={form.cashCollectionPoint}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => set('cashCollectionPoint', e.target.value)}
            options={COLLECTION_POINTS}
          />
        )}

        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          <Checkbox label="Colis urgent" checked={form.isUrgent} onChange={(checked) => set('isUrgent', checked)} />
          <Checkbox label="Assurer le colis" checked={form.isInsured} onChange={(checked) => set('isInsured', checked)} />
        </div>

        {error && <span style={{ color: 'var(--red-500)', fontSize: 12.5 }}>{error}</span>}
      </div>
    </Dialog>
  )
}
