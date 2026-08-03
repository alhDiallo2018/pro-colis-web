import { useState } from 'react'
import { Avatar, Badge, Button, Dialog, Icon, Input, Select } from '@/ds'
import { QueryState } from '@/components/QueryState'
import type { TicketPriority } from '@/lib/api/support-roles'
import { formatDateTime } from '@/lib/format'
import { useTicket, useUpdateTicket } from './hooks'
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

interface Props {
  ticketId: string
  onClose: () => void
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-strong)', overflowWrap: 'anywhere' }}>
        {children}
      </div>
    </div>
  )
}

/**
 * Panneau de détail d'un ticket. La liste n'affiche que l'objet : le corps du
 * message, la catégorie et la priorité ne sont modifiables que d'ici.
 */
export function TicketDetailDialog({ ticketId, onClose }: Props) {
  const query = useTicket(ticketId)
  const update = useUpdateTicket()
  const ticket = query.data
  const [category, setCategory] = useState<string | null>(null)

  // `null` tant que l'agent n'a rien tapé : on n'écrase pas la valeur serveur
  // par un champ encore vide pendant le chargement.
  const categoryValue = category ?? ticket?.category ?? ''

  return (
    <Dialog
      open
      onClose={onClose}
      icon="confirmation_number"
      iconTone="primary"
      size="lg"
      title={ticket ? `${ticket.reference} · ${ticket.subject}` : 'Ticket'}
      style={{ maxWidth: 640 }}
      actions={<Button variant="secondary" block onClick={onClose}>Fermer</Button>}
    >
      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => query.refetch()}
      >
        {ticket && (
          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Badge tone={TICKET_PRIORITY_TONE[ticket.priority]}>{TICKET_PRIORITY_LABEL[ticket.priority]}</Badge>
              <Badge tone={TICKET_STATUS_TONE[ticket.status]}>{TICKET_STATUS_LABEL[ticket.status]}</Badge>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'var(--text-muted)' }}>
                <Icon name={TICKET_CHANNEL_ICON[ticket.channel]} size={15} />
                {TICKET_CHANNEL_LABEL[ticket.channel]}
              </span>
            </div>

            {ticket.body && (
              <div style={{ background: 'var(--slate-50)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
                <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginBottom: 6 }}>Message du demandeur</div>
                <div style={{ whiteSpace: 'pre-wrap', fontSize: 13.5, lineHeight: 1.6, color: 'var(--text-body)' }}>
                  {ticket.body}
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              <Field label="Demandeur">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Avatar name={ticket.requesterName ?? '?'} size="xs" />
                  {ticket.requesterName ?? 'Inconnu'}
                </span>
              </Field>
              <Field label="Titulaire">{ticket.assigneeName ?? 'Non assigné'}</Field>
              <Field label="Ouvert depuis">{formatMinutes(ticket.ageMinutes)}</Field>
              <Field label="Échéance SLA">
                {ticket.slaRemainingMinutes == null
                  ? 'Pas de SLA'
                  : ticket.slaRemainingMinutes < 0
                    ? `dépassée de ${formatMinutes(ticket.slaRemainingMinutes)}`
                    : `dans ${formatMinutes(ticket.slaRemainingMinutes)}`}
              </Field>
              <Field label="Créé le">{formatDateTime(ticket.createdAt)}</Field>
              {ticket.firstResponseAt && (
                <Field label="Première réponse">{formatDateTime(ticket.firstResponseAt)}</Field>
              )}
              {ticket.resolvedAt && <Field label="Résolu le">{formatDateTime(ticket.resolvedAt)}</Field>}
              {ticket.satisfactionScore != null && (
                <Field label="Satisfaction">{ticket.satisfactionScore}/5</Field>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, alignItems: 'end' }}>
              <Select
                label="Priorité"
                value={ticket.priority}
                options={TICKET_PRIORITIES.map((priority) => ({
                  value: priority,
                  label: TICKET_PRIORITY_LABEL[priority],
                }))}
                onChange={(e) =>
                  update.mutate({ ticketId, payload: { priority: e.target.value as TicketPriority } })
                }
              />
              <div style={{ display: 'flex', gap: 8, alignItems: 'end' }}>
                <div style={{ flex: 1 }}>
                  <Input
                    label="Catégorie"
                    value={categoryValue}
                    placeholder="ex. paiement"
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>
                <Button
                  size="sm"
                  icon="save"
                  loading={update.isPending}
                  disabled={categoryValue.trim() === (ticket.category ?? '')}
                  onClick={() =>
                    update.mutate(
                      { ticketId, payload: { category: categoryValue.trim() } },
                      { onSuccess: () => setCategory(null) },
                    )
                  }
                >
                  Enregistrer
                </Button>
              </div>
            </div>
          </div>
        )}
      </QueryState>
    </Dialog>
  )
}
