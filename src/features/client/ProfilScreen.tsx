import { useState } from 'react'
import { Avatar, Badge, Button, Card, Input, Toast } from '@/ds'
import { useAuthStore } from '@/store/auth'
import { useUpdateProfile } from './hooks'
import { ApiError } from '@/lib/api/client'

const ROLE_LABEL: Record<string, string> = {
  client: 'Client',
  driver: 'Chauffeur',
  admin: 'Admin garage',
  super_admin: 'Super admin',
}

export function ProfilScreen() {
  const user = useAuthStore((s) => s.user)
  const update = useUpdateProfile()
  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [city, setCity] = useState(user?.city ?? '')
  const [address, setAddress] = useState(user?.address ?? '')
  const [saved, setSaved] = useState(false)

  if (!user) return null

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(false)
    update.mutate(
      { fullName: fullName.trim(), email: email.trim() || null, city: city.trim() || null, address: address.trim() || null },
      { onSuccess: () => setSaved(true) },
    )
  }

  const error = update.error instanceof ApiError ? update.error.message : null

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card padding="lg">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Avatar name={user.fullName} size="xl" status="online" />
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--fs-h2)', color: 'var(--text-strong)' }}>{user.fullName}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
              <Badge tone="primary">{ROLE_LABEL[user.role] ?? user.role}</Badge>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>{user.phone}</span>
            </div>
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <h3 style={{ margin: '0 0 16px', fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)', color: 'var(--text-strong)' }}>
          Informations personnelles
        </h3>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Nom complet" icon="badge" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <div className="pc-field-pair" style={{ gap: 16 }}>
            <Input label="Email" icon="mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="Téléphone" icon="call" mono value={user.phone} disabled help="Le téléphone n'est pas modifiable" />
          </div>
          <div className="pc-field-pair" style={{ gap: 16 }}>
            <Input label="Ville" icon="location_on" value={city} onChange={(e) => setCity(e.target.value)} />
            <Input label="Adresse" icon="home" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          {error && <Toast tone="error" message={error} />}
          {saved && !error && <Toast tone="success" message="Profil mis à jour." />}

          <div>
            <Button type="submit" icon="save" loading={update.isPending} disabled={!fullName.trim()}>
              Enregistrer
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
