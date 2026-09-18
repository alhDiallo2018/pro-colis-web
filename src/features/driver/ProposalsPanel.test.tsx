import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProposalsPanel } from './ProposalsPanel'
import { useDriverFinancialState, useDriverProposals, useRespondToProposal } from './hooks'
import type { Parcel } from '@/lib/api/types'

vi.mock('./hooks', () => ({
  useDriverFinancialState: vi.fn(),
  useDriverProposals: vi.fn(),
  useRespondToProposal: vi.fn(),
}))

const mockFin = vi.mocked(useDriverFinancialState)
const mockProposals = vi.mocked(useDriverProposals)
const mockRespond = vi.mocked(useRespondToProposal)

function proposalParcel(): Parcel {
  return {
    id: 'p1',
    trackingNumber: 'PC-0001',
    senderName: 'Aïcha',
    senderPhone: '+221770000000',
    receiverName: 'Destinataire',
    receiverPhone: '+221780000000',
    status: 'proposal_sent',
    price: 5000,
    proposal: {
      status: 'pending',
      lastOfferBy: 'client',
      negotiationCount: 0,
      canClientAccept: false,
      canDriverAccept: true,
    },
  }
}

function renderPanel() {
  return render(
    <MemoryRouter>
      <ProposalsPanel />
    </MemoryRouter>,
  )
}

describe('ProposalsPanel — acceptation vs dette', () => {
  beforeEach(() => {
    mockFin.mockReset()
    mockProposals.mockReset()
    mockRespond.mockReset()
    mockProposals.mockReturnValue({
      data: [proposalParcel()],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDriverProposals>)
    mockRespond.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: null,
      variables: undefined,
    } as unknown as ReturnType<typeof useRespondToProposal>)
  })

  it('commissionDebt = 0 → bouton Accepter disponible', () => {
    mockFin.mockReturnValue({
      isLoading: false,
      isError: false,
      commissionDebt: 0,
      canAcceptNewDeliveries: true,
      hasDebt: false,
      isBlocked: false,
      debtLimit: 0,
    } as ReturnType<typeof useDriverFinancialState>)
    renderPanel()
    const accept = screen.getByRole('button', { name: /Accepter/ })
    expect(accept).toBeInTheDocument()
    expect(accept).not.toBeDisabled()
    expect(screen.queryByRole('button', { name: /Dette à régler/ })).not.toBeInTheDocument()
  })

  it('une dette sous le seuil ne bloque pas le bouton Accepter', () => {
    mockFin.mockReturnValue({
      isLoading: false,
      isError: false,
      commissionDebt: 500,
      canAcceptNewDeliveries: true,
      hasDebt: true,
      isBlocked: false,
      debtLimit: 1000,
    } as ReturnType<typeof useDriverFinancialState>)
    renderPanel()
    expect(screen.getByRole('button', { name: /Accepter/ })).not.toBeDisabled()
  })

  it('commissionDebt = 500 → bouton Accepter bloqué et message de dette affiché', () => {
    mockFin.mockReturnValue({
      isLoading: false,
      isError: false,
      commissionDebt: 500,
      canAcceptNewDeliveries: false,
      hasDebt: true,
      isBlocked: true,
      debtLimit: 0,
    } as ReturnType<typeof useDriverFinancialState>)
    renderPanel()
    const blocked = screen.getByRole('button', { name: /Dette à régler/ })
    expect(blocked).toBeDisabled()
    expect(screen.queryByRole('button', { name: /^Accepter/ })).not.toBeInTheDocument()
    expect(blocked.getAttribute('title')).toContain('500 FCFA')
  })

  it('pendant le chargement, l\'acceptation n\'est pas activée prématurément', () => {
    mockFin.mockReturnValue({
      isLoading: true,
      isError: false,
      commissionDebt: 0,
      canAcceptNewDeliveries: false,
      hasDebt: false,
      isBlocked: true,
      debtLimit: 0,
    } as ReturnType<typeof useDriverFinancialState>)
    renderPanel()
    expect(screen.getByRole('button', { name: /Chargement/ })).toBeDisabled()
  })
})
