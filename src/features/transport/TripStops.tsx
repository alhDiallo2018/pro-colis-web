import type { Advertisement } from '@/lib/api/advertisements'
import './transport.css'
export function TripStops({ ad }: { ad: Advertisement }) {
  return ad.itinerary ? (
    <section className="transport-panel">
      <h3>
        {ad.itinerary.serviceType === 'gp'
          ? 'Voyage GP'
          : ad.itinerary.serviceType === 'shuttle'
            ? `Navette · ligne ${ad.itinerary.lineNumber}`
            : 'Trajet'}
        {ad.transport?.reference ? ` · véhicule ${ad.transport.reference}` : ''}
      </h3>
      <ol className="transport-stops">
        {ad.itinerary.stops.map((s) => (
          <li key={s.zoneId}>
            <strong>{s.name}</strong> ·{' '}
            {s.scheduledAt
              ? new Date(s.scheduledAt).toLocaleString('fr-SN')
              : `+${s.offsetMinutes} min`}
          </li>
        ))}
      </ol>
      <p className="transport-note">
        Prise en charge et remise possibles aux arrêts indiqués, dans le sens du trajet et selon la
        capacité disponible.
      </p>
    </section>
  ) : null
}
