import { useId, useState, useRef, useEffect, useMemo } from 'react'
import type { CSSProperties, ChangeEvent } from 'react'
import { Button, Icon, Input } from '@/ds'

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
  required?: boolean
  style?: CSSProperties
  showGeolocate?: boolean
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
      const found = components.find((c) => c.types.includes(type))
      if (found) return found.long_name
    }
    return undefined
  }
  return {
    city: pick(COMPONENT_TYPES.city),
    region: pick(COMPONENT_TYPES.region),
    country: pick(COMPONENT_TYPES.country),
  }
}

let googleLoading = false
const onLoadQueue: Array<() => void> = []

function loadGoogleMaps(): Promise<void> {
  if (window.google?.maps?.places) {
    return Promise.resolve()
  }
  if (googleLoading) {
    return new Promise((resolve) => onLoadQueue.push(resolve))
  }
  if (!GOOGLE_API_KEY) return Promise.resolve()

  googleLoading = true
  return new Promise((resolve) => {
    onLoadQueue.push(resolve)
    if (document.querySelector('script[src*="maps.googleapis.com"]')) return

    window.initGoogleMapsCallback = () => {
      googleLoading = false
      onLoadQueue.forEach((cb) => cb())
      onLoadQueue.length = 0
      delete window.initGoogleMapsCallback
    }

    const script = document.createElement('script')
    script.src = `${PLACES_LIBRARY_URL}?key=${GOOGLE_API_KEY}&libraries=places&callback=initGoogleMapsCallback`
    script.async = true
    script.defer = true
    document.head.appendChild(script)
  })
}

function debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number): (...args: A) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: A) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
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
  style,
  showGeolocate = true,
}: LocationInputProps) {
  const id = useId()
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState<PlaceResult[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [locating, setLocating] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [, setMapsReady] = useState(false)

  const wrapperRef = useRef<HTMLDivElement>(null)
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null)
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null)
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null)
  const billingWarnedRef = useRef(false)

  useEffect(() => {
    loadGoogleMaps().then(() => {
      if (window.google?.maps?.places) {
        const token = new google.maps.places.AutocompleteSessionToken()
        sessionTokenRef.current = token
        autocompleteServiceRef.current = new google.maps.places.AutocompleteService()
        const dummy = document.createElement('div')
        placesServiceRef.current = new google.maps.places.PlacesService(dummy)
        setMapsReady(true)
      }
    })
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fetchSuggestions = useMemo(
    () => debounce((q: string) => {
      if (!q || !autocompleteServiceRef.current) {
        setSuggestions([])
        return
      }
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: q,
          sessionToken: sessionTokenRef.current!,
          componentRestrictions: undefined,
        },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            setSuggestions(
              results.slice(0, 6).map((r) => ({
                description: r.description,
                placeId: r.place_id,
                mainText: r.structured_formatting?.main_text ?? r.description.split(',')[0],
                secondaryText: r.structured_formatting?.secondary_text ?? r.description.split(',').slice(1).join(',').trim(),
              })),
            )
            setShowSuggestions(true)
          } else {
            if (status === google.maps.places.PlacesServiceStatus.REQUEST_DENIED && !billingWarnedRef.current) {
              billingWarnedRef.current = true
              setGeoError('API Google Maps : billing non activé sur le projet Google Cloud.')
            }
            setSuggestions([])
          }
        },
      )
    }, 300),
    [],
  )

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setQuery(v)
    onChange(v)
    fetchSuggestions(v)
    setGeoError(null)
  }

  const handleSelectSuggestion = (place: PlaceResult) => {
    setQuery(place.description)
    setSuggestions([])
    setShowSuggestions(false)
    onChange(place.description, place)

    if (placesServiceRef.current && onCoordinates) {
      placesServiceRef.current.getDetails(
        { placeId: place.placeId, fields: ['geometry', 'address_components', 'formatted_address'] },
        (result, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && result?.geometry?.location) {
            onCoordinates(result.geometry.location.lat(), result.geometry.location.lng(), {
              ...extractPlaceDetails(result.address_components),
              placeId: place.placeId,
              formattedAddress: result.formatted_address ?? place.description,
            })
          }
        },
      )
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
    if (!navigator.geolocation) {
      setGeoError('Géolocalisation non supportée par ce navigateur.')
      return
    }
    setLocating(true)
    setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setLocating(false)
        const { latitude, longitude } = position.coords
        let details: PlaceDetails | undefined

        if (placesServiceRef.current) {
          try {
            const geocoder = new google.maps.Geocoder()
            const geocodeResult = await geocoder.geocode({
              location: { lat: latitude, lng: longitude },
            })
            if (geocodeResult.results.length > 0) {
              const first = geocodeResult.results[0]
              const addr = buildAddress(first.address_components) ?? first.formatted_address
              details = {
                ...extractPlaceDetails(first.address_components),
                placeId: first.place_id,
                formattedAddress: first.formatted_address,
              }
              setQuery(addr)
              onChange(addr, {
                description: addr,
                placeId: first.place_id,
                mainText: addr.split(',')[0],
                secondaryText: addr.split(',').slice(1).join(',').trim(),
              })
            } else {
              if (!billingWarnedRef.current) {
                billingWarnedRef.current = true
                setGeoError('API Google Maps : billing non activé sur le projet Google Cloud.')
              }
              const fallback = 'Position actuelle'
              setQuery(fallback)
              onChange(fallback)
            }
          } catch {
            if (!billingWarnedRef.current) {
              billingWarnedRef.current = true
              setGeoError('API Google Maps : billing non activé sur le projet Google Cloud.')
            }
            const fallback = 'Position actuelle'
            setQuery(fallback)
            onChange(fallback)
          }
        } else {
          const fallback = 'Position actuelle'
          setQuery(fallback)
          onChange(fallback)
        }

        onCoordinates?.(latitude, longitude, details)
      },
      (err) => {
        setLocating(false)
        switch (err.code) {
          case err.PERMISSION_DENIED: setGeoError('Accès à la position refusé.'); break
          case err.POSITION_UNAVAILABLE: setGeoError('Position indisponible.'); break
          case err.TIMEOUT: setGeoError('Délai de géolocalisation dépassé.'); break
          default: setGeoError('Erreur de géolocalisation.')
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    )
  }

  const fallbackMode = !GOOGLE_API_KEY

  return (
    <div ref={wrapperRef} style={{ position: 'relative', ...style }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <Input
            id={id}
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
        {showGeolocate && !fallbackMode && (
          <Button
            variant="ghost"
            size="sm"
            icon="my_location"
            loading={locating}
            onClick={handleGeolocate}
            title="Utiliser ma position actuelle"
            style={{ flexShrink: 0, height: 48, width: 48, minWidth: 48, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          />
        )}
      </div>

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
            <span style={{ width: 130, height: 1, background: 'var(--border-subtle)' }} />
            <img src="https://maps.gstatic.com/consumer/images/icons/2x/powered-by-google-on-white.png" alt="" style={{ height: 12 }} />
            <span style={{ width: 130, height: 1, background: 'var(--border-subtle)' }} />
          </div>
        </div>
      )}
    </div>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export { loadGoogleMaps }
