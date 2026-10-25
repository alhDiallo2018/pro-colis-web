import { cleanup, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { NegotiationChat } from './NegotiationChat'
import { useAuthStore } from '@/store/auth'
import { supportThread } from '@/lib/api/supportChat'
vi.mock('@/lib/api/supportChat', () => ({ supportThread: vi.fn(), supportSend: vi.fn() }))
let qc: QueryClient
beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', { configurable: true, value: vi.fn() })
  useAuthStore.setState({ user: { id: 'client', fullName: 'Client', email: null, phone: '123', role: 'client', status: 'active' } })
  qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  vi.mocked(supportThread).mockResolvedValue({
    conversation: { id: 'chat', userId: 'client', department: 'general', status: 'open', waiting: false,
      user: { id: 'client', fullName: 'Client', role: 'client' }, assignedTo: { id: 'agent2', fullName: 'Relais', role: 'support' }, lastMessage: null, lastMessageAt: '2026-10-25T10:00:00Z' },
    messages: [
      { id: 'one', senderId: 'agent1', receiverId: 'client', body: 'Première réponse', isRead: true, createdAt: '2026-10-25T10:00:00Z', sender: { id: 'agent1', fullName: 'Premier agent' } },
      { id: 'two', senderId: 'agent2', receiverId: 'client', body: 'Reprise du dossier', isRead: true, createdAt: '2026-10-25T10:01:00Z', sender: { id: 'agent2', fullName: 'Relais' } },
    ],
  })
})
afterEach(() => { cleanup(); qc.clear(); useAuthStore.setState({ user: null }) })
function mount(readOnly = false) {
  render(<QueryClientProvider client={qc}><NegotiationChat peerId="client" peerName="Support" supportConversationId="chat" readOnly={readOnly} /></QueryClientProvider>)
}
it('conserve les auteurs après transfert et masque les propositions tarifaires', async () => {
  mount()
  expect(await screen.findByText('Premier agent')).toBeInTheDocument()
  expect(screen.getByText('Relais')).toBeInTheDocument()
  expect(screen.getByRole('textbox')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Proposer un prix' })).not.toBeInTheDocument()
})
it('un agent en supervision lit l’historique sans compositeur ni actions média', async () => {
  mount(true)
  expect(await screen.findByText('Reprise du dossier')).toBeInTheDocument()
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Envoyer une photo' })).not.toBeInTheDocument()
})
