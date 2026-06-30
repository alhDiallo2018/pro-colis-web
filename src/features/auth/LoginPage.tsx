import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Toast } from '@/ds'
import { AuthShell } from './AuthShell'
import { useLogin } from './useAuth'
import { homeForRole } from '@/routes/paths'
import { ApiError } from '@/lib/api/client'

export function LoginPage() {
  const navigate = useNavigate()
  const login = useLogin()
  const [identifier, setIdentifier] = useState('')
  const [pin, setPin] = useState('')

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    login.mutate(
      { identifier: identifier.trim(), pin },
      { onSuccess: (session) => navigate(homeForRole(session.user.role), { replace: true }) },
    )
  }

  const error = login.error instanceof ApiError ? login.error.message : login.error ? 'Connexion impossible' : null
  const pinValid = /^\d{6}$/.test(pin)

  return (
    <AuthShell
      brand={
        <>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 84,
              height: 84,
              borderRadius: 24,
              background: 'rgba(255,255,255,0.16)',
              marginBottom: 24,
            }}
          >
            <span className="material-symbols-rounded fill" style={{ fontSize: 46 }}>
              local_shipping
            </span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30, lineHeight: 1.15, letterSpacing: '-0.02em', margin: '0 0 12px' }}>
            Pilotez vos colis
            <br />
            depuis le web.
          </h2>
          <p style={{ fontSize: 15, opacity: 0.9, lineHeight: 1.55, margin: 0, maxWidth: 320 }}>
            Connectez-vous pour créer des colis, comparer les offres et suivre vos livraisons en temps réel.
          </p>
        </>
      }
    >
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30, color: 'var(--text-strong)', margin: '0 0 8px', letterSpacing: '-0.01em' }}>
        Bon retour 👋
      </h1>
      <p style={{ fontSize: 15, color: 'var(--text-muted)', margin: '0 0 32px' }}>
        Entrez votre identifiant et votre code PIN.
      </p>

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
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          autoComplete="current-password"
        />

        {error && <Toast tone="error" message={error} />}

        <Button type="submit" block size="lg" iconTrailing="arrow_forward" loading={login.isPending} disabled={!identifier.trim() || !pinValid}>
          Se connecter
        </Button>
      </form>

      <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)', margin: '28px 0 0' }}>
        Pas encore de compte ?{' '}
        <span style={{ color: 'var(--text-link)', fontWeight: 700, cursor: 'pointer' }} onClick={() => navigate('/register')}>
          Créer un compte
        </span>
      </p>
    </AuthShell>
  )
}
