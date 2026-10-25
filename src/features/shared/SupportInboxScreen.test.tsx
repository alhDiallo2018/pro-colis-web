import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { SupportInboxScreen } from './SupportInboxScreen'
import { useAuthStore } from '@/store/auth'
import * as api from '@/lib/api/supportChat'

vi.mock('@/lib/api/supportChat', () => ({ supportChats: vi.fn(), supportThread: vi.fn(), openSupportChat: vi.fn(), claimSupportChat: vi.fn(), closeSupportChat: vi.fn(), availableSupportAgents: vi.fn(), transferSupportChat: vi.fn() }))
vi.mock('@/lib/useMediaQuery', () => ({ useIsMobile: () => false }))
vi.mock('@/components/NegotiationChat', () => ({ NegotiationChat: ({ readOnly }: { readOnly: boolean }) => <div>{readOnly ? 'Lecture seule' : 'Réponse autorisée'}</div> }))
vi.mock('@/components/UserSearchSelect', () => ({ UserSearchSelect: ({ onChange }: { onChange: (user: { id: string }) => void }) => <button onClick={() => onChange({ id: 'client' })}>Contacter un client</button> }))
const agent = { id: 'agent', fullName: 'Support A', role: 'support' as const, email: null, phone: '123', status: 'active' as const }
let chat: api.SupportChat
let qc: QueryClient
beforeEach(() => {
  vi.clearAllMocks()
  useAuthStore.setState({ user: agent })
  chat = { id: 'chat', userId: 'client', department: 'general', status: 'open', waiting: false,
    user: { id: 'client', fullName: 'Client test', role: 'client' }, assignedTo: agent,
    lastMessage: null, lastMessageAt: new Date().toISOString() }
  vi.mocked(api.supportChats).mockImplementation(async () => [chat])
  vi.mocked(api.supportThread).mockImplementation(async () => ({ conversation: chat, messages: [] }))
  vi.mocked(api.openSupportChat).mockImplementation(async () => chat)
  vi.mocked(api.claimSupportChat).mockImplementation(async () => chat)
  vi.mocked(api.availableSupportAgents).mockResolvedValue([{ id: 'backup', fullName: 'Relais', role: 'support', activeCases: 0 }])
  qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
})
afterEach(() => { cleanup(); qc.clear(); useAuthStore.setState({ user: null }) })
function mount() { render(<QueryClientProvider client={qc}><SupportInboxScreen /></QueryClientProvider>) }

it('seul l’agent affecté peut répondre puis le changement d’affectation verrouille le compositeur', async () => {
  const user = userEvent.setup(); mount()
  await user.click(await screen.findByRole('button', { name: /Client test/ }))
  expect(await screen.findByText('Réponse autorisée')).toBeInTheDocument()
  chat = { ...chat, assignedTo: { id: 'backup', fullName: 'Relais', role: 'support' } }
  await qc.invalidateQueries({ queryKey: ['support-chat'] })
  expect(await screen.findByText('Lecture seule')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Clôturer' })).not.toBeInTheDocument()
})

it('ouvre un fil sortant pour le destinataire choisi', async () => {
  const user = userEvent.setup(); mount()
  await user.click(screen.getByRole('button', { name: 'Contacter un client' }))
  await waitFor(() => expect(api.openSupportChat).toHaveBeenCalledWith('client'))
  expect(await screen.findByText('Réponse autorisée')).toBeInTheDocument()
})

it('affiche le conflit de prise en charge sans autoriser une réponse', async () => {
  chat = { ...chat, assignedTo: null, waiting: true }
  vi.mocked(api.claimSupportChat).mockRejectedValue(new Error('Un autre agent traite cette conversation'))
  const user = userEvent.setup(); mount()
  await user.click(await screen.findByRole('button', { name: /Client test/ }))
  await user.click(await screen.findByRole('button', { name: 'Prendre en charge' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Un autre agent')
  expect(screen.getByText('Lecture seule')).toBeInTheDocument()
})

it('un agent contacté en tant qu’utilisateur peut répondre à sa propre demande', async () => {
  chat = { ...chat, userId: agent.id, user: agent, assignedTo: { id: 'backup', fullName: 'Relais', role: 'support' } }
  const user = userEvent.setup(); mount()
  await user.click(await screen.findByRole('button', { name: /Support A/ }))
  expect(await screen.findByText('Réponse autorisée')).toBeInTheDocument()
})


it('transfère au support choisi puis verrouille la réponse de l’ancien agent', async () => {
  vi.mocked(api.transferSupportChat).mockImplementation(async () => {
    chat = { ...chat, assignedTo: { id: 'backup', fullName: 'Relais', role: 'support' } }
    return chat
  })
  const user = userEvent.setup(); mount()
  await user.click(await screen.findByRole('button', { name: /Client test/ }))
  await screen.findByRole('option', { name: 'Relais · 0 dossier(s)' })
  await user.selectOptions(screen.getByLabelText('Affecter à un support disponible'), 'backup')
  await user.click(screen.getByRole('button', { name: 'Transférer l’assistance' }))
  expect(api.transferSupportChat).toHaveBeenCalledWith('chat', 'backup', 'agent')
  expect(await screen.findByText('Lecture seule')).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('Prise en charge par Relais')
})

it('un support non affecté ne peut pas transférer mais le super admin le peut', async () => {
  chat = { ...chat, assignedTo: { id: 'other', fullName: 'Autre agent', role: 'support' } }
  const user = userEvent.setup(); mount()
  await user.click(await screen.findByRole('button', { name: /Client test/ }))
  await screen.findByText('Lecture seule')
  expect(screen.queryByLabelText('Affecter à un support disponible')).not.toBeInTheDocument()
  useAuthStore.setState({ user: { ...agent, role: 'super_admin' } })
  expect(await screen.findByLabelText('Affecter à un support disponible')).toBeInTheDocument()
})

it('un conflit de transfert actualise l’affectation sans envoyer de message', async () => {
  vi.mocked(api.transferSupportChat).mockImplementation(async () => {
    chat = { ...chat, assignedTo: { id: 'backup', fullName: 'Relais', role: 'support' } }
    throw new Error('L’affectation a changé')
  })
  const user = userEvent.setup(); mount()
  await user.click(await screen.findByRole('button', { name: /Client test/ }))
  await screen.findByRole('option', { name: 'Relais · 0 dossier(s)' })
  await user.selectOptions(screen.getByLabelText('Affecter à un support disponible'), 'backup')
  await user.click(screen.getByRole('button', { name: 'Transférer l’assistance' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('L’affectation a changé')
  expect(await screen.findByText('Lecture seule')).toBeInTheDocument()
})
