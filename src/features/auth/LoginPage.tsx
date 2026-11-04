import { useState, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button, Input, Toast } from '@/ds'
import { GoogleAuth } from './GoogleAuth'
import { AuthShell } from './AuthShell'
import { useLogin } from './useAuth'
import { loginDestination } from '@/routes/login-destination'
import type { AuthSession } from '@/lib/api/types'
import { ApiError } from '@/lib/api/client'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useLogin()
  const [googleActive, setGoogleActive] = useState(false)
  const [identifier, setIdentifier] = useState('')
  const [pin, setPin] = useState('')
  const prevPinRef = useRef('')

  const onLoginSuccess = (session: AuthSession) => {
    navigate(loginDestination(location.state, session.user.role), { replace: true })
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    login.mutate(
      { identifier: identifier.trim(), pin },
      { onSuccess: onLoginSuccess },
    )
  }

  const error = login.error instanceof ApiError ? login.error.message : login.error ? 'Connexion impossible' : null
  const pinValid = /^\d{6}$/.test(pin)

  return (
    <AuthShell
      mode="login"
      brand={
        <>
          <div className="auth-brand-icon">
            <span className="material-symbols-rounded fill" aria-hidden="true">local_shipping</span>
          </div>
          <h2 className="auth-brand-title">Pilotez vos colis depuis le web.</h2>
          <p className="auth-brand-lead">
            Connectez-vous pour créer des colis, comparer les offres et suivre vos livraisons en temps réel.
          </p>
          <div className="auth-brand-perks">
            {[
              { icon: 'verified', text: 'Chauffeurs vérifiés & notés' },
              { icon: 'bolt', text: 'Premières offres en moins de 45 min' },
              { icon: 'qr_code_2', text: 'Suivi en temps réel + code PIN' },
            ].map(p => (
              <div key={p.icon} className="auth-brand-perks-item">
                <span className="material-symbols-rounded" aria-hidden="true">{p.icon}</span>
                {p.text}
              </div>
            ))}
          </div>
        </>
      }
    >
      <div className="auth-header">
        <h1 className="auth-title">Bon retour 👋</h1>
        <p className="auth-lead">Entrez votre identifiant et votre code PIN.</p>
        <p style={{ margin: 0, fontSize: 13.5 }}>
          <Link to="/installer" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            Installer ProColis sur iPhone ou iPad
          </Link>
        </p>
      </div>

      <GoogleAuth onSuccess={onLoginSuccess} onFlowChange={setGoogleActive} />

      {!googleActive && (
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input
            label="Identifiant"
            icon="person"
            placeholder="Email ou téléphone"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete="username"
          />
          <Input
            label="Code PIN"
            icon="lock"
            type="password"
            inputMode="numeric"
            mono
            placeholder="6 chiffres"
            value={pin}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 6)
              setPin(val)
              if (prevPinRef.current.length === 5 && val.length === 6 && identifier.trim()) {
                login.mutate(
                  { identifier: identifier.trim(), pin: val },
                  { onSuccess: onLoginSuccess },
                )
              }
              prevPinRef.current = val
            }}
            autoComplete="current-password"
          />

          {error && <Toast tone="error" message={error} />}

          <Button type="submit" block size="lg" iconTrailing="arrow_forward" loading={login.isPending} disabled={!identifier.trim() || !pinValid}>
            Se connecter
          </Button>
        </form>
      )}

      <p className="auth-footer-row">
        <button type="button" onClick={() => navigate('/pin-oublie', { state: location.state })}>
          Code PIN oublié ?
        </button>
      </p>

      <p className="auth-footer-row" style={{ marginTop: 20 }}>
        Pas encore de compte ?{' '}
        <button type="button" onClick={() => navigate('/register', { state: location.state })}>
          Créer un compte
        </button>
      </p>
    </AuthShell>
  )
}
