import { beforeEach, afterEach, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react'
import { JourneySharing } from './JourneySharing'
import { api } from '@/lib/api/client'
import { useAuthStore } from '@/store/auth'
vi.mock('@/lib/api/client', () => ({
  api: { post: vi.fn(), patch: vi.fn(), delete: vi.fn(), put: vi.fn() },
}))
let callback: PositionCallback
beforeEach(() => {
  vi.clearAllMocks()
  useAuthStore.setState({ sessionId: 'driver-session' })
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: {
      watchPosition: vi.fn((fn) => {
        callback = fn
        return 7
      }),
      clearWatch: vi.fn(),
    },
  })
  Object.defineProperty(document, 'hidden', {
    configurable: true,
    value: false,
  })
  vi.mocked(api.post).mockResolvedValue({ data: { sessionId: 'gps-session' } })
  vi.mocked(api.delete).mockResolvedValue({ data: {} })
})
afterEach(cleanup)
it('attend le consentement et une vraie mesure, lie le GPS au départ puis arrête en arrière-plan', async () => {
  render(<JourneySharing advertisementId="departure-1" />)
  expect(navigator.geolocation.watchPosition).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Activer mon partage GPS' }))
  expect(api.post).not.toHaveBeenCalled()
  const timestamp = Date.now()
  await act(async () =>
    callback({
      timestamp,
      coords: { latitude: 14.7, longitude: -17.4, accuracy: 12 },
    } as GeolocationPosition),
  )
  expect(api.post).toHaveBeenCalledWith(
    '/advertisements/ departure-1/live'.replace(' ', ''),
    expect.objectContaining({
      capturedAt: new Date(timestamp).toISOString(),
      enabled: true,
    }),
  )
  Object.defineProperty(document, 'hidden', {
    configurable: true,
    value: true,
  })
  fireEvent(document, new Event('visibilitychange'))
  await waitFor(() =>
    expect(api.delete).toHaveBeenCalledWith('/advertisements/departure-1/live', {
      data: { sessionId: 'gps-session' },
    }),
  )
  expect(navigator.geolocation.clearWatch).toHaveBeenCalledWith(7)
})
it('ne publie pas un point acquis dans une session précédente', async () => {
  render(<JourneySharing advertisementId="departure-1" />)
  fireEvent.click(screen.getByRole('button', { name: 'Activer mon partage GPS' }))
  const old = callback
  act(() => useAuthStore.setState({ sessionId: 'other' }))
  await act(async () =>
    old({
      timestamp: Date.now(),
      coords: { latitude: 14.7, longitude: -17.4, accuracy: 12 },
    } as GeolocationPosition),
  )
  expect(api.post).not.toHaveBeenCalled()
})
