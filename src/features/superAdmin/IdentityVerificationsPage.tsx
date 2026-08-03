import { useState } from 'react'
import { Button, Dialog, Input, SegmentedControl } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import { DetailList, DetailRow, DetailSection } from '@/components/DetailList'
import {
  useIdentityVerifications,
  useApproveVerification,
  useRejectVerification,
} from '@/features/superAdmin/hooks'
import { formatDateTime } from '@/lib/format'
import { useIsMobile } from '@/lib/useMediaQuery'
import type { IdentityVerification, IdentityStatus } from '@/lib/api/identity'

const STATUS_META: Record<IdentityStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'À valider', color: 'var(--amber-700)', bg: 'var(--amber-50)' },
  approved: { label: 'Vérifié', color: 'var(--green-700)', bg: 'var(--green-50)' },
  rejected: { label: 'Rejeté', color: 'var(--red-600)', bg: 'var(--red-50)' },
}

const COL_GRID = '1.4fr 120px 130px 110px 210px'
/** Fixed tracks + a workable minimum for the chauffeur column. */
const TABLE_MIN_WIDTH = 860

export function IdentityVerificationsPage() {
  const isMobile = useIsMobile()
  const [status, setStatus] = useState('pending')
  const [page, setPage] = useState(1)
  const limit = 20

  const params = { page, limit, ...(status ? { status } : {}) }
  const query = useIdentityVerifications(params)
  const approve = useApproveVerification()
  const reject = useRejectVerification()

  const [rejectDialog, setRejectDialog] = useState<IdentityVerification | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [detail, setDetail] = useState<IdentityVerification | null>(null)

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
          {isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {items.map((v) => {
                const st = STATUS_META[v.status] ?? { label: v.status, color: 'var(--text-muted)', bg: 'var(--surface-sunken)' }
                return (
                  <div key={v.id} onClick={() => setDetail(v)} style={mobileCardStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <span style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text-strong)', overflowWrap: 'anywhere' }}>{v.user?.fullName ?? '—'}</span>
                      <span style={{ flex: 'none', fontSize: 11.5, fontWeight: 700, color: st.color, background: st.bg, padding: '3px 10px', borderRadius: 'var(--radius-pill)' }}>{st.label}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {v.user?.phone ?? ''}{v.documentType ? ` · ${v.documentType}` : ''}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }} onClick={(ev) => ev.stopPropagation()}>
                      {v.documentFrontUrl ? (
                        <a href={v.documentFrontUrl} target="_blank" rel="noopener noreferrer">
                          <img src={v.documentFrontUrl} alt="Recto" style={docThumb} />
                        </a>
                      ) : null}
                      {v.documentBackUrl ? (
                        <a href={v.documentBackUrl} target="_blank" rel="noopener noreferrer">
                          <img src={v.documentBackUrl} alt="Verso" style={docThumb} />
                        </a>
                      ) : null}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, flexWrap: 'wrap' }} onClick={(ev) => ev.stopPropagation()}>
                      <Button icon="visibility" size="sm" variant="ghost" onClick={() => setDetail(v)}>Détails</Button>
                      {v.status !== 'approved' && (
                        <Button size="sm" icon="check" onClick={() => approve.mutate(v.id)} loading={approve.isPending}>Approuver</Button>
                      )}
                      {v.status === 'pending' && (
                        <Button size="sm" variant="ghost" tone="danger" icon="close"
                          onClick={() => { setRejectDialog(v); setRejectReason('') }}>Rejeter</Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
          <div className="pc-table-scroll">
          <div style={{ minWidth: TABLE_MIN_WIDTH, display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                <div key={v.id} style={rowStyle} onClick={() => setDetail(v)}>
                  <span style={{ fontSize: 13, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-strong)' }}>{v.user?.fullName ?? '—'}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{v.user?.phone ?? ''}</div>
                  </span>
                  <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{v.documentType ?? '—'}</span>
                  <span style={{ display: 'flex', gap: 6 }} onClick={(ev) => ev.stopPropagation()}>
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
                  <span style={{ minWidth: 0 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: st.color, background: st.bg, padding: '3px 10px', borderRadius: 'var(--radius-pill)' }}>{st.label}</span>
                    {v.status === 'rejected' && v.rejectionReason && (
                      <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v.rejectionReason}>{v.rejectionReason}</div>
                    )}
                  </span>
                  <span style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }} onClick={(ev) => ev.stopPropagation()}>
                    <Button size="sm" icon="visibility" variant="ghost" onClick={() => setDetail(v)} aria-label="Détails" title="Détails" />
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
      </div>

      {detail && (
        <VerificationDetailDialog
          verification={detail}
          onClose={() => setDetail(null)}
          onApprove={detail.status !== 'approved' ? () => approve.mutate(detail.id, { onSuccess: () => setDetail(null) }) : undefined}
          onReject={detail.status === 'pending' ? () => { setRejectDialog(detail); setRejectReason(''); setDetail(null) } : undefined}
        />
      )}

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
          <div className="pc-form" style={{ gap: 10 }}>
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

/** Fiche lecture seule — documents en grand, motif de refus complet, revue. */
function VerificationDetailDialog({
  verification,
  onClose,
  onApprove,
  onReject,
}: {
  verification: IdentityVerification
  onClose: () => void
  onApprove?: () => void
  onReject?: () => void
}) {
  const v = verification
  const st = STATUS_META[v.status] ?? { label: v.status, color: 'var(--text-muted)', bg: 'var(--surface-sunken)' }
  return (
    <Dialog
      open
      size="lg"
      title="Vérification d'identité"
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>Fermer</Button>
          {onReject && <Button variant="ghost" tone="danger" icon="close" onClick={onReject}>Rejeter</Button>}
          {onApprove && <Button icon="check" onClick={onApprove}>Approuver</Button>}
        </>
      }
    >
      <div className="pc-form" style={{ gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-strong)', overflowWrap: 'anywhere' }}>
            {v.user?.fullName ?? '—'}
          </span>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: st.color, background: st.bg, padding: '3px 10px', borderRadius: 'var(--radius-pill)' }}>
            {st.label}
          </span>
        </div>

        <DetailList>
          <DetailRow label="Téléphone" mono>{v.user?.phone}</DetailRow>
          <DetailRow label="E-mail">{v.user?.email}</DetailRow>
          <DetailRow label="Rôle">{v.user?.role}</DetailRow>
          <DetailRow label="Compte vérifié" always>{v.user?.isVerified ? 'Oui' : 'Non'}</DetailRow>
          <DetailRow label="Type de pièce" always>{v.documentType}</DetailRow>
          <DetailRow label="Soumise le">{formatDateTime(v.createdAt)}</DetailRow>
          <DetailRow label="Revue le">{formatDateTime(v.reviewedAt)}</DetailRow>
          <DetailRow label="Revue par">{v.reviewedBy}</DetailRow>
          <DetailRow label="Motif du refus" valueStyle={{ color: 'var(--color-danger)' }}>{v.rejectionReason}</DetailRow>
        </DetailList>

        <DetailSection title="Documents">
          {v.documentFrontUrl || v.documentBackUrl ? (
            <div className="pc-field-pair" style={{ gap: 12 }}>
              {v.documentFrontUrl && <DocPreview label="Recto" url={v.documentFrontUrl} />}
              {v.documentBackUrl && <DocPreview label="Verso" url={v.documentBackUrl} />}
            </div>
          ) : (
            <span style={{ fontSize: 13, color: 'var(--text-faint)' }}>Aucun document téléversé.</span>
          )}
        </DetailSection>
      </div>
    </Dialog>
  )
}

function DocPreview({ label, url }: { label: string; url: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, textDecoration: 'none' }}>
      <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)' }}>{label}</span>
      <img
        src={url}
        alt={label}
        style={{ width: '100%', maxHeight: 220, objectFit: 'contain', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}
      />
    </a>
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
  alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer',
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
