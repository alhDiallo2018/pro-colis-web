import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button, Checkbox, Input, SegmentedControl, Toast } from '@/ds'
import { ApiError } from '@/lib/api/client'
import { googleConfiguration, startGoogle, linkGoogle, sendGoogleOtp, registerGoogle, type GoogleChallenge, type GoogleSession } from '@/lib/api/googleAuth'
import { useAuthStore } from '@/store/auth'
import type { AuthSession } from '@/lib/api/types'
import { renderGoogleButton } from './googleIdentity'
import './google-auth.css'

interface Props {
  onSuccess: (session: AuthSession) => void
  onFlowChange: (active: boolean) => void
  initialRole?: 'client' | 'driver'
}
const digits = (value: string) => value.replace(/\D/g, '').slice(0, 6)

export function GoogleAuth({ onSuccess, onFlowChange, initialRole = 'client' }: Props) {
  const config = useQuery({ queryKey: ['auth', 'google-config'], queryFn: googleConfiguration, retry: false, staleTime: 60000 })
  const [challenge, setChallenge] = useState<GoogleChallenge | null>(null)
  const [view, setView] = useState<'link' | 'profile'>('profile')
  const [identifier, setIdentifier] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('+221')
  const [sentPhone, setSentPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [pin, setPin] = useState('')
  const [role, setRole] = useState(initialRole)
  const [accepted, setAccepted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sdkError, setSdkError] = useState(false)
  const [sdkReady, setSdkReady] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [retryAt, setRetryAt] = useState(0)
  const [now, setNow] = useState(Date.now())
  const host = useRef<HTMLDivElement>(null)
  const flight = useRef(false)
  const generation = useRef(0)
  const success = useRef(onSuccess)
  success.current = onSuccess
  const flowChanged = useRef(onFlowChange)
  flowChanged.current = onFlowChange
  const initial = useRef(initialRole)
  initial.current = initialRole

  useEffect(() => () => { generation.current++ }, [])
  useEffect(() => {
    if (!challenge) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [challenge])
  const reset = useCallback(() => {
    generation.current++
    flight.current = false
    setBusy(false)
    setChallenge(null)
    setPin(''); setOtp(''); setAccepted(false); setSentPhone(''); setRetryAt(0); setPhone('+221')
    setIdentifier(''); setFullName(''); setError('')
    flowChanged.current(false)
  }, [])
  const complete = useCallback((session: GoogleSession) => {
    useAuthStore.getState().setSession(session)
    reset()
    success.current(session)
  }, [reset])

  // Le verrou immediat couvre les doubles clics ; la generation ignore toute
  // reponse arrivee apres annulation ou demontage. Les challenges restent en memoire.
  const run = useCallback(async <T,>(operation: () => Promise<T>, accept: (value: T) => void) => {
    if (flight.current) return
    const current = generation.current
    flight.current = true
    setBusy(true); setError('')
    try {
      const result = await operation()
      if (generation.current === current) accept(result)
    } catch (failure) {
      if (generation.current !== current) return
      if (failure instanceof ApiError && failure.code === 'GOOGLE_CHALLENGE_EXPIRED') reset()
      setError(failure instanceof ApiError ? failure.message : 'Connexion Google impossible. Veuillez réessayer.')
    } finally {
      if (generation.current === current) { flight.current = false; setBusy(false) }
    }
  }, [reset])
  const credential = useCallback((idToken: string) => {
    void run(() => startGoogle(idToken), result => {
      if (result.status === 'authenticated') { complete(result); return }
      setChallenge(result); setNow(Date.now()); setFullName(result.fullName); setIdentifier(result.email)
      setRole(initial.current); setView(result.status === 'link_required' ? 'link' : 'profile')
      flowChanged.current(true)
    })
  }, [run, complete])

  useEffect(() => {
    if (!config.data?.enabled || !config.data.serverClientId || challenge || !host.current) return
    let cancelled = false
    let dispose: (() => void) | undefined
    setSdkError(false); setSdkReady(false)
    void renderGoogleButton(host.current, config.data.serverClientId, credential).then(cleanup => {
      if (cancelled) cleanup()
      else { dispose = cleanup; setSdkReady(true) }
    }).catch(() => { if (!cancelled) setSdkError(true) })
    return () => { cancelled = true; dispose?.() }
  }, [config.data, challenge, credential, attempt])

  const expired = challenge ? now >= new Date(challenge.expiresAt).getTime() : false
  const locked = busy || expired
  const cooldown = Math.max(0, Math.ceil((retryAt - now) / 1000))
  const phoneValid = /^\+[1-9]\d{7,14}$/.test(phone)
  const pinValid = /^\d{6}$/.test(pin)
  const profileValid = fullName.trim().length >= 2 && phoneValid && sentPhone === phone && /^\d{6}$/.test(otp) && pinValid && accepted

  if (!challenge) return <section className="pc-google-auth" aria-label="Connexion ou inscription avec Google" aria-busy={busy}>
    <div ref={host} className="pc-google-button" hidden={sdkError || !config.data?.enabled || busy} />
    {busy && <p role="status">Connexion à votre compte…</p>}
    {!busy && config.isPending && <p role="status">Chargement de Google…</p>}
    {!busy && config.data?.enabled && !sdkReady && !sdkError && <p role="status">Chargement du bouton Google…</p>}
    {(config.isError || config.data?.enabled === false || sdkError) && <p className="pc-google-unavailable">La connexion Google est momentanément indisponible.</p>}
    {(config.isError || sdkError) && <Button type="button" onClick={() => { void config.refetch(); setAttempt(value => value + 1) }}>Réessayer Google</Button>}
    {error && <Toast tone="error" message={error} />}
    <div className="pc-google-divider"><span>ou avec votre téléphone / email</span></div>
  </section>

  return <section className="pc-google-auth pc-google-profile" aria-label="Finaliser la connexion Google" aria-busy={busy}>
    <p className="pc-google-eyebrow">COMPTE GOOGLE VÉRIFIÉ</p>
    <p className="pc-google-email">{challenge.email}</p>
    <h2>{view === 'link' ? 'Retrouver mon compte' : 'Bienvenue chez ProColis'}</h2>
    <p>{view === 'link' ? 'Saisissez le PIN de votre compte ProColis pour l’associer à Google.' : 'Confirmez votre téléphone pour recevoir les informations de livraison.'}</p>
    <form onSubmit={event => {
      event.preventDefault()
      if (locked) return
      if (view === 'link') {
        if (!identifier.trim() || !pinValid) return
        void run(() => linkGoogle({ challengeToken: challenge.challengeToken, identifier: identifier.trim(), pin }), complete)
      } else if (profileValid) {
        void run(() => registerGoogle({ challengeToken: challenge.challengeToken, phone, otpCode: otp,
          fullName: fullName.trim(), pin, role, acceptedTerms: true }), result => {
          if (result.status === 'authenticated') complete(result)
          else {
            // Un numero deja utilise impose une preuve du PIN existant ; le
            // challenge original reste valide mais ne cree jamais un doublon.
            setChallenge({ ...challenge, status: 'link_required' }); setView('link')
            setIdentifier(result.identifier); setPin(''); setOtp(''); setAccepted(false)
          }
        })
      }
    }}>
      {view === 'link' ? <Input label="Email ou téléphone du compte existant" autoComplete="username" value={identifier} disabled={locked} onChange={event => setIdentifier(event.target.value)} /> : <>
        <Input label="Nom complet" autoComplete="name" value={fullName} maxLength={100} disabled={locked} onChange={event => setFullName(event.target.value)} />
        <div><p className="pc-google-label">Je souhaite</p><SegmentedControl block options={[
          { value: 'client', label: 'Envoyer un colis' }, { value: 'driver', label: 'Conduire' },
        ]} value={role} onChange={value => { if (!locked) setRole(value as 'client' | 'driver') }} /></div>
        <Input label="Téléphone avec indicatif" type="tel" autoComplete="tel" placeholder="+221771234567" value={phone} disabled={locked}
          onChange={event => { setPhone(event.target.value.replace(/[\s().-]/g, '')); setOtp('') }} />
        <Button type="button" disabled={locked || !phoneValid || cooldown > 0} onClick={() => {
          void run(() => sendGoogleOtp({ challengeToken: challenge.challengeToken, phone }), result => {
            if (!result.sent) { setError('Le SMS n’a pas pu être envoyé.'); return }
            setSentPhone(phone); setOtp(''); setNow(Date.now()); setRetryAt(Date.now() + result.retryAfterSeconds * 1000)
          })
        }}>{cooldown > 0 ? `Renvoyer dans ${cooldown} s` : sentPhone ? 'Renvoyer le code SMS' : 'Recevoir le code SMS'}</Button>
        {sentPhone && <p role="status">Code envoyé au {sentPhone}.</p>}
        <Input label="Code reçu par SMS" inputMode="numeric" autoComplete="one-time-code" value={otp} disabled={locked || sentPhone !== phone} onChange={event => setOtp(digits(event.target.value))} />
      </>}
      <Input label={view === 'link' ? 'PIN du compte existant' : 'Créer un PIN à 6 chiffres'} type="password" inputMode="numeric"
        autoComplete={view === 'link' ? 'current-password' : 'new-password'} value={pin} disabled={locked} onChange={event => setPin(digits(event.target.value))} />
      {view === 'profile' && <Checkbox checked={accepted} onChange={setAccepted} disabled={locked} label="J’accepte les conditions de transport et la politique de confidentialité." />}
      {expired && <Toast tone="error" message="Cette demande a expiré. Recommencez avec Google." />}
      {error && <Toast tone="error" message={error} />}
      <Button type="submit" block size="lg" loading={busy} disabled={locked || (view === 'link' ? !identifier.trim() || !pinValid : !profileValid)}>
        {view === 'link' ? 'Associer et me connecter' : 'Créer mon compte avec Google'}
      </Button>
    </form>
    {view === 'profile' && <Button type="button" disabled={locked} onClick={() => { setView('link'); setPin(''); setError('') }}>J’ai déjà un compte ProColis</Button>}
    {view === 'link' && challenge.status === 'profile_required' && <Button type="button" disabled={locked} onClick={() => { setView('profile'); setPin(''); setError('') }}>Créer un nouveau compte</Button>}
    <Button type="button" onClick={reset}>{expired ? 'Recommencer avec Google' : 'Utiliser une autre méthode'}</Button>
  </section>
}
