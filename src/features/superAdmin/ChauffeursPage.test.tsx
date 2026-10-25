import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ChauffeursPage } from './ChauffeursPage'
import { listMessageRecipients } from '@/lib/api/manualMessages'

vi.mock('@/lib/api/manualMessages', () => ({ listMessageRecipients: vi.fn() }))
vi.mock('./ManualMessagePanel', () => ({ ManualMessagePanel: ({ initialRecipients, initialKind }: { initialRecipients: { id: string }[]; initialKind: string }) =>
  <div data-testid="composer">{initialKind}:{initialRecipients.map(user => user.id).join(',')}</div> }))
const users = ['Aminata', 'Moussa', 'Fatou'].map((name, i) => ({ id: `driver-${i}`, fullName: name, phone: `+22177000000${i}`, email: `${name}@example.test`, role: 'driver', status: 'active' }))
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(listMessageRecipients).mockImplementation(async params => ({
    users: params.search ? [users[2]] : params.page === 2 ? [users[2]] : users.slice(0, 2),
    pagination: { page: params.page || 1, limit: 20, total: 21, totalPages: params.search ? 1 : 2 },
  }))
})
afterEach(cleanup)
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(<QueryClientProvider client={client}><MemoryRouter><ChauffeursPage /></MemoryRouter></QueryClientProvider>)
}
it('recherche côté serveur tous les chauffeurs et remet la page à 1', async () => {
  const user = userEvent.setup(); setup()
  await screen.findByRole('checkbox', { name: 'Sélectionner Aminata' })
  await user.click(screen.getByRole('button', { name: 'Suivant' }))
  await screen.findByRole('checkbox', { name: 'Sélectionner Fatou' })
  await user.type(screen.getByLabelText('Rechercher un chauffeur'), ' Fatou@example.test ')
  await waitFor(() => expect(listMessageRecipients).toHaveBeenLastCalledWith({ role: 'driver', search: 'Fatou@example.test', page: 1, limit: 20 }))
})
it('conserve la sélection sur plusieurs pages et ouvre le renvoi des données', async () => {
  const user = userEvent.setup(); setup()
  await screen.findByRole('checkbox', { name: 'Sélectionner Aminata' })
  await user.click(screen.getByRole('checkbox', { name: 'Sélectionner cette page' }))
  expect(screen.getByRole('status')).toHaveTextContent('2/50')
  await user.click(screen.getByRole('button', { name: 'Suivant' }))
  await user.click(await screen.findByRole('checkbox', { name: 'Sélectionner Fatou' }))
  expect(screen.getByRole('status')).toHaveTextContent('3/50')
  await user.click(screen.getByRole('button', { name: 'Précédent' }))
  expect(await screen.findByRole('checkbox', { name: 'Sélectionner Aminata' })).toHaveAttribute('aria-checked', 'true')
  await user.click(screen.getByRole('button', { name: 'Renvoyer leurs données' }))
  expect(screen.getByTestId('composer')).toHaveTextContent('account_summary:driver-0,driver-1,driver-2')
})
it('permet de retirer toute la sélection avant un envoi', async () => {
  const user = userEvent.setup(); setup()
  await user.click(await screen.findByRole('checkbox', { name: 'Sélectionner Aminata' }))
  await user.click(screen.getByRole('button', { name: 'Vider la sélection' }))
  expect(screen.getByRole('button', { name: 'Envoyer un message' })).toBeDisabled()
  expect(screen.getByRole('checkbox', { name: 'Sélectionner Aminata' })).toHaveAttribute('aria-checked', 'false')
})
