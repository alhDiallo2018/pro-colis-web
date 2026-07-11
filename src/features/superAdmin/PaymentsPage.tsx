import { useState, type ChangeEvent } from 'react'
import { Badge, SegmentedControl, Select } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import { useAdminPayments } from './hooks'
import { formatFcfa, formatDate } from '@/lib/format'
import type { ListParams } from '@/lib/api/types'

const STATUS_FILTERS = [
  { value: '', label: 'Tous' },
  { value: 'reussi', label: 'Réussis' },
  { value: 'en_attente', label: 'En attente' },
  { value: 'echoue', label: 'Échoués' },
  { value: 'rembourse', label: 'Remboursés' },
]

const METHOD_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Toutes les méthodes' },
  { value: 'paydunya', label: 'PayDunya' },
  { value: 'wallet', label: 'Wallet' },
  { value: 'cash', label: 'Espèces' },
  { value: 'cheque', label: 'Chèque' },
  { value: 'virement', label: 'Virement' },
]

function statusBadgeTone(status: string): 'green' | 'amber' | 'red' | 'neutral' {
  switch (status) {
    case 'reussi':
    case 'completed':
    case 'success':
      return 'green'
    case 'en_attente':
    case 'pending':
      return 'amber'
    case 'echoue':
    case 'failed':
      return 'red'
    case 'rembourse':
    case 'refunded':
      return 'neutral'
    default:
      return 'neutral'
  }
}

const GRID = '160px 1fr 120px 110px 100px 130px 120px'
const cell: React.CSSProperties = { display: 'flex', alignItems: 'center', minWidth: 0 }

export function PaymentsPage() {
  const [status, setStatus] = useState('')
  const [method, setMethod] = useState('')
  const [page, setPage] = useState(1)

  const params: ListParams = { page, limit: 20 }
  if (status) params.status = status
  if (method) params.method = method

  const query = useAdminPayments(params)
  const payments = query.data?.payments ?? []
  const pagination = query.data?.pagination

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <SegmentedControl size="sm" options={STATUS_FILTERS} value={status} onChange={setStatus} />
        <Select
          value={method}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setMethod(e.target.value)}
          options={METHOD_OPTIONS}
          style={{ minWidth: 180 }}
        />
      </div>

      <Panel title={`Paiements${pagination ? ` · ${pagination.total}` : ''}`} flush>
        <div className="pc-table-scroll">
          <div style={{ minWidth: 860 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: GRID,
                padding: '11px 18px',
                borderBottom: '1px solid var(--border-subtle)',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--text-faint)',
              }}
            >
              <span>ID</span>
              <span>Client</span>
              <span>Montant</span>
              <span>Méthode</span>
              <span>Statut</span>
              <span>Colis</span>
              <span>Date</span>
            </div>

            <QueryState
              isLoading={query.isLoading}
              isError={query.isError}
              error={query.error}
              isEmpty={payments.length === 0}
              emptyTitle="Aucun paiement"
              emptyMessage="Aucun paiement ne correspond à ces filtres."
              onRetry={() => query.refetch()}
            >
              {payments.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: GRID,
                    alignItems: 'center',
                    padding: '12px 18px',
                    borderBottom: '1px solid var(--slate-100)',
                  }}
                >
                  <span style={{ ...cell, fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 11.5, color: 'var(--text-faint)' }}>
                    {p.id.slice(0, 8)}...
                  </span>
                  <span style={{ ...cell, fontSize: 13, color: 'var(--text-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.user?.fullName ?? p.user?.phone ?? '—'}
                  </span>
                  <span style={{ ...cell, fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12.5, color: 'var(--teal-600)' }}>
                    {formatFcfa(p.amount)}
                  </span>
                  <span style={cell}>
                    <Badge tone="neutral">{p.method ?? '—'}</Badge>
                  </span>
                  <span style={cell}>
                    <Badge tone={statusBadgeTone(p.status)}>{p.status}</Badge>
                  </span>
                  <span style={{ ...cell, fontSize: 12.5, color: 'var(--text-body)', fontFamily: 'var(--font-mono)' }}>
                    {p.parcel?.trackingNumber ?? p.reference ?? '—'}
                  </span>
                  <span style={{ ...cell, fontSize: 12.5, color: 'var(--text-muted)' }}>
                    {formatDate(p.createdAt)}
                  </span>
                </div>
              ))}
            </QueryState>
          </div>
        </div>

        {pagination && pagination.total > 20 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '14px 18px',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{
                border: '1px solid var(--border-default)',
                background: 'var(--surface-card)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 14px',
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: 13,
                color: page <= 1 ? 'var(--text-faint)' : 'var(--text-body)',
                opacity: page <= 1 ? 0.5 : 1,
              }}
            >
              Précédent
            </button>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Page {page} / {Math.ceil(pagination.total / 20)}
            </span>
            <button
              disabled={page >= Math.ceil(pagination.total / 20)}
              onClick={() => setPage((p) => p + 1)}
              style={{
                border: '1px solid var(--border-default)',
                background: 'var(--surface-card)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 14px',
                cursor: page >= Math.ceil(pagination.total / 20) ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: 13,
                color: page >= Math.ceil(pagination.total / 20) ? 'var(--text-faint)' : 'var(--text-body)',
                opacity: page >= Math.ceil(pagination.total / 20) ? 0.5 : 1,
              }}
            >
              Suivant
            </button>
          </div>
        )}
      </Panel>
    </div>
  )
}
