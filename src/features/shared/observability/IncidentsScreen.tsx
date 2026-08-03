import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { Badge, Button, Dialog, Icon, Input, SegmentedControl, Select, StatBox } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import { ApiError } from '@/lib/api/client'
import type { IncidentSeverity, PlatformIncident } from '@/lib/api/incidents'
import { formatDateTime } from '@/lib/format'
import { useCreateIncident, useIncidents, useUpdateIncident } from './hooks'
import { formatDuration } from './labels'

const SEVERITY_LABEL: Record<IncidentSeverity, string> = {
  sev1: 'SEV1 — critique',
  sev2: 'SEV2 — majeur',
  sev3: 'SEV3 — mineur',
}

const SEVERITY_TONE: Record<IncidentSeverity, 'red' | 'amber' | 'neutral'> = {
  sev1: 'red',
  sev2: 'amber',
  sev3: 'neutral',
}

const SEVERITY_OPTIONS = (Object.keys(SEVERITY_LABEL) as IncidentSeverity[]).map((value) => ({
  value,
  label: SEVERITY_LABEL[value],
}))

interface IncidentFormState {
  title: string
  scope: string
  severity: IncidentSeverity
  impactedUsers: string
  mitigated: boolean
}

const EMPTY_FORM: IncidentFormState = {
  title: '',
  scope: '',
  severity: 'sev2',
  impactedUsers: '0',
  mitigated: false,
}

function IncidentDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState<IncidentFormState>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const mutation = useCreateIncident()

  const close = () => {
    setForm(EMPTY_FORM)
    setError(null)
    onClose()
  }

  const submit = async () => {
    if (!form.title.trim() || !form.scope.trim()) {
      setError('Le titre et le périmètre sont obligatoires.')
      return
    }
    setError(null)
    try {
      await mutation.mutateAsync({
        title: form.title.trim(),
        scope: form.scope.trim(),
        severity: form.severity,
        impactedUsers: Number(form.impactedUsers) || 0,
        mitigated: form.mitigated,
      })
      close()
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "L'incident n'a pas pu être déclaré.")
    }
  }

  return (
    <Dialog
      open={open}
      title="Déclarer un incident"
      icon="report"
      iconTone="amber"
      size="lg"
      onClose={close}
      actions={
        <>
          <Button variant="ghost" onClick={close}>
            Annuler
          </Button>
          <Button icon="check" loading={mutation.isPending} onClick={submit}>
            Déclarer
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
        <Input
          label="Titre"
          placeholder="Ex : paiements PayDunya en échec"
          value={form.title}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, title: e.target.value })}
        />
        <Input
          label="Périmètre"
          placeholder="Ex : paiements en ligne, tous rôles"
          value={form.scope}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, scope: e.target.value })}
        />
        <div className="pc-field-pair" style={{ gap: 12 }}>
          <Select
            label="Sévérité"
            value={form.severity}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setForm({ ...form, severity: e.target.value as IncidentSeverity })
            }
            options={SEVERITY_OPTIONS}
          />
          <Input
            label="Utilisateurs impactés"
            type="number"
            value={form.impactedUsers}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, impactedUsers: e.target.value })}
          />
        </div>
        {error && <span style={{ color: 'var(--red-500)', fontSize: 12.5 }}>{error}</span>}
      </div>
    </Dialog>
  )
}

function IncidentCard({ incident }: { incident: PlatformIncident }) {
  const update = useUpdateIncident()
  const resolved = Boolean(incident.resolvedAt)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: '14px 18px',
        borderBottom: '1px solid var(--slate-100)',
        opacity: resolved ? 0.72 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Badge tone={SEVERITY_TONE[incident.severity]}>{SEVERITY_LABEL[incident.severity]}</Badge>
        {resolved ? (
          <Badge tone="green" icon="check_circle">
            Résolu
          </Badge>
        ) : incident.mitigated ? (
          <Badge tone="teal" icon="healing">
            Mitigé
          </Badge>
        ) : (
          <Badge tone="red" icon="bolt">
            En cours
          </Badge>
        )}
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--text-faint)' }}>
          {resolved ? formatDateTime(incident.resolvedAt) : `depuis ${formatDuration(incident.sinceMinutes)}`}
        </span>
      </div>

      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14.5, color: 'var(--text-strong)' }}>
        {incident.title}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', fontSize: 12.5, color: 'var(--text-muted)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <Icon name="flag" size={15} />
          {incident.scope}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <Icon name="group" size={15} />
          {incident.impactedUsers} utilisateur{incident.impactedUsers > 1 ? 's' : ''} impacté
          {incident.impactedUsers > 1 ? 's' : ''}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <Icon name="schedule" size={15} />
          Début {formatDateTime(incident.startedAt)}
        </span>
      </div>

      {!resolved && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {!incident.mitigated && (
            <Button
              variant="secondary"
              size="sm"
              icon="healing"
              loading={update.isPending}
              onClick={() => update.mutate({ incidentId: incident.id, payload: { mitigated: true } })}
            >
              Marquer mitigé
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            icon="check_circle"
            loading={update.isPending}
            onClick={() => update.mutate({ incidentId: incident.id, payload: { resolved: true } })}
          >
            Clôturer
          </Button>
        </div>
      )}

      {resolved && (
        <div>
          <Button
            variant="ghost"
            size="sm"
            icon="restart_alt"
            loading={update.isPending}
            onClick={() => update.mutate({ incidentId: incident.id, payload: { resolved: false } })}
          >
            Rouvrir
          </Button>
        </div>
      )}
    </div>
  )
}

/**
 * Incidents plateforme : le pendant humain des journaux techniques. Les
 * journaux disent ce qui casse, l'incident dit ce que l'équipe en fait.
 */
export function IncidentsScreen() {
  const [scopeFilter, setScopeFilter] = useState('open')
  const [dialogOpen, setDialogOpen] = useState(false)

  const includeResolved = scopeFilter === 'all'
  const query = useIncidents(includeResolved)
  const incidents = query.data ?? []

  const open = incidents.filter((incident) => !incident.resolvedAt)
  const critical = open.filter((incident) => incident.severity === 'sev1')
  const impacted = open.reduce((total, incident) => total + incident.impactedUsers, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <StatBox icon="bolt" tone={open.length ? 'red' : 'green'} value={open.length} label="Incidents ouverts" />
        <StatBox icon="priority_high" tone={critical.length ? 'red' : 'neutral'} value={critical.length} label="Critiques (SEV1)" />
        <StatBox icon="group" tone="amber" value={impacted} label="Utilisateurs impactés" />
        <StatBox
          icon="healing"
          tone="teal"
          value={open.filter((incident) => incident.mitigated).length}
          label="Mitigés, en surveillance"
        />
      </div>

      <Panel
        title="Incidents plateforme"
        flush
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <SegmentedControl
              size="sm"
              options={[
                { value: 'open', label: 'Ouverts' },
                { value: 'all', label: 'Tous' },
              ]}
              value={scopeFilter}
              onChange={setScopeFilter}
            />
            <Button size="sm" icon="add" onClick={() => setDialogOpen(true)}>
              Déclarer
            </Button>
          </div>
        }
      >
        <QueryState
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          isEmpty={incidents.length === 0}
          emptyTitle="Aucun incident"
          emptyMessage={
            includeResolved
              ? "Aucun incident n'a été déclaré."
              : 'Aucun incident ouvert. La plateforme fonctionne normalement.'
          }
          onRetry={() => query.refetch()}
        >
          {incidents.map((incident) => (
            <IncidentCard key={incident.id} incident={incident} />
          ))}
        </QueryState>
      </Panel>

      <IncidentDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  )
}
