import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge, Button, Dialog, Input, Select, Textarea, Toast } from '@/ds'
import { QueryState } from '@/components/QueryState'
import {
  createSchedule,
  DAY_LABELS_FR,
  deleteSchedule,
  formatDaysOfWeek,
  listLines,
  listSchedules,
  updateSchedule,
  type CreateSchedulePayload,
  type ShuttleSchedule,
} from '@/lib/api/shuttle-operator'
import { ApiError } from '@/lib/api/client'
import { formatDate } from '@/lib/format'

interface FormState {
  transitLineId: string
  daysOfWeek: number[]
  departureTime: string
  activeFrom: string
  activeUntil: string
  notes: string
}

function emptyForm(): FormState {
  return {
    transitLineId: '',
    daysOfWeek: [1, 2, 3, 4, 5],
    departureTime: '07:30',
    activeFrom: '',
    activeUntil: '',
    notes: '',
  }
}

function toLocalDateInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function ShuttleSchedulesPage() {
  const qc = useQueryClient()
  const schedulesQuery = useQuery({ queryKey: ['shuttle-operator', 'schedules'], queryFn: listSchedules })
  const linesQuery = useQuery({ queryKey: ['shuttle-operator', 'lines'], queryFn: listLines })
  const [editing, setEditing] = useState<ShuttleSchedule | 'new' | null>(null)
  const [error, setError] = useState('')
  const schedules = schedulesQuery.data ?? []
  const lines = linesQuery.data ?? []

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['shuttle-operator', 'schedules'] })
    void qc.invalidateQueries({ queryKey: ['shuttle-operator', 'overview'] })
  }

  const saveMutation = useMutation({
    mutationFn: async (payload: { id: string | null; data: CreateSchedulePayload }) => {
      if (payload.id) return updateSchedule(payload.id, payload.data)
      return createSchedule(payload.data)
    },
    onSuccess: () => { invalidate(); setEditing(null); setError('') },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Enregistrement impossible'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSchedule(id),
    onSuccess: invalidate,
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Suppression impossible'),
  })

  const canCreate = lines.length > 0

  return (
    <div className="cm-detail-page" style={{ maxWidth: 1040 }}>
      <div className="cm-page-head">
        <div className="cm-page-head-body">
          <h1>Horaires</h1>
          <p className="cm-page-head-sub">Plages de service récurrentes rattachées à vos lignes.</p>
        </div>
        <Button icon="add" disabled={!canCreate} onClick={() => { setEditing('new'); setError('') }}>
          Nouvel horaire
        </Button>
      </div>

      {!canCreate && <Toast tone="info" message="Créez d'abord au moins une ligne pour pouvoir y rattacher des horaires." />}
      {error && <Toast tone="error" message={error} />}

      <QueryState
        isLoading={schedulesQuery.isLoading}
        isError={schedulesQuery.isError}
        error={schedulesQuery.error}
        isEmpty={schedules.length === 0}
        emptyTitle="Aucun horaire"
        emptyMessage="Programmez les plages de service récurrentes de vos lignes."
        onRetry={() => schedulesQuery.refetch()}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {schedules.map((s) => {
            const line = lines.find((l) => l.id === s.transitLineId)
            const isExpired = s.activeUntil ? new Date(s.activeUntil) < new Date() : false
            return (
              <div key={s.id} style={{
                padding: 14,
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface-card)',
                display: 'flex',
                gap: 12,
                alignItems: 'center',
              }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  fontSize: 'var(--fs-lg)',
                  padding: '4px 10px',
                  background: 'var(--teal-100)',
                  color: 'var(--teal-800)',
                  borderRadius: 'var(--radius-sm)',
                }}>{s.departureTime}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>
                    {line ? `${line.name} · #${line.number}` : s.transitLine?.name ?? s.transitLineId.slice(0, 8)}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>
                    {formatDaysOfWeek(s.daysOfWeek)}
                    {' · '}
                    du {formatDate(s.activeFrom)}
                    {s.activeUntil ? ` au ${formatDate(s.activeUntil)}` : ' (ouvert)'}
                  </div>
                  {s.notes && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginTop: 2 }}>{s.notes}</div>}
                </div>
                {isExpired && <Badge tone="red">Expiré</Badge>}
                <Button size="sm" variant="ghost" icon="edit" onClick={() => { setEditing(s); setError('') }}>Modifier</Button>
                <Button size="sm" variant="ghost" icon="delete" onClick={() => {
                  if (window.confirm('Supprimer cet horaire ?')) deleteMutation.mutate(s.id)
                }} loading={deleteMutation.isPending}>Supprimer</Button>
              </div>
            )
          })}
        </div>
      </QueryState>

      {editing && (
        <ScheduleDialog
          initial={editing === 'new' ? null : editing}
          lines={lines}
          saving={saveMutation.isPending}
          onClose={() => setEditing(null)}
          onSave={(data) => saveMutation.mutate({ id: editing === 'new' ? null : editing.id, data })}
        />
      )}
    </div>
  )
}

function ScheduleDialog({
  initial,
  lines,
  onClose,
  onSave,
  saving,
}: {
  initial: ShuttleSchedule | null
  lines: { id: string; name: string; number: string }[]
  onClose: () => void
  onSave: (payload: CreateSchedulePayload) => void
  saving: boolean
}) {
  const [form, setForm] = useState<FormState>(() => {
    if (!initial) return emptyForm()
    return {
      transitLineId: initial.transitLineId,
      daysOfWeek: [...initial.daysOfWeek],
      departureTime: initial.departureTime,
      activeFrom: toLocalDateInput(initial.activeFrom),
      activeUntil: toLocalDateInput(initial.activeUntil),
      notes: initial.notes ?? '',
    }
  })

  const invalid = useMemo(() => {
    if (!form.transitLineId) return true
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(form.departureTime)) return true
    if (form.daysOfWeek.length === 0) return true
    return false
  }, [form])

  const submit = () => {
    if (invalid || saving) return
    onSave({
      transitLineId: form.transitLineId,
      daysOfWeek: form.daysOfWeek,
      departureTime: form.departureTime,
      activeFrom: form.activeFrom ? new Date(form.activeFrom).toISOString() : undefined,
      activeUntil: form.activeUntil ? new Date(form.activeUntil).toISOString() : null,
      notes: form.notes.trim() || null,
    })
  }

  const toggleDay = (d: number) => {
    setForm((f) => ({
      ...f,
      daysOfWeek: f.daysOfWeek.includes(d) ? f.daysOfWeek.filter((x) => x !== d) : [...f.daysOfWeek, d].sort((a, b) => a - b),
    }))
  }

  return (
    <Dialog
      open
      onClose={onClose}
      icon="schedule"
      iconTone="primary"
      title={initial ? 'Modifier l’horaire' : 'Nouvel horaire'}
      style={{ maxWidth: 520 }}
      actions={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Annuler</Button>
          <Button icon="save" onClick={submit} disabled={invalid} loading={saving}>Enregistrer</Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Select
          label="Ligne"
          value={form.transitLineId}
          onChange={(e) => setForm((f) => ({ ...f, transitLineId: e.target.value }))}
          options={[{ value: '', label: '— Choisir —' }, ...lines.map((l) => ({ value: l.id, label: `${l.name} · #${l.number}` }))]}
          disabled={!!initial}
        />
        <Input
          label="Heure de départ (HH:MM)"
          value={form.departureTime}
          mono
          placeholder="07:30"
          onChange={(e) => setForm((f) => ({ ...f, departureTime: e.target.value }))}
        />
        <div>
          <div style={{ fontWeight: 700, fontSize: 'var(--fs-sm)', marginBottom: 6 }}>Jours</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {DAY_LABELS_FR.map((label, i) => {
              const active = form.daysOfWeek.includes(i)
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleDay(i)}
                  style={{
                    padding: '6px 12px',
                    border: `1px solid ${active ? 'var(--teal-600)' : 'var(--border-default)'}`,
                    background: active ? 'var(--teal-100)' : 'var(--surface-card)',
                    color: active ? 'var(--teal-800)' : 'var(--text-body)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontWeight: active ? 700 : 500,
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Input
            label="Actif depuis"
            type="date"
            value={form.activeFrom}
            onChange={(e) => setForm((f) => ({ ...f, activeFrom: e.target.value }))}
          />
          <Input
            label="Jusqu'au (optionnel)"
            type="date"
            value={form.activeUntil}
            onChange={(e) => setForm((f) => ({ ...f, activeUntil: e.target.value }))}
          />
        </div>
        <Textarea
          label="Notes"
          rows={2}
          value={form.notes}
          maxLength={500}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        />
      </div>
    </Dialog>
  )
}
