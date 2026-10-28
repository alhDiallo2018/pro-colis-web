import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ParcelExperience } from './ParcelExperience'
import { parseShipmentLines } from './shipmentLines'
import { receiptText, type Experience } from './api'
import { api } from '@/lib/api/client'
vi.mock('@/lib/api/client', () => ({ api: { get: vi.fn(), post: vi.fn() } }))
const value: Experience = { trackingNumber:'SP-001',nextAction:{title:'Recevoir le colis',description:'Donnez le code lors de la remise.'},tracking:{lastPositionAt:null,positionFresh:false,estimatedDeliveryAt:null,overdue:true},finance:{agreedPrice:2000,collected:0,parcelPenaltyDue:0,paymentStatus:'pending'},receipts:[],complaints:[],canRepeat:true }
function setup() {
  const client = new QueryClient({defaultOptions:{queries:{retry:false}}})
  return render(<QueryClientProvider client={client}><MemoryRouter><ParcelExperience parcelId="p1" /></MemoryRouter></QueryClientProvider>)
}
describe('outils de livraison', () => {
  it('refuse un lot mal formé avant toute publication', () => {
    expect(() => parseShipmentLines('Awa;770000000;Documents;0')).toThrow('Ligne 1')
    expect(() => parseShipmentLines(Array(51).fill('A;770000000;Colis;1').join('\n'))).toThrow('50')
    const draft = parseShipmentLines('Awa;+221770000000;Documents;1,5')[0]
    expect(draft.data.weight).toBe(1.5)
    expect(draft.data).not.toHaveProperty('price')
  })
  it('affiche le retard et la copie sans inventer de reçu', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({data:{experience:value}})
    setup()
    expect(await screen.findByText('Recevoir le colis')).toBeInTheDocument()
    expect(screen.getByText(/heure estimée de livraison est dépassée/)).toBeInTheDocument()
    expect(screen.getByRole('link',{name:'Envoyer un colis similaire'})).toHaveAttribute('href','/client/nouveau?source=p1')
    expect(screen.queryByRole('button',{name:/Reçu de/})).not.toBeInTheDocument()
    expect(screen.queryByText('Dette actuelle du compte')).not.toBeInTheDocument()
  })
  it('garde la saisie de réclamation après une panne', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({data:{experience:value}})
    vi.mocked(api.post).mockRejectedValueOnce(new Error('Connexion interrompue'))
    setup()
    fireEvent.click(await screen.findByRole('button',{name:'Signaler un problème'}))
    fireEvent.change(screen.getByLabelText('Décrivez le problème'),{target:{value:'Le colis est arrivé abîmé.'}})
    fireEvent.click(screen.getByRole('button',{name:'Envoyer la réclamation'}))
    expect(await screen.findByText('Connexion interrompue')).toBeInTheDocument()
    expect(screen.getByLabelText('Décrivez le problème')).toHaveValue('Le colis est arrivé abîmé.')
  })
  it('le justificatif est lié au paiement confirmé et au colis', () => {
    expect(receiptText({id:'pay1',reference:'ref1',amount:2500,method:'cash',createdAt:'2026-10-28T10:00:00Z'},'SP-001')).toContain('Référence : ref1')
  })
})
