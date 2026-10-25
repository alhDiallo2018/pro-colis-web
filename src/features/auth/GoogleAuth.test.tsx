import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { LoginPage } from './LoginPage'
import { RegisterPage } from './RegisterPage'
import { GoogleAuth } from './GoogleAuth'
import * as google from '@/lib/api/googleAuth'
import { renderGoogleButton } from './googleIdentity'
import { useAuthStore } from '@/store/auth'
import { ApiError } from '@/lib/api/client'
import type { User } from '@/lib/api/types'

vi.mock('@/lib/api/googleAuth', () => ({ googleConfiguration: vi.fn(), startGoogle: vi.fn(), linkGoogle: vi.fn(), sendGoogleOtp: vi.fn(), registerGoogle: vi.fn() }))
vi.mock('./googleIdentity', () => ({ renderGoogleButton: vi.fn() }))
const session: google.GoogleSession = { status: 'authenticated', user: { id: 'google-user', role: 'client' } as User, accessToken: 'access', refreshToken: 'refresh' }
const challenge = (): google.GoogleChallenge => ({ status: 'profile_required', challengeToken: 'a'.repeat(64), email: 'client@example.com', fullName: 'Aïcha Test', expiresAt: new Date(Date.now() + 600000).toISOString() })
let receive: (value: string) => void
const clients: QueryClient[] = []
function open() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  clients.push(client)
  const onSuccess = vi.fn(), onFlowChange = vi.fn()
  const result = render(<QueryClientProvider client={client}><GoogleAuth onSuccess={onSuccess} onFlowChange={onFlowChange} /></QueryClientProvider>)
  return { ...result, onSuccess, onFlowChange }
}
async function identify(result: google.GoogleStart = challenge()) {
  vi.mocked(google.startGoogle).mockResolvedValueOnce(result)
  await waitFor(() => expect(renderGoogleButton).toHaveBeenCalled())
  await act(async () => { receive('google-id-token') })
}
beforeEach(() => {
  vi.resetAllMocks()
  useAuthStore.getState().clearSession()
  vi.mocked(google.googleConfiguration).mockResolvedValue({ enabled: true, serverClientId: 'test.apps.googleusercontent.com' })
  vi.mocked(renderGoogleButton).mockImplementation(async (host, _id, callback) => {
    receive = callback
    const button = document.createElement('button'); button.textContent = 'Continuer avec Google'
    host.appendChild(button)
    return () => host.replaceChildren()
  })
  vi.mocked(google.sendGoogleOtp).mockResolvedValue({ sent: true, retryAfterSeconds: 60 })
  vi.mocked(google.registerGoogle).mockResolvedValue(session)
  vi.mocked(google.linkGoogle).mockResolvedValue(session)
})
afterEach(() => { cleanup(); clients.splice(0).forEach(client => client.clear()) })

it('connecte une identite associee avec la session renvoyee par le serveur', async () => {
  const { onSuccess } = open()
  await identify(session)
  expect(google.startGoogle).toHaveBeenCalledWith('google-id-token')
  expect(useAuthStore.getState().accessToken).toBe('access')
  expect(onSuccess).toHaveBeenCalledWith(session)
})

it('demande le PIN existant pour associer Google, sans inscription automatique', async () => {
  open(); await identify({ ...challenge(), status: 'link_required' })
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('PIN du compte existant'), '123456')
  await user.click(screen.getByRole('button', { name: 'Associer et me connecter' }))
  expect(google.linkGoogle).toHaveBeenCalledWith({ challengeToken: 'a'.repeat(64), identifier: 'client@example.com', pin: '123456' })
  expect(google.registerGoogle).not.toHaveBeenCalled()
})

async function fillProfile() {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Téléphone avec indicatif'), '771234567')
  await user.click(screen.getByRole('button', { name: 'Recevoir le code SMS' }))
  await screen.findByText('Code envoyé au +221771234567.')
  await user.type(screen.getByLabelText('Code reçu par SMS'), '654321')
  await user.type(screen.getByLabelText('Créer un PIN à 6 chiffres'), '123456')
  await user.click(screen.getByRole('checkbox'))
  return user
}
it('cree un chauffeur seulement apres SMS, PIN et consentement', async () => {
  open(); await identify()
  expect(screen.getByRole('button', { name: 'Créer mon compte avec Google' })).toBeDisabled()
  const user = await fillProfile()
  await user.click(screen.getByRole('button', { name: 'Conduire' }))
  await user.click(screen.getByRole('button', { name: 'Créer mon compte avec Google' }))
  expect(google.registerGoogle).toHaveBeenCalledWith({ challengeToken: 'a'.repeat(64), phone: '+221771234567', otpCode: '654321', fullName: 'Aïcha Test', pin: '123456', role: 'driver', acceptedTerms: true })
})
it('invalide le code local quand le telephone change et respecte le delai de renvoi', async () => {
  open(); await identify(); const user = await fillProfile()
  expect(screen.getByRole('button', { name: /Renvoyer dans/ })).toBeDisabled()
  await user.type(screen.getByLabelText('Téléphone avec indicatif'), '8')
  expect(screen.getByLabelText('Code reçu par SMS')).toHaveValue('')
  expect(screen.getByRole('button', { name: 'Créer mon compte avec Google' })).toBeDisabled()
})
it('bascule vers le PIN existant si le numero appartient deja a un compte', async () => {
  vi.mocked(google.registerGoogle).mockResolvedValue({ status: 'link_required', identifier: '+221771234567', email: 'client@example.com' })
  open(); await identify(); const user = await fillProfile()
  await user.click(screen.getByRole('button', { name: 'Créer mon compte avec Google' }))
  expect(await screen.findByLabelText('PIN du compte existant')).toHaveValue('')
  expect(screen.getByLabelText('Email ou téléphone du compte existant')).toHaveValue('+221771234567')
  expect(useAuthStore.getState().accessToken).toBeNull()
})
it('affiche une panne SMS sans permettre de terminer le profil', async () => {
  vi.mocked(google.sendGoogleOtp).mockRejectedValue(new ApiError('Envoi du SMS impossible.', 'OTP_DELIVERY_UNAVAILABLE', 503))
  open(); await identify()
  fireEvent.change(screen.getByLabelText('Téléphone avec indicatif'), { target: { value: '+221771234567' } })
  fireEvent.click(screen.getByRole('button', { name: 'Recevoir le code SMS' }))
  await screen.findByText('Envoi du SMS impossible.')
  expect(screen.getByRole('button', { name: 'Créer mon compte avec Google' })).toBeDisabled()
})
it('ne charge aucun SDK quand Google est desactive', async () => {
  vi.mocked(google.googleConfiguration).mockResolvedValue({ enabled: false, serverClientId: null })
  open(); await screen.findByText('La connexion Google est momentanément indisponible.')
  expect(renderGoogleButton).not.toHaveBeenCalled()
})
it('propose une nouvelle tentative quand le SDK ne charge pas', async () => {
  vi.mocked(renderGoogleButton).mockRejectedValue(new Error('blocked'))
  open(); expect(await screen.findByRole('button', { name: 'Réessayer Google' })).toBeEnabled()
})
it('ignore une reponse apres demontage et ne conserve pas de challenge dans le stockage', async () => {
  let finish!: (value: google.GoogleStart) => void
  vi.mocked(google.startGoogle).mockReturnValue(new Promise(resolve => { finish = resolve }))
  const view = open(); await waitFor(() => expect(renderGoogleButton).toHaveBeenCalled())
  act(() => { receive('token'); receive('token') })
  expect(google.startGoogle).toHaveBeenCalledTimes(1)
  view.unmount()
  await act(async () => { finish(session) })
  expect(view.onSuccess).not.toHaveBeenCalled()
  expect(useAuthStore.getState().accessToken).toBeNull()
  expect(JSON.stringify(localStorage)).not.toContain('google-id-token')
})
it('refuse un challenge expire et permet de recommencer', async () => {
  open(); await identify({ ...challenge(), expiresAt: new Date(Date.now() - 1000).toISOString() })
  expect(screen.getByRole('button', { name: 'Créer mon compte avec Google' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: 'Recommencer avec Google' }))
  await waitFor(() => expect(screen.queryByText('COMPTE GOOGLE VÉRIFIÉ')).not.toBeInTheDocument())
})
it('affiche une preuve refusee sans ouvrir de session', async () => {
  vi.mocked(google.linkGoogle).mockRejectedValue(new ApiError('Code incorrect.', 'GOOGLE_PROOF_INVALID', 401))
  open(); await identify({ ...challenge(), status: 'link_required' })
  fireEvent.change(screen.getByLabelText('PIN du compte existant'), { target: { value: '123456' } })
  fireEvent.click(screen.getByRole('button', { name: 'Associer et me connecter' }))
  await screen.findByText('Code incorrect.')
  expect(useAuthStore.getState().accessToken).toBeNull()
})

it.each(['/login', '/register'])('reprend la destination protegee apres Google depuis %s', async path => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); clients.push(client)
  const router = createMemoryRouter([
    { path: '/login', element: <LoginPage /> }, { path: '/register', element: <RegisterPage /> },
    { path: '/client/colis', element: <div>Mes colis apres Google</div> },
  ], { initialEntries: [{ pathname: path, state: { from: { pathname: '/client/colis', search: '?page=2', hash: '#suivi' } } }] })
  render(<QueryClientProvider client={client}><RouterProvider router={router} /></QueryClientProvider>)
  await identify(session)
  await screen.findByText('Mes colis apres Google')
  expect(router.state.location.search).toBe('?page=2')
  expect(router.state.location.hash).toBe('#suivi')
  router.dispose()
})
