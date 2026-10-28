import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { NegotiationChat } from './NegotiationChat'
import { useAuthStore } from '@/store/auth'
import { supportSend, supportThread } from '@/lib/api/supportChat'
vi.mock('@/lib/api/supportChat', () => ({ supportThread: vi.fn(), supportSend: vi.fn() }))
let qc: QueryClient
beforeEach(() => {
  vi.mocked(supportSend).mockReset()
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

it('conserve le texte après échec et réserve Entrée au retour à la ligne', async () => {
  vi.mocked(supportSend).mockRejectedValueOnce(new Error('Réseau indisponible'))
  mount()
  const input = screen.getByRole('textbox', { name: 'Votre message' })
  expect(input.tagName).toBe('TEXTAREA')
  fireEvent.change(input, { target: { value: 'Bonjour,\nMon colis pèse 12 kg.' } })
  fireEvent.keyDown(input, { key: 'Enter' })
  expect(supportSend).not.toHaveBeenCalled()
  fireEvent.keyDown(input, { key: 'Enter', ctrlKey: true, isComposing: true })
  expect(supportSend).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Envoyer' }))
  await screen.findByRole('alert')
  expect(input).toHaveValue('Bonjour,\nMon colis pèse 12 kg.')
  expect(supportSend).toHaveBeenCalledWith('chat', { body: 'Bonjour,\nMon colis pèse 12 kg.' })
})
it('une réponse tardive ne supprime pas le message suivant', async () => {
  let finish!: (message: any) => void
  vi.mocked(supportSend).mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
  mount()
  const input = screen.getByRole('textbox', { name: 'Votre message' })
  fireEvent.change(input, { target: { value: 'Premier message' } })
  fireEvent.click(screen.getByRole('button', { name: 'Envoyer' }))
  await waitFor(() => expect(supportSend).toHaveBeenCalledTimes(1))
  fireEvent.change(input, { target: { value: 'Deuxième message en cours' } })
  await act(async () => finish({ id: 'sent', body: 'Premier message' }))
  expect(input).toHaveValue('Deuxième message en cours')
})
