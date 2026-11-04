import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, IconButton, Input, Toast } from '@/ds'
import { AuthShell } from './AuthShell'
import * as authApi from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'

type Step = 'identifier' | 'code'

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message
  return error ? fallback : null
}

/**
 * Récupération d'un accès perdu, en deux temps : demande du code de
 * vérification, puis pose du nouveau code PIN.
 *
 * Le PIN — et non le mot de passe — est le secret de connexion : c'est bien
 * `newPin` qui est envoyé à `/auth/reset-password`.
 */
export function ForgotPinPage() {
  const navigate = useNavigate()
  const location = useLocation()
  // La recuperation du PIN est un detour du parcours de reconnexion : garder
  // l'adresse d'origine jusqu'au retour sur le formulaire de connexion.
  const backToLogin = () => navigate('/login', { replace: true, state: location.state })
  const [step, setStep] = useState<Step>('identifier')
  const [identifier, setIdentifier] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const request = useMutation({
    mutationFn: () => authApi.forgotPin(identifier.trim()),
    onSuccess: (result) => {
      // En développement, Brevo n'est pas configuré : l'API renvoie le code
      // dans son message. On l'affiche tel quel, sinon le parcours est
      // impraticable en local.
      setNotice(result.sent ? 'Code envoyé. Vérifiez vos SMS et vos emails.' : result.message)
      setStep('code')
    },
  })

  const reset = useMutation({
    mutationFn: () => authApi.resetPin({ identifier: identifier.trim(), otpCode, newPin }),
    onSuccess: () => setDone(true),
  })

  const pinValid = /^\d{6}$/.test(newPin)
  const pinsMatch = newPin === confirmPin
  const codeValid = otpCode.trim().length >= 4

  const error =
    errorMessage(request.error, 'Impossible d’envoyer le code') ??
    errorMessage(reset.error, 'Réinitialisation impossible')

  return (
    <AuthShell
      mode="forgot"
      brand={
        <>
          <div className="auth-brand-icon">
            <span className="material-symbols-rounded fill" aria-hidden="true">lock_reset</span>
          </div>
          <h2 className="auth-brand-title">Reprenez la main sur votre compte.</h2>
          <p className="auth-brand-lead">
            Nous envoyons un code de vérification sur le numéro ou l'email associé à votre compte.
          </p>
        </>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <IconButton icon="arrow_back" aria-label="Retour" onClick={backToLogin} />
      </div>

      {done ? (
        <>
          <div className="auth-header">
            <h1 className="auth-title">Code PIN mis à jour</h1>
            <p className="auth-lead">
              Vos autres sessions ont été déconnectées. Connectez-vous avec votre nouveau code.
            </p>
          </div>
          <Button block size="lg" iconTrailing="arrow_forward" onClick={backToLogin}>
            Se connecter
          </Button>
        </>
      ) : (
        <>
          <div className="auth-header">
            <h1 className="auth-title">Code PIN oublié</h1>
            <p className="auth-lead">
              {step === 'identifier'
                ? 'Entrez l’identifiant de votre compte pour recevoir un code de vérification.'
                : 'Saisissez le code reçu, puis choisissez un nouveau code PIN.'}
            </p>
          </div>

          {step === 'identifier' ? (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                request.mutate()
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
            >
              <Input
                label="Identifiant"
                icon="person"
                placeholder="Email ou téléphone"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
              />

              {error && <Toast tone="error" message={error} />}

              <Button type="submit" block size="lg" iconTrailing="arrow_forward" loading={request.isPending} disabled={identifier.trim().length < 3}>
                Recevoir le code
              </Button>
            </form>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                reset.mutate()
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
            >
              {notice && <Toast tone="info" message={notice} />}

              <Input
                label="Code de vérification"
                icon="sms"
                inputMode="numeric"
                mono
                placeholder="Code reçu par SMS / email"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 10))}
                autoComplete="one-time-code"
              />
              <Input
                label="Nouveau code PIN"
                icon="lock"
                type="password"
                inputMode="numeric"
                mono
                placeholder="6 chiffres"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                autoComplete="new-password"
              />
              <Input
                label="Confirmer le code PIN"
                icon="lock"
                type="password"
                inputMode="numeric"
                mono
                placeholder="6 chiffres"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                error={confirmPin.length === 6 && !pinsMatch ? 'Les deux codes ne correspondent pas' : undefined}
                autoComplete="new-password"
              />

              {error && <Toast tone="error" message={error} />}

              <Button
                type="submit"
                block
                size="lg"
                iconTrailing="check"
                loading={reset.isPending}
                disabled={!codeValid || !pinValid || !pinsMatch}
              >
                Réinitialiser mon code
              </Button>
              <Button
                type="button"
                variant="ghost"
                block
                loading={request.isPending}
                onClick={() => request.mutate()}
              >
                Renvoyer un code
              </Button>
            </form>
          )}
        </>
      )}

      <p className="auth-footer-row">
        Vous vous souvenez de votre code ?{' '}
        <button type="button" onClick={backToLogin}>Se connecter</button>
      </p>
    </AuthShell>
  )
}
