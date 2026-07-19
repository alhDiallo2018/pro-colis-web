import { useMemo } from 'react'
import { Card } from '@/ds'

interface CityCoord {
  lat: number
  lng: number
}

const CITY_FALLBACKS: Record<string, CityCoord> = {
  'dakar': { lat: 14.6937, lng: -17.4441 },
  'dakar plateau': { lat: 14.6937, lng: -17.4441 },
  'pikine': { lat: 14.7645, lng: -17.3988 },
  'guediawaye': { lat: 14.7745, lng: -17.3956 },
  'rufisque': { lat: 14.7155, lng: -17.2725 },
  'thies': { lat: 14.7894, lng: -16.9277 },
  'thiès': { lat: 14.7894, lng: -16.9277 },
  'mbour': { lat: 14.4189, lng: -16.9667 },
  'saint-louis': { lat: 16.0179, lng: -16.4896 },
  'saint louis': { lat: 16.0179, lng: -16.4896 },
  'touba': { lat: 14.8622, lng: -15.8743 },
  'diourbel': { lat: 14.6487, lng: -16.2337 },
  'kaolack': { lat: 14.1822, lng: -16.2532 },
  'ziguinchor': { lat: 12.5608, lng: -16.2753 },
  'tambacounda': { lat: 13.7721, lng: -13.6711 },
  'louga': { lat: 15.6187, lng: -16.2278 },
  'bamako': { lat: 12.6392, lng: -8.0029 },
  'sikasso': { lat: 11.3176, lng: -5.6665 },
  'kayes': { lat: 14.4443, lng: -11.0989 },
  'mopti': { lat: 14.4897, lng: -4.1833 },
  'ségou': { lat: 13.4317, lng: -6.2157 },
  'conakry': { lat: 9.6412, lng: -13.5784 },
  'nzérékoré': { lat: 7.7478, lng: -8.8256 },
  'kindia': { lat: 10.0473, lng: -12.8598 },
  'abidjan': { lat: 5.36, lng: -4.0083 },
  'yamoussoukro': { lat: 6.8276, lng: -5.2893 },
  'bouaké': { lat: 7.6905, lng: -5.0304 },
  'san-pédro': { lat: 4.7485, lng: -6.6363 },
  'korhogo': { lat: 9.458, lng: -5.6298 },
  'ouagadougou': { lat: 12.3714, lng: -1.5197 },
  'bobo-dioulasso': { lat: 11.1781, lng: -4.2978 },
  'cotonou': { lat: 6.3703, lng: 2.3912 },
  'parakou': { lat: 9.337, lng: 2.6337 },
  'banjul': { lat: 13.4549, lng: -16.579 },
  'paris': { lat: 48.8566, lng: 2.3522 },
}

const DEFAULT_COORD: CityCoord = { lat: 14.6937, lng: -17.4441 }

function resolveCity(name: string): CityCoord {
  const key = name.trim().toLowerCase().replace(/\s+/g, ' ')
  if (CITY_FALLBACKS[key]) return CITY_FALLBACKS[key]
  for (const [fallback, coord] of Object.entries(CITY_FALLBACKS)) {
    if (key.includes(fallback) || fallback.includes(key)) return coord
  }
  return DEFAULT_COORD
}

function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function formatDuration(km: number): string {
  if (km < 0.1) return '--'
  const h = Math.floor(km / 60)
  const m = Math.round(((km / 60) - h) * 60)
  if (h === 0 && m === 0) return "Moins d'1 min"
  if (h === 0) return `${m} min`
  if (m === 0) return `${h}h`
  return `${h}h ${String(m).padStart(2, '0')} min`
}

export function ItineraireScreen() {
  const departure = 'Dakar'
  const arrival = 'Saint-Louis'

  const dep = resolveCity(departure)
  const arr = resolveCity(arrival)
  const distance = calcDistance(dep.lat, dep.lng, arr.lat, arr.lng)

  const mapUrl = useMemo(() => {
    const token = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    if (token) {
      return `https://www.google.com/maps/embed/v1/directions?key=${token}&origin=${dep.lat},${dep.lng}&destination=${arr.lat},${arr.lng}&zoom=7&language=fr`
    }
    return `https://www.openstreetmap.org/export/embed.html?bbox=${Math.min(dep.lng, arr.lng) - 1},${Math.min(dep.lat, arr.lat) - 1},${Math.max(dep.lng, arr.lng) + 1},${Math.max(dep.lat, arr.lat) + 1}&layer=mapnik`
  }, [dep, arr])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 120px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '8px 0 10px', marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: 'var(--green-500)', fontSize: 14 }}>●</span> {departure}
        </span>
        <span className="material-symbols-rounded" style={{ fontSize: 18, color: 'var(--text-faint)' }}>arrow_forward</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: 'var(--red-400)', fontSize: 14 }}>●</span> {arrival}
        </span>
      </div>

      <div style={{ flex: 1, borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-subtle)', minHeight: 300 }}>
        <iframe
          title="Itinéraire"
          src={mapUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <div style={{ marginTop: 12 }}>
        <Card padding="lg">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span className="material-symbols-rounded" style={{ fontSize: 20, color: 'var(--teal-500)' }}>route</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text-strong)' }}>
              Détails du trajet
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
              <span style={{ color: 'var(--text-muted)' }}>Distance</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-strong)' }}>
                {distance < 0.1 ? '-- km' : `${distance.toFixed(1)} km`}
              </span>
            </div>
            <div style={{ height: 1, background: 'var(--border-subtle)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
              <span style={{ color: 'var(--text-muted)' }}>Durée estimée</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-strong)' }}>
                {distance < 0.1 ? '--' : formatDuration(distance)}
              </span>
            </div>
            <div style={{ height: 1, background: 'var(--border-subtle)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
              <span style={{ color: 'var(--text-muted)' }}>Départ</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-strong)' }}>{departure}</span>
            </div>
            <div style={{ height: 1, background: 'var(--border-subtle)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
              <span style={{ color: 'var(--text-muted)' }}>Arrivée</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-strong)' }}>{arrival}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
