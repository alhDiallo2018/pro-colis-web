import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge, Button, Dialog, Icon, Input, Select, Textarea, Toast } from '@/ds'
import { QueryState } from '@/components/QueryState'
import {
  createVehicle,
  deleteVehicle,
  listVehicles,
  updateVehicle,
  type CreateVehiclePayload,
  type ShuttleVehicle,
  type ShuttleVehicleStatus,
  type ShuttleVehicleType,
} from '@/lib/api/shuttle-operator'
import { ApiError } from '@/lib/api/client'

const TYPE_OPTIONS: { value: ShuttleVehicleType; label: string }[] = [
  { value: 'bus', label: 'Bus' },
  { value: 'minibus', label: 'Minibus' },
  { value: 'car', label: 'Car' },
  { value: 'van', label: 'Van' },
]
const STATUS_META: Record<ShuttleVehicleStatus, { label: string; tone: 'green' | 'amber' | 'red' }> = {
  available: { label: 'Disponible', tone: 'green' },
  maintenance: { label: 'Maintenance', tone: 'amber' },
  retired: { label: 'Retiré', tone: 'red' },
}

interface FormState {
  plateNumber: string
  model: string
  type: ShuttleVehicleType
  capacity: string
  status: ShuttleVehicleStatus
  notes: string
}

const EMPTY_FORM: FormState = {
  plateNumber: '',
  model: '',
  type: 'minibus',
  capacity: '16',
  status: 'available',
  notes: '',
}

export function ShuttleVehiclesPage() {
  const qc = useQueryClient()
  const query = useQuery({ queryKey: ['shuttle-operator', 'vehicles'], queryFn: listVehicles })
  const [editing, setEditing] = useState<ShuttleVehicle | 'new' | null>(null)
  const [error, setError] = useState('')
  const vehicles = query.data ?? []

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['shuttle-operator', 'vehicles'] })
    void qc.invalidateQueries({ queryKey: ['shuttle-operator', 'overview'] })
  }

  const saveMutation = useMutation({
    mutationFn: async (payload: { id: string | null; data: CreateVehiclePayload }) => {
      if (payload.id) return updateVehicle(payload.id, payload.data)
      return createVehicle(payload.data)
    },
    onSuccess: () => {
      invalidate()
      setEditing(null)
      setError('')
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Enregistrement impossible'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteVehicle(id),
    onSuccess: invalidate,
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Suppression impossible'),
  })

  return (
    <div className="cm-detail-page" style={{ maxWidth: 1040 }}>
      <div className="cm-page-head">
        <div className="cm-page-head-body">
          <h1>Flotte</h1>
          <p className="cm-page-head-sub">Véhicules collectifs enregistrés à votre nom.</p>
        </div>
        <Button icon="add" onClick={() => { setEditing('new'); setError('') }}>
          Ajouter un véhicule
        </Button>
      </div>

      {error && <Toast tone="error" message={error} />}

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        isEmpty={vehicles.length === 0}
        emptyTitle="Aucun véhicule"
        emptyMessage="Ajoutez votre premier véhicule pour configurer des horaires."
        onRetry={() => query.refetch()}
      >
        <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--fs-sm)' }}>
            <thead>
              <tr style={{ background: 'var(--surface-sunken)' }}>
                {['Plaque', 'Modèle', 'Type', 'Capacité', 'Statut', ''].map((h) => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontSize: 'var(--fs-xs)', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => {
                const meta = STATUS_META[v.status] ?? { label: v.status, tone: 'neutral' as const }
                return (
                  <tr key={v.id} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)' }}>{v.plateNumber}</td>
                    <td style={{ padding: '10px 12px' }}>{v.model}</td>
                    <td style={{ padding: '10px 12px' }}>{v.type}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>{v.capacity}</td>
                    <td style={{ padding: '10px 12px' }}><Badge tone={meta.tone}>{meta.label}</Badge></td>
                    <td style={{ padding: '10px 12px', display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <Button size="sm" variant="ghost" icon="edit" onClick={() => { setEditing(v); setError('') }}>
                        Modifier
                      </Button>
                      <Button size="sm" variant="ghost" icon="delete" onClick={() => {
                        if (window.confirm(`Retirer définitivement ${v.plateNumber} ?`)) deleteMutation.mutate(v.id)
                      }} loading={deleteMutation.isPending}>
                        Retirer
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </QueryState>

      {editing && (
        <VehicleDialog
          initial={editing === 'new' ? null : editing}
          saving={saveMutation.isPending}
          onClose={() => setEditing(null)}
          onSave={(payload) => saveMutation.mutate({ id: editing === 'new' ? null : editing.id, data: payload })}
        />
      )}
    </div>
  )
}

function VehicleDialog({
  initial,
  onClose,
  onSave,
  saving,
}: {
  initial: ShuttleVehicle | null
  onClose: () => void
  onSave: (payload: CreateVehiclePayload) => void
  saving: boolean
}) {
  const [form, setForm] = useState<FormState>(() => ({
    plateNumber: initial?.plateNumber ?? EMPTY_FORM.plateNumber,
    model: initial?.model ?? EMPTY_FORM.model,
    type: initial?.type ?? EMPTY_FORM.type,
    capacity: initial ? String(initial.capacity) : EMPTY_FORM.capacity,
    status: initial?.status ?? EMPTY_FORM.status,
    notes: initial?.notes ?? '',
  }))

  const invalid = useMemo(() => {
    const cap = Number(form.capacity)
    return (
      form.plateNumber.trim().length < 2 ||
      form.model.trim().length < 1 ||
      !Number.isInteger(cap) ||
      cap < 1 ||
      cap > 200
    )
  }, [form])

  const submit = () => {
    if (invalid || saving) return
    onSave({
      plateNumber: form.plateNumber.trim(),
      model: form.model.trim(),
      type: form.type,
      capacity: Number(form.capacity),
      status: form.status,
      notes: form.notes.trim() || null,
    })
  }

  return (
    <Dialog
      open
      onClose={onClose}
      icon="directions_bus"
      iconTone="primary"
      title={initial ? `Modifier ${initial.plateNumber}` : 'Nouveau véhicule'}
      style={{ maxWidth: 480 }}
      actions={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Annuler</Button>
          <Button icon="save" onClick={submit} disabled={invalid} loading={saving}>Enregistrer</Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Input
          label="Plaque"
          icon="pin"
          value={form.plateNumber}
          mono
          onChange={(e) => setForm((f) => ({ ...f, plateNumber: e.target.value.toUpperCase() }))}
        />
        <Input
          label="Modèle"
          value={form.model}
          onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Select
            label="Type"
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ShuttleVehicleType }))}
            options={TYPE_OPTIONS}
          />
          <Input
            label="Capacité"
            inputMode="numeric"
            value={form.capacity}
            onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value.replace(/\D/g, '') }))}
          />
        </div>
        <Select
          label="Statut"
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ShuttleVehicleStatus }))}
          options={[
            { value: 'available', label: 'Disponible' },
            { value: 'maintenance', label: 'Maintenance' },
            { value: 'retired', label: 'Retiré' },
          ]}
        />
        <Textarea
          label="Notes"
          rows={3}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          maxLength={500}
        />
      </div>
      <div style={{ marginTop: 10, color: 'var(--text-muted)', fontSize: 'var(--fs-xs)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon name="info" size={14} /> Les véhicules retirés sont archivés et libèrent la plaque pour une nouvelle fiche.
      </div>
    </Dialog>
  )
}
