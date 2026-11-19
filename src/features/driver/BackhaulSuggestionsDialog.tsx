import { useQuery, useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Badge, Button, Dialog, Icon, Input, Toast } from '@/ds'
import { QueryState } from '@/components/QueryState'
import {
  fetchBackhaulMatches,
  BACKHAUL_REASON_LABELS,
  type BackhaulMatch,
} from '@/lib/api/consolidation'
import * as bidsApi from '@/lib/api/bids'
import { ApiError } from '@/lib/api/client'
import { formatFcfa, formatWeight } from '@/lib/format'

interface Props {
  advertisementId: string
  onClose: () => void
}

/**
 * Parité mobile (à venir) : suggestions de colis « backhaul » pour une annonce
 * donnée. L'API `GET /drivers/backhaul-matches/:id` renvoie la liste des
 * colis compatibles (triée par score) et un extrait des rejetés pour debug.
 * Le chauffeur peut proposer une offre directement depuis chaque ligne.
 */
export function BackhaulSuggestionsDialog({ advertisementId, onClose }: Props) {
  const [showRejected, setShowRejected] = useState(false)
  const [offerDraft, setOfferDraft] = useState<{ parcelId: string; price: string } | null>(null)
  const [toast, setToast] = useState<{ tone: 'ok' | 'error'; message: string } | null>(null)

  const query = useQuery({
    queryKey: ['driver', 'backhaul', advertisementId],
    queryFn: () => fetchBackhaulMatches(advertisementId),
    enabled: Boolean(advertisementId),
    staleTime: 30_000,
  })

  const createBid = useMutation({
    mutationFn: (payload: { parcelId: string; price: number }) =>
      bidsApi.create({ parcelId: payload.parcelId, price: payload.price }),
    onSuccess: () => {
      setToast({ tone: 'ok', message: 'Offre envoyée au client.' })
      setOfferDraft(null)
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : 'Erreur lors de l’envoi de l’offre.'
      setToast({ tone: 'error', message: msg })
    },
  })

  const submitOffer = () => {
    if (!offerDraft) return
    const price = Number(offerDraft.price.replace(',', '.'))
    if (!Number.isFinite(price) || price <= 0) {
      setToast({ tone: 'error', message: 'Prix invalide.' })
      return
    }
    createBid.mutate({ parcelId: offerDraft.parcelId, price })
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Suggestions de colis à adopter"
      icon="auto_awesome"
      size="lg"
      actions={
        <Button variant="secondary" onClick={onClose}>
          Fermer
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-muted)' }}>
          Les colis listés ci-dessous sont compatibles avec le trajet et la capacité restante de votre annonce. Proposez une offre : le client la reçoit dans sa boîte d'offres.
        </p>

        <QueryState
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          isEmpty={!query.isLoading && (query.data?.matches.length ?? 0) === 0}
          emptyMessage="Aucun colis compatible pour le moment. Revenez après quelques nouvelles créations."
          onRetry={() => query.refetch()}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(query.data?.matches ?? []).map((m) => (
              <MatchRow
                key={m.id}
                match={m}
                draft={offerDraft?.parcelId === m.id ? offerDraft.price : null}
                onDraftChange={(price) => setOfferDraft({ parcelId: m.id, price })}
                onDraftStart={() =>
                  setOfferDraft({
                    parcelId: m.id,
                    price: m.price != null ? String(Math.round(m.price)) : '',
                  })
                }
                onDraftCancel={() => setOfferDraft(null)}
                onDraftSubmit={submitOffer}
                submitting={createBid.isPending && offerDraft?.parcelId === m.id}
              />
            ))}
          </div>
        </QueryState>

        {query.data?.rejected && query.data.rejected.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Button
              variant="ghost"
              size="sm"
              icon={showRejected ? 'expand_less' : 'expand_more'}
              onClick={() => setShowRejected((v) => !v)}
            >
              {showRejected ? 'Masquer' : 'Afficher'} les colis non compatibles ({query.data.rejected.length})
            </Button>
            {showRejected &&
              query.data.rejected.map((m) => <RejectedRow key={m.id} match={m} />)}
          </div>
        )}
      </div>
      {toast && (
        <Toast
          tone={toast.tone === 'ok' ? 'success' : 'error'}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </Dialog>
  )
}

function MatchRow({
  match,
  draft,
  onDraftStart,
  onDraftChange,
  onDraftCancel,
  onDraftSubmit,
  submitting,
}: {
  match: BackhaulMatch
  draft: string | null
  onDraftStart: () => void
  onDraftChange: (price: string) => void
  onDraftCancel: () => void
  onDraftSubmit: () => void
  submitting: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: 12,
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        background: 'var(--surface-card)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Icon name="inventory_2" size={18} style={{ color: 'var(--teal-600)' }} />
        <strong style={{ fontSize: 14, color: 'var(--text-strong)' }}>
          {match.trackingNumber ?? match.id.slice(0, 8)}
        </strong>
        {match.senderName && (
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            · {match.senderName}
          </span>
        )}
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {match.score != null && (
            <Badge tone="green">Score {match.score}</Badge>
          )}
          {match.detourKm != null && (
            <Badge tone="neutral">{match.detourKm.toFixed(1)} km détour</Badge>
          )}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: 'var(--text-body)' }}>
        <span>
          <Icon name="scale" size={14} /> {formatWeight(match.weightKg)}
        </span>
        {match.price != null && (
          <span>
            <Icon name="payments" size={14} /> Prix proposé : <strong>{formatFcfa(match.price)}</strong>
          </span>
        )}
      </div>

      {draft === null ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="sm" icon="send" onClick={onDraftStart}>
            Proposer une offre
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              placeholder="Prix (FCFA)"
              value={draft}
              onChange={(e) => onDraftChange(e.target.value)}
            />
          </div>
          <Button size="sm" icon="check" onClick={onDraftSubmit} disabled={submitting}>
            {submitting ? 'Envoi…' : 'Envoyer'}
          </Button>
          <Button size="sm" variant="ghost" icon="close" onClick={onDraftCancel} disabled={submitting}>
            Annuler
          </Button>
        </div>
      )}
    </div>
  )
}

function RejectedRow({ match }: { match: BackhaulMatch }) {
  const labels = match.reasons.map((r) => BACKHAUL_REASON_LABELS[r] ?? r)
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 12px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--surface-sunken)',
        fontSize: 12.5,
        color: 'var(--text-muted)',
      }}
    >
      <Icon name="block" size={14} style={{ color: 'var(--red-500)' }} />
      <span style={{ fontWeight: 600 }}>
        {match.trackingNumber ?? match.id.slice(0, 8)}
      </span>
      <span style={{ flex: 1 }}>{labels.join(' · ')}</span>
    </div>
  )
}
