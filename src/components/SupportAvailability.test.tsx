import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { SupportAvailability } from './SupportAvailability'
import { useAuthStore } from '@/store/auth'
import { heartbeat } from '@/lib/api/supportChat'
vi.mock('@/lib/api/supportChat', () => ({ heartbeat: vi.fn(), SUPPORT_ROLES: ['support', 'support_commercial', 'support_technique', 'super_admin'] }))
const agent = { id: 'agent', fullName: 'Support', role: 'support' as const, email: null, phone: '123', status: 'active' as const }
beforeEach(() => {
  vi.clearAllMocks(); vi.mocked(heartbeat).mockResolvedValue()
  useAuthStore.setState({ user: agent })
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
})
afterEach(() => { cleanup(); useAuthStore.setState({ user: null }) })
it('publie la disponibilité puis libère les demandes quand l’onglet est caché', async () => {
  render(<SupportAvailability />)
  await waitFor(() => expect(heartbeat).toHaveBeenLastCalledWith(expect.any(String), true))
  const id = vi.mocked(heartbeat).mock.calls[0][0]
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' })
  act(() => document.dispatchEvent(new Event('visibilitychange')))
  await waitFor(() => expect(heartbeat).toHaveBeenLastCalledWith(id, false))
})
it('permet de passer indisponible explicitement', async () => {
  const user = userEvent.setup(); render(<SupportAvailability />)
  await user.click(screen.getByRole('button', { name: 'Me rendre indisponible' }))
  await waitFor(() => expect(heartbeat).toHaveBeenLastCalledWith(expect.any(String), false))
})
it('n’annonce pas une présence confirmée quand le serveur refuse', async () => {
  vi.mocked(heartbeat).mockRejectedValue(new Error('offline'))
  render(<SupportAvailability />)
  expect(await screen.findByRole('status')).toHaveTextContent(/Présence non confirmée/)
})
it('un client ne publie aucune présence support', () => {
  useAuthStore.setState({ user: { ...agent, role: 'client' } })
  render(<SupportAvailability />)
  expect(heartbeat).not.toHaveBeenCalled()
})
