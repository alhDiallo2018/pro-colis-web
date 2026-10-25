import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ManualMessagePanel } from './ManualMessagePanel'
import { getManualMessageResult, sendManualMessage } from '@/lib/api/manualMessages'

const accounts = [
  { id: 'user-1', fullName: 'Aminata Diallo', email: 'aminata@example.test', phone: '+221770000001', role: 'client' },
  { id: 'user-2', fullName: 'Moussa Sarr', email: null, phone: '+221770000002', role: 'driver' },
]
vi.mock('./hooks', () => ({ useAssistanceUserSearch: () => ({ data: accounts, isFetching: false, isError: false }) }))
vi.mock('@/lib/api/manualMessages', () => ({ sendManualMessage: vi.fn(), getManualMessageResult: vi.fn() }))

async function choose(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByText('Nom, e-mail ou téléphone'))
  await user.click(await screen.findByRole('button', { name: `Sélectionner ${name}` }))
}

describe('envois manuels', () => {
  afterEach(cleanup)
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(sendManualMessage).mockImplementation(async payload => ({ ...payload, status: 'sent', message: 'Accepté par le prestataire' }))
  })

  it('valide le formulaire avant tout appel', async () => {
    const user = userEvent.setup()
    render(<ManualMessagePanel />)
    await user.click(screen.getByRole('button', { name: 'Envoyer à 0 utilisateur' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Choisissez au moins un destinataire')
    expect(sendManualMessage).not.toHaveBeenCalled()
  })

  it('sélectionne plusieurs comptes et envoie un texte personnalisé par canal', async () => {
    const user = userEvent.setup()
    render(<ManualMessagePanel />)
    await choose(user, 'Aminata Diallo')
    await choose(user, 'Moussa Sarr')
    await user.click(screen.getByRole('checkbox', { name: 'SMS' }))
    await user.type(screen.getByLabelText('Objet / titre'), 'Informations de livraison')
    await user.type(screen.getByLabelText('Message'), 'Bonjour, voici les informations demandées.')
    expect(screen.getByText(/Les comptes sans email seront ignorés/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Envoyer à 2 utilisateurs' }))
    await waitFor(() => expect(sendManualMessage).toHaveBeenCalledTimes(4))
    expect(new Set(vi.mocked(sendManualMessage).mock.calls.map(([payload]) => payload.requestId)).size).toBe(4)
    expect(vi.mocked(sendManualMessage).mock.calls.map(([payload]) => [payload.userId, payload.channel])).toEqual([
      ['user-1', 'email'], ['user-1', 'sms'], ['user-2', 'email'], ['user-2', 'sms'],
    ])
    expect(sendManualMessage).toHaveBeenCalledWith(expect.objectContaining({
      subject: 'Informations de livraison', content: 'Bonjour, voici les informations demandées.',
    }))
    expect(screen.queryByRole('button', { name: 'Envoyer à 2 utilisateurs' })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Message')).toBeDisabled()
  })

  it('déduplique la sélection et permet de retirer un destinataire', async () => {
    const user = userEvent.setup()
    render(<ManualMessagePanel />)
    await choose(user, 'Aminata Diallo')
    await choose(user, 'Aminata Diallo')
    expect(screen.getByRole('button', { name: 'Envoyer à 1 utilisateur' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retirer Aminata Diallo' }))
    expect(screen.getByRole('button', { name: 'Envoyer à 0 utilisateur' })).toBeInTheDocument()
  })

  it('vérifie une réponse perdue sans renvoyer le message', async () => {
    const user = userEvent.setup()
    vi.mocked(sendManualMessage).mockRejectedValueOnce(new Error('network'))
    render(<ManualMessagePanel />)
    await choose(user, 'Aminata Diallo')
    await user.type(screen.getByLabelText('Objet / titre'), 'Objet')
    await user.type(screen.getByLabelText('Message'), 'Message')
    await user.click(screen.getByRole('button', { name: 'Envoyer à 1 utilisateur' }))
    await screen.findByText(/Réponse non reçue/)
    const payload = vi.mocked(sendManualMessage).mock.calls[0][0]
    vi.mocked(getManualMessageResult).mockResolvedValueOnce({ ...payload, status: 'sent', message: 'Accepté par le prestataire' })
    await user.click(screen.getByRole('button', { name: 'Vérifier les résultats' }))
    await screen.findByText(/1\/1 envois acceptés/)
    expect(getManualMessageResult).toHaveBeenCalledWith(payload.requestId)
    expect(sendManualMessage).toHaveBeenCalledTimes(1)
  })

  it('continue les autres destinataires en cas d’échec partiel', async () => {
    const user = userEvent.setup()
    vi.mocked(sendManualMessage).mockRejectedValueOnce(new Error('network'))
    render(<ManualMessagePanel />)
    await choose(user, 'Aminata Diallo')
    await choose(user, 'Moussa Sarr')
    await user.type(screen.getByLabelText('Objet / titre'), 'Objet')
    await user.type(screen.getByLabelText('Message'), 'Message')
    await user.click(screen.getByRole('button', { name: 'Envoyer à 2 utilisateurs' }))
    await screen.findByText(/1\/2 envois acceptés/)
    expect(sendManualMessage).toHaveBeenCalledTimes(2)
  })

  it('limite la concurrence à trois et empêche le double clic', async () => {
    const user = userEvent.setup()
    const pending: Array<() => void> = []
    vi.mocked(sendManualMessage).mockImplementation(payload => new Promise(resolve => {
      pending.push(() => resolve({ ...payload, status: 'sent' }))
    }))
    render(<ManualMessagePanel />)
    await choose(user, 'Aminata Diallo')
    await choose(user, 'Moussa Sarr')
    await user.click(screen.getByRole('checkbox', { name: 'SMS' }))
    await user.type(screen.getByLabelText('Objet / titre'), 'Objet')
    await user.type(screen.getByLabelText('Message'), 'Message')
    await user.dblClick(screen.getByRole('button', { name: 'Envoyer à 2 utilisateurs' }))
    expect(sendManualMessage).toHaveBeenCalledTimes(3)
    await act(async () => { pending[0]() })
    expect(sendManualMessage).toHaveBeenCalledTimes(4)
    await act(async () => { pending.slice(1).forEach(resolve => resolve()) })
    expect(screen.getByRole('button', { name: 'Nouvel envoi' })).toBeEnabled()
  })
})

it('reprend la sélection des listes et envoie la fiche personnelle via le chat', async () => {
  vi.clearAllMocks()
  vi.mocked(sendManualMessage).mockImplementation(async payload => ({ ...payload, status: 'sent' }))
  const user = userEvent.setup()
  render(<ManualMessagePanel initialRecipients={accounts} initialKind="account_summary" />)
  expect(screen.queryByLabelText('Message')).not.toBeInTheDocument()
  expect(screen.getByLabelText('Objet / titre')).toHaveValue('Vos informations ProColis')
  await user.click(screen.getByRole('checkbox', { name: 'Email' }))
  await user.click(screen.getByRole('checkbox', { name: 'Chat privé' }))
  await user.click(screen.getByRole('button', { name: 'Envoyer à 2 utilisateurs' }))
  await waitFor(() => expect(sendManualMessage).toHaveBeenCalledTimes(2))
  for (const [payload] of vi.mocked(sendManualMessage).mock.calls) {
    expect(payload).toMatchObject({ kind: 'account_summary', channel: 'chat', content: '' })
    expect(Object.keys(payload)).not.toContain('email')
  }
})
