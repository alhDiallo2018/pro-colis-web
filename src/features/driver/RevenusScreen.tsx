import { useMemo, useState } from 'react'
import { Badge, Icon, SegmentedControl, StatBox } from '@/ds'
import { Panel } from '@/components/Panel'
import { BarChart } from '@/components/BarChart'
import { QueryState } from '@/components/QueryState'
import type { Payment } from '@/lib/api/payments'
import { useDriverCashDeclarations, useDriverPayments } from './hooks'
import { formatDate, formatFcfa } from '@/lib/format'

const DAY_MS = 86_400_000
const PAGE_SIZE = 10

/** Un paiement compte comme encaissé dès qu'il est réglé côté plateforme. */
function isSettled(payment: Payment): boolean {
  return payment.status === 'completed' || payment.status === 'confirmed'
}

/** Date de référence : la date de règlement, à défaut celle de création. */
function settledAt(payment: Payment): number | null {
  const raw = payment.completedAt ?? payment.createdAt
  if (!raw) return null
  const time = new Date(raw).getTime()
  return Number.isNaN(time) ? null : time
}

const FILTERS = [
  { value: 'all', label: 'Tous' },
  { value: 'settled', label: 'Réglés' },
  { value: 'pending', label: 'En attente' },
]

/**
 * Revenus du chauffeur. Compteurs et graphe se calculent sur l'historique réel,
 * comme sur mobile : une courbe décorative sur un écran d'argent se lit comme
 * une donnée, pas comme une illustration.
 */
export function RevenusScreen() {
  const query = useDriverPayments()
  const cashQuery = useDriverCashDeclarations()
  const [filter, setFilter] = useState('all')
  const [visible, setVisible] = useState(PAGE_SIZE)

  const payments = useMemo(() => query.data ?? [], [query.data])

  const { total, count, weekBars, weekLabels, comparison } = useMemo(() => {
    const settled = payments.filter(isSettled)

    // Fenêtres glissantes de sept jours, alignées sur le début du jour local.
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
    const daily = Array<number>(7).fill(0)
    let currentWeek = 0
    let previousWeek = 0

    for (const payment of settled) {
      const at = settledAt(payment)
      if (at == null) continue
      const dayStart = new Date(at)
      dayStart.setHours(0, 0, 0, 0)
      const dayOffset = Math.round((todayStart - dayStart.getTime()) / DAY_MS)
      if (dayOffset >= 0 && dayOffset < 7) {
        daily[6 - dayOffset] += payment.amount ?? 0
        currentWeek += payment.amount ?? 0
      } else if (dayOffset >= 7 && dayOffset < 14) {
        previousWeek += payment.amount ?? 0
      }
    }

    const dayLetters = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
    const labels: string[] = []
    for (let i = 6; i >= 0; i -= 1) {
      const day = new Date(todayStart - i * DAY_MS)
      labels.push(dayLetters[(day.getDay() + 6) % 7])
    }

    // Sans semaine précédente, aucun pourcentage n'est calculable : on le dit
    // plutôt que d'inventer une progression.
    let delta: string | null = null
    if (previousWeek > 0) {
      const ratio = Math.round(((currentWeek - previousWeek) / previousWeek) * 100)
      delta = `${ratio >= 0 ? '+' : ''}${ratio}%`
    } else if (currentWeek > 0) {
      delta = 'Nouveau'
    }

    return {
      total: settled.reduce((sum, payment) => sum + (payment.amount ?? 0), 0),
      count: settled.length,
      weekBars: daily,
      weekLabels: labels,
      comparison: delta,
    }
  }, [payments])

  const filtered = useMemo(() => {
    if (filter === 'settled') return payments.filter(isSettled)
    if (filter === 'pending') return payments.filter((payment) => !isSettled(payment))
    return payments
  }, [payments, filter])

  const pendingCash = (cashQuery.data?.declarations ?? []).filter((declaration) => declaration.status === 'processing')
  const pendingCashTotal = pendingCash.reduce((sum, declaration) => sum + declaration.amount, 0)
  const weekTotal = weekBars.reduce((sum, value) => sum + value, 0)

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
        <StatBox icon="payments" tone="green" value={formatFcfa(total)} label="Revenus encaissés" />
        <StatBox icon="receipt_long" tone="primary" value={count} label="Paiements" />
        <StatBox icon="trending_up" tone="amber" value={comparison ?? '—'} label="vs semaine dernière" />
      </div>

      {pendingCash.length > 0 && (
        <Panel>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 38,
                height: 38,
                borderRadius: 'var(--radius-md)',
                background: 'var(--amber-50)',
                color: 'var(--amber-600)',
                flex: 'none',
              }}
            >
              <Icon name="hourglass_top" size={20} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: 'var(--text-strong)' }}>
                Espèces en attente de validation
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, fontWeight: 700, color: 'var(--text-muted)' }}>
                {pendingCash.length} déclaration{pendingCash.length > 1 ? 's' : ''} · {formatFcfa(pendingCashTotal)}
              </div>
            </div>
          </div>
          {pendingCash.map((declaration) => (
            <div key={declaration.id} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 8 }}>
              <span style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 12.5, fontWeight: 700, color: 'var(--text-body)' }}>
                {declaration.trackingNumber ?? declaration.parcelId ?? '—'}
              </span>
              <Badge tone="neutral">
                {declaration.cashCollectionPoint === 'sender_pickup' ? 'Expéditeur' : 'Destinataire'}
              </Badge>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 800, color: 'var(--amber-700)' }}>
                {formatFcfa(declaration.amount)}
              </span>
            </div>
          ))}
        </Panel>
      )}

      <Panel title="Revenus · 7 jours" action={comparison ? <Badge tone="green">{comparison}</Badge> : undefined}>
        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 28, color: 'var(--text-strong)', marginBottom: 16 }}>
          {formatFcfa(weekTotal)}
        </div>
        <BarChart bars={weekBars} labels={weekLabels} height={120} highlightLast />
      </Panel>

      <Panel
        title="Historique des paiements"
        flush
        action={
          <SegmentedControl
            size="sm"
            options={FILTERS}
            value={filter}
            onChange={(value) => {
              setFilter(value)
              setVisible(PAGE_SIZE)
            }}
          />
        }
      >
        <QueryState
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          isEmpty={filtered.length === 0}
          emptyTitle="Aucun paiement"
          emptyMessage="Vos paiements apparaîtront ici une fois vos livraisons réglées."
          onRetry={() => query.refetch()}
        >
          {filtered.slice(0, visible).map((p) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px', borderBottom: '1px solid var(--slate-100)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 'var(--radius-sm)', background: 'var(--green-50)', color: 'var(--green-700)', flex: 'none' }}>
                <span className="material-symbols-rounded fill" style={{ fontSize: 20 }}>payments</span>
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-strong)' }}>{p.trackingNumber ?? p.id.slice(0, 8)}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(p.completedAt ?? p.createdAt)}{p.method ? ` · ${p.method}` : ''}</div>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: 'var(--teal-600)' }}>{formatFcfa(p.amount)}</span>
              <Badge tone={isSettled(p) ? 'green' : 'amber'}>{isSettled(p) ? 'Réglé' : 'En attente'}</Badge>
            </div>
          ))}

          {filtered.length > visible && (
            <button
              type="button"
              onClick={() => setVisible((current) => current + PAGE_SIZE)}
              style={{
                width: '100%',
                padding: '12px 18px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--color-primary)',
              }}
            >
              Voir plus ({filtered.length - visible})
            </button>
          )}
        </QueryState>
      </Panel>
    </div>
  )
}
