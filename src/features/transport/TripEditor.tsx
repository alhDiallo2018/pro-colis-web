import { Button, Input } from '@/ds'
import { GarageSearchSelect } from '@/components/GarageSearchSelect'
import type { Zone } from '@/lib/api/types'
import type { Stop } from './domain'
export function TripEditor({
  stops,
  onChange,
  zones,
  onAddNew,
}: {
  stops: Stop[]
  onChange: (s: Stop[]) => void
  zones: Zone[]
  onAddNew: (z: Zone) => void
}) {
  return (
    <div className="transport-panel">
      <strong>Arrêts intermédiaires</strong>
      <p className="transport-note">
        Indiquez le temps écoulé depuis le départ. L’ordre définit les lieux possibles de prise en
        charge et de remise des colis.
      </p>
      {stops.map((s, i) => (
        <div className="transport-fields" key={i}>
          <GarageSearchSelect
            label={`Arrêt ${i + 1}`}
            zones={zones}
            value={s.zoneId}
            onAddNew={onAddNew}
            onChange={(id) =>
              onChange(stops.map((old, k) => (k === i ? { ...old, zoneId: id } : old)))
            }
          />
          <Input
            label="Minutes après départ"
            type="number"
            min={1}
            value={String(s.offsetMinutes)}
            onChange={(e) =>
              onChange(
                stops.map((old, k) =>
                  k === i ? { ...old, offsetMinutes: Number(e.target.value) } : old,
                ),
              )
            }
          />
          <Button variant="secondary" onClick={() => onChange(stops.filter((_, k) => k !== i))}>
            Retirer cet arrêt
          </Button>
        </div>
      ))}
      <Button
        variant="secondary"
        disabled={stops.length >= 38}
        onClick={() =>
          onChange([
            ...stops,
            {
              zoneId: '',
              offsetMinutes: (stops.at(-1)?.offsetMinutes ?? 0) + 15,
            },
          ])
        }
      >
        Ajouter un arrêt
      </Button>
    </div>
  )
}
