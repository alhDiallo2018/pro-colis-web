/** GIS recoit uniquement l'identifiant public du client OAuth. Le JWT retourne
 * est transmis a l'API : aucune identite n'est deduite de son contenu cote web.
 */
interface IdentitySdk {
  initialize: (config: { client_id: string; callback: (response: { credential: string }) => void; auto_select: boolean; ux_mode: 'popup' }) => void
  renderButton: (element: HTMLElement, config: { type: 'standard'; theme: 'outline'; size: 'large'; text: 'continue_with'; shape: 'rectangular'; locale: string; width: number }) => void
}
const identity = () => (window as unknown as { google?: { accounts?: { id?: IdentitySdk } } }).google?.accounts?.id
let loading: Promise<IdentitySdk> | undefined
let initializedClient: string | undefined
let receiver: { token: symbol; callback: (credential: string) => void } | undefined
const owners = new WeakMap<HTMLElement, symbol>()

function loadIdentity(): Promise<IdentitySdk> {
  const existing = identity()
  if (existing) return Promise.resolve(existing)
  if (loading) return loading
  loading = new Promise<IdentitySdk>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    const timeout = window.setTimeout(() => finish(), 15000)
    const finish = (sdk?: IdentitySdk) => {
      window.clearTimeout(timeout)
      script.onload = null
      script.onerror = null
      if (sdk) resolve(sdk)
      else { script.remove(); reject(new Error('Google indisponible')) }
    }
    script.onload = () => finish(identity())
    script.onerror = () => finish()
    document.head.appendChild(script)
  }).catch(error => { loading = undefined; throw error })
  return loading
}

export async function renderGoogleButton(element: HTMLElement, clientId: string, onCredential: (credential: string) => void) {
  const sdk = await loadIdentity()
  // Une page quittee pendant le chargement ne peut pas recuperer la prochaine
  // connexion. GIS est initialise une seule fois par client, meme dans la SPA.
  if (!element.isConnected) return () => {}
  if (initializedClient !== clientId) {
    sdk.initialize({ client_id: clientId, auto_select: false, ux_mode: 'popup',
      callback: response => { if (response.credential) receiver?.callback(response.credential) } })
    initializedClient = clientId
  }
  const token = Symbol()
  receiver = { token, callback: onCredential }
  owners.set(element, token)
  sdk.renderButton(element, { type: 'standard', theme: 'outline', size: 'large',
    text: 'continue_with', shape: 'rectangular', locale: 'fr',
    width: Math.min(400, Math.max(200, element.clientWidth || 320)) })
  return () => {
    if (receiver?.token === token) receiver = undefined
    if (owners.get(element) === token) { owners.delete(element); element.replaceChildren() }
  }
}
