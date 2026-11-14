import { Badge, StatBox } from '@/ds'
import { Panel } from '@/components/Panel'
import { useSupportSlaOverview } from './hooks'
import type { SupportSlaOverview } from '@/lib/api/support-roles'

type Tone = 'green' | 'amber' | 'red'

function slaTone(value: number, severity: 'risk' | 'breach'): Tone {
  if (value <= 0) return 'green'
  return severity === 'breach' ? 'red' : 'amber'
}

function formatMinutes(minutes: number | null): string {
  if (minutes == null) return '—'
  if (minutes < 60) return `${Math.round(minutes)} min`
  const hours = minutes / 60
  return hours < 10 ? `${hours.toFixed(1)} h` : `${Math.round(hours)} h`
}

function formatHours(hours: number | null): string {
  if (hours == null) return '—'
  if (hours < 1) return `${Math.round(hours * 60)} min`
  return hours < 10 ? `${hours.toFixed(1)} h` : `${Math.round(hours)} h`
}

function pills(data: SupportSlaOverview) {
  return [
    {
      key: 'technicalAtRisk',
      icon: 'alarm',
      value: data.technicalAtRisk,
      label: 'Tickets à risque',
      tone: slaTone(data.technicalAtRisk, 'risk'),
    },
    {
      key: 'technicalBreached',
      icon: 'report',
      value: data.technicalBreached,
      label: 'Tickets dépassés',
      tone: slaTone(data.technicalBreached, 'breach'),
    },
    {
      key: 'commercialDelayed',
      icon: 'event_busy',
      value: data.commercialDelayed,
      label: 'Relances en retard',
      tone: slaTone(data.commercialDelayed, 'risk'),
    },
    {
      key: 'chatExceeded',
      icon: 'forum',
      value: data.chatExceeded,
      label: 'Chats dépassés',
      tone: slaTone(data.chatExceeded, 'breach'),
    },
  ]
}

/**
 * Supervision SLA transverse (support technique + commercial + chat).
 *
 * La carte reproduit les quatre pastilles du dashboard mobile et affiche en
 * complément les deux moyennes contextuelles renvoyées par l'API. Si l'agrégat
 * n'est pas (encore) exposé par le backend, le hook renvoie `null` et le
 * composant se masque de lui-même — on ne fabrique jamais de métriques côté
 * client.
 */
export function SlaCrossTierCard() {
  const query = useSupportSlaOverview()
  const data = query.data
  if (!query.isLoading && !data) return null

  const loading = query.isLoading && !data
  const items = data ? pills(data) : []

  return (
    <Panel
      title="Supervision SLA"
      action={<Badge tone="neutral">Tous les tiers</Badge>}
    >
      {loading ? (
        <div style={{ padding: 18, fontSize: 13.5, color: 'var(--text-muted)' }}>Chargement…</div>
      ) : data ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 14,
            }}
          >
            {items.map((item) => (
              <StatBox
                key={item.key}
                icon={item.icon}
                tone={item.tone}
                value={item.value}
                label={item.label}
              />
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              gap: 18,
              flexWrap: 'wrap',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface-sunken)',
              border: '1px solid var(--border-subtle)',
              fontSize: 12.5,
              color: 'var(--text-muted)',
            }}
          >
            <span>
              1<sup>re</sup> réponse chat ·{' '}
              <strong style={{ color: 'var(--text-strong)', fontFamily: 'var(--font-mono)' }}>
                {formatMinutes(data.chatAvgFirstResponseMinutes)}
              </strong>
            </span>
            <span>
              Résolution tickets ·{' '}
              <strong style={{ color: 'var(--text-strong)', fontFamily: 'var(--font-mono)' }}>
                {formatHours(data.technicalAvgResolutionHours)}
              </strong>
            </span>
          </div>
        </div>
      ) : null}
    </Panel>
  )
}
