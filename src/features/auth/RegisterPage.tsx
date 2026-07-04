import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Checkbox, IconButton, Input, SegmentedControl, Toast } from '@/ds'
import { AuthShell } from './AuthShell'
import { useRegister } from './useAuth'
import { homeForRole } from '@/routes/paths'
import { ApiError } from '@/lib/api/client'
import type { Role } from '@/lib/api/types'

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
  const registerMut = useRegister()
  const [role, setRole] = useState<Role>('client')
  const [fullName, setFullName] = useState('')
  const [city, setCity] = useState('')
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [accepted, setAccepted] = useState(false)

  const pinValid = /^\d{6}$/.test(pin)
  const canSubmit = fullName.trim().length >= 2 && phone.trim().length >= 8 && pinValid && accepted

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    registerMut.mutate(
      { role, fullName: fullName.trim(), city: city.trim() || null, phone: phone.trim(), pin },
      { onSuccess: (session) => navigate(homeForRole(session.user.role), { replace: true }) },
    )
  }

  const error = registerMut.error instanceof ApiError ? registerMut.error.message : registerMut.error ? 'Inscription impossible' : null

  return (
    <AuthShell
      brandWidth={440}
      formMaxWidth={560}
      brand={
        <>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 27, lineHeight: 1.18, letterSpacing: '-0.02em', margin: '0 0 18px' }}>
            Rejoignez le réseau Procolis.
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {PERKS.map((p) => (
              <div key={p.text} style={{ display: 'flex', alignItems: 'center', gap: 11, fontSize: 14.5 }}>
                <span className="material-symbols-rounded" style={{ fontSize: 22, color: 'var(--amber-300)' }}>
                  {p.icon}
                </span>
                {p.text}
              </div>
            ))}
          </div>
        </>
      }
    >
      <div style={{ marginBottom: 24 }}>
        <IconButton icon="arrow_back" aria-label="Retour" onClick={() => navigate('/')} />
      </div>

      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 27, color: 'var(--text-strong)', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
        Créer un compte
      </h1>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 22px' }}>Quelques informations et vous êtes prêt.</p>

      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: 'var(--text-body)', marginBottom: 8 }}>Je veux…</div>
          <SegmentedControl block options={ROLE_OPTIONS} value={role} onChange={(v) => setRole(v as Role)} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Input label="Nom complet" icon="badge" placeholder="Ex : Aïcha Mballa" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input label="Ville" icon="location_on" placeholder="Douala" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Input
            label="Téléphone"
            icon="call"
            mono
            placeholder="+237 6 00 00 00 00"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
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

      <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)', margin: '22px 0 0' }}>
        Déjà un compte ?{' '}
        <span style={{ color: 'var(--text-link)', fontWeight: 700, cursor: 'pointer' }} onClick={() => navigate('/login')}>
          Se connecter
        </span>
      </p>
    </AuthShell>
  )
}
