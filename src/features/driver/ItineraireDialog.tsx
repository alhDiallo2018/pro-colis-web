import { Button, Dialog } from '@/ds'
import type { Parcel } from '@/lib/api/types'

interface ItineraireDialogProps {
  parcel: Parcel | null
  open: boolean
  onClose: () => void
}

const GARAGE_COORDS: Record<string, [number, number]> = {
  Dakar: [14.7167, -17.4677],
  Thies: [14.7910, -16.9359],
  Mbour: [14.4167, -16.9667],
  Touba: [14.8667, -15.8833],
  'Saint-Louis': [16.0333, -16.5000],
}

const ROUTE_ESTIMATES: Record<string, Record<string, { distance: string; duration: string }>> = {
  Dakar: {
    Thies: { distance: '72 km', duration: '1 h 15 min' },
    Mbour: { distance: '83 km', duration: '1 h 30 min' },
    Touba: { distance: '194 km', duration: '3 h' },
    'Saint-Louis': { distance: '260 km', duration: '3 h 45 min' },
  },
}

function buildMapHtml(fromLabel: string, fromCoord: [number, number] | undefined, toLabel: string, toCoord: [number, number] | undefined) {
  const fl = fromCoord
  const tl = toCoord
  const mlat = fl && tl ? (fl[0] + tl[0]) / 2 : 14.75
  const mlng = fl && tl ? (fl[1] + tl[1]) / 2 : -17.2
  const fLat = fl?.[0] ?? 14.7167
  const fLng = fl?.[1] ?? -17.4677
  const tLat = tl?.[0] ?? 14.791
  const tLng = tl?.[1] ?? -16.9359

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9/dist/leaflet.js"></script>
<style>*{margin:0;padding:0}html,body,#map{width:100%;height:100%;font-family:sans-serif}</style>
</head>
<body>
<div id="map"></div>
<script>
var map = L.map('map', { attributionControl: false, zoomControl: true }).setView([${mlat},${mlng}], 10);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);

var depIcon = L.divIcon({ html: '<div style="background:#0D9488;color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;box-shadow:0 2px 8px rgba(0,0,0,.3)">D</div>', className: '', iconSize: [28, 28], iconAnchor: [14, 14] });
var arrIcon = L.divIcon({ html: '<div style="background:#EF4444;color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;box-shadow:0 2px 8px rgba(0,0,0,.3)">A</div>', className: '', iconSize: [28, 28], iconAnchor: [14, 14] });

L.marker([${fLat},${fLng}], { icon: depIcon }).addTo(map).bindPopup('${fromLabel}');
L.marker([${tLat},${tLng}], { icon: arrIcon }).addTo(map).bindPopup('${toLabel}');

L.polyline([[${fLat},${fLng}],[${tLat},${tLng}]], { color: '#0D9488', weight: 3, opacity: 0.7, dashArray: '10 6' }).addTo(map);

map.fitBounds([[${fLat},${fLng}],[${tLat},${tLng}]], { padding: [40, 40] });
</script>
</body>
</html>`
}

export function ItineraireDialog({ parcel, open, onClose }: ItineraireDialogProps) {
  if (!open || !parcel) return null

  const from = parcel.departureCity ?? parcel.departureGarageName ?? 'Depart'
  const to = parcel.arrivalCity ?? parcel.arrivalGarageName ?? 'Arrivee'
  const fromCoord = GARAGE_COORDS[from]
  const toCoord = GARAGE_COORDS[to]
  const estimates = ROUTE_ESTIMATES[from]?.[to] ?? { distance: '—', duration: '—' }

  return (
    <Dialog
      open
      onClose={onClose}
      icon="route"
      iconTone="primary"
      title="Itineraire"
      style={{ width: 'min(600px, 94vw)' }}
      actions={
        <Button variant="secondary" block onClick={onClose}>
          Fermer
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <iframe
          srcDoc={buildMapHtml(from, fromCoord, to, toCoord)}
          style={{ width: '100%', height: 340, border: 'none', borderRadius: 'var(--radius-md)', background: 'var(--slate-100)' }}
          title="Carte itineraire"
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-strong)' }}>{from}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Depart</div>
          </div>
          <div style={{ flex: 'none', textAlign: 'center', minWidth: 80 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: 'var(--text-body)' }}>{estimates.distance}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{estimates.duration}</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-strong)' }}>{to}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Arrivee</div>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
