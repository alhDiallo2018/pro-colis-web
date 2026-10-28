import {afterEach,beforeEach,it,expect,vi} from 'vitest'
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react'
import {QueryClient,QueryClientProvider} from '@tanstack/react-query'
import {NegotiationChat} from './NegotiationChat'
import {useAuthStore} from '@/store/auth'
import * as messages from '@/lib/api/messages'
import * as ads from '@/lib/api/advertisements'
vi.mock('@/lib/api/messages',()=>({thread:vi.fn(),send:vi.fn(),isMessageEditable:()=>false}))
vi.mock('@/lib/api/advertisements',()=>({negotiateOffer:vi.fn()}))
let qc:QueryClient
beforeEach(()=>{vi.resetAllMocks();Object.defineProperty(HTMLElement.prototype,'scrollTo',{configurable:true,value:vi.fn()});useAuthStore.setState({user:{id:'driver',role:'driver'} as any});qc=new QueryClient({defaultOptions:{queries:{retry:false}}});vi.mocked(messages.thread).mockResolvedValue([])})
afterEach(()=>{cleanup();qc.clear()})
function prepare(){render(<QueryClientProvider client={qc}><NegotiationChat peerId="client" peerName="Client" advertisementId="trip" offerId="offer"/></QueryClientProvider>);fireEvent.click(screen.getByRole('button',{name:'Proposer un prix'}));fireEvent.change(screen.getByRole('spinbutton',{name:'Votre proposition (FCFA)'}),{target:{value:'2500'}});fireEvent.change(screen.getByRole('textbox',{name:'Votre message'}),{target:{value:'Pour ce colis de 12 kg.'}})}
it('ne publie pas une fausse proposition dans le chat si la négociation est refusée',async()=>{vi.mocked(ads.negotiateOffer).mockRejectedValue(new Error('Ce n’est pas votre tour'));prepare();fireEvent.click(screen.getByRole('button',{name:'Envoyer l’offre'}));await screen.findByText('Ce n’est pas votre tour');expect(messages.send).not.toHaveBeenCalled();expect(screen.getByRole('textbox')).toHaveValue('Pour ce colis de 12 kg.');expect(screen.getByRole('spinbutton')).toHaveValue(2500)})
it('ne renégocie pas deux fois si seul le message échoue après enregistrement du tarif',async()=>{vi.mocked(ads.negotiateOffer).mockResolvedValue({id:'offer'} as any);vi.mocked(messages.send).mockRejectedValueOnce(new Error('Réseau indisponible')).mockResolvedValueOnce({id:'sent'} as any);prepare();fireEvent.click(screen.getByRole('button',{name:'Envoyer l’offre'}));await screen.findByText(/Votre proposition a été enregistrée/);expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'Envoyer'}));await waitFor(()=>expect(messages.send).toHaveBeenCalledTimes(2));expect(ads.negotiateOffer).toHaveBeenCalledTimes(1);expect(vi.mocked(messages.send).mock.calls[1][0].body).toBe('Pour ce colis de 12 kg.')})
