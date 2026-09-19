import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ClientDebtsScreen, PayClientDebtDialog } from './ClientDebtsScreen'
import * as debtsApi from '@/lib/api/client-debts'
import { createPaydunyaPayment } from '@/lib/api/paydunya'

vi.mock('@/lib/api/client-debts', () => ({ list: vi.fn() }))
vi.mock('@/lib/api/paydunya', () => ({ createPaydunyaPayment: vi.fn() }))
const debt: debtsApi.ClientDebt = {
  id: 'debt-1', parcelId: 'parcel-1', amount: 1000, remaining: 400,
  status: 'partially_paid', reference: 'PD-001', trackingNumber: 'PC-001', createdAt: '2026-09-19T12:00:00Z',
}
const response: debtsApi.ClientDebtsResponse = {
  debts: [debt], summary: { totalDebt: 400, currency: 'XOF', debtLimit: 1000, canCreateParcel: true },
  pagination: { page: 1, limit: 20, total: 21, totalPages: 2 },
}
function mount(ui: React.ReactNode) {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>{ui}</QueryClientProvider>)
}
beforeEach(() => vi.clearAllMocks())

describe('Mes dettes client', () => {
  it('affiche le reliquat et les autres pages sans modifier le total', async () => {
    vi.mocked(debtsApi.list).mockResolvedValue(response)
    mount(<ClientDebtsScreen />)
    expect(await screen.findByText('400 FCFA')).toBeInTheDocument()
    expect(screen.getByText('Partiellement réglée')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Suivant' }))
    await waitFor(() => expect(debtsApi.list).toHaveBeenCalledWith(2))
    expect(await screen.findByText('400 FCFA')).toBeInTheDocument()
  })

  it('signale une erreur sans afficher un faux solde nul', async () => {
    vi.mocked(debtsApi.list).mockRejectedValue(new Error('offline'))
    mount(<ClientDebtsScreen />)
    expect(await screen.findByText('Impossible de charger')).toBeInTheDocument()
    expect(screen.queryByText('Vous êtes à jour.')).not.toBeInTheDocument()
    expect(screen.queryByText('0 FCFA')).not.toBeInTheDocument()
  })

  it('rafraîchit les dettes réglées et retire leur action de paiement', async () => {
    vi.mocked(debtsApi.list).mockResolvedValueOnce(response).mockResolvedValue({
      ...response, summary: { ...response.summary, totalDebt: 0 }, debts: [{ ...debt, remaining: 0, status: 'paid' }],
    })
    mount(<ClientDebtsScreen />)
    await screen.findByText('400 FCFA')
    fireEvent.click(screen.getByRole('button', { name: /Actualiser/ }))
    expect(await screen.findByText('Vous êtes à jour.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Régler cette dette' })).not.toBeInTheDocument()
  })

  it.each(['', '150'])('transmet l’UUID réel et le montant facultatif %s', async (amount) => {
    // Laisser le paiement en attente évite toute navigation externe et vérifie
    // qu'ouvrir une facture ne marque pas immédiatement la dette comme payée.
    vi.mocked(createPaydunyaPayment).mockReturnValue(new Promise(() => {}))
    mount(<PayClientDebtDialog debt={debt} onClose={() => {}} />)
    fireEvent.change(screen.getByLabelText('Montant personnalisé (FCFA)'), { target: { value: amount } })
    fireEvent.click(screen.getByRole('button', { name: /Payer avec PayDunya/ }))
    await waitFor(() => expect(createPaydunyaPayment).toHaveBeenCalledWith('penalty_debt', {
      debtId: 'debt-1', ...(amount ? { amount: 150 } : {}),
    }))
    expect(screen.getByText(/Restant à régler : 400 FCFA/)).toBeInTheDocument()
  })

  it('refuse les montants négatifs ou supérieurs au reliquat', () => {
    mount(<PayClientDebtDialog debt={debt} onClose={() => {}} />)
    const input = screen.getByLabelText('Montant personnalisé (FCFA)')
    for (const amount of ['-1', '401', 'abc']) {
      fireEvent.change(input, { target: { value: amount } })
      expect(screen.getByRole('button', { name: /Payer avec PayDunya/ })).toBeDisabled()
    }
  })
})
