import { api } from './client'

export interface PlacePrediction {
  place_id: string
  description: string
  structured_formatting: { main_text: string; secondary_text: string }
}
export interface GeographicPlace {
  place_id?: string
  name?: string
  formatted_address?: string
  address_components: google.maps.GeocoderAddressComponent[]
  geometry: { location: { lat: number; lng: number } }
}

export async function searchPlaces(input: string, sessionToken: string): Promise<PlacePrediction[]> {
  const { data } = await api.get('/public/places/autocomplete', { params: { input, sessionToken } })
  return data.data ?? []
}
export async function getPlace(placeId: string, sessionToken: string): Promise<GeographicPlace> {
  const { data } = await api.get('/public/places/details', { params: { placeId, sessionToken } })
  return data.data
}
export async function reversePlace(latitude: number, longitude: number): Promise<GeographicPlace | null> {
  const { data } = await api.get('/public/places/reverse', { params: { latitude, longitude } })
  return data.data
}
