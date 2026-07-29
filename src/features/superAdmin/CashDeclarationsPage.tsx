import { useEffect, useMemo, useState } from 'react'
import { Button, SegmentedControl, StatBox, StatusBadge, Textarea, Toast } from '@/ds'
import { Panel } from '@/components/Panel'
import { ParcelsTable } from '@/components/ParcelsTable'
import { QueryState } from '@/components/QueryState'
import {
  useCashDeclarations,
  useRejectCashDeclaration,
  useValidateCashDeclaration,
} from './hooks'
import type {
  CashDeclaration,
  CashDeclarationStatus,
} from '@/lib/api/cash-payments'
import { formatDateTime, formatFcfa } from '@/lib/format'
import { useIsMobile } from '@/lib/useMediaQuery'

const STATUS_OPTIONS = [
  { value: 'processing', label: 'À valider' },
  { value: 'completed', label: 'Validées' },
  { value: 'failed', label: 'Rejetées' },
]

const STATUS_META = {
  processing: { status: 'transit' as const, label: 'À réconcilier' },
  completed: { status: 'delivered' as const, label: 'Validée' },
  failed: { status: 'cancelled' as const, label: 'Rejetée' },
}

function collectionPointLabel(value?: string | null) {
  return value === 'sender_pickup'
    ? 'Expéditeur · ramassage'
    : 'Destinataire · livraison'
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ color: 'var(--text-faint)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <span style={{ color: 'var(--text-strong)', fontSize: 13.5, fontWeight: 600 }}>
        {value || '—'}
      </span>
    </div>
  )
}

function DeclarationStatus({ status }: { status: CashDeclarationStatus }) {
  const meta = STATUS_META[status]
  return <StatusBadge status={meta.status} label={meta.label} size="sm" />
}

export function CashDeclarationsPage() {
  const isMobile = useIsMobile()
  const [status, setStatus] = useState<CashDeclarationStatus>('processing')
  const [selectedId, setSelectedId] = useState<string>()
  const [rejectionReason, setRejectionReason] = useState('')
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string }>()

  const query = useCashDeclarations(status)
  const validateMutation = useValidateCashDeclaration()
  const rejectMutation = useRejectCashDeclaration()
  const declarations = useMemo(
    () => query.data?.declarations ?? [],
    [query.data?.declarations],
  )

  // La sélection suit la liste après un changement de filtre ou une mutation :
  // aucun panneau de détail ne doit conserver une déclaration disparue.
  useEffect(() => {
    if (!declarations.some((item) => item.id === selectedId)) {
      setSelectedId(declarations[0]?.id)
      setRejectionReason('')
    }
  }, [declarations, selectedId])

  const selected = declarations.find((item) => item.id === selectedId)
  const parcels = useMemo(
    () => declarations
      .map((item) => item.parcel)
      .filter((parcel): parcel is NonNullable<CashDeclaration['parcel']> => Boolean(parcel)),
    [declarations],
  )
  const totalAmount = declarations.reduce((sum, item) => sum + item.amount, 0)
  const senderPickupCount = declarations.filter(
    (item) => item.cashCollectionPoint === 'sender_pickup',
  ).length

  async function validateSelected() {
    if (!selected) return
    setFeedback(undefined)
    try {
      await validateMutation.mutateAsync(selected.id)
      setFeedback({ tone: 'success', message: 'L’encaissement a été validé et le colis marqué payé.' })
    } catch (error) {
      setFeedback({ tone: 'error', message: error instanceof Error ? error.message : 'Validation impossible.' })
    }
  }

  async function rejectSelected() {
    if (!selected || !rejectionReason.trim()) return
    setFeedback(undefined)
    try {
      await rejectMutation.mutateAsync({
        paymentId: selected.id,
        reason: rejectionReason.trim(),
      })
      setRejectionReason('')
      setFeedback({ tone: 'success', message: 'La déclaration a été rejetée ; le colis reste à régler.' })
    } catch (error) {
      setFeedback({ tone: 'error', message: error instanceof Error ? error.message : 'Rejet impossible.' })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: isMobile ? 18 : '22px 24px',
          borderRadius: 'var(--radius-lg)',
          color: '#fff',
          background: 'linear-gradient(118deg, var(--deep-700), var(--deep-500) 62%, var(--teal-500))',
          boxShadow: 'var(--shadow-brand)',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            width: 190,
            height: 190,
            right: -55,
            top: -85,
            borderRadius: '50%',
            border: '34px solid rgba(255,255,255,.08)',
          }}
        />
        <div style={{ position: 'relative', maxWidth: 680 }}>
          <div style={{ color: 'var(--amber-300)', fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Réconciliation financière
          </div>
          <h1 style={{ margin: '6px 0 5px', fontFamily: 'var(--font-display)', fontSize: isMobile ? 23 : 28, lineHeight: 1.1 }}>
            Encaissements espèces
          </h1>
          <p style={{ margin: 0, maxWidth: 610, color: 'rgba(255,255,255,.76)', fontSize: 13.5, lineHeight: 1.55 }}>
            Contrôlez les montants déclarés par les chauffeurs avant de marquer les colis comme payés.
          </p>
        </div>
      </section>

      {feedback && (
        <Toast
          tone={feedback.tone}
          title={feedback.tone === 'success' ? 'Opération enregistrée' : 'Action impossible'}
          message={feedback.message}
          onClose={() => setFeedback(undefined)}
        />
      )}

      <SegmentedControl
        size="sm"
        options={STATUS_OPTIONS}
        value={status}
        onChange={(value) => setStatus(value as CashDeclarationStatus)}
      />

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
        <StatBox icon="pending_actions" tone="amber" value={declarations.length} label="Déclarations affichées" />
        <StatBox icon="payments" tone="green" value={formatFcfa(totalAmount)} label="Montant cumulé" />
        <StatBox icon="move_to_inbox" tone="neutral" value={senderPickupCount} label="Encaissées au départ" />
      </div>

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        isEmpty={declarations.length === 0}
        emptyTitle="Aucune déclaration"
        emptyMessage="Aucun encaissement ne correspond au statut sélectionné."
        onRetry={() => query.refetch()}
      >
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(300px, .8fr) minmax(390px, 1.2fr)', gap: 16, alignItems: 'start' }}>
          <Panel title={`File · ${declarations.length}`} flush>
            {declarations.map((item) => {
              const active = item.id === selected?.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(item.id)
                    setRejectionReason('')
                  }}
                  style={{
                    width: '100%',
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: 8,
                    padding: '14px 16px',
                    textAlign: 'left',
                    border: 0,
                    borderBottom: '1px solid var(--border-subtle)',
                    borderLeft: active ? '3px solid var(--color-accent)' : '3px solid transparent',
                    background: active ? 'var(--amber-50)' : 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', color: 'var(--text-strong)', fontFamily: 'var(--font-display)', fontWeight: 750, fontSize: 13.5 }}>
                      {item.declaredByName || item.userName || 'Chauffeur'}
                    </span>
                    <span style={{ display: 'block', marginTop: 3, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>
                      {item.trackingNumber || item.parcelId || 'Colis non renseigné'}
                    </span>
                    <span style={{ display: 'block', marginTop: 5, color: 'var(--text-faint)', fontSize: 11.5 }}>
                      {formatDateTime(item.declaredAt || item.createdAt)}
                    </span>
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 7 }}>
                    <strong style={{ color: 'var(--teal-600)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                      {formatFcfa(item.amount)}
                    </strong>
                    <DeclarationStatus status={item.status} />
                  </span>
                </button>
              )
            })}
          </Panel>

          {selected && (
            <Panel
              title={selected.trackingNumber || 'Détail de la déclaration'}
              action={<DeclarationStatus status={selected.status} />}
            >
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, minmax(0, 1fr))', gap: '18px 14px' }}>
                <Field label="Montant déclaré" value={formatFcfa(selected.amount)} />
                <Field label="Chauffeur" value={selected.declaredByName || selected.userName} />
                <Field label="Encaissement" value={collectionPointLabel(selected.cashCollectionPoint)} />
                <Field label="Déclaré le" value={formatDateTime(selected.declaredAt || selected.createdAt)} />
                <Field label="Réconcilié le" value={formatDateTime(selected.validatedAt)} />
                <Field
                  label="Preuve"
                  value={selected.declarationProofUrl
                    ? <a href={selected.declarationProofUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)' }}>Ouvrir le justificatif</a>
                    : 'Non fournie'}
                />
              </div>

              {selected.declarationNote && (
                <div style={{ marginTop: 18, padding: 13, borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)', color: 'var(--text-body)', fontSize: 13 }}>
                  <strong style={{ display: 'block', marginBottom: 4, color: 'var(--text-strong)' }}>Note du chauffeur</strong>
                  {selected.declarationNote}
                </div>
              )}

              {selected.rejectionReason && (
                <Toast tone="warning" title="Motif du rejet" message={selected.rejectionReason} style={{ marginTop: 18, maxWidth: 'none' }} />
              )}

              {selected.status === 'processing' && (
                <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid var(--border-subtle)' }}>
                  <Textarea
                    label="Motif en cas de rejet"
                    placeholder="Ex. montant différent du reçu remis…"
                    value={rejectionReason}
                    onChange={(event) => setRejectionReason(event.target.value)}
                  />
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column-reverse' : 'row', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                    <Button
                      variant="secondary"
                      tone="danger"
                      icon="close"
                      loading={rejectMutation.isPending}
                      disabled={!rejectionReason.trim() || validateMutation.isPending}
                      onClick={rejectSelected}
                    >
                      Rejeter la déclaration
                    </Button>
                    <Button
                      icon="verified"
                      loading={validateMutation.isPending}
                      disabled={rejectMutation.isPending}
                      onClick={validateSelected}
                    >
                      Valider l’encaissement
                    </Button>
                  </div>
                </div>
              )}
            </Panel>
          )}
        </div>

        <Panel title="Colis concernés" flush style={{ marginTop: 16 }}>
          <ParcelsTable parcels={parcels} emptyHint="Aucun colis lié à ces déclarations." />
        </Panel>
      </QueryState>
    </div>
  )
}
