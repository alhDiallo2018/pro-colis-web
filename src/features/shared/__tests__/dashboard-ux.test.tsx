import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import { ClientDashboard } from '@/features/client/ClientDashboard'
import { DriverDashboard } from '@/features/driver/DriverDashboard'

vi.mock('@/lib/useMediaQuery', () => ({ useMediaQuery: () => false, useIsMobile: () => false }))
const state = vi.hoisted(() => ({ parcels: {} as any, offers: {} as any, stats: {} as any, empty: {} as any }))
vi.mock('@/features/client/hooks', () => ({useMyParcels: () => state.parcels, useReceivedBids: () => state.offers}))
vi.mock('@/features/shared/profile/hooks', () => ({useMyStats: () => state.stats, useMyBidStats: () => state.stats, useMyDriverStats: () => state.stats}))
vi.mock('@/features/driver/hooks', () => ({
  useDriverParcels: () => state.parcels, useDriverFreeParcels: () => state.parcels,
  useDriverBidsSent: () => state.offers, useMyAdvertisements: () => state.offers,
  useScoreBalance: () => state.empty, useDriverWallet: () => state.empty,
  useDriverFinancialState: () => ({isLoading:true, isBlocked:false}),
}))
vi.mock('@/lib/useZoneFilter', () => ({useZoneFilter: (items: unknown[]) => ({items, mode:'all',setMode:vi.fn(),hasZone:false,zone:{}})}))
vi.mock('@/features/driver/ProposalsPanel', () => ({ProposalsPanel: () => null}))
vi.mock('@/features/driver/CommissionDebtNotice', () => ({CommissionDebtNotice: () => null}))
vi.mock('@/features/driver/OfferDialog', () => ({OfferDialog: () => null}))
vi.mock('@/features/driver/CreateAnnonceDialog', () => ({CreateAnnonceDialog: () => null}))
vi.mock('@/features/driver/RechargeDialog', () => ({RechargeDialog: () => null}))
vi.mock('@/features/driver/ItineraireDialog', () => ({ItineraireDialog: ({open}: {open:boolean}) => open ? <p>Itinéraire ouvert</p> : null}))
vi.mock('@/components/ParcelDetailDialog', () => ({ParcelDetailDialog: ({parcel}: {parcel:unknown}) => parcel ? <p>Détail ouvert</p> : null}))
const query = (data?: unknown) => ({data, isLoading:false,isError:false,refetch:vi.fn()})
function Location() {const location=useLocation();return <output aria-label="Destination">{location.pathname + location.search}</output>}
function show(node: React.ReactNode) {return render(<MemoryRouter>{node}<Location /></MemoryRouter>)}
const parcel={id:'parcel-1',trackingNumber:'PC-TEST-1',status:'in_transit',departureCity:'Dakar',arrivalCity:'Thiès',receiverName:'Test',price:4500}
beforeEach(() => { state.parcels=query({parcels:[parcel]});state.offers=query([]);state.stats=query();state.empty=query() })

it('le bouton Suivre ouvre le suivi prérempli sans être remplacé par le clic de la carte', async () => {
  show(<ClientDashboard />)
  await userEvent.click(screen.getByRole('button',{name:'Suivre'}))
  expect(screen.getByLabelText('Destination')).toHaveTextContent('/client/suivi?tracking=PC-TEST-1')
})
it('le client ne voit pas un faux état vide pendant le chargement', () => {
  state.parcels={...query(),isLoading:true};state.offers={...query(),isLoading:true}
  show(<ClientDashboard />)
  expect(screen.getByText('Chargement de vos colis…')).toBeInTheDocument()
  expect(screen.queryByText(/Aucun colis en cours/)).not.toBeInTheDocument()
  expect(screen.queryByText(/Aucune offre reçue pour le moment/)).not.toBeInTheDocument()
})
it('une panne chauffeur affiche une reprise au lieu de faux montants ou missions vides', async () => {
  state.parcels={...query(),isError:true};state.offers={...query(),isError:true}
  show(<DriverDashboard />)
  expect(screen.getByRole('alert')).toHaveTextContent('Certaines données')
  expect(screen.queryByText(/Aucune mission en cours/)).not.toBeInTheDocument()
  expect(screen.queryByText('0 FCFA')).not.toBeInTheDocument()
  await userEvent.click(screen.getAllByRole('button', {name:'Réessayer'})[0])
  expect(state.parcels.refetch).toHaveBeenCalled()
})
it('ouvrir l’itinéraire ne déclenche pas aussi le détail de mission', async () => {
  show(<DriverDashboard />)
  await userEvent.click(screen.getByRole('button',{name:'Itinéraire'}))
  expect(screen.getByText('Itinéraire ouvert')).toBeInTheDocument()
  expect(screen.queryByText('Détail ouvert')).not.toBeInTheDocument()
})
