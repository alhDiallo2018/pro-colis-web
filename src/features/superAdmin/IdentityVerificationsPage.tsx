import { useState } from 'react'
import { Button, Dialog, Input, SegmentedControl } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import {
  useIdentityVerifications,
  useApproveVerification,
  useRejectVerification,
} from '@/features/superAdmin/hooks'
import type { IdentityVerification, IdentityStatus } from '@/lib/api/identity'

const STATUS_META: Record<IdentityStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'À valider', color: 'var(--amber-700)', bg: 'var(--amber-50)' },
  approved: { label: 'Vérifié', color: 'var(--green-700)', bg: 'var(--green-50)' },
  rejected: { label: 'Rejeté', color: 'var(--red-600)', bg: 'var(--red-50)' },
}

const COL_GRID = '1.4fr 120px 130px 110px 170px'

export function IdentityVerificationsPage() {
  const [status, setStatus] = useState('pending')
  const [page, setPage] = useState(1)
  const limit = 20

  const params = { page, limit, ...(status ? { status } : {}) }
  const query = useIdentityVerifications(params)
  const approve = useApproveVerification()
  const reject = useRejectVerification()

  const [rejectDialog, setRejectDialog] = useState<IdentityVerification | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const items = query.data?.verifications ?? []
  const summary = query.data?.summary
  const pagination = query.data?.pagination

  return (
    <Panel title="Vérifications d'identité (chauffeurs)">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {summary && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Tile label="À valider" value={summary.pending} color="var(--amber-700)" />
            <Tile label="Vérifiés" value={summary.approved} color="var(--green-700)" />
            <Tile label="Rejetés" value={summary.rejected} color="var(--red-600)" />
            <Tile label="Total" value={summary.total} color="var(--text-strong)" />
          </div>
        )}

        <SegmentedControl
          options={[
            { value: 'pending', label: 'À valider' },
            { value: 'approved', label: 'Vérifiés' },
            { value: 'rejected', label: 'Rejetés' },
            { value: '', label: 'Tous' },
          ]}
          value={status}
          onChange={(s) => { setStatus(s); setPage(1) }}
        />

        <QueryState
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          isEmpty={!query.isLoading && items.length === 0}
          emptyMessage="Aucune vérification pour ce filtre."
          onRetry={() => query.refetch()}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={headerRowStyle}>
              <span>Chauffeur</span>
              <span>Type</span>
              <span>Documents</span>
              <span>Statut</span>
              <span />
            </div>

            {items.map((v) => {
              const st = STATUS_META[v.status] ?? { label: v.status, color: 'var(--text-muted)', bg: 'var(--surface-sunken)' }
              return (
                <div key={v.id} style={rowStyle}>
                  <span style={{ fontSize: 13 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-strong)' }}>{v.user?.fullName ?? '—'}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{v.user?.phone ?? ''}</div>
                  </span>
                  <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{v.documentType ?? '—'}</span>
                  <span style={{ display: 'flex', gap: 6 }}>
                    {v.documentFrontUrl ? (
                      <a href={v.documentFrontUrl} target="_blank" rel="noopener noreferrer">
                        <img src={v.documentFrontUrl} alt="Recto" style={docThumb} />
                      </a>
                    ) : <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>—</span>}
                    {v.documentBackUrl && (
                      <a href={v.documentBackUrl} target="_blank" rel="noopener noreferrer">
                        <img src={v.documentBackUrl} alt="Verso" style={docThumb} />
                      </a>
                    )}
                  </span>
                  <span>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: st.color, background: st.bg, padding: '3px 10px', borderRadius: 'var(--radius-pill)' }}>{st.label}</span>
                    {v.status === 'rejected' && v.rejectionReason && (
                      <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v.rejectionReason}>{v.rejectionReason}</div>
                    )}
                  </span>
                  <span style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    {v.status !== 'approved' && (
                      <Button size="sm" icon="check" onClick={() => approve.mutate(v.id)} loading={approve.isPending}>
                        Approuver
                      </Button>
                    )}
                    {v.status === 'pending' && (
                      <Button size="sm" variant="ghost" tone="danger" icon="close"
                        onClick={() => { setRejectDialog(v); setRejectReason('') }}>
                        Rejeter
                      </Button>
                    )}
                  </span>
                </div>
              )
            })}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12 }}>
              <Button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} size="sm">Précédent</Button>
              <span style={{ lineHeight: '32px', fontSize: 13, color: 'var(--text-muted)' }}>Page {page} / {pagination.totalPages}</span>
              <Button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)} size="sm">Suivant</Button>
            </div>
          )}
        </QueryState>
      </div>

      {rejectDialog && (
        <Dialog
          open
          title="Rejeter la vérification"
          onClose={() => setRejectDialog(null)}
          actions={
            <>
              <Button variant="ghost" onClick={() => setRejectDialog(null)}>Annuler</Button>
              <Button tone="danger" loading={reject.isPending} disabled={!rejectReason.trim()}
                onClick={() => reject.mutate({ id: rejectDialog.id, reason: rejectReason.trim() }, { onSuccess: () => setRejectDialog(null) })}>
                Rejeter
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 'min(360px, 80vw)' }}>
            <Input
              label="Motif du refus"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ex : document illisible, non conforme…"
            />
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
              Le chauffeur sera notifié et pourra renvoyer ses documents.
            </p>
          </div>
        </Dialog>
      )}
    </Panel>
  )
}

function Tile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ flex: '1 1 120px', minWidth: 120, background: 'var(--surface-sunken)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color }}>{value}</div>
    </div>
  )
}

const docThumb: React.CSSProperties = { width: 40, height: 40, objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }

const headerRowStyle: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: COL_GRID, gap: 8, padding: '6px 12px',
  fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase',
  letterSpacing: '0.5px', borderBottom: '1px solid var(--border)',
}
const rowStyle: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: COL_GRID, gap: 8, padding: '10px 12px',
  alignItems: 'center', borderBottom: '1px solid var(--border-subtle)',
}
