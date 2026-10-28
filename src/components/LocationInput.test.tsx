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
  it('cherche uniquement pendant la saisie puis transmet les coordonnées du choix', async () => {
    vi.mocked(searchPlaces).mockResolvedValue([prediction('Tokyo')])
    vi.mocked(getPlace).mockResolvedValue({ place_id: 'Tokyo', name: 'Shibuya', address_components: [], geometry: { location: { lat: 35.66, lng: 139.7 } } })
    const onCoordinates = vi.fn()
    render(<LocationInput onChange={vi.fn()} onCoordinates={onCoordinates} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Tokyo' } })
    await tick()
    fireEvent.click(screen.getByRole('button', { name: /Tokyo/ }))
    await act(async () => {})
    expect(onCoordinates).toHaveBeenCalledWith(35.66, 139.7, expect.objectContaining({ placeId: 'Tokyo', name: 'Shibuya' }))
    expect(vi.mocked(searchPlaces).mock.calls[0][1]).toBe(vi.mocked(getPlace).mock.calls[0][1])
  })

  it('ne recherche pas une adresse enregistrée, même au focus', async () => {
    const onChange = vi.fn()
    render(<LocationInput value="Dakar, Sénégal" onChange={onChange} />)
    fireEvent.focus(screen.getByRole('textbox'))
    await tick()
    expect(searchPlaces).not.toHaveBeenCalled()
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('textbox')).toHaveValue('Dakar, Sénégal')
  })

  it('annule une recherche quand une adresse enregistrée remplace le texte', async () => {
    let finish!: (value: ReturnType<typeof prediction>[]) => void
    vi.mocked(searchPlaces).mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
    const onChange = vi.fn()
    const view = render(<LocationInput value="" onChange={onChange} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Paris' } })
    await tick()
    view.rerender(<LocationInput value="Thiès, Sénégal" onChange={onChange} />)
    await act(async () => finish([prediction('Paris')]))
    await tick()
    expect(searchPlaces).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('textbox')).toHaveValue('Thiès, Sénégal')
    expect(screen.queryByRole('button', { name: /Paris/ })).not.toBeInTheDocument()
  })

  it('ne rouvre pas la liste après un choix confirmé puis un nouveau focus', async () => {
    vi.mocked(searchPlaces).mockResolvedValue([prediction('Dakar')])
    vi.mocked(getPlace).mockResolvedValue({ geometry:{location:{lat:14.7,lng:-17.4}}, address_components:[] })
    const onChange=vi.fn()
    const view=render(<LocationInput value="" onChange={onChange} />)
    fireEvent.change(screen.getByRole('textbox'), {target:{value:'Dakar'}})
    view.rerender(<LocationInput value="Dakar" onChange={onChange} />)
    await tick()
    fireEvent.click(screen.getByRole('button', {name:/Dakar/}))
    view.rerender(<LocationInput value="Dakar, pays" onChange={onChange} />)
    fireEvent.blur(screen.getByRole('textbox'))
    fireEvent.focus(screen.getByRole('textbox'))
    await tick()
    expect(searchPlaces).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', {name:/Dakar/})).not.toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveValue('Dakar, pays')
  })

  it('une réponse tardive ne rouvre pas la liste après avoir quitté le champ', async () => {
    let finish!: (value: ReturnType<typeof prediction>[]) => void
    vi.mocked(searchPlaces).mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
    render(<LocationInput onChange={vi.fn()} />)
    fireEvent.change(screen.getByRole('textbox'), {target:{value:'Paris'}})
    await tick()
    fireEvent.blur(screen.getByRole('textbox'))
    await act(async()=>finish([prediction('Paris')]))
    expect(screen.queryByRole('button', {name:/Paris/})).not.toBeInTheDocument()
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
    render(<LocationInput onChange={vi.fn()} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Dakar' } })
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
