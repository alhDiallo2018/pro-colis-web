import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LocationInput, extractPlaceDetails } from './LocationInput'
import { searchPlaces, getPlace } from '@/lib/api/places'

vi.mock('@/lib/api/places', () => ({ searchPlaces: vi.fn(), getPlace: vi.fn(), reversePlace: vi.fn() }))
const prediction = (name: string) => ({ place_id: name, description: `${name}, pays`,
  structured_formatting: { main_text: name, secondary_text: 'pays' } })
beforeEach(() => { vi.useFakeTimers(); vi.resetAllMocks() })
afterEach(() => { cleanup(); vi.useRealTimers() })
const tick = () => act(() => vi.advanceTimersByTimeAsync(310))

describe('recherche mondiale', () => {
  it('cherche dès la saisie initiale puis transmet les coordonnées de la suggestion', async () => {
    vi.mocked(searchPlaces).mockResolvedValue([prediction('Tokyo')])
    vi.mocked(getPlace).mockResolvedValue({ place_id: 'Tokyo', name: 'Shibuya', address_components: [], geometry: { location: { lat: 35.66, lng: 139.7 } } })
    const onCoordinates = vi.fn()
    render(<LocationInput value="Tokyo" onChange={vi.fn()} onCoordinates={onCoordinates} />)
    await tick()
    fireEvent.click(screen.getByRole('button', { name: /Tokyo/ }))
    await act(async () => {})
    expect(onCoordinates).toHaveBeenCalledWith(35.66, 139.7, expect.objectContaining({ placeId: 'Tokyo', name: 'Shibuya' }))
    expect(vi.mocked(searchPlaces).mock.calls[0][1]).toBe(vi.mocked(getPlace).mock.calls[0][1])
  })

  it('ignore une ancienne réponse qui arrive après une nouvelle saisie', async () => {
    let finishOld!: (value: ReturnType<typeof prediction>[]) => void
    vi.mocked(searchPlaces).mockImplementationOnce(() => new Promise(resolve => { finishOld = resolve }))
      .mockResolvedValueOnce([prediction('Tokyo')])
    render(<LocationInput onChange={vi.fn()} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Paris' } })
    await tick()
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Tokyo' } })
    await tick()
    await act(async () => finishOld([prediction('Paris')]))
    expect(screen.getByRole('button', { name: /Tokyo/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Paris/ })).not.toBeInTheDocument()
  })

  it('explique un échec réseau sans prétendre à un problème de facturation', async () => {
    vi.mocked(searchPlaces).mockRejectedValue(new Error('network'))
    render(<LocationInput value="Dakar" onChange={vi.fn()} />)
    await tick()
    expect(screen.getByText(/Recherche indisponible/)).toBeInTheDocument()
  })
})

it('préfère un quartier nommé au numéro de bloc renvoyé par Google', () => {
  expect(extractPlaceDetails([
    { long_name: '27', short_name: '27', types: ['sublocality', 'sublocality_level_4'] },
    { long_name: 'Hōnan', short_name: 'Hōnan', types: ['sublocality', 'sublocality_level_2'] },
  ]).district).toBe('Hōnan')
})
