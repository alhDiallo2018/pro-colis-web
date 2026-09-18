import { render, screen, fireEvent } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PayDebtDialog } from './PayDebtDialog'
import { useDriverFinancialState, useDriverWallet, usePayWalletDebt } from './hooks'

vi.mock('./hooks', () => ({
  useDriverFinancialState: vi.fn(),
  useDriverWallet: vi.fn(),
  usePayWalletDebt: vi.fn(),
}))

const mockFin = vi.mocked(useDriverFinancialState)
const mockWallet = vi.mocked(useDriverWallet)
const mockRepay = vi.mocked(usePayWalletDebt)

function finState(debt: number, canAccept: boolean) {
  return {
    isLoading: false,
    isError: false,
    commissionDebt: debt,
    canAcceptNewDeliveries: canAccept,
    hasDebt: debt > 0,
    isBlocked: !canAccept,
    debtLimit: 0,
  } as ReturnType<typeof useDriverFinancialState>
}

function renderDialog(props: { open?: boolean; onClose?: () => void; onSuccess?: () => void } = {}) {
  const { open = true, onClose = vi.fn(), onSuccess } = props
  return render(<PayDebtDialog open={open} onClose={onClose} onSuccess={onSuccess} />)
}

describe('PayDebtDialog — règlement de la dette', () => {
  beforeEach(() => {
    mockFin.mockReset()
    mockWallet.mockReset()
    mockRepay.mockReset()
    mockFin.mockReturnValue(finState(500, false))
    mockWallet.mockReturnValue({
      data: { balance: 1000 } as unknown as ReturnType<typeof useDriverWallet>['data'],
    } as ReturnType<typeof useDriverWallet>)
    mockRepay.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: null,
      data: undefined,
    } as unknown as ReturnType<typeof usePayWalletDebt>)
  })

  it('affiche la dette et le solde disponible', () => {
    renderDialog()
    expect(screen.getByText('Dette de commission')).toBeInTheDocument()
    expect(screen.getByText('500 FCFA')).toBeInTheDocument()
    expect(screen.getByText('1 000 FCFA')).toBeInTheDocument()
  })

  it('règle la dette (montant par défaut = maximum réglable) et affiche le reste', () => {
    const mutate = vi.fn()
    mockRepay.mockReturnValue({
      mutate,
      isPending: false,
      error: null,
      data: undefined,
    } as unknown as ReturnType<typeof usePayWalletDebt>)
    renderDialog()

    const button = screen.getByRole('button', { name: /Régler 500 FCFA/ })
    expect(button).not.toBeDisabled()
    fireEvent.click(button)

    expect(mutate).toHaveBeenCalledTimes(1)
    const arg = mutate.mock.calls[0][0]
    expect(arg).toBe(500)
    // Le rappel onSuccess est fourni pour rafraîchir l'état.
    expect(mutate.mock.calls[0][1].onSuccess).toBeInstanceOf(Function)
  })

  it('après un règlement partiel, affiche le montant restant', () => {
    const mutate = vi.fn()
    mockRepay.mockReturnValue({
      mutate,
      isPending: false,
      error: null,
      data: { debtRepaid: 200, remainingDebt: 300, commissionDebt: 300, balance: 800, debtLimit: 100, canAcceptNewDeliveries: false },
    } as unknown as ReturnType<typeof usePayWalletDebt>)
    renderDialog()
    expect(screen.getByText(/Il reste 300 FCFA de dette de commission/)).toBeInTheDocument()
  })

  it('après un règlement total, confirme la réactivation des acceptations', () => {
    mockRepay.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: null,
      data: { debtRepaid: 500, remainingDebt: 0, commissionDebt: 0, balance: 500, debtLimit: 100, canAcceptNewDeliveries: true },
    } as unknown as ReturnType<typeof usePayWalletDebt>)
    renderDialog()
    expect(screen.getByText(/Dette entièrement réglée/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Régler/ })).not.toBeInTheDocument()
  })

  it('sans solde wallet, propose de recharger au lieu de régler', () => {
    mockWallet.mockReturnValue({
      data: { balance: 0 } as unknown as ReturnType<typeof useDriverWallet>['data'],
    } as ReturnType<typeof useDriverWallet>)
    renderDialog()
    expect(screen.getByText(/Rechargez votre portefeuille ou vos points/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Régler/ })).not.toBeInTheDocument()
  })
})
