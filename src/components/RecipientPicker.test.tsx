import { useState } from 'react'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RecipientPicker } from './RecipientPicker'
import type { AssistanceUser } from '@/lib/api/assistances'
import { listMessageRecipients } from '@/lib/api/manualMessages'
vi.mock('@/lib/api/manualMessages', () => ({ listMessageRecipients: vi.fn() }))
afterEach(cleanup)
it('filtre par rôle et garde la sélection entre deux recherches', async () => {
  const first = { id: 'a', fullName: 'Aminata', phone: '123', role: 'client' }
  const second = { id: 'b', fullName: 'Moussa', phone: '456', role: 'driver' }
  vi.mocked(listMessageRecipients).mockImplementation(async params => ({ users: params.search ? [second] : [first],
    pagination: { page: 1, total: 1, totalPages: 1, limit: 20 } }))
  function Harness() {
    const [selected, setSelected] = useState<AssistanceUser[]>([])
    return <RecipientPicker selected={selected} onChange={setSelected} />
  }
  const user = userEvent.setup()
  render(<QueryClientProvider client={new QueryClient()}><Harness /></QueryClientProvider>)
  await user.click(await screen.findByRole('checkbox', { name: 'Aminata · 123' }))
  await user.selectOptions(screen.getByLabelText('Filtrer les destinataires par profil'), 'driver')
  await user.type(screen.getByLabelText('Rechercher dans le répertoire'), 'Moussa')
  await waitFor(() => expect(listMessageRecipients).toHaveBeenLastCalledWith({ search: 'Moussa', role: 'driver', page: 1, limit: 20 }))
  await user.click(await screen.findByRole('checkbox', { name: 'Moussa · 456' }))
  expect(screen.getByText('2/50 sélectionnés')).toBeInTheDocument()
})
