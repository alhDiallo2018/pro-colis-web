import { useNavigate } from 'react-router-dom'
import { Badge, Button, Icon, StatBox } from '@/ds'
import { Panel } from '@/components/Panel'
import { BarChart } from '@/components/BarChart'
import { useAuthStore } from '@/store/auth'
import { formatFcfa } from '@/lib/format'
import type { RoleBreakdown, RoleSeries } from '@/lib/api/support-roles'
import { useLeads, useSupportCommercialStats, useSupportTechniqueStats, useTickets } from './hooks'
import {
  LEAD_STAGE_LABEL,
  LEAD_STAGE_TONE,
  TICKET_PRIORITY_LABEL,
  TICKET_PRIORITY_TONE,
  formatFollowUp,
  formatMinutes,
} from './labels'

/** Répartition en barres horizontales : motifs de contact, sources du portefeuille. */
function Breakdown({ items, empty }: { items: RoleBreakdown[]; empty: string }) {
  const total = items.reduce((sum, item) => sum + item.count, 0)
  if (!items.length || total === 0) {
    return <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{empty}</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((item) => (
        <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 12.5 }}>
            <span style={{ flex: 1, color: 'var(--text-body)' }}>{item.label}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-strong)' }}>{item.count}</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'var(--slate-100)', overflow: 'hidden' }}>
            <div style={{ width: `${(item.count / total) * 100}%`, height: '100%', background: 'var(--teal-500)' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Série renvoyée par l'API : les hauteurs sont normalisées par le BarChart. */
function SeriesPanel({ title, series }: { title: string; series: RoleSeries | undefined }) {
  if (!series) return null
  const total = series.values.reduce((sum, value) => sum + value, 0)
  return (
    <Panel title={title} action={<Badge tone="neutral">{`${total} ${series.unit}`}</Badge>}>
      <BarChart bars={series.values} labels={series.labels} height={110} highlightLast />
    </Panel>
  )
}

/**
 * Bloc « mon métier » du tableau de bord support technique : ce que l'agent
 * doit traiter avant de descendre dans la liste des conversations.
 */
function TechniqueSummary() {
  const navigate = useNavigate()
  const stats = useSupportTechniqueStats()
  // La file prioritaire montre les tickets encore actifs. L'API remonte déjà
  // les non résolus en tête, triés par échéance : on garde la tête de liste et
  // on écarte les résolus qui la complètent quand la file est courte.
  const queue = useTickets({ limit: 8 })
  const tickets = (queue.data?.tickets ?? []).filter((ticket) => ticket.status !== 'resolved').slice(0, 5)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
        <StatBox
          icon="confirmation_number"
          tone={stats.data?.openTickets ? 'amber' : 'green'}
          value={stats.data?.openTickets ?? '—'}
          label="Tickets ouverts"
        />
        <StatBox icon="task_alt" tone="green" value={stats.data?.resolvedToday ?? '—'} label="Résolus aujourd'hui" />
        <StatBox
          icon="timer"
          tone="primary"
          value={stats.data ? formatMinutes(stats.data.firstResponseMinutes) : '—'}
          label="1re réponse (moy.)"
        />
        <StatBox
          icon="sentiment_satisfied"
          tone="teal"
          value={stats.data?.satisfactionPercent == null ? '—' : `${stats.data.satisfactionPercent}%`}
          label="Satisfaction"
        />
      </div>

      {Boolean(stats.data?.slaAtRisk) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--red-50)',
            border: '1px solid var(--red-200)',
            color: 'var(--red-600)',
          }}
        >
          <Icon name="alarm" size={20} />
          <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600 }}>
            {stats.data?.slaAtRisk} ticket{(stats.data?.slaAtRisk ?? 0) > 1 ? 's ont' : ' a'} dépassé son échéance de
            première réponse.
          </span>
          <Button size="sm" variant="secondary" onClick={() => navigate('/support-admin/tickets')}>
            Traiter
          </Button>
        </div>
      )}

      <div className="pc-duo" style={{ gap: 16 }}>
        <Panel
          title="File prioritaire"
          flush
          action={
            <Button size="sm" variant="ghost" iconTrailing="chevron_right" onClick={() => navigate('/support-admin/tickets')}>
              Tout voir
            </Button>
          }
        >
          {tickets.length === 0 ? (
            <div style={{ padding: 18, fontSize: 13.5, color: 'var(--text-muted)' }}>
              {queue.isLoading ? 'Chargement…' : 'File vide : aucun ticket ouvert.'}
            </div>
          ) : (
            tickets.map((ticket) => (
              <div
                key={ticket.id}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: '1px solid var(--slate-100)', cursor: 'pointer' }}
                onClick={() => navigate('/support-admin/tickets')}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5, color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ticket.subject}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {ticket.reference} · ouvert depuis {formatMinutes(ticket.ageMinutes)}
                  </div>
                </div>
                <Badge tone={TICKET_PRIORITY_TONE[ticket.priority]}>{TICKET_PRIORITY_LABEL[ticket.priority]}</Badge>
              </div>
            ))
          )}
        </Panel>

        <Panel title="Motifs de contact">
          <Breakdown items={stats.data?.categories ?? []} empty="Aucun ticket catégorisé ce mois-ci." />
        </Panel>
      </div>

      <SeriesPanel title="Tickets · 7 jours" series={stats.data?.weeklySeries} />
    </div>
  )
}

/** Bloc « mon métier » du tableau de bord support commercial. */
function CommercialSummary() {
  const navigate = useNavigate()
  const stats = useSupportCommercialStats()
  const leads = useLeads()
  // Relances à faire : ce que l'agent doit rappeler aujourd'hui ou aurait dû
  // rappeler hier. Les signés sortent du radar.
  const followUps = (leads.data?.leads ?? [])
    .filter((lead) => lead.stage !== 'signed' && lead.daysToFollowUp != null && lead.daysToFollowUp <= 0)
    .slice(0, 5)

  const objective = stats.data?.monthlyObjective ?? 0
  const revenue = stats.data?.monthlyRevenue ?? 0
  const progress = objective > 0 ? Math.min(100, Math.round((revenue / objective) * 100)) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Panel
        title="Objectif du mois"
        action={stats.data?.territory ? <Badge tone="neutral" icon="map">{stats.data.territory}</Badge> : undefined}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 26, color: 'var(--text-strong)' }}>
            {formatFcfa(revenue)}
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {objective > 0 ? `sur ${formatFcfa(objective)}` : 'aucun objectif défini ce mois-ci'}
          </span>
          {progress != null && (
            <Badge tone={progress >= 100 ? 'green' : progress >= 60 ? 'teal' : 'amber'} style={{ marginLeft: 'auto' }}>
              {progress}%
            </Badge>
          )}
        </div>
        {progress != null && (
          <div style={{ height: 8, borderRadius: 4, background: 'var(--slate-100)', overflow: 'hidden', marginTop: 12 }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'var(--gradient-brand)' }} />
          </div>
        )}
      </Panel>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
        <StatBox icon="hub" tone="primary" value={stats.data?.activeLeads ?? '—'} label="Prospects actifs" />
        <StatBox icon="handshake" tone="green" value={stats.data?.signedThisMonth ?? '—'} label="Signés ce mois" />
        <StatBox
          icon="percent"
          tone="teal"
          value={stats.data?.conversionPercent == null ? '—' : `${stats.data.conversionPercent}%`}
          label="Taux de conversion"
        />
        <StatBox icon="add_business" tone="amber" value={stats.data?.newZonesSigned ?? '—'} label="Nouvelles zones" />
      </div>

      <div className="pc-duo" style={{ gap: 16 }}>
        <Panel
          title="Relances à faire"
          flush
          action={
            <Button size="sm" variant="ghost" iconTrailing="chevron_right" onClick={() => navigate('/support-admin/prospects')}>
              Le pipeline
            </Button>
          }
        >
          {followUps.length === 0 ? (
            <div style={{ padding: 18, fontSize: 13.5, color: 'var(--text-muted)' }}>
              {leads.isLoading ? 'Chargement…' : 'Portefeuille à jour : aucune relance en retard.'}
            </div>
          ) : (
            followUps.map((lead) => (
              <div
                key={lead.id}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: '1px solid var(--slate-100)', cursor: 'pointer' }}
                onClick={() => navigate('/support-admin/prospects')}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5, color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {lead.name}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{formatFollowUp(lead.daysToFollowUp)}</div>
                </div>
                <Badge tone={LEAD_STAGE_TONE[lead.stage]}>{LEAD_STAGE_LABEL[lead.stage]}</Badge>
              </div>
            ))
          )}
        </Panel>

        <Panel title="Répartition du portefeuille">
          <Breakdown items={stats.data?.sources ?? []} empty="Aucun prospect enregistré." />
        </Panel>
      </div>

      <SeriesPanel title="Contrats signés · année" series={stats.data?.monthlySeries} />
    </div>
  )
}

/**
 * Bloc métier du tableau de bord support, choisi d'après le rôle. Le compte
 * `support` généraliste n'a pas d'espace dédié côté API : il ne voit rien de
 * plus que les conversations et les assistances.
 */
export function SupportRoleSummary() {
  const role = useAuthStore((state) => state.user?.role)
  if (role === 'support_technique') return <TechniqueSummary />
  if (role === 'support_commercial') return <CommercialSummary />
  return null
}
