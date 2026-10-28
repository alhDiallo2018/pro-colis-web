import { beforeEach, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Schedule } from './domain'
import { RoutePlanner } from './RoutePlanner'
import { useAuthStore } from '@/store/auth'
import { api, ApiError } from '@/lib/api/client'
import type { User } from '@/lib/api/types'
vi.mock('@/lib/api/client', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/client')>('@/lib/api/client')
  return { ...actual, api: { get: vi.fn(), post: vi.fn() } }
})
const template = {
  id: 'template-1',
  name: '45 · Keur Massar → Parcelles',
  data: {
    availableWeight: 100,
    proposedPrice: 1500,
    itinerary: {
      serviceType: 'shuttle',
      lineNumber: '45',
      stops: [
        { zoneId: 'a', name: 'Keur Massar', offsetMinutes: 0 },
        { zoneId: 'b', name: 'Parcelles', offsetMinutes: 60 },
      ],
    },
  },
}
function mount() {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <RoutePlanner />
    </QueryClientProvider>,
  )
}
beforeEach(() => {
  cleanup()
  localStorage.clear()
  vi.clearAllMocks()
  useAuthStore.setState({
    user: { id: 'driver-1', role: 'driver' } as User,
    sessionId: 'session-1',
  })
  vi.mocked(api.get).mockResolvedValue({ data: { templates: [template] } })
})
it('publie 50 départs et reprend exactement la même demande après une réponse perdue, même après réouverture', async () => {
  vi.mocked(api.post)
    .mockRejectedValueOnce(new ApiError('Réponse perdue', 'NETWORK_ERROR', 0))
    .mockResolvedValueOnce({ data: { count: 50 } })
  const view = mount()
  fireEvent.click(await screen.findByRole('button', { name: template.name }))
  fireEvent.change(screen.getByLabelText('Premier départ'), {
    target: { value: '2030-01-01T08:00' },
  })
  fireEvent.change(screen.getByLabelText('Nombre de départs (1–100)'), {
    target: { value: '50' },
  })
  fireEvent.click(screen.getByLabelText('Alterner aller et retour'))
  fireEvent.click(screen.getByRole('button', { name: 'Publier 50 départ(s)' }))
  await screen.findByText('Réponse perdue')
  expect(api.post).toHaveBeenCalledTimes(1)
  const original = vi.mocked(api.post).mock.calls[0][1] as Schedule
  expect(original.departures).toHaveLength(50)
  expect(original.proposedPrice).toBeNull()
  expect(screen.queryByLabelText('Prix (FCFA), vide : à négocier')).not.toBeInTheDocument()
  view.unmount()
  mount()
  fireEvent.click(
    await screen.findByRole('button', {
      name: 'Vérifier / reprendre la publication',
    }),
  )
  await screen.findByText('50 départ(s) publié(s).')
  expect(vi.mocked(api.post).mock.calls[1][1]).toEqual(original)
  expect(localStorage.getItem('procolis-route-schedule:driver-1')).toBeNull()
})
it('ne reprend pas la publication privée d’un autre compte', async () => {
  localStorage.setItem(
    'procolis-route-schedule:other',
    JSON.stringify({ template, payload: { requestId: 'x', departures: [] } }),
  )
  mount()
  await waitFor(() => expect(api.get).toHaveBeenCalled())
  expect(
    screen.queryByRole('button', {
      name: 'Vérifier / reprendre la publication',
    }),
  ).not.toBeInTheDocument()
  expect(api.post).not.toHaveBeenCalled()
})
