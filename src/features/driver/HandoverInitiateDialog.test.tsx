import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { HandoverInitiateDialog } from './HandoverInitiateDialog'
import type { Parcel } from '@/lib/api/types'
import * as api from '@/lib/api/handovers'

vi.mock('@/lib/api/handovers', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/handovers')>('@/lib/api/handovers')
  return {
    ...actual,
    initiateHandover: vi.fn(),
    listHandovers: vi.fn(),
    cancelHandover: vi.fn(),
    confirmHandover: vi.fn(),
  }
})

const UUID = '11111111-1111-4111-8111-111111111111'
const TARGET_DRIVER = '22222222-2222-4222-8222-222222222222'

let qc: QueryClient
const parcel: Parcel = {
  id: UUID,
  trackingNumber: 'PC-TEST',
  senderName: 'Aïcha',
  senderPhone: '+221770000000',
  receiverName: 'Dest',
  receiverPhone: '+221780000000',
  status: 'picked_up',
  driverId: 'me',
  price: 5000,
} as Parcel

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(api.listHandovers).mockResolvedValue([])
  qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
})
afterEach(() => { cleanup(); qc.clear() })

function mount() {
  return render(
    <QueryClientProvider client={qc}>
      <HandoverInitiateDialog parcel={parcel} onClose={() => {}} />
    </QueryClientProvider>,
  )
}

it("refuse un UUID destinataire mal formé et n'appelle pas l'API", async () => {
  const user = userEvent.setup(); mount()
  const input = await screen.findByLabelText(/Identifiant du chauffeur destinataire/i)
  await user.type(input, 'pas-un-uuid')
  const submit = screen.getByRole('button', { name: /Lancer le transfert/i })
  expect(submit).toBeDisabled()
  expect(api.initiateHandover).not.toHaveBeenCalled()
})

it("initie un transfert avec UUID valide et affiche PIN + jeton QR", async () => {
  vi.mocked(api.initiateHandover).mockResolvedValue({
    handover: {
      id: '33333333-3333-4333-8333-333333333333',
      parcelId: UUID, fromDriverId: 'me', toDriverId: TARGET_DRIVER,
      initiatedAt: new Date().toISOString(), status: 'pending_pickup',
    },
    pickupPin: '123456', pickupQrToken: 'secret-token-xyz',
  })
  const user = userEvent.setup(); mount()
  const input = await screen.findByLabelText(/Identifiant du chauffeur destinataire/i)
  await user.type(input, TARGET_DRIVER)
  await user.click(screen.getByRole('button', { name: /Lancer le transfert/i }))
  await waitFor(() => expect(api.initiateHandover).toHaveBeenCalledWith(UUID, { toDriverId: TARGET_DRIVER }))
  expect(await screen.findByText('123456')).toBeInTheDocument()
  expect(screen.getByText('secret-token-xyz')).toBeInTheDocument()
})
