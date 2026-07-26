import { useState } from 'react'
import { Badge, Button, Card, Icon, Input, Toast } from '@/ds'
import { LocationInput } from '@/components/LocationInput'
import { ApiError } from '@/lib/api/client'
import { useCreateAddress, useDeleteAddress, useMyAddresses, useSetDefaultAddress } from './hooks'

/**
 * Carnet d'adresses personnel (expéditions récurrentes).
 * S'appuie sur `/addresses` — la carte se masque si la route est indisponible.
 */
export function AddressBookCard() {
  const list = useMyAddresses()
  const create = useCreateAddress()
  const remove = useDeleteAddress()
  const setDefault = useSetDefaultAddress()

  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [region, setRegion] = useState('')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)

  if (list.isError) return null

  const addresses = list.data ?? []

  const reset = () => {
    setLabel('')
    setAddress('')
    setCity('')
    setRegion('')
    setCoords(null)
    setOpen(false)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    create.mutate(
      {
        label: label.trim() || null,
        address: address.trim(),
        city: city.trim() || null,
        region: region.trim() || null,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        isDefault: addresses.length === 0,
      },
      { onSuccess: reset },
    )
  }

  const error = create.error instanceof ApiError ? create.error.message : null

  return (
    <Card padding="lg">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
        <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)', color: 'var(--text-strong)' }}>
          Mes adresses
        </h3>
        <Button size="sm" variant={open ? 'ghost' : 'secondary'} icon={open ? 'close' : 'add'} onClick={() => setOpen((o) => !o)}>
          {open ? 'Annuler' : 'Ajouter'}
        </Button>
      </div>
      <p style={{ margin: '0 0 16px', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
        Vos adresses enregistrées accélèrent la création d'un colis.
      </p>

      {open && (
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 18 }}>
          <div className="pc-field-pair" style={{ gap: 14 }}>
            <Input label="Libellé" icon="label" placeholder="Domicile, bureau…" value={label} onChange={(e) => setLabel(e.target.value)} />
            <Input label="Région" icon="map" value={region} onChange={(e) => setRegion(e.target.value)} />
          </div>
          <LocationInput
            label="Adresse"
            icon="home"
            placeholder="Rechercher une adresse..."
            value={address}
            onChange={setAddress}
            onCoordinates={(lat, lng, details) => {
              setCoords({ lat, lng })
              if (details?.city) setCity(details.city)
              if (details?.region) setRegion(details.region)
            }}
          />
          <LocationInput label="Ville" icon="location_on" placeholder="Ville..." value={city} onChange={setCity} />
          {error && <Toast tone="error" message={error} />}
          <div>
            <Button type="submit" icon="save" loading={create.isPending} disabled={address.trim().length < 3}>
              Enregistrer l'adresse
            </Button>
          </div>
        </form>
      )}

      {addresses.length === 0 ? (
        <div style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>Aucune adresse enregistrée.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {addresses.map((a) => (
            <div
              key={a.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 0',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <Icon name={a.isDefault ? 'home_pin' : 'location_on'} size={20} style={{ color: 'var(--text-faint)' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5, color: 'var(--text-strong)' }}>
                    {a.label || 'Adresse'}
                  </span>
                  {a.isDefault && <Badge tone="green">Par défaut</Badge>}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                  {a.address}
                  {a.city ? ` · ${a.city}` : ''}
                </div>
              </div>
              {!a.isDefault && (
                <Button size="sm" variant="ghost" icon="star" onClick={() => setDefault.mutate(a.id)} loading={setDefault.isPending}>
                  Par défaut
                </Button>
              )}
              <Button size="sm" variant="ghost" icon="delete" onClick={() => remove.mutate(a.id)} loading={remove.isPending}>
                Supprimer
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
