import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { BrevoConfigScreen } from './BrevoConfigScreen'
import { getBrevoConfig, updateBrevoConfig, type BrevoConfig } from '@/lib/api/brevo'

vi.mock('./ManualMessagePanel', () => ({ ManualMessagePanel: () => null }))
vi.mock('@/lib/api/brevo', () => ({ getBrevoConfig: vi.fn(), updateBrevoConfig: vi.fn(), testBrevoConnection: vi.fn() }))
const configured: BrevoConfig = { provider: 'brevo', apiKey: '********', apiKeyConfigured: true,
  apiKeySource: 'environment', environmentApiKeyConfigured: true,
  senderEmail: 'sender@example.test', senderName: 'Equipe', smsSender: 'ProColis' }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getBrevoConfig).mockResolvedValue(configured)
  vi.mocked(updateBrevoConfig).mockResolvedValue(configured)
})
afterEach(cleanup)

async function open() {
  const user = userEvent.setup()
  render(<BrevoConfigScreen />)
  await user.click(screen.getByRole('button', { name: /Charger la configuration/ }))
  await screen.findByLabelText('Nouvelle clé API Brevo')
  return user
}

it('permet de saisir et enregistrer une cle sans la conserver dans le formulaire apres sauvegarde', async () => {
  const user = await open()
  const input = screen.getByLabelText('Nouvelle clé API Brevo')
  expect(input).toHaveAttribute('type', 'password')
  await user.type(input, 'test-only-new-key')
  vi.mocked(updateBrevoConfig).mockResolvedValue({ ...configured, apiKeySource: 'database' })
  await user.click(screen.getByRole('button', { name: /Enregistrer/ }))
  await waitFor(() => expect(updateBrevoConfig).toHaveBeenCalledWith(expect.objectContaining({ apiKey: 'test-only-new-key' })))
  await screen.findByText('Clé enregistrée dans l’administration (prioritaire).')
  expect(input).toHaveValue('')
})

it('un champ vide conserve la cle existante sans renvoyer son masque', async () => {
  const user = await open()
  expect(screen.getByLabelText('Nouvelle clé API Brevo')).toHaveValue('')
  await user.clear(screen.getByLabelText('Nom expéditeur'))
  await user.type(screen.getByLabelText('Nom expéditeur'), 'Nouvelle equipe')
  await user.click(screen.getByRole('button', { name: /Enregistrer/ }))
  await waitFor(() => expect(updateBrevoConfig).toHaveBeenCalledTimes(1))
  const payload = vi.mocked(updateBrevoConfig).mock.calls[0][0]
  expect(payload).not.toHaveProperty('apiKey')
  expect(payload.senderName).toBe('Nouvelle equipe')
})

it('permet le retour explicite a la cle du serveur', async () => {
  vi.mocked(getBrevoConfig).mockResolvedValue({ ...configured, apiKeySource: 'database' })
  const user = await open()
  await user.click(screen.getByRole('button', { name: 'Utiliser la clé du serveur' }))
  expect(updateBrevoConfig).not.toHaveBeenCalled()
  await user.click(screen.getByRole('button', { name: /Enregistrer/ }))
  await waitFor(() => expect(updateBrevoConfig).toHaveBeenCalledWith(expect.objectContaining({ apiKey: '' })))
  await screen.findByText('Clé configurée sur le serveur.')
})

it('explique une configuration absente et permet de renseigner la premiere cle', async () => {
  vi.mocked(getBrevoConfig).mockResolvedValue({ ...configured, apiKey: '', apiKeyConfigured: false, apiKeySource: 'none', environmentApiKeyConfigured: false })
  const user = await open()
  expect(screen.getByRole('status')).toHaveTextContent('Aucune clé API configurée.')
  expect(screen.getByLabelText('Nouvelle clé API Brevo')).toBeEnabled()
  await user.type(screen.getByLabelText('Adresse email de test'), 'test@example.test')
  expect(screen.getByRole('button', { name: /Tester/ })).toBeDisabled()
  await user.click(screen.getByRole('button', { name: /Enregistrer/ }))
  expect(updateBrevoConfig).not.toHaveBeenCalled()
  expect(screen.getByText('Renseignez une clé API Brevo avant d’enregistrer la configuration.')).toBeInTheDocument()
  await user.type(screen.getByLabelText('Nouvelle clé API Brevo'), 'new-test-key')
  await user.click(screen.getByRole('button', { name: /Enregistrer/ }))
  await waitFor(() => expect(updateBrevoConfig).toHaveBeenCalledWith(expect.objectContaining({ apiKey: 'new-test-key' })))
  await waitFor(() => expect(screen.getByRole('button', { name: /Tester/ })).toBeEnabled())
})

it('ne permet pas de retirer la cle admin quand aucune cle serveur ne peut la remplacer', async () => {
  vi.mocked(getBrevoConfig).mockResolvedValue({ ...configured, apiKeySource: 'database', environmentApiKeyConfigured: false })
  const user = await open()
  expect(screen.getByRole('button', { name: 'Utiliser la clé du serveur' })).toBeDisabled()
  await user.click(screen.getByRole('button', { name: 'Utiliser la clé du serveur' }))
  await user.click(screen.getByRole('button', { name: /Enregistrer/ }))
  await waitFor(() => expect(updateBrevoConfig).toHaveBeenCalledTimes(1))
  expect(vi.mocked(updateBrevoConfig).mock.calls[0][0]).not.toHaveProperty('apiKey')
})

it('ne presente pas une sauvegarde sans cle effective comme une configuration operationnelle', async () => {
  vi.mocked(updateBrevoConfig).mockResolvedValue({ ...configured, apiKey: '', apiKeyConfigured: false, apiKeySource: 'none', environmentApiKeyConfigured: false })
  const user = await open()
  await user.click(screen.getByRole('button', { name: /Enregistrer/ }))
  expect(await screen.findByText('Paramètres enregistrés, mais aucune clé API Brevo n’est configurée. Les envois sont indisponibles.')).toBeInTheDocument()
})

it('ne permet pas d ecraser les reglages tant que leur chargement a echoue', async () => {
  vi.mocked(getBrevoConfig).mockRejectedValue(new Error('network'))
  const user = userEvent.setup()
  render(<BrevoConfigScreen />)
  await user.click(screen.getByRole('button', { name: /Charger la configuration/ }))
  await screen.findByText('Impossible de charger la configuration.')
  expect(screen.queryByRole('button', { name: /Enregistrer/ })).not.toBeInTheDocument()
})


it('explique le refus d un expediteur SMS de 12 caracteres avant toute sauvegarde', async () => {
  const user = await open()
  const sender = screen.getByLabelText('Expéditeur SMS (max 11 caractères)')
  await user.clear(sender)
  await user.type(sender, 'SENDPROCOLIS')
  await user.type(screen.getByLabelText('Nouvelle clé API Brevo'), 'test-only-key')
  await user.click(screen.getByRole('button', { name: /Enregistrer/ }))
  expect(updateBrevoConfig).not.toHaveBeenCalled()
  expect(screen.getByText('L’expéditeur SMS doit contenir au maximum 11 caractères. Utilisez par exemple ProColis.')).toBeInTheDocument()
  await user.clear(sender)
  await user.type(sender, 'ProColis')
  await user.click(screen.getByRole('button', { name: /Enregistrer/ }))
  await waitFor(() => expect(updateBrevoConfig).toHaveBeenCalledWith(expect.objectContaining({ smsSender: 'ProColis', apiKey: 'test-only-key' })))
})
