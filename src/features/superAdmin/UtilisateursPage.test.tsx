import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { UtilisateursPage } from './UtilisateursPage'
import { useAdminUsers } from './hooks'

vi.mock('./hooks', () => ({
  useAdminUsers: vi.fn(() => ({ data: { users: [], pagination: { page: 1, total: 25, totalPages: 2 } }, isFetching: false, refetch: vi.fn() })),
  useUpdateUserStatus: () => ({}), useDeleteUser: () => ({}), useResetUserPin: () => ({}),
}))
vi.mock('@/lib/useMediaQuery', () => ({ useIsMobile: () => false }))
vi.mock('./UserFormDialog', () => ({ UserFormDialog: () => null }))

afterEach(cleanup)

it('envoie la recherche au serveur et remet la pagination à la première page', async () => {
  const user = userEvent.setup()
  render(<UtilisateursPage />)
  await user.click(screen.getByRole('button', { name: 'Suivant' }))
  expect(useAdminUsers).toHaveBeenLastCalledWith({ search: '', page: 2, limit: 20 })
  await user.type(screen.getByLabelText('Rechercher un utilisateur'), ' Aminata@Example.test ')
  await waitFor(() => expect(useAdminUsers).toHaveBeenLastCalledWith({ search: 'Aminata@Example.test', page: 1, limit: 20 }))
  await user.clear(screen.getByLabelText('Rechercher un utilisateur'))
  await waitFor(() => expect(useAdminUsers).toHaveBeenLastCalledWith({ search: '', page: 1, limit: 20 }))
})

it('ne remet pas à zéro une pagination immédiate après le montage', () => {
  vi.useFakeTimers()
  try {
    render(<UtilisateursPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Suivant' }))
    act(() => vi.advanceTimersByTime(300))
    expect(useAdminUsers).toHaveBeenLastCalledWith({ search: '', page: 2, limit: 20 })
  } finally { vi.useRealTimers() }
})
