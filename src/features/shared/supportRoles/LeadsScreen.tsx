import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { Badge, Button, Dialog, Icon, Input, SegmentedControl, Select, StatBox, Textarea } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import { ApiError } from '@/lib/api/client'
import type { CommercialLead, LeadKind, LeadStage } from '@/lib/api/support-roles'
import { formatDate, formatFcfa } from '@/lib/format'
import { useCreateLead, useLeads, useSupportCommercialStats, useUpdateLead } from './hooks'
import {
  LEAD_KIND_ICON,
  LEAD_KIND_LABEL,
  LEAD_STAGES,
  LEAD_STAGE_LABEL,
  LEAD_STAGE_TONE,
  formatFollowUp,
  nextStage,
} from './labels'

const STAGE_FILTERS = [
  { value: 'all', label: 'Tous' },
  ...LEAD_STAGES.map((stage) => ({ value: stage, label: LEAD_STAGE_LABEL[stage] })),
]

const KIND_OPTIONS = (Object.keys(LEAD_KIND_LABEL) as LeadKind[]).map((kind) => ({
  value: kind,
  label: LEAD_KIND_LABEL[kind],
}))

const STAGE_OPTIONS = LEAD_STAGES.map((stage) => ({ value: stage, label: LEAD_STAGE_LABEL[stage] }))

interface LeadFormState {
  name: string
  city: string
  kind: LeadKind
  stage: LeadStage
  monthlyValue: string
  contactName: string
  contactPhone: string
  nextFollowUpAt: string
  notes: string
}

const EMPTY_FORM: LeadFormState = {
  name: '',
  city: '',
  kind: 'business_client',
  stage: 'contacted',
  monthlyValue: '0',
  contactName: '',
  contactPhone: '',
  nextFollowUpAt: '',
  notes: '',
}

function LeadDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState<LeadFormState>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const mutation = useCreateLead()

  const close = () => {
    setForm(EMPTY_FORM)
    setError(null)
    onClose()
  }

  const submit = async () => {
    if (!form.name.trim()) {
      setError('Le nom du prospect est obligatoire.')
      return
    }
    setError(null)
    try {
      await mutation.mutateAsync({
        name: form.name.trim(),
        city: form.city.trim() || undefined,
        kind: form.kind,
        stage: form.stage,
        monthlyValue: Number(form.monthlyValue) || 0,
        contactName: form.contactName.trim() || undefined,
        contactPhone: form.contactPhone.trim() || undefined,
        nextFollowUpAt: form.nextFollowUpAt || undefined,
        notes: form.notes.trim() || undefined,
      })
      close()
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "Le prospect n'a pas pu être créé.")
    }
  }

  return (
    <Dialog
      open={open}
      title="Nouveau prospect"
      icon="person_add"
      iconTone="primary"
      size="lg"
      onClose={close}
      actions={
        <>
          <Button variant="ghost" onClick={close}>
            Annuler
          </Button>
          <Button icon="check" loading={mutation.isPending} onClick={submit}>
            Créer
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
        <Input
          label="Nom"
          placeholder="Ex : Garage Liberté 6"
          value={form.name}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target.value })}
        />
        <div className="pc-field-pair" style={{ gap: 12 }}>
          <Input
            label="Ville"
            placeholder="Ex : Dakar"
            value={form.city}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, city: e.target.value })}
          />
          <Select
            label="Type"
            value={form.kind}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setForm({ ...form, kind: e.target.value as LeadKind })}
            options={KIND_OPTIONS}
          />
        </div>
        <div className="pc-field-pair" style={{ gap: 12 }}>
          <Select
            label="Étape"
            value={form.stage}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setForm({ ...form, stage: e.target.value as LeadStage })}
            options={STAGE_OPTIONS}
          />
          <Input
            label="Valeur mensuelle (FCFA)"
            type="number"
            value={form.monthlyValue}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, monthlyValue: e.target.value })}
          />
        </div>
        <div className="pc-field-pair" style={{ gap: 12 }}>
          <Input
            label="Contact"
            placeholder="Nom du décideur"
            value={form.contactName}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, contactName: e.target.value })}
          />
          <Input
            label="Téléphone"
            placeholder="+221…"
            value={form.contactPhone}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, contactPhone: e.target.value })}
          />
        </div>
        <Input
          label="Prochaine relance"
          type="date"
          value={form.nextFollowUpAt}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, nextFollowUpAt: e.target.value })}
        />
        <Textarea
          label="Notes"
          rows={3}
          placeholder="Contexte, objections, prochaine action…"
          value={form.notes}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, notes: e.target.value })}
        />
        {error && <span style={{ color: 'var(--red-500)', fontSize: 12.5 }}>{error}</span>}
      </div>
    </Dialog>
  )
}

/** Ruban des quatre étapes : la position dans le pipeline se lit d'un coup d'œil. */
function StageTrack({ stage }: { stage: LeadStage }) {
  const current = LEAD_STAGES.indexOf(stage)
  return (
    <div style={{ display: 'flex', gap: 4, flex: 1, minWidth: 90, maxWidth: 160 }}>
      {LEAD_STAGES.map((step, index) => (
        <span
          key={step}
          title={LEAD_STAGE_LABEL[step]}
          style={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            background: index <= current ? 'var(--teal-500)' : 'var(--slate-200)',
          }}
        />
      ))}
    </div>
  )
}

function LeadRow({ lead }: { lead: CommercialLead }) {
  const update = useUpdateLead()
  const advanceTo = nextStage(lead.stage)
  const overdue = (lead.daysToFollowUp ?? 0) < 0 && lead.stage !== 'signed'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: '14px 18px',
        borderBottom: '1px solid var(--slate-100)',
        borderLeft: overdue ? '3px solid var(--amber-400)' : '3px solid transparent',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Icon name={LEAD_KIND_ICON[lead.kind]} size={18} />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14.5, color: 'var(--text-strong)' }}>
          {lead.name}
        </span>
        <Badge tone={LEAD_STAGE_TONE[lead.stage]}>{LEAD_STAGE_LABEL[lead.stage]}</Badge>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, color: 'var(--teal-600)' }}>
          {formatFcfa(lead.monthlyValue)}/mois
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', fontSize: 12.5, color: 'var(--text-muted)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <Icon name="category" size={15} />
          {LEAD_KIND_LABEL[lead.kind]}
        </span>
        {lead.city && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Icon name="location_on" size={15} />
            {lead.city}
          </span>
        )}
        {lead.contactName && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Icon name="person" size={15} />
            {[lead.contactName, lead.contactPhone].filter(Boolean).join(' · ')}
          </span>
        )}
        {lead.stage === 'signed' ? (
          <span style={{ fontWeight: 700, color: 'var(--green-700)' }}>Signé le {formatDate(lead.signedAt)}</span>
        ) : (
          <span style={{ fontWeight: 700, color: overdue ? 'var(--amber-700)' : 'var(--text-muted)' }}>
            {formatFollowUp(lead.daysToFollowUp)}
          </span>
        )}
      </div>

      {lead.notes && <div style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.45 }}>{lead.notes}</div>}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <StageTrack stage={lead.stage} />
        {advanceTo && (
          <Button
            variant="secondary"
            size="sm"
            icon="arrow_forward"
            loading={update.isPending}
            onClick={() => update.mutate({ leadId: lead.id, payload: { stage: advanceTo } })}
          >
            Passer en {LEAD_STAGE_LABEL[advanceTo].toLowerCase()}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          icon="event"
          loading={update.isPending}
          onClick={() => {
            // Relance à J+7 : le geste courant du terrain, sans ouvrir de
            // formulaire pour une seule date.
            const target = new Date()
            target.setDate(target.getDate() + 7)
            update.mutate({ leadId: lead.id, payload: { nextFollowUpAt: target.toISOString().slice(0, 10) } })
          }}
        >
          Relancer dans 7 j
        </Button>
      </div>
    </div>
  )
}

/**
 * Pipeline commercial — pendant web de l'onglet « Prospects » du mobile.
 * L'API ne renvoie que le portefeuille de l'agent connecté (le super admin
 * voit tout), aucun filtrage supplémentaire n'est nécessaire ici.
 */
export function LeadsScreen() {
  const [stage, setStage] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)

  const stats = useSupportCommercialStats()
  const query = useLeads(stage === 'all' ? undefined : (stage as LeadStage))
  const leads = query.data?.leads ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <StatBox icon="hub" tone="primary" value={stats.data?.activeLeads ?? '—'} label="Prospects actifs" />
        <StatBox icon="handshake" tone="green" value={stats.data?.signedThisMonth ?? '—'} label="Signés ce mois" />
        <StatBox
          icon="percent"
          tone="teal"
          value={stats.data?.conversionPercent == null ? '—' : `${stats.data.conversionPercent}%`}
          label="Taux de conversion"
        />
        <StatBox
          icon="notification_important"
          tone={stats.data?.overdueFollowUps ? 'amber' : 'neutral'}
          value={stats.data?.overdueFollowUps ?? '—'}
          label="Relances en retard"
        />
      </div>

      <Panel
        title="Pipeline commercial"
        flush
        action={
          <Button size="sm" icon="add" onClick={() => setDialogOpen(true)}>
            Nouveau prospect
          </Button>
        }
      >
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--slate-100)' }}>
          <SegmentedControl size="sm" options={STAGE_FILTERS} value={stage} onChange={setStage} />
        </div>

        <QueryState
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          isEmpty={leads.length === 0}
          emptyTitle="Aucun prospect"
          emptyMessage="Aucun prospect ne correspond à cette étape."
          onRetry={() => query.refetch()}
        >
          {leads.map((lead) => (
            <LeadRow key={lead.id} lead={lead} />
          ))}
        </QueryState>
      </Panel>

      <LeadDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  )
}
