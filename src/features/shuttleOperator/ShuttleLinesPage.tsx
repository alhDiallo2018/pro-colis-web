import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge, Button, Dialog, Icon, Input, Select, Toast } from '@/ds'
import { QueryState } from '@/components/QueryState'
import {
  createLine,
  deleteLine,
  listLines,
  updateLine,
  type CreateLinePayload,
  type ShuttleLine,
  type ShuttleLineStop,
  type TransitDirection,
  type TransitOperatorKind,
} from '@/lib/api/shuttle-operator'
import { ApiError } from '@/lib/api/client'

const OPERATOR_OPTIONS: { value: TransitOperatorKind; label: string }[] = [
  { value: 'ddd', label: 'DDD' },
  { value: 'aftu', label: 'AFTU' },
]
const DIRECTION_OPTIONS: { value: TransitDirection; label: string }[] = [
  { value: 'aller', label: 'Aller' },
  { value: 'retour', label: 'Retour' },
]

interface FormState {
  operator: TransitOperatorKind
  number: string
  direction: TransitDirection
  name: string
  origin: string
  destination: string
  stops: ShuttleLineStop[]
}

function emptyForm(): FormState {
  return {
    operator: 'ddd',
    number: '',
    direction: 'aller',
    name: '',
    origin: '',
    destination: '',
    stops: [
      { order: 1, zoneId: '', label: '' },
      { order: 2, zoneId: '', label: '' },
    ],
  }
}

export function ShuttleLinesPage() {
  const qc = useQueryClient()
  const query = useQuery({ queryKey: ['shuttle-operator', 'lines'], queryFn: listLines })
  const [editing, setEditing] = useState<ShuttleLine | 'new' | null>(null)
  const [error, setError] = useState('')
  const lines = query.data ?? []

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['shuttle-operator', 'lines'] })
    void qc.invalidateQueries({ queryKey: ['shuttle-operator', 'overview'] })
    void qc.invalidateQueries({ queryKey: ['shuttle-operator', 'schedules'] })
  }

  const saveMutation = useMutation({
    mutationFn: async (payload: { id: string | null; data: CreateLinePayload }) => {
      if (payload.id) return updateLine(payload.id, payload.data)
      return createLine(payload.data)
    },
    onSuccess: () => { invalidate(); setEditing(null); setError('') },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Enregistrement impossible'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteLine(id),
    onSuccess: invalidate,
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Suppression impossible'),
  })

  return (
    <div className="cm-detail-page" style={{ maxWidth: 1040 }}>
      <div className="cm-page-head">
        <div className="cm-page-head-body">
          <h1>Lignes de transit</h1>
          <p className="cm-page-head-sub">Lignes rattachées à votre espace opérateur.</p>
        </div>
        <Button icon="add" onClick={() => { setEditing('new'); setError('') }}>Nouvelle ligne</Button>
      </div>

      {error && <Toast tone="error" message={error} />}

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        isEmpty={lines.length === 0}
        emptyTitle="Aucune ligne"
        emptyMessage="Créez votre première ligne de transit pour la rendre disponible aux chauffeurs."
        onRetry={() => query.refetch()}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {lines.map((line) => (
            <div
              key={line.id}
              style={{
                padding: 14,
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface-card)',
                display: 'flex',
                gap: 12,
                alignItems: 'center',
              }}
            >
              <Badge tone="neutral">{line.operator.toUpperCase()}</Badge>
              <code style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>#{line.number}</code>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{line.name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>
                  <Icon name="place" size={13} /> {line.origin} → {line.destination} · {line.direction}
                  {' · '}
                  {line.stops.length} arrêt{line.stops.length > 1 ? 's' : ''}
                </div>
              </div>
              <Button size="sm" variant="ghost" icon="edit" onClick={() => { setEditing(line); setError('') }}>Modifier</Button>
              <Button size="sm" variant="ghost" icon="delete" onClick={() => {
                if (window.confirm(`Supprimer la ligne « ${line.name} » ? Les horaires associés seront également supprimés.`)) {
                  deleteMutation.mutate(line.id)
                }
              }} loading={deleteMutation.isPending}>Supprimer</Button>
            </div>
          ))}
        </div>
      </QueryState>

      {editing && (
        <LineDialog
          initial={editing === 'new' ? null : editing}
          saving={saveMutation.isPending}
          onClose={() => setEditing(null)}
          onSave={(data) => saveMutation.mutate({ id: editing === 'new' ? null : editing.id, data })}
        />
      )}
    </div>
  )
}

function LineDialog({
  initial,
  onClose,
  onSave,
  saving,
}: {
  initial: ShuttleLine | null
  onClose: () => void
  onSave: (payload: CreateLinePayload) => void
  saving: boolean
}) {
  const [form, setForm] = useState<FormState>(() => {
    if (!initial) return emptyForm()
    return {
      operator: initial.operator,
      number: initial.number,
      direction: initial.direction,
      name: initial.name,
      origin: initial.origin,
      destination: initial.destination,
      stops: initial.stops.length >= 2
        ? initial.stops.map((s) => ({ ...s }))
        : [{ order: 1, zoneId: '', label: '' }, { order: 2, zoneId: '', label: '' }],
    }
  })

  const invalid = useMemo(() => {
    if (!form.number.trim() || !form.name.trim() || !form.origin.trim() || !form.destination.trim()) return true
    if (form.stops.length < 2) return true
    return form.stops.some((s) => !s.label.trim() || !s.zoneId.trim())
  }, [form])

  const setStop = (i: number, patch: Partial<ShuttleLineStop>) => {
    setForm((f) => ({ ...f, stops: f.stops.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) }))
  }
  const addStop = () => {
    setForm((f) => ({ ...f, stops: [...f.stops, { order: f.stops.length + 1, zoneId: '', label: '' }] }))
  }
  const removeStop = (i: number) => {
    setForm((f) => ({
      ...f,
      stops: f.stops.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, order: idx + 1 })),
    }))
  }

  const submit = () => {
    if (invalid || saving) return
    onSave({
      operator: form.operator,
      number: form.number.trim(),
      direction: form.direction,
      name: form.name.trim(),
      origin: form.origin.trim(),
      destination: form.destination.trim(),
      stops: form.stops.map((s, i) => ({ order: i + 1, label: s.label.trim(), zoneId: s.zoneId.trim() })),
    })
  }

  return (
    <Dialog
      open
      onClose={onClose}
      icon="route"
      iconTone="primary"
      title={initial ? `Modifier ${initial.name}` : 'Nouvelle ligne'}
      style={{ maxWidth: 640 }}
      actions={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Annuler</Button>
          <Button icon="save" onClick={submit} disabled={invalid} loading={saving}>Enregistrer</Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <Select label="Opérateur" value={form.operator} onChange={(e) => setForm((f) => ({ ...f, operator: e.target.value as TransitOperatorKind }))} options={OPERATOR_OPTIONS} disabled={!!initial} />
          <Input label="Numéro" value={form.number} mono onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))} />
          <Select label="Sens" value={form.direction} onChange={(e) => setForm((f) => ({ ...f, direction: e.target.value as TransitDirection }))} options={DIRECTION_OPTIONS} />
        </div>
        <Input label="Nom public" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Input label="Origine" value={form.origin} onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))} />
          <Input label="Destination" value={form.destination} onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))} />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ fontWeight: 700, fontSize: 'var(--fs-sm)' }}>Arrêts ({form.stops.length})</div>
            <Button variant="ghost" size="sm" icon="add" onClick={addStop}>Ajouter</Button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {form.stops.map((s, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr 32px', gap: 8, alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', textAlign: 'center' }}>{i + 1}</span>
                <Input placeholder="Libellé arrêt" value={s.label} onChange={(e) => setStop(i, { label: e.target.value })} />
                <Input placeholder="Zone ID (UUID)" value={s.zoneId} mono onChange={(e) => setStop(i, { zoneId: e.target.value.trim() })} />
                <Button
                  variant="ghost"
                  size="sm"
                  icon="delete"
                  disabled={form.stops.length <= 2}
                  onClick={() => removeStop(i)}
                >{' '}</Button>
              </div>
            ))}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-xs)', marginTop: 4 }}>
            Deux arrêts minimum. Les zones doivent exister (table `zones`).
          </div>
        </div>
      </div>
    </Dialog>
  )
}
