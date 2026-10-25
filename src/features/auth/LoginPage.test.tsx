import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { LoginPage } from './LoginPage'
import { ForgotPinPage } from './ForgotPinPage'
import { RequireAuth, RequireRole } from '@/routes/guards'
import { loginDestination } from '@/routes/login-destination'
import { useAuthStore } from '@/store/auth'
import { loginWithPin } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'
import type { AuthSession, User } from '@/lib/api/types'

vi.mock('@/lib/api/auth', () => ({ loginWithPin: vi.fn(), me: vi.fn(), register: vi.fn(), forgotPin: vi.fn(), resetPin: vi.fn() }))

const session: AuthSession = { user: { id: 'admin-test', role: 'super_admin' } as User, accessToken: 'access-test', refreshToken: 'refresh-test' }
const destination = '/admin/audit?actorRole=driver&page=3#details'
const routers: ReturnType<typeof createMemoryRouter>[] = []

function open(initialEntries: NonNullable<Parameters<typeof createMemoryRouter>[1]>['initialEntries'] = [destination]) {
  const router = createMemoryRouter([
    { path: '/login', element: <LoginPage /> },
    { path: '/pin-oublie', element: <ForgotPinPage /> },
    { path: '/admin/audit', element: <RequireRole roles={['super_admin']}><div>Audit protege</div></RequireRole> },
    { path: '/support', element: <RequireAuth><div>Support protege</div></RequireAuth> },
    { path: '/admin', element: <div>Dashboard admin</div> },
    { path: '/client', element: <div>Dashboard client</div> },
  ], { initialEntries })
  routers.push(router)
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const view = render(<QueryClientProvider client={queryClient}><RouterProvider router={router} /></QueryClientProvider>)
  return { router, view }
}

beforeEach(() => {
  vi.mocked(loginWithPin).mockReset().mockResolvedValue(session)
  useAuthStore.setState({ user: null, accessToken: null, refreshToken: null, sessionId: null, hydrated: true })
})

afterEach(() => {
  cleanup()
  routers.splice(0).forEach(router => router.dispose())
})

async function submitLogin(auto = false) {
  fireEvent.change(screen.getByLabelText('Identifiant'), { target: { value: 'admin@example.test' } })
  if (auto) await userEvent.type(screen.getByLabelText('Code PIN'), '123456')
  else {
    fireEvent.change(screen.getByLabelText('Code PIN'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: /Se connecter/ }))
  }
}

it.each([false, true])('reprend la page complete apres expiration, connexion automatique=%s', async auto => {
  useAuthStore.getState().setSession(session)
  const { router } = open()
  expect(screen.getByText('Audit protege')).toBeInTheDocument()
  // L'intercepteur HTTP efface les jetons apres refus du renouvellement.
  // Le vrai garde doit alors memoriser l'URL avant de demonter la page.
  act(() => useAuthStore.getState().clearSession())
  await screen.findByRole('button', { name: /Se connecter/ })
  expect(router.state.location.pathname).toBe('/login')
  await submitLogin(auto)
  await screen.findByText('Audit protege')
  expect(router.state.location.pathname + router.state.location.search + router.state.location.hash).toBe(destination)
  expect(vi.mocked(loginWithPin)).toHaveBeenCalledTimes(1)
})

it('reprend aussi un lien protege par RequireAuth ouvert sans session', async () => {
  const { router } = open(['/support?conversation=42#latest'])
  await screen.findByRole('button', { name: /Se connecter/ })
  await submitLogin()
  await screen.findByText('Support protege')
  expect(router.state.location.search).toBe('?conversation=42')
  expect(router.state.location.hash).toBe('#latest')
})

it('conserve le retour apres une erreur de PIN et un rechargement de la connexion', async () => {
  vi.mocked(loginWithPin).mockRejectedValueOnce(new ApiError('PIN incorrect', 'UNAUTHORIZED', 401))
  const { router, view } = open()
  await screen.findByRole('button', { name: /Se connecter/ })
  await submitLogin()
  await screen.findByText('PIN incorrect')
  // React Router garde cet etat dans l'historique navigateur lors d'un reload.
  const savedLocation = router.state.location
  view.unmount()
  router.dispose()
  const resumed = open([savedLocation])
  await submitLogin()
  await screen.findByText('Audit protege')
  expect(resumed.router.state.location.search).toBe('?actorRole=driver&page=3')
})

it('preserve le retour pendant un detour par la recuperation du PIN', async () => {
  const { router } = open()
  await screen.findByRole('button', { name: /Se connecter/ })
  fireEvent.click(screen.getByText('Code PIN oublié ?'))
  await screen.findByRole('button', { name: /Recevoir le code/ })
  fireEvent.click(screen.getByLabelText('Retour'))
  await screen.findByRole('button', { name: /Se connecter/ })
  await submitLogin()
  await screen.findByText('Audit protege')
  expect(router.state.location.hash).toBe('#details')
})

it('utilise le dashboard pour une connexion directe sans page a reprendre', async () => {
  open(['/login'])
  await submitLogin()
  await screen.findByText('Dashboard admin')
})

it('reverifie les droits si le compte reconnecte a un autre role', async () => {
  vi.mocked(loginWithPin).mockResolvedValue({ ...session, user: { ...session.user, role: 'client' } })
  const { router } = open()
  await screen.findByRole('button', { name: /Se connecter/ })
  await submitLogin()
  await screen.findByText('Dashboard client')
  await waitFor(() => expect(router.state.location.pathname).toBe('/client'))
  expect(screen.queryByText('Audit protege')).not.toBeInTheDocument()
})

it.each(['https://example.test', '//example.test', '/\\example.test', '/\n/example.test', '/login', '/register', '/pin-oublie'])('rejette une destination de retour invalide : %j', pathname => {
  expect(loginDestination({ from: { pathname } }, 'super_admin')).toBe('/admin')
})
