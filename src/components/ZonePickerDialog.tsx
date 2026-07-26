import { useEffect, useState } from 'react'
import { Button, Dialog, Icon, Input, Toast } from '@/ds'
import { LocationInput, type PlaceDetails, type PlaceResult } from './LocationInput'
import { MapPicker } from './MapPicker'
import { resolveZone, type ResolvedZone } from '@/lib/api/zones'
import { ApiError } from '@/lib/api/client'
import type { Garage } from '@/lib/api/types'

export interface ZonePickerDialogProps {
  open: boolean
  /** Texte déjà saisi dans le sélecteur, réutilisé comme nom par défaut. */
  initialQuery?: string
  onClose: () => void
  /**
   * Zone retenue. `garage` est le garage miroir : c'est lui qu'il faut poser
   * dans `departureGarageId` / `arrivalGarageId`, jamais l'id de la zone.
   */
  onResolved: (garage: Garage, result: ResolvedZone) => void
}

interface Picked {
  lat: number
  lng: number
  placeId?: string
  city?: string
  region?: string
  country?: string
  formattedAddress?: string
}

/**
 * Ajout d'une zone de départ / arrivée absente de la liste, par recherche
 * Google Places ou par pointage direct sur la carte.
 *
 * La zone créée part en `pending` côté API : elle est utilisable tout de suite
 * par son auteur, mais n'apparaît chez les autres qu'une fois validée.
 */
export function ZonePickerDialog({ open, initialQuery = '', onClose, onResolved }: ZonePickerDialogProps) {
  const [picked, setPicked] = useState<Picked | null>(null)
  const [name, setName] = useState(initialQuery)
  // L'utilisateur a-t-il repris la main sur le nom ? Si oui, on cesse de
  // l'écraser à chaque déplacement du repère.
  const [nameTouched, setNameTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setPicked(null)
    setName(initialQuery)
    setNameTouched(false)
    setBusy(false)
    setError(null)
  }, [open, initialQuery])

  if (!open) return null

  const applyDetails = (lat: number, lng: number, details?: PlaceDetails, fallbackName?: string) => {
    setPicked({
      lat,
      lng,
      placeId: details?.placeId,
      city: details?.city,
      region: details?.region,
      country: details?.country,
      formattedAddress: details?.formattedAddress,
    })
    setError(null)
    const suggested = fallbackName || details?.city || details?.formattedAddress?.split(',')[0]
    if (!nameTouched && suggested) setName(suggested)
  }

  const handleSuggestion = (_value: string, place?: PlaceResult) => {
    // Le nom est proposé ici ; les coordonnées suivent via `onCoordinates`.
    if (place && !nameTouched) setName(place.mainText || place.description)
  }

  const submit = async () => {
    if (!picked) return setError('Choisissez un lieu sur la carte ou dans la liste.')
    const label = name.trim()
    if (label.length < 2) return setError('Donnez un nom à cette zone (2 caractères minimum).')

    setBusy(true)
    setError(null)
    try {
      const result = await resolveZone({
        placeId: picked.placeId,
        name: label,
        displayName: picked.formattedAddress || label,
        latitude: picked.lat,
        longitude: picked.lng,
        city: picked.city,
        region: picked.region,
        country: picked.country,
      })

      // Sans garage miroir la zone est inutilisable comme départ / arrivée :
      // mieux vaut le dire que laisser la création du colis échouer plus tard.
      if (!result.garage || !result.garageId) {
        setError("Cette zone n'a pas pu être rattachée à un point de départ. Contactez le support.")
        return
      }
      onResolved(result.garage, result)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Impossible d'ajouter cette zone.")
    } finally {
      setBusy(false)
    }
  }

  const locality = [picked?.city, picked?.region, picked?.country].filter(Boolean).join(' · ')

  return (
    <Dialog
      open
      onClose={busy ? undefined : onClose}
      icon="add_location_alt"
      iconTone="primary"
      title="Ajouter une zone"
      // Plus haut que le défaut du Dialog : la carte a besoin de place pour
      // rester manipulable sans que le formulaire disparaisse.
      style={{ maxWidth: 520, maxHeight: 'min(92vh, 760px)', textAlign: 'left' }}
      actions={
        <>
          <Button variant="secondary" block onClick={onClose} disabled={busy}>
            Annuler
          </Button>
          <Button block icon="check" loading={busy} disabled={busy || !picked} onClick={submit}>
            Utiliser cette zone
          </Button>
        </>
      }
    >
      <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ margin: 0, fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
          Recherchez le lieu, ou pointez-le directement sur la carte s’il n’apparaît pas dans les
          suggestions. Vous pourrez l’utiliser immédiatement ; il sera validé ensuite par l’équipe.
        </p>

        <LocationInput
          label="Rechercher un lieu"
          icon="search"
          placeholder="Ville, quartier, repère…"
          disabled={busy}
          onChange={handleSuggestion}
          onCoordinates={(lat, lng, details) => applyDetails(lat, lng, details)}
        />

        <MapPicker
          value={picked ? { lat: picked.lat, lng: picked.lng } : null}
          onChange={(lat, lng, details) => applyDetails(lat, lng, details)}
          disabled={busy}
        />

        <Input
          label="Nom de la zone"
          icon="pin_drop"
          placeholder="Ex : Mbour, Gare routière"
          value={name}
          disabled={busy}
          onChange={(e) => {
            setName(e.target.value)
            setNameTouched(true)
          }}
          help={locality || undefined}
        />

        {picked && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 'var(--fs-xs)',
              color: 'var(--text-muted)',
            }}
          >
            <Icon name="my_location" size={14} />
            <span style={{ fontFamily: 'var(--font-mono, monospace)' }}>
              {picked.lat.toFixed(5)}, {picked.lng.toFixed(5)}
            </span>
          </div>
        )}

        {error && <Toast tone="error" message={error} onClose={() => setError(null)} />}
      </div>
    </Dialog>
  )
}
