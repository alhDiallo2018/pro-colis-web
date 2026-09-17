import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CommissionDebtNotice } from './CommissionDebtNotice'
import { useDriverFinancialState } from './hooks'

vi.mock('./hooks', () => ({
  useDriverFinancialState: vi.fn(),
}))

const mockFin = vi.mocked(useDriverFinancialState)

function renderNotice(props: { compact?: boolean; showClearState?: boolean } = {}) {
  return render(
    <MemoryRouter>
      <CommissionDebtNotice {...props} />
    </MemoryRouter>,
  )
}

describe('CommissionDebtNotice', () => {
  beforeEach(() => {
    mockFin.mockReset()
  })

  it('n\'affiche rien pendant le chargement (jamais « Dette = 0 » par défaut)', () => {
    mockFin.mockReturnValue({
      isLoading: true,
      isError: false,
      commissionDebt: 0,
      canAcceptNewDeliveries: false,
      hasDebt: false,
      debtLimit: 0,
    } as ReturnType<typeof useDriverFinancialState>)
    renderNotice()
    expect(screen.queryByText(/Dette de commission/)).not.toBeInTheDocument()
    expect(screen.queryByText(/accepter de nouveaux colis/)).not.toBeInTheDocument()
  })

  it('affiche la dette et son message quand commissionDebt > 0', () => {
    mockFin.mockReturnValue({
      isLoading: false,
      isError: false,
      commissionDebt: 500,
      canAcceptNewDeliveries: false,
      hasDebt: true,
      debtLimit: 0,
    } as ReturnType<typeof useDriverFinancialState>)
    renderNotice()
    expect(screen.getByText('Dette de commission')).toBeInTheDocument()
    expect(screen.getByText('500 FCFA')).toBeInTheDocument()
    expect(screen.getByText(/régler cette dette avant de pouvoir accepter/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Régler la dette/ })).toBeInTheDocument()
  })

  it('affiche le montant restant après un règlement partiel', () => {
    mockFin.mockReturnValue({
      isLoading: false,
      isError: false,
      commissionDebt: 400,
      canAcceptNewDeliveries: false,
      hasDebt: true,
      debtLimit: 0,
    } as ReturnType<typeof useDriverFinancialState>)
    renderNotice()
    expect(screen.getByText('400 FCFA')).toBeInTheDocument()
  })

  it('affiche l\'état sain et supprime le message de dette quand commissionDebt = 0', () => {
    mockFin.mockReturnValue({
      isLoading: false,
      isError: false,
      commissionDebt: 0,
      canAcceptNewDeliveries: true,
      hasDebt: false,
      debtLimit: 0,
    } as ReturnType<typeof useDriverFinancialState>)
    renderNotice({ showClearState: true })
    expect(screen.getByText(/Vous pouvez accepter de nouveaux colis/)).toBeInTheDocument()
    expect(screen.queryByText(/Dette de commission/)).not.toBeInTheDocument()
  })
})
