import { beforeEach, afterEach, it, expect } from 'vitest'
import { render, screen, act, cleanup } from '@testing-library/react'
import { OfflineHistoryRecorder, OfflineHistory } from './OfflineHistory'
import { readHistory } from './history-store'
import { useAuthStore } from '@/store/auth'
import { queryClient } from '@/lib/queryClient'
import type { User } from '@/lib/api/types'
beforeEach(() => {
  localStorage.clear()
  queryClient.clear()
  useAuthStore.setState({
    user: { id: 'client-a', fullName: 'Client A', role: 'client' } as User,
    sessionId: 'a',
  })
})
afterEach(cleanup)
it('sauvegarde un historique minimal et jamais un GPS ou code de remise', () => {
  render(<OfflineHistoryRecorder />)
  act(() => {
    queryClient.setQueryData(['client', 'parcels', {}], {
      parcels: [
        {
          id: 'p1',
          trackingNumber: 'PC-001',
          status: 'delivered',
          departureZoneName: 'Dakar',
          arrivalZoneName: 'Thiès',
          price: 1000,
          deliveryCode: 'SECRET',
          receiverPhone: 'PRIVATE',
        },
      ],
    })
    queryClient.setQueryData(['journeys', 'live'], { latitude: 14.7 })
  })
  const saved = localStorage.getItem('procolis-offline-history:client-a')!
  expect(saved).toContain('PC-001')
  expect(saved).not.toMatch(/SECRET|PRIVATE|latitude/)
  expect(readHistory('client-b')).toBeNull()
})
it('affiche la copie hors ligne puis l’efface à la déconnexion', () => {
  localStorage.setItem(
    'procolis-offline-history:client-a',
    JSON.stringify({
      savedAt: new Date().toISOString(),
      entries: [
        {
          id: 'p1',
          trackingNumber: 'PC-001',
          status: 'delivered',
          departure: 'Dakar',
          arrival: 'Thiès',
        },
      ],
    }),
  )
  render(<OfflineHistory />)
  expect(screen.getByText('PC-001')).toBeInTheDocument()
  act(() => useAuthStore.getState().clearSession())
  expect(readHistory('client-a')).toBeNull()
  expect(screen.queryByText('PC-001')).not.toBeInTheDocument()
})
it('vide le cache métier au changement de session', () => {
  queryClient.setQueryData(['client', 'parcels'], {
    parcels: [{ id: 'private' }],
  })
  act(() => useAuthStore.setState({ sessionId: 'b' }))
  expect(queryClient.getQueryData(['client', 'parcels'])).toBeUndefined()
})
