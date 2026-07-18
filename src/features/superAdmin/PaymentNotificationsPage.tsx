import { useMemo, useState } from 'react'
import { Badge, Button, SegmentedControl, StatBox } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import { usePaymentFeed } from './hooks'
import { formatFcfa, formatDateTime } from '@/lib/format'
import type { AdminPayment } from '@/lib/api/admin-finance'

const LAST_SEEN_KEY = 'pc_admin_payments_last_seen'

const STATUS_FILTERS = [
  { value: '', label: 'Tous' },
  { value: 'reussi', label: 'Réussis' },
  { value: 'en_attente', label: 'En attente' },
  { value: 'echoue', label: 'Échoués' },
]

const SUCCESS_STATUSES = new Set(['reussi', 'completed', 'success', 'confirmed'])

function statusTone(status: string): 'green' | 'amber' | 'red' | 'neutral' {
  if (SUCCESS_STATUSES.has(status)) return 'green'
  if (status === 'en_attente' || status === 'pending') return 'amber'
  if (status === 'echoue' || status === 'failed') return 'red'
  return 'neutral'
}

function statusLabel(status: string): string {
  if (SUCCESS_STATUSES.has(status)) return 'Réussi'
  if (status === 'en_attente' || status === 'pending') return 'En attente'
  if (status === 'echoue' || status === 'failed') return 'Échoué'
  if (status === 'rembourse' || status === 'refunded') return 'Remboursé'
  return status
}

function methodIcon(method?: string): string {
  switch (method) {
    case 'paydunya':
      return 'smartphone'
    case 'wallet':
      return 'account_balance_wallet'
    case 'cash':
      return 'payments'
    case 'cheque':
      return 'receipt_long'
    case 'virement':
      return 'account_balance'
    default:
      return 'paid'
  }
}

function methodLabel(method?: string): string {
  switch (method) {
    case 'paydunya':
      return 'PayDunya'
    case 'wallet':
      return 'Wallet'
    case 'cash':
      return 'Espèces'
    case 'cheque':
      return 'Chèque'
    case 'virement':
      return 'Virement'
    default:
      return method || 'Paiement'
  }
}

function readLastSeen(): number {
  try {
    return Number(localStorage.getItem(LAST_SEEN_KEY)) || 0
  } catch {
    return 0
  }
}

function paymentTime(p: AdminPayment): number {
  const iso = p.completedAt || p.createdAt
  return iso ? new Date(iso).getTime() : 0
}

function isToday(p: AdminPayment): boolean {
  const t = paymentTime(p)
  if (!t) return false
  const d = new Date(t)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}

export function PaymentNotificationsPage() {
  const [status, setStatus] = useState('')
  const [lastSeen, setLastSeen] = useState<number>(readLastSeen)

  const query = usePaymentFeed(status)
  const payments = useMemo(() => query.data?.payments ?? [], [query.data])

  const newPayments = useMemo(() => payments.filter((p) => paymentTime(p) > lastSeen), [payments, lastSeen])
  const todayPayments = useMemo(() => payments.filter(isToday), [payments])
  const todayAmount = todayPayments
    .filter((p) => SUCCESS_STATUSES.has(p.status))
    .reduce((sum, p) => sum + (p.amount || 0), 0)

  const markSeen = () => {
    const now = Date.now()
    try {
      localStorage.setItem(LAST_SEEN_KEY, String(now))
    } catch {
      /* storage unavailable */
    }
    setLastSeen(now)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
        <StatBox icon="notifications_active" tone="amber" value={newPayments.length} label="Nouveaux paiements" />
        <StatBox icon="today" tone="primary" value={todayPayments.length} label="Paiements aujourd'hui" />
        <StatBox icon="account_balance_wallet" tone="green" value={formatFcfa(todayAmount)} label="Encaissé aujourd'hui" />
        <StatBox icon="receipt_long" tone="neutral" value={payments.length} label="Derniers paiements affichés" />
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <SegmentedControl size="sm" options={STATUS_FILTERS} value={status} onChange={setStatus} />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-muted)' }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: query.isFetching ? 'var(--amber-400)' : 'var(--green-500)',
            }}
          />
          Actualisation automatique toutes les 15 s
        </span>
        <div style={{ marginLeft: 'auto' }}>
          <Button variant="secondary" size="sm" icon="done_all" onClick={markSeen} disabled={newPayments.length === 0}>
            Tout marquer comme vu
          </Button>
        </div>
      </div>

      <Panel title="Notifications de paiement" flush>
        <QueryState
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          isEmpty={payments.length === 0}
          emptyTitle="Aucun paiement"
          emptyMessage="Les paiements effectués par les utilisateurs apparaîtront ici en temps réel."
          onRetry={() => query.refetch()}
        >
          {payments.map((p) => {
            const isNew = paymentTime(p) > lastSeen
            return (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 18px',
                  borderBottom: '1px solid var(--slate-100)',
                  background: isNew ? 'var(--teal-50)' : 'transparent',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 42,
                    height: 42,
                    flex: 'none',
                    borderRadius: 'var(--radius-md)',
                    background: SUCCESS_STATUSES.has(p.status) ? 'var(--green-50)' : 'var(--surface-sunken)',
                    color: SUCCESS_STATUSES.has(p.status) ? 'var(--green-600)' : 'var(--text-muted)',
                  }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 22 }}>
                    {methodIcon(p.method)}
                  </span>
                </span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text-strong)' }}>
                      {p.user?.fullName ?? p.user?.phone ?? 'Utilisateur'}
                    </span>
                    <span style={{ fontSize: 13.5, color: 'var(--text-body)' }}>
                      a effectué un paiement de{' '}
                      <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--teal-600)' }}>{formatFcfa(p.amount)}</strong>
                    </span>
                    {isNew && <Badge tone="amber">Nouveau</Badge>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3, fontSize: 12.5, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                    <span>{methodLabel(p.method)}</span>
                    {p.parcel?.trackingNumber && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{p.parcel.trackingNumber}</span>
                    )}
                    {p.phoneNumber && <span>{p.phoneNumber}</span>}
                    <span>{formatDateTime(p.completedAt || p.createdAt)}</span>
                  </div>
                </div>

                <Badge tone={statusTone(p.status)}>{statusLabel(p.status)}</Badge>
              </div>
            )
          })}
        </QueryState>
      </Panel>
    </div>
  )
}
