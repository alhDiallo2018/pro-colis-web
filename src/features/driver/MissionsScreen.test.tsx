import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MissionsScreen } from './MissionsScreen'
import { useAdvanceParcel, useDriverFinancialState, useDriverParcels, useRespondToBid } from './hooks'
import type { Parcel } from '@/lib/api/types'

vi.mock('./hooks', () => ({
  useDriverParcels: vi.fn(),
  useDriverFinancialState: vi.fn(),
  useAdvanceParcel: vi.fn(),
  useDeliverParcel: vi.fn(),
  useRespondToBid: vi.fn(),
}))

vi.mock('./CommissionDebtNotice', () => ({ CommissionDebtNotice: () => null }))
vi.mock('./ProposalsPanel', () => ({ ProposalsPanel: () => null }))
vi.mock('./PayCommissionDialog', () => ({ PayCommissionDialog: () => null }))
vi.mock('./DeclareCashDialog', () => ({ DeclareCashDialog: () => null }))
vi.mock('./DriverCancelDialog', () => ({ DriverCancelDialog: () => null }))
vi.mock('@/components/ParcelDetailDialog', () => ({ ParcelDetailDialog: () => null }))
vi.mock('@/components/NegotiationChat', () => ({ NegotiationChat: () => null }))
vi.mock('@/components/NegotiationTurn', () => ({ NegotiationTurn: () => null }))
vi.mock('@/components/ParcelMedia', () => ({ ParcelMedia: () => null }))
vi.mock('@/store/auth', () => ({ useAuthStore: () => ({ user: { id: 'driver-1' } }) }))

const mockParcels = vi.mocked(useDriverParcels)
const mockFin = vi.mocked(useDriverFinancialState)
const mockAdvance = vi.mocked(useAdvanceParcel)
const mockRespond = vi.mocked(useRespondToBid)

/** Livraison déjà acceptée / assignée au chauffeur, en attente de confirmation. */
function assignedParcel(): Parcel {
  return {
    id: 'p1',
    trackingNumber: 'PC-0001',
    senderName: 'Aïcha',
    senderPhone: '+221770000000',
    receiverName: 'Destinataire',
    receiverPhone: '+221780000000',
    status: 'pending',
    driverId: 'driver-1',
    price: 5000,
  }
}

function renderScreen() {
  return render(
    <MemoryRouter>
      <MissionsScreen />
    </MemoryRouter>,
  )
}

describe('MissionsScreen — livraison déjà acceptée vs dette', () => {
  beforeEach(() => {
    mockParcels.mockReset()
    mockFin.mockReset()
    mockAdvance.mockReset()
    mockRespond.mockReset()

    mockParcels.mockReturnValue({
      data: { parcels: [assignedParcel()] },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDriverParcels>)
    mockAdvance.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      variables: undefined,
    } as unknown as ReturnType<typeof useAdvanceParcel>)
    mockRespond.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: null,
      variables: undefined,
    } as unknown as ReturnType<typeof useRespondToBid>)
  })

  it('commissionDebt > 0 : la progression d\'une livraison déjà acceptée reste disponible', () => {
    mockFin.mockReturnValue({
      isLoading: false,
      isError: false,
      commissionDebt: 500,
      canAcceptNewDeliveries: false,
      hasDebt: true,
      debtLimit: 0,
    } as ReturnType<typeof useDriverFinancialState>)
    renderScreen()

    const advance = screen.getByRole('button', { name: /Confirmer la prise en charge/ })
    expect(advance).toBeInTheDocument()
    expect(advance).not.toBeDisabled()
  })
})
