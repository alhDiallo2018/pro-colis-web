import { render, screen, fireEvent } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CancellationDialog } from './CancellationDialog'
import { useCancelParcel, useCancellationQuote } from '@/features/client/hooks'
import { ApiError } from '@/lib/api/client'
import { CANCELLATION_ALREADY_CANCELLED } from '@/lib/cancellation'
import type { Parcel } from '@/lib/api/types'

vi.mock('@/features/client/hooks', () => ({
  useCancellationQuote: vi.fn(),
  useCancelParcel: vi.fn(),
}))

const mockQuote = vi.mocked(useCancellationQuote)
const mockCancel = vi.mocked(useCancelParcel)

const parcel = { id: 'p-1', trackingNumber: 'PC-123', status: 'confirmed' } as Parcel

function quoteState(data: unknown, isLoading = false) {
  return { data, isLoading, isError: false, error: null, refetch: vi.fn() } as unknown as ReturnType<typeof useCancellationQuote>
}

function cancelState(overrides: Record<string, unknown> = {}) {
  return {
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
    isSuccess: false,
    error: null,
    data: undefined,
    ...overrides,
  } as unknown as ReturnType<typeof useCancelParcel>
}

describe('CancellationDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQuote.mockReturnValue(quoteState(undefined))
    mockCancel.mockReturnValue(cancelState())
  })

  it('affiche les conséquences dynamiques retournées par le devis', () => {
    mockQuote.mockReturnValue(
      quoteState({
        allowed: true,
        penalized: true,
        exempt: false,
        responsibility: 'client',
        paidAmount: 1400,
        penalty: 500,
        refund: 900,
        refundStatus: 'pending',
      })
    )
    render(<CancellationDialog parcel={parcel} onClose={vi.fn()} />)

    expect(screen.getByText('Client responsable')).toBeInTheDocument()
    expect(screen.getByText('1 400 FCFA')).toBeInTheDocument()
    expect(screen.getByText('- 500 FCFA')).toBeInTheDocument()
    expect(screen.getByText('900 FCFA')).toBeInTheDocument()
    expect(screen.getByText('Remboursement en attente')).toBeInTheDocument()
  })

  it('sans devis, affiche une confirmation neutre sans montant inventé', () => {
    render(<CancellationDialog parcel={parcel} onClose={vi.fn()} />)

    expect(screen.queryByText('Pénalité')).not.toBeInTheDocument()
    expect(screen.queryByText('Montant payé')).not.toBeInTheDocument()
    expect(screen.queryByText(/FCFA/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Annuler le colis/ })).toBeInTheDocument()
  })

  it('bloque le bouton pendant la requête', () => {
    mockCancel.mockReturnValue(cancelState({ isPending: true }))
    render(<CancellationDialog parcel={parcel} onClose={vi.fn()} />)

    expect(screen.getByRole('button', { name: /Annuler le colis/ })).toBeDisabled()
  })

  it('transmet le motif et empêche la double soumission après succès', () => {
    let success = false
    const mutate = vi.fn((_vars: unknown, opts?: { onSuccess?: (r: unknown) => void }) => {
      opts?.onSuccess?.({ parcel: { id: 'p-1', status: 'cancelled' }, exempt: true, penalized: false, allowed: true, responsibility: 'exempt' })
      success = true
    })
    const state = cancelState({ mutate })
    Object.defineProperty(state, 'isSuccess', { get: () => success })
    mockCancel.mockReturnValue(state)
    mockQuote.mockReturnValue(
      quoteState({
        allowed: true,
        penalized: false,
        exempt: false,
        responsibility: null,
        reasons: [{ value: 'sick', label: 'Maladie' }],
      })
    )
    render(<CancellationDialog parcel={parcel} onClose={vi.fn()} />)

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'sick' } })

    fireEvent.click(screen.getByRole('button', { name: /Annuler le colis/ }))
    expect(mutate).toHaveBeenCalledTimes(1)
    expect(mutate.mock.calls[0][0]).toEqual({ reason: 'sick' })

    // Après succès, la modale passe en état terminé : plus de bouton de confirmation.
    expect(screen.queryByRole('button', { name: /Annuler le colis/ })).not.toBeInTheDocument()
    expect(screen.getByText('Votre annulation a bien été prise en compte.')).toBeInTheDocument()
  })

  it('affiche un message d\'erreur compréhensible sans exposer le code technique', () => {
    const error = new ApiError('Déjà annulé', CANCELLATION_ALREADY_CANCELLED, 409)
    mockCancel.mockReturnValue(cancelState({ error }))
    render(<CancellationDialog parcel={parcel} onClose={vi.fn()} />)

    expect(screen.getByText('Ce colis a déjà été annulé.')).toBeInTheDocument()
    expect(screen.queryByText(CANCELLATION_ALREADY_CANCELLED)).not.toBeInTheDocument()
  })

  it('ne révèle jamais les données privées du chauffeur au client', () => {
    mockQuote.mockReturnValue(
      quoteState({
        allowed: true,
        penalized: true,
        exempt: false,
        responsibility: 'shared',
        penalty: 500,
        driver: {
          penalty: 250,
          fees: 0,
          refund: 0,
          walletDeduction: 250,
          walletBefore: 5000,
          walletAfter: 4750,
          pointsDeduction: 10,
          pointsBefore: 100,
          pointsAfter: 90,
          debtAmount: 0,
          debtBefore: 0,
          debtAfter: 0,
        },
      })
    )
    render(<CancellationDialog parcel={parcel} onClose={vi.fn()} />)

    expect(screen.queryByText(/wallet/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/points/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/dette/i)).not.toBeInTheDocument()
    expect(screen.queryByText('5 000 FCFA')).not.toBeInTheDocument()
    expect(screen.queryByText('4 750 FCFA')).not.toBeInTheDocument()
  })
})
