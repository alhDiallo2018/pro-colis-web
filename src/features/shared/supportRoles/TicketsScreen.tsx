import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { Avatar, Badge, Button, Icon, SegmentedControl, Select, StatBox } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import type { SupportTicket, TicketPriority, TicketStatus } from '@/lib/api/support-roles'
import { formatDateTime } from '@/lib/format'
import { useSupportTechniqueStats, useTickets, useUpdateTicket } from './hooks'
import { TicketDetailDialog } from './TicketDetailDialog'
import {
  TICKET_CHANNEL_ICON,
  TICKET_CHANNEL_LABEL,
  TICKET_PRIORITIES,
  TICKET_PRIORITY_LABEL,
  TICKET_PRIORITY_TONE,
  TICKET_STATUS_LABEL,
  TICKET_STATUS_TONE,
  formatMinutes,
} from './labels'

const REQUESTER_ROLE_LABEL: Record<string, string> = {
  client: 'Client',
  driver: 'Chauffeur',
  admin: 'Admin zone',
  super_admin: 'Super admin',
  support: 'Support',
  support_technique: 'Support technique',
  support_commercial: 'Support commercial',
}

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'open', label: 'Ouverts' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'pending', label: 'En attente' },
  { value: 'resolved', label: 'Résolus' },
]

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'Toutes priorités' },
  ...TICKET_PRIORITIES.map((priority) => ({ value: priority, label: TICKET_PRIORITY_LABEL[priority] })),
]

function requesterLabel(ticket: SupportTicket): string {
  const name = ticket.requesterName ?? 'Demandeur inconnu'
  if (!ticket.requesterRole) return name
  return `${name} · ${REQUESTER_ROLE_LABEL[ticket.requesterRole] ?? ticket.requesterRole}`
}

/** Formule l'échéance de première réponse du point de vue de l'agent. */
function slaLabel(ticket: SupportTicket): string {
  if (ticket.slaRemainingMinutes == null) return 'Pas de SLA'
  return ticket.slaRemainingMinutes < 0
    ? `SLA dépassé de ${formatMinutes(ticket.slaRemainingMinutes)}`
    : `SLA dans ${formatMinutes(ticket.slaRemainingMinutes)}`
}

function TicketRow({ ticket, onOpen }: { ticket: SupportTicket; onOpen: () => void }) {
  const update = useUpdateTicket()
  const resolved = ticket.status === 'resolved'
  const breached = !resolved && ticket.slaRemainingMinutes != null && ticket.slaRemainingMinutes < 0

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: '14px 18px',
        borderBottom: '1px solid var(--slate-100)',
        // Le liseré rouge reprend l'accent de la carte mobile : un SLA dépassé
        // doit se repérer sans lire la ligne.
        borderLeft: breached ? '3px solid var(--red-400)' : '3px solid transparent',
        opacity: resolved ? 0.72 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--slate-500)' }}>
          {ticket.reference}
        </span>
        <Badge tone={TICKET_PRIORITY_TONE[ticket.priority]}>{TICKET_PRIORITY_LABEL[ticket.priority]}</Badge>
        <Badge tone={TICKET_STATUS_TONE[ticket.status]}>{TICKET_STATUS_LABEL[ticket.status]}</Badge>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--text-faint)' }}>
          {resolved ? formatDateTime(ticket.resolvedAt) : `ouvert depuis ${formatMinutes(ticket.ageMinutes)}`}
        </span>
      </div>

      <button
        type="button"
        onClick={onOpen}
        style={{
          border: 0, background: 'none', padding: 0, textAlign: 'left', cursor: 'pointer',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14.5,
          color: 'var(--text-strong)', lineHeight: 1.3,
        }}
      >
        {ticket.subject}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <Avatar name={ticket.requesterName ?? '?'} size="xs" />
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--slate-600)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {requesterLabel(ticket)}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', fontSize: 12.5, color: 'var(--text-muted)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <Icon name={TICKET_CHANNEL_ICON[ticket.channel]} size={15} />
          {TICKET_CHANNEL_LABEL[ticket.channel]}
        </span>
        {ticket.category && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Icon name="label" size={15} />
            {ticket.category}
          </span>
        )}
        {ticket.assigneeName && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Icon name="person" size={15} />
            {ticket.assigneeName}
          </span>
        )}
        {!resolved && (
          <span style={{ fontWeight: 700, color: breached ? 'var(--red-500)' : 'var(--green-700)' }}>{slaLabel(ticket)}</span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {!resolved && ticket.status !== 'in_progress' && (
          <Button
            variant="secondary"
            size="sm"
            icon="play_arrow"
            loading={update.isPending}
            onClick={() => update.mutate({ ticketId: ticket.id, payload: { status: 'in_progress' } })}
          >
            Prendre en charge
          </Button>
        )}
        {!resolved && (
          <Button
            size="sm"
            icon="check"
            loading={update.isPending}
            onClick={() => update.mutate({ ticketId: ticket.id, payload: { status: 'resolved' } })}
          >
            Résoudre
          </Button>
        )}
        {resolved && (
          <Button
            variant="ghost"
            size="sm"
            icon="restart_alt"
            loading={update.isPending}
            onClick={() => update.mutate({ ticketId: ticket.id, payload: { status: 'open' } })}
          >
            Rouvrir
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * File de tickets du support technique — pendant web de l'onglet « Tickets »
 * de l'app mobile. Les compteurs viennent de `/support-technique/stats` plutôt
 * que d'un décompte local : la liste est paginée, elle ne voit pas tout.
 */
export function TicketsScreen() {
  const [status, setStatus] = useState('all')
  const [priority, setPriority] = useState('all')
  const [mineOnly, setMineOnly] = useState(false)
  const [openTicketId, setOpenTicketId] = useState<string | null>(null)

  const stats = useSupportTechniqueStats()
  const query = useTickets({
    status: status === 'all' ? undefined : (status as TicketStatus),
    priority: priority === 'all' ? undefined : (priority as TicketPriority),
    assignedToMe: mineOnly || undefined,
  })
  const tickets = query.data?.tickets ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <StatBox
          icon="confirmation_number"
          tone={stats.data?.openTickets ? 'amber' : 'green'}
          value={stats.data?.openTickets ?? '—'}
          label="Tickets ouverts"
        />
        <StatBox icon="task_alt" tone="green" value={stats.data?.resolvedToday ?? '—'} label="Résolus aujourd'hui" />
        <StatBox
          icon="alarm"
          tone={stats.data?.slaAtRisk ? 'red' : 'neutral'}
          value={stats.data?.slaAtRisk ?? '—'}
          label="SLA dépassés"
        />
        <StatBox
          icon="timer"
          tone="primary"
          value={stats.data ? formatMinutes(stats.data.firstResponseMinutes) : '—'}
          label="1re réponse (moy.)"
        />
      </div>

      <Panel
        title="File de tickets"
        flush
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Select
              value={priority}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setPriority(e.target.value)}
              options={PRIORITY_OPTIONS}
            />
            <Button
              variant={mineOnly ? 'primary' : 'secondary'}
              size="sm"
              icon="person"
              onClick={() => setMineOnly((value) => !value)}
            >
              Mes tickets
            </Button>
          </div>
        }
      >
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--slate-100)' }}>
          <SegmentedControl size="sm" options={STATUS_FILTERS} value={status} onChange={setStatus} />
        </div>

        <QueryState
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          isEmpty={tickets.length === 0}
          emptyTitle="Aucun ticket"
          emptyMessage="Aucun ticket ne correspond à ces filtres."
          onRetry={() => query.refetch()}
        >
          {tickets.map((ticket) => (
            <TicketRow key={ticket.id} ticket={ticket} onOpen={() => setOpenTicketId(ticket.id)} />
          ))}
        </QueryState>
      </Panel>

      {openTicketId && (
        <TicketDetailDialog ticketId={openTicketId} onClose={() => setOpenTicketId(null)} />
      )}
    </div>
  )
}
