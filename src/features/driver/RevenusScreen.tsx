import { Badge, StatBox } from '@/ds'
import { Panel } from '@/components/Panel'
import { BarChart } from '@/components/BarChart'
import { QueryState } from '@/components/QueryState'
import { useDriverPayments } from './hooks'
import { formatDate, formatFcfa } from '@/lib/format'

const WEEK_BARS = [46, 62, 40, 78, 55, 88, 100]
const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export function RevenusScreen() {
  const query = useDriverPayments()
  const payments = (query.data ?? []).filter((p) => p.status === 'completed' || p.status === 'confirmed')
  const total = payments.reduce((sum, p) => sum + (p.amount ?? 0), 0)
  const count = payments.length

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <StatBox icon="payments" tone="green" value={formatFcfa(total)} label="Revenus encaissés" />
        <StatBox icon="receipt_long" tone="primary" value={count} label="Paiements" />
        <StatBox icon="trending_up" tone="amber" value="+14%" label="vs semaine dernière" />
      </div>

      <Panel title="Revenus · 7 jours" action={<Badge tone="green">+14%</Badge>}>
        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 28, color: 'var(--text-strong)', marginBottom: 16 }}>
          {formatFcfa(total)}
        </div>
        <BarChart bars={WEEK_BARS} labels={DAYS} height={120} highlightLast />
      </Panel>

      <Panel title="Historique des paiements" flush>
        <QueryState
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          isEmpty={(query.data ?? []).length === 0}
          emptyTitle="Aucun paiement"
          emptyMessage="Vos paiements apparaîtront ici une fois vos livraisons réglées."
          onRetry={() => query.refetch()}
        >
          {(query.data ?? []).map((p) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px', borderBottom: '1px solid var(--slate-100)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 'var(--radius-sm)', background: 'var(--green-50)', color: 'var(--green-700)', flex: 'none' }}>
                <span className="material-symbols-rounded fill" style={{ fontSize: 20 }}>payments</span>
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-strong)' }}>{p.trackingNumber ?? p.id.slice(0, 8)}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(p.completedAt ?? p.createdAt)}{p.method ? ` · ${p.method}` : ''}</div>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: 'var(--teal-600)' }}>{formatFcfa(p.amount)}</span>
              <Badge tone={p.status === 'completed' || p.status === 'confirmed' ? 'green' : 'amber'}>
                {p.status === 'completed' || p.status === 'confirmed' ? 'Réglé' : 'En attente'}
              </Badge>
            </div>
          ))}
        </QueryState>
      </Panel>
    </div>
  )
}
