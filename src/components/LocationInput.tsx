import { useId, useState, useRef, useEffect } from 'react'
import type { CSSProperties, ChangeEvent } from 'react'
import { Button, Icon, Input } from '@/ds'
import { searchPlaces, getPlace, reversePlace } from '@/lib/api/places'

declare global {
  interface Window {
    google?: typeof google
    initGoogleMapsCallback?: () => void
  }
}

const PLACES_LIBRARY_URL = 'https://maps.googleapis.com/maps/api/js'
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

export interface PlaceResult {
  description: string
  placeId: string
  mainText: string
  secondaryText: string
}

/** Découpage administratif d'un lieu, extrait des `address_components` Google. */
export interface PlaceDetails {
  placeId?: string
  name?: string
  district?: string
  exactPoint?: boolean
  formattedAddress?: string
  city?: string
  region?: string
  country?: string
}

export interface LocationInputProps {
  label?: string
  placeholder?: string
  icon?: string
  value?: string
  onChange: (value: string, place?: PlaceResult) => void
  /**
   * Appelé dès que le lieu est résolu en coordonnées. `details` porte le
   * découpage administratif (ville / région / pays) : sans lui, les zones
   * créées à la volée arrivent sans ville et deviennent illisibles dans les
   * sélecteurs de trajet.
   */
  onCoordinates?: (lat: number, lng: number, details?: PlaceDetails) => void
  error?: string
  disabled?: boolean
  autoFocus?: boolean
  required?: boolean
  style?: CSSProperties
  showGeolocate?: boolean
  onResolving?: (busy: boolean) => void
}

const COMPONENT_TYPES = {
  city: ['locality', 'postal_town', 'administrative_area_level_2'],
  region: ['administrative_area_level_1'],
  country: ['country'],
} as const

/** Extrait ville / région / pays d'une liste de composants d'adresse Google. */
// eslint-disable-next-line react-refresh/only-export-components
export function extractPlaceDetails(
  components: google.maps.GeocoderAddressComponent[] | undefined,
): PlaceDetails {
  if (!components) return {}
  const pick = (types: readonly string[]) => {
    // Les types sont classés du plus précis au plus large : on garde le premier
    // qui matche pour éviter qu'un département écrase une ville.
    for (const type of types) {
      // Certains pays exposent un numéro de bloc comme sous-localité.
      const found = components.find((c) => c.types.includes(type) && !/^\d+$/.test(c.long_name.trim()))
      if (found) return found.long_name
    }
    return undefined
  }
  return {
    district: pick(['neighborhood', 'sublocality_level_1', 'sublocality_level_2', 'sublocality']),
    city: pick(COMPONENT_TYPES.city),
    region: pick(COMPONENT_TYPES.region),
    country: pick(COMPONENT_TYPES.country),
  }
}

let mapsPromise: Promise<void> | undefined

/** Une seule charge du SDK ; une erreur réseau finit la promesse et permet
 * une nouvelle tentative au prochain montage, au lieu de bloquer la carte. */
function loadGoogleMaps(): Promise<void> {
  if (window.google?.maps?.Map) return Promise.resolve()
  if (mapsPromise) return mapsPromise
  if (!GOOGLE_API_KEY) return Promise.reject(new Error('Carte non configurée'))
  mapsPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    const timer = setTimeout(() => finish(new Error('Chargement de la carte expiré')), 15000)
    const finish = (error?: Error) => {
      clearTimeout(timer)
      delete window.initGoogleMapsCallback
      if (error) { script.remove(); mapsPromise = undefined; reject(error) }
      else resolve()
    }
    window.initGoogleMapsCallback = () => finish()
    script.onerror = () => finish(new Error('Carte indisponible'))
    script.src = `${PLACES_LIBRARY_URL}?key=${encodeURIComponent(GOOGLE_API_KEY)}&loading=async&callback=initGoogleMapsCallback&language=fr`
    script.async = true
    document.head.appendChild(script)
  })
  return mapsPromise
}

export function LocationInput({
  label,
  placeholder = 'Rechercher une adresse ou une ville...',
  icon = 'location_on',
  value = '',
  onChange,
  onCoordinates,
  error,
  disabled = false,
  autoFocus = false,
  required = false,
  style,
  showGeolocate = true,
  onResolving,
}: LocationInputProps) {
  const id = useId()
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState<PlaceResult[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [locating, setLocating] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [searchEnabled, setSearchEnabled] = useState(Boolean(value))
  const wrapperRef = useRef<HTMLDivElement>(null)
  const sessionTokenRef = useRef(crypto.randomUUID())
  const generationRef = useRef(0)
  const searchGenerationRef = useRef(0)

  useEffect(() => {
    if (value !== query) { setQuery(value); setSearchEnabled(Boolean(value)) }
  }, [value])
  useEffect(() => () => { generationRef.current++; searchGenerationRef.current++ }, [])

  useEffect(() => {
    const generation = ++searchGenerationRef.current
    setSuggestions([])
    setSearched(false)
    if (!searchEnabled || query.trim().length < 2) { setSearching(false); return }
    setSearching(true)
    // Le numéro de génération invalide aussi les requêtes déjà parties : un
    // résultat ancien ne peut pas écraser une saisie ou un choix plus récent.
    const timer = setTimeout(async () => {
      try {
        const results = await searchPlaces(query.trim(), sessionTokenRef.current)
        if (generation !== searchGenerationRef.current) return
        setSuggestions(results.map(r => ({ description: r.description, placeId: r.place_id,
          mainText: r.structured_formatting.main_text, secondaryText: r.structured_formatting.secondary_text })))
        setShowSuggestions(true)
        setSearched(true)
      } catch {
        if (generation === searchGenerationRef.current) setGeoError('Recherche indisponible. Réessayez ou choisissez un point sur la carte.')
      } finally {
        if (generation === searchGenerationRef.current) setSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, searchEnabled])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    generationRef.current++
    searchGenerationRef.current++
    setLocating(false)
    setQuery(e.target.value)
    setSearchEnabled(true)
    onChange(e.target.value)
    onResolving?.(false)
    setGeoError(null)
  }

  const handleSelectSuggestion = async (place: PlaceResult) => {
    searchGenerationRef.current++
    setSearchEnabled(false)
    setQuery(place.description)
    setSuggestions([])
    setShowSuggestions(false)
    onChange(place.description, place)
    onResolving?.(true)
    // Les détails ont leur propre génération, indépendante des suggestions.
    const generation = ++generationRef.current
    try {
      const result = await getPlace(place.placeId, sessionTokenRef.current)
      if (generation !== generationRef.current) return
      const location = result.geometry?.location
      if (!location || !Number.isFinite(location.lat) || !Number.isFinite(location.lng)) throw new Error('Lieu sans coordonnées')
      onCoordinates?.(location.lat, location.lng, {
        ...extractPlaceDetails(result.address_components), name: result.name ?? place.mainText,
        placeId: place.placeId, formattedAddress: result.formatted_address ?? place.description,
      })
      sessionTokenRef.current = crypto.randomUUID()
    } catch {
      if (generation === generationRef.current) setGeoError('Impossible de localiser ce lieu. Réessayez ou choisissez-le sur la carte.')
    } finally {
      if (generation === generationRef.current) onResolving?.(false)
    }
  }

  const buildAddress = (components: google.maps.GeocoderAddressComponent[]) => {
    const parts: string[] = []
    const routeTypes = ['route', 'street_number', 'neighborhood', 'sublocality']
    const cityTypes = ['locality', 'postal_town']
    const isType = (c: google.maps.GeocoderAddressComponent, t: string) => c.types.includes(t)

    for (const c of components) {
      if (isType(c, 'plus_code')) continue
      if (routeTypes.some((t) => isType(c, t))) {
        if (parts.length === 0) parts.push(c.long_name)
      }
    }
    for (const c of components) {
      if (isType(c, 'plus_code')) continue
      if (cityTypes.some((t) => isType(c, t))) {
        parts.push(c.long_name)
        break
      }
    }
    for (const c of components) {
      if (isType(c, 'country')) {
        parts.push(c.long_name)
        break
      }
    }
    return parts.length > 0 ? parts.join(', ') : undefined
  }

  const handleGeolocate = () => {
    if (!navigator.geolocation) { setGeoError('Géolocalisation non supportée.'); return }
    setSearchEnabled(false)
    setLocating(true)
    setGeoError(null)
    onResolving?.(true)
    const generation = ++generationRef.current
    navigator.geolocation.getCurrentPosition(async position => {
      const { latitude, longitude } = position.coords
      try {
        const first = await reversePlace(latitude, longitude)
        if (generation !== generationRef.current) return
        const addr = first ? buildAddress(first.address_components) ?? first.formatted_address : undefined
        if (addr) { setQuery(addr); onChange(addr) }
        onCoordinates?.(latitude, longitude, first ? {
          ...extractPlaceDetails(first.address_components), exactPoint: true,
          placeId: first.place_id, formattedAddress: first.formatted_address,
        } : { exactPoint: true })
      } catch {
        if (generation === generationRef.current) setGeoError('Adresse introuvable. Choisissez un point sur la carte.')
      } finally {
        if (generation === generationRef.current) { setLocating(false); onResolving?.(false) }
      }
    }, err => {
      if (generation !== generationRef.current) return
      setLocating(false)
      onResolving?.(false)
      setGeoError(err.code === 1 ? 'Accès à la position refusé.' : 'Position indisponible. Réessayez.')
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 })
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative', ...style }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <Input
            id={id}
            autoFocus={autoFocus}
            required={required}
            label={label}
            icon={icon}
            placeholder={placeholder}
            value={query}
            onChange={handleInputChange}
            onFocus={() => { if (suggestions.length) setShowSuggestions(true) }}
            error={error || geoError}
            disabled={disabled}
            autoComplete="off"
          />
        </div>
        {showGeolocate && (
          <Button
            variant="ghost"
            size="sm"
            icon="my_location"
            disabled={disabled || locating}
            loading={locating}
            onClick={handleGeolocate}
            title="Utiliser ma position actuelle"
            style={{ flexShrink: 0, height: 48, width: 48, minWidth: 48, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          />
        )}
      </div>

      {searching && <p role="status" style={{ fontSize: 12 }}>Recherche dans le monde entier…</p>}
      {searched && !searching && !suggestions.length && <p role="status" style={{ fontSize: 12 }}>Aucun lieu trouvé. Précisez la ville ou le pays, ou touchez la carte.</p>}
      {showSuggestions && suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            background: 'var(--surface-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            marginTop: 4,
            maxHeight: 280,
            overflowY: 'auto',
          }}
        >
          {suggestions.map((s) => (
            <button
              key={s.placeId}
              type="button"
              onClick={() => handleSelectSuggestion(s)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                borderBottom: '1px solid var(--border-subtle)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-sunken)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <Icon name="location_on" size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--text-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.mainText}
                </div>
                {s.secondaryText && (
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.secondaryText}
                  </div>
                )}
              </div>
            </button>
          ))}
          <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ flex: 1, minWidth: 0, height: 1, background: 'var(--border-subtle)' }} />
            <img src="https://maps.gstatic.com/consumer/images/icons/2x/powered-by-google-on-white.png" alt="" style={{ flex: 'none', height: 12 }} />
            <span style={{ flex: 1, minWidth: 0, height: 1, background: 'var(--border-subtle)' }} />
          </div>
        </div>
      )}
    </div>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export { loadGoogleMaps }
