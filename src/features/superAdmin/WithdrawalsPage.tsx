import { useState } from 'react'
import { Button, Dialog, Input, SegmentedControl } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import { DetailList, DetailRow, DetailSection } from '@/components/DetailList'
import { useWithdrawals, useApproveWithdrawal, useRejectWithdrawal, useCompleteWithdrawal } from '@/features/superAdmin/hooks'
import { formatDateTime, formatFcfa } from '@/lib/format'
import { useIsMobile } from '@/lib/useMediaQuery'
import type { Withdrawal, WithdrawalStatus } from '@/lib/api/withdrawals'

const STATUS_LABELS: Record<WithdrawalStatus, { label: string; color: string }> = {
  PENDING: { label: 'En attente', color: 'var(--amber-600)' },
  PROCESSING: { label: 'En cours', color: 'var(--blue-600)' },
  SUCCESS: { label: 'Réussi', color: 'var(--green-600)' },
  FAILED: { label: 'Échoué', color: 'var(--red-600)' },
  CANCELLED: { label: 'Annulé', color: 'var(--gray-500)' },
}

const METHOD_LABELS: Record<string, string> = {
  wave: 'Wave',
  orange_money: 'Orange Money',
  freeMoney: 'Free Money',
  freemMoney: 'Free Money',
  bank: 'Virement',
  paydunya: 'PayDunya',
}

const COL_GRID = `32px 1.2fr 100px 130px 90px 110px 210px`
/** Fixed tracks + a workable minimum for the chauffeur column. */
const TABLE_MIN_WIDTH = 940

export function WithdrawalsPage() {
  const isMobile = useIsMobile()
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const limit = 20

  const params = { page, limit, ...(status ? { status } : {}) }
  const withdrawals = useWithdrawals(params)
  const approve = useApproveWithdrawal()
  const reject = useRejectWithdrawal()
  const complete = useCompleteWithdrawal()

  const [rejectDialog, setRejectDialog] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [detail, setDetail] = useState<Withdrawal | null>(null)

  const items = withdrawals.data?.withdrawals ?? []
  const pagination = withdrawals.data?.pagination

  return (
    <Panel title="Retraits chauffeurs">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="pc-filters">
          <SegmentedControl
            options={[
              { value: '', label: 'Tous' },
              { value: 'PENDING', label: 'En attente' },
              { value: 'PROCESSING', label: 'En cours' },
              { value: 'SUCCESS', label: 'Réussis' },
              { value: 'FAILED', label: 'Échoués' },
              { value: 'CANCELLED', label: 'Annulés' },
            ]}
            value={status}
            onChange={(s) => { setStatus(s); setPage(1) }}
          />
        </div>

        <QueryState
          isLoading={withdrawals.isLoading}
          isError={withdrawals.isError}
          error={withdrawals.error}
          isEmpty={!withdrawals.isLoading && items.length === 0}
          emptyMessage="Aucun retrait trouvé."
          onRetry={() => withdrawals.refetch()}
        >
          {isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {items.map((w) => {
                const s = STATUS_LABELS[w.status] ?? { label: w.status, color: 'var(--text-muted)' }
                return (
                  <div key={w.id} onClick={() => setDetail(w)} style={mobileCardStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, overflowWrap: 'anywhere' }}>{w.driver?.fullName ?? '—'}</span>
                      <span style={{ flex: 'none', color: s.color, fontWeight: 700, fontSize: 12 }}>{s.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15 }}>{formatFcfa(w.amount)}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {METHOD_LABELS[w.method] ?? w.method}
                        {w.phoneNumber ? ` · ${w.phoneNumber}` : ''}
                      </span>
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{formatDateTime(w.requestedAt ?? w.createdAt)}</div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, flexWrap: 'wrap' }} onClick={(ev) => ev.stopPropagation()}>
                      <Button icon="visibility" size="sm" variant="ghost" onClick={() => setDetail(w)}>Détails</Button>
                      {w.status === 'PENDING' && (
                        <>
                          <Button icon="check" size="sm" onClick={() => approve.mutate(w.id)} loading={approve.isPending}>Approuver</Button>
                          <Button icon="close" size="sm" onClick={() => { setRejectDialog(w.id); setRejectReason('') }}>Rejeter</Button>
                        </>
                      )}
                      {w.status === 'PROCESSING' && (
                        <Button icon="check" size="sm" onClick={() => complete.mutate(w.id)} loading={complete.isPending}>Compléter</Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
          <div className="pc-table-scroll">
          <div style={{ minWidth: TABLE_MIN_WIDTH, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: COL_GRID,
                gap: 8,
                padding: '6px 12px',
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <span />
              <span>Chauffeur</span>
              <span>Montant</span>
              <span>Moyen</span>
              <span>Statut</span>
              <span>Date</span>
              <span />
            </div>

            {items.map((w) => {
              const s = STATUS_LABELS[w.status] ?? { label: w.status, color: 'var(--text-muted)' }
              return (
                <div
                  key={w.id}
                  onClick={() => setDetail(w)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: COL_GRID,
                    gap: 8,
                    padding: '10px 12px',
                    alignItems: 'center',
                    borderBottom: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gray-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                    {w.driver?.fullName?.charAt(0)?.toUpperCase() ?? '?'}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.driver?.fullName ?? '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{w.driver?.phone ?? ''}</div>
                  </div>
                  <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{formatFcfa(w.amount)}</div>
                  <div style={{ fontSize: 12, minWidth: 0 }}>
                    <div>{METHOD_LABELS[w.method] ?? w.method}</div>
                    {w.phoneNumber ? <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{w.phoneNumber}</div> : null}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ color: s.color, fontWeight: 600, fontSize: 12 }}>{s.label}</span>
                    {w.failureReason ? (
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={w.failureReason}>
                        {w.failureReason}
                      </div>
                    ) : null}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDateTime(w.requestedAt ?? w.createdAt)}</div>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }} onClick={(ev) => ev.stopPropagation()}>
                    <Button icon="visibility" size="sm" variant="ghost" onClick={() => setDetail(w)} aria-label="Détails" title="Détails" />
                    {w.status === 'PENDING' && (
                      <>
                        <Button icon="check" size="sm" onClick={() => approve.mutate(w.id)} loading={approve.isPending}>
                          Approuver
                        </Button>
                        <Button icon="close" size="sm" onClick={() => { setRejectDialog(w.id); setRejectReason('') }}>
                          Rejeter
                        </Button>
                      </>
                    )}
                    {w.status === 'PROCESSING' && (
                      <Button icon="check" size="sm" onClick={() => complete.mutate(w.id)} loading={complete.isPending}>
                        Compléter
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12 }}>
              <Button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} size="sm">Précédent</Button>
              <span style={{ lineHeight: '32px', fontSize: 13, color: 'var(--text-muted)' }}>Page {page} / {pagination.totalPages}</span>
              <Button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)} size="sm">Suivant</Button>
            </div>
          )}
        </QueryState>

        {detail && (
          <WithdrawalDetailDialog withdrawal={detail} onClose={() => setDetail(null)} />
        )}

        {rejectDialog && (
          <Dialog
            title="Rejeter le retrait"
            open={!!rejectDialog}
            onClose={() => setRejectDialog(null)}
            actions={
              <>
                <Button onClick={() => setRejectDialog(null)}>Annuler</Button>
                <Button
                  onClick={() => {
                    reject.mutate(
                      { id: rejectDialog, reason: rejectReason || 'Rejeté par administration' },
                      { onSuccess: () => setRejectDialog(null) },
                    )
                  }}
                  loading={reject.isPending}
                >
                  Rejeter
                </Button>
              </>
            }
          >
            <div className="pc-form">
              <Input
                label="Raison du rejet"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ex: Numéro invalide, fraude..."
              />
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                Le montant sera remis dans le solde disponible du chauffeur.
              </p>
            </div>
          </Dialog>
        )}
      </div>
    </Panel>
  )
}

const mobileCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  minWidth: 0,
  padding: 14,
  background: 'var(--surface-card)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
}

/** Fiche lecture seule d'un retrait — références provider, revue, motif d'échec. */
function WithdrawalDetailDialog({ withdrawal, onClose }: { withdrawal: Withdrawal; onClose: () => void }) {
  const w = withdrawal
  const s = STATUS_LABELS[w.status] ?? { label: w.status, color: 'var(--text-muted)' }
  return (
    <Dialog
      open
      size="lg"
      title="Détail du retrait"
      onClose={onClose}
      actions={<Button variant="ghost" onClick={onClose}>Fermer</Button>}
    >
      <div className="pc-form" style={{ gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 22, color: 'var(--text-strong)' }}>
            {formatFcfa(w.amount)}
          </span>
          <span style={{ color: s.color, fontWeight: 700, fontSize: 13 }}>{s.label}</span>
        </div>

        <DetailSection title="Chauffeur">
          <DetailList>
            <DetailRow label="Nom" always>{w.driver?.fullName}</DetailRow>
            <DetailRow label="Téléphone" mono>{w.driver?.phone}</DetailRow>
          </DetailList>
        </DetailSection>

        <DetailSection title="Versement">
          <DetailList>
            <DetailRow label="Moyen" always>{METHOD_LABELS[w.method] ?? w.method}</DetailRow>
            <DetailRow label="Numéro" mono>{w.phoneNumber ?? w.phone}</DetailRow>
            <DetailRow label="Référence" mono>{w.reference}</DetailRow>
            <DetailRow label="Réf. opérateur" mono>{w.providerRef}</DetailRow>
          </DetailList>
        </DetailSection>

        <DetailSection title="Suivi">
          <DetailList>
            <DetailRow label="Demandé le" always>{formatDateTime(w.requestedAt ?? w.createdAt)}</DetailRow>
            <DetailRow label="Revu le">{formatDateTime(w.reviewedAt)}</DetailRow>
            <DetailRow label="Revu par">{w.reviewedBy}</DetailRow>
            <DetailRow label="Complété le">{formatDateTime(w.completedAt)}</DetailRow>
            <DetailRow label="Motif d'échec" valueStyle={{ color: 'var(--color-danger)' }}>{w.failureReason}</DetailRow>
          </DetailList>
        </DetailSection>
      </div>
    </Dialog>
  )
}
