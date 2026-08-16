import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RegisterPage } from './RegisterPage'
import { register } from '@/lib/api/auth'
import type { AuthSession } from '@/lib/api/types'

/**
 * L'email est facultatif à l'inscription : le compte doit pouvoir se créer
 * sans, mais une adresse saisie doit atteindre l'API — c'est elle qui autorise
 * ensuite la connexion par email et la récupération du code PIN.
 */
vi.mock('@/lib/api/auth', () => ({
  register: vi.fn(),
  loginWithPin: vi.fn(),
  me: vi.fn(),
}))

const registerMock = vi.mocked(register)

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Nom complet'), 'Aïcha Mballa')
  await user.type(screen.getByPlaceholderText('77 123 45 67'), '771234567')
  await user.type(screen.getByLabelText('Code PIN'), '123456')
  await user.click(screen.getByRole('checkbox'))
}

describe('inscription web', () => {
  beforeEach(() => {
    registerMock.mockReset()
    registerMock.mockResolvedValue({
      user: { id: 'u1', fullName: 'Aïcha Mballa', role: 'client' },
      accessToken: 'access',
      refreshToken: 'refresh',
    } as unknown as AuthSession)
  })

  it('cree le compte sans email', async () => {
    const user = userEvent.setup()
    renderPage()
    await fillRequiredFields(user)

    await user.click(screen.getByRole('button', { name: /Créer mon compte/ }))

    expect(registerMock).toHaveBeenCalledTimes(1)
    // `null` et non `''` : l'API traite la chaine vide comme un email invalide.
    expect(registerMock.mock.calls[0][0]).toMatchObject({ email: null, phone: '+221771234567' })
  })

  it('transmet l email saisi', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText('Email (facultatif)'), '  aicha@exemple.com  ')
    await fillRequiredFields(user)

    await user.click(screen.getByRole('button', { name: /Créer mon compte/ }))

    expect(registerMock.mock.calls[0][0]).toMatchObject({ email: 'aicha@exemple.com' })
  })

  // Les controles du DS sont des <button> : sans `type="button"` ils valent
  // submit et creaient le compte des le clic, avant meme le bouton final.
  it('ne soumet pas au clic sur un controle du formulaire', async () => {
    const user = userEvent.setup()
    renderPage()
    await fillRequiredFields(user)

    await user.click(screen.getByRole('button', { name: /Conduire/ }))
    await user.click(screen.getByRole('checkbox'))

    expect(registerMock).not.toHaveBeenCalled()
  })

  it('bloque l envoi sur une adresse malformee', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText('Email (facultatif)'), 'aicha@exemple')
    await fillRequiredFields(user)

    expect(screen.getByText('Adresse email invalide')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Créer mon compte/ })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: /Créer mon compte/ }))
    expect(registerMock).not.toHaveBeenCalled()
  })
})
