import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { GarageSearchSelect } from './GarageSearchSelect'
import { searchPlaces, getPlace } from '@/lib/api/places'
import { resolveZone } from '@/lib/api/zones'
vi.mock('@/lib/api/places', () => ({ searchPlaces: vi.fn(), getPlace: vi.fn(), reversePlace: vi.fn() }))
vi.mock('@/lib/api/zones', () => ({ resolveZone: vi.fn() }))
vi.mock('./MapPicker', () => ({ MapPicker: () => <div>Carte</div> }))
afterEach(() => { cleanup(); vi.useRealTimers() })
it('la barre principale recherche dans le monde et confirme la zone choisie', async () => {
  vi.useFakeTimers()
  vi.mocked(searchPlaces).mockResolvedValue([{ place_id: 'tokyo', description: 'Tokyo, Japon', structured_formatting: { main_text: 'Tokyo', secondary_text: 'Japon' } }])
  vi.mocked(getPlace).mockResolvedValue({ place_id: 'tokyo', name: 'Tokyo', formatted_address: 'Tokyo, Japon', address_components: [], geometry: { location: { lat: 35.6, lng: 139.7 } } })
  const onChange = vi.fn()
  const onAddNew = vi.fn()
  vi.mocked(resolveZone).mockResolvedValue({ zone: { id: 'zone-tokyo', name: 'Tokyo' } as never, created: true })
  render(<GarageSearchSelect zones={[]} onChange={onChange} onAddNew={onAddNew} />)
  fireEvent.click(screen.getByText('Rechercher une zone...'))
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Tokyo' } })
  await act(() => vi.advanceTimersByTimeAsync(310))
  fireEvent.click(screen.getByRole('button', { name: /Tokyo Japon/ }))
  await act(async () => {})
  expect(screen.getByText('Choisir un lieu')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /Utiliser cette zone/ }))
  await act(async () => {})
  expect(resolveZone).toHaveBeenCalledWith(expect.objectContaining({ placeId: 'tokyo', latitude: 35.6, longitude: 139.7 }))
  expect(onChange).toHaveBeenCalledWith('zone-tokyo')
  expect(onAddNew).toHaveBeenCalledWith(expect.objectContaining({ id: 'zone-tokyo' }))
})
