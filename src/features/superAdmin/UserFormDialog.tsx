import { useEffect, useState } from 'react'
import { Button, Dialog, Input, Select, Toast } from '@/ds'
import type { Role, User } from '@/lib/api/types'
import { useCreateUser, useUpdateUser } from './hooks'

interface UserFormDialogProps {
  open: boolean
  user?: User | null
  onClose: () => void
}

interface FormState {
  fullName: string
  phone: string
  email: string
  role: Role
  pin: string
  address: string
  city: string
  region: string
}

const EMPTY: FormState = {
  fullName: '',
  phone: '',
  email: '',
  role: 'client',
  pin: '',
  address: '',
  city: '',
  region: '',
}

const ROLE_OPTIONS = [
  { value: 'client', label: 'Client' },
  { value: 'driver', label: 'Chauffeur' },
  { value: 'admin', label: 'Admin zone' },
  { value: 'super_admin', label: 'Super admin' },
  { value: 'support', label: 'Support' },
  { value: 'support_technique', label: 'Support technique' },
  { value: 'support_commercial', label: 'Support commercial' },
]

/** Création / édition d'un utilisateur par le super admin. */
export function UserFormDialog({ open, user, onClose }: UserFormDialogProps) {
  const isEdit = !!user
  const [form, setForm] = useState<FormState>(EMPTY)
  const [localError, setLocalError] = useState<string | null>(null)

  const createMutation = useCreateUser()
  const updateMutation = useUpdateUser()
  const pending = createMutation.isPending || updateMutation.isPending

  useEffect(() => {
    if (!open) return
    setLocalError(null)
    setForm(
      user
        ? {
            fullName: user.fullName ?? '',
            phone: user.phone ?? '',
            email: user.email ?? '',
            role: user.role,
            pin: '',
            address: user.address ?? '',
            city: user.city ?? '',
            region: user.region ?? '',
          }
        : EMPTY,
    )
  }, [open, user])

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }))

  const handleSubmit = async () => {
    if (!form.fullName.trim()) return setLocalError('Le nom complet est requis.')
    if (!form.phone.trim()) return setLocalError('Le téléphone est requis.')
    if (!isEdit && form.pin && !/^\d{4,6}$/.test(form.pin)) return setLocalError('Le PIN doit contenir 4 à 6 chiffres.')

    const payload = {
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      role: form.role,
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      region: form.region.trim() || null,
    }

    setLocalError(null)
    try {
      if (isEdit && user) {
        await updateMutation.mutateAsync({ userId: user.id, payload, previousRole: user.role })
      } else {
        await createMutation.mutateAsync({ ...payload, pin: form.pin || '123456' })
      }
      onClose()
    } catch (e) {
      const err = e as { response?: { data?: { message?: string }; status?: number } }
      if (err.response?.status === 409) {
        setLocalError('Un utilisateur avec ce téléphone ou cet email existe déjà.')
      } else {
        setLocalError(err.response?.data?.message ?? "Erreur lors de l'enregistrement de l'utilisateur.")
      }
    }
  }

  return (
    <Dialog
      open={open}
      title={isEdit ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}
      icon={isEdit ? 'manage_accounts' : 'person_add'}
      iconTone="primary"
      onClose={pending ? undefined : onClose}
      style={{ maxWidth: 440, textAlign: 'left' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
        <Input
          label="Nom complet"
          placeholder="Ex: Awa Ndiaye"
          value={form.fullName}
          onChange={(e) => set({ fullName: e.target.value })}
          icon="person"
        />
        <div className="pc-field-pair" style={{ gap: 10 }}>
          <Input
            label="Téléphone"
            placeholder="+221 77 000 00 00"
            value={form.phone}
            onChange={(e) => set({ phone: e.target.value })}
            icon="call"
          />
          <Input
            label="Email (optionnel)"
            placeholder="email@exemple.com"
            value={form.email}
            onChange={(e) => set({ email: e.target.value })}
            icon="mail"
          />
        </div>
        <Select
          label="Rôle"
          value={form.role}
          onChange={(e) => set({ role: e.target.value as Role })}
          options={ROLE_OPTIONS}
          icon="badge"
        />
        {!isEdit && (
          <Input
            label="Code PIN initial (optionnel, défaut 123456)"
            placeholder="4 à 6 chiffres"
            value={form.pin}
            onChange={(e) => set({ pin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
            icon="pin"
          />
        )}
        <div className="pc-field-pair" style={{ gap: 10 }}>
          <Input
            label="Ville (optionnel)"
            placeholder="Ex: Dakar"
            value={form.city}
            onChange={(e) => set({ city: e.target.value })}
          />
          <Input
            label="Région (optionnel)"
            placeholder="Ex: Dakar"
            value={form.region}
            onChange={(e) => set({ region: e.target.value })}
          />
        </div>
        <Input
          label="Adresse (optionnel)"
          placeholder="Rue, quartier…"
          value={form.address}
          onChange={(e) => set({ address: e.target.value })}
          icon="location_on"
        />
        {localError && <Toast tone="error" message={localError} onClose={() => setLocalError(null)} />}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
        <Button variant="secondary" onClick={onClose} disabled={pending} block>
          Annuler
        </Button>
        <Button variant="primary" onClick={handleSubmit} loading={pending} disabled={pending} block>
          {isEdit ? 'Enregistrer' : "Créer l'utilisateur"}
        </Button>
      </div>
    </Dialog>
  )
}
