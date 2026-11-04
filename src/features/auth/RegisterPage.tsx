import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, Checkbox, Input, SegmentedControl, Toast } from '@/ds'
import { GoogleAuth } from './GoogleAuth'
import { AuthShell } from './AuthShell'
import { useRegister } from './useAuth'
import { loginDestination } from '@/routes/login-destination'
import { ApiError } from '@/lib/api/client'
import type { Role } from '@/lib/api/types'
import { LocationInput } from '@/components/LocationInput'
import { CountryCodePicker } from '@/components/CountryCodePicker'

const ROLE_OPTIONS = [
  { value: 'client', label: 'Envoyer un colis', icon: 'inventory_2' },
  { value: 'driver', label: 'Conduire', icon: 'local_shipping' },
]

const PERKS = [
  { icon: 'verified', text: 'Chauffeurs vérifiés & notés' },
  { icon: 'sell', text: 'Vous fixez le prix, les offres viennent' },
  { icon: 'qr_code_2', text: 'Suivi de bout en bout' },
]

export function RegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [googleActive, setGoogleActive] = useState(false)
  const registerMut = useRegister()
  const [role, setRole] = useState<Role>('client')
  const [fullName, setFullName] = useState('')
  const [city, setCity] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('+221')
  const [pin, setPin] = useState('')
  const [accepted, setAccepted] = useState(false)

  const pinValid = /^\d{6}$/.test(pin)
  const emailTrimmed = email.trim()
  const emailValid = emailTrimmed === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)
  const canSubmit = fullName.trim().length >= 2 && phone.trim().length >= 8 && pinValid && emailValid && accepted

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    registerMut.mutate(
      {
        role,
        fullName: fullName.trim(),
        city: city.trim() || null,
        email: emailTrimmed || null,
        phone: `${countryCode}${phone.trim()}`,
        pin,
      },
      { onSuccess: (session) => navigate(loginDestination(location.state, session.user.role), { replace: true }) },
    )
  }

  const error = registerMut.error instanceof ApiError ? registerMut.error.message : registerMut.error ? 'Inscription impossible' : null

  return (
    <AuthShell
      mode="register"
      brandWidth={440}
      formMaxWidth={560}
      brand={
        <>
          <div className="auth-brand-icon">
            <span className="material-symbols-rounded fill" aria-hidden="true">group_add</span>
          </div>
          <h2 className="auth-brand-title">Rejoignez le réseau SendProcolis.</h2>
          <p className="auth-brand-lead">
            Envoyez vos colis ou devenez chauffeur. Tout commence ici.
          </p>
          <div className="auth-brand-perks">
            {PERKS.map((p) => (
              <div key={p.text} className="auth-brand-perks-item">
                <span className="material-symbols-rounded" aria-hidden="true">{p.icon}</span>
                {p.text}
              </div>
            ))}
          </div>
        </>
      }
    >
      <div className="auth-header">
        <h1 className="auth-title">Créer un compte</h1>
        <p className="auth-lead">Quelques informations et vous êtes prêt.</p>
      </div>

      <GoogleAuth
        onFlowChange={setGoogleActive}
        initialRole={role === 'driver' ? 'driver' : 'client'}
        onSuccess={session => navigate(loginDestination(location.state, session.user.role), { replace: true })}
      />

      {!googleActive && (
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: 'var(--text-body)', marginBottom: 8 }}>Je veux…</div>
            <SegmentedControl block options={ROLE_OPTIONS} value={role} onChange={(v) => setRole(v as Role)} />
          </div>

          <div className="pc-field-pair" style={{ gap: 16 }}>
            <Input label="Nom complet" icon="badge" placeholder="Ex : Aïcha Mballa" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <LocationInput
              label="Ville"
              icon="location_on"
              placeholder="Votre ville..."
              value={city}
              onChange={setCity}
            />
          </div>

          <Input
            label="Email (facultatif)"
            icon="mail"
            type="email"
            autoComplete="email"
            placeholder="aicha@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={emailValid ? undefined : 'Adresse email invalide'}
            help="Permet aussi de vous connecter et de récupérer votre compte si vous oubliez votre code PIN."
          />

          <div className="pc-field-pair" style={{ gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              <label style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: 'var(--text-body)' }}>
                Téléphone
              </label>
              <div style={{ display: 'flex', gap: 0, alignItems: 'stretch' }}>
                <CountryCodePicker value={countryCode} onChange={(code) => setCountryCode(code)} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Input
                    mono
                    placeholder="77 123 45 67"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, marginLeft: -1 }}
                  />
                </div>
              </div>
            </div>
            <Input
              label="Code PIN"
              icon="lock"
              type="password"
              inputMode="numeric"
              mono
              placeholder="6 chiffres"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
          </div>

          <Checkbox
            checked={accepted}
            onChange={setAccepted}
            label="J’accepte les conditions de transport et la politique de confidentialité."
          />

          {error && <Toast tone="error" message={error} />}

          <Button type="submit" block size="lg" icon="person_add" loading={registerMut.isPending} disabled={!canSubmit}>
            Créer mon compte
          </Button>
        </form>
      )}

      <p className="auth-footer-row">
        Déjà un compte ?{' '}
        <button type="button" onClick={() => navigate('/login', { state: location.state })}>
          Se connecter
        </button>
      </p>
    </AuthShell>
  )
}
