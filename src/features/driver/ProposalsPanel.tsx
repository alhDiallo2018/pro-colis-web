import { useState } from 'react'
import { Button, Dialog, Icon, Input, Textarea, Toast } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import { NegotiationTurn } from '@/components/NegotiationTurn'
import { useDriverProposals, useRespondToProposal } from './hooks'
import { ApiError } from '@/lib/api/client'
import { formatFcfa } from '@/lib/format'
import type { Parcel } from '@/lib/api/types'

/**
 * Propositions directes reçues par le chauffeur.
 *
 * Un client qui choisit son chauffeur n'assigne pas le colis pour autant : il
 * envoie une offre. Tant que le chauffeur n'a pas répondu, le colis reste ici
 * et n'apparaît pas dans « Mes missions ». Le chauffeur peut accepter, refuser
 * ou contre-proposer ; dans ce dernier cas la main repasse au client et le
 * bouton « Accepter » disparaît de son côté jusqu'à la réponse.
 */
export function ProposalsPanel() {
  const query = useDriverProposals()
  const proposals = query.data ?? []
  const [counterTarget, setCounterTarget] = useState<Parcel | null>(null)

  // Un panneau vide n'a rien à dire au chauffeur : il ne s'affiche que
  // lorsqu'une proposition attend une réponse.
  if (!query.isLoading && !query.isError && proposals.length === 0) return null

  return (
    <>
      {/* Des clients ont choisi ce chauffeur directement : chaque ligne attend
          une réponse avant que le colis ne devienne une mission. */}
      <Panel title="Propositions reçues" flush>
        <QueryState
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          isEmpty={proposals.length === 0}
          emptyTitle="Aucune proposition"
          emptyMessage="Les colis proposés directement par des clients apparaîtront ici."
          onRetry={() => query.refetch()}
        >
          {proposals.map((parcel) => (
            <ProposalRow key={parcel.id} parcel={parcel} onCounter={() => setCounterTarget(parcel)} />
          ))}
        </QueryState>
      </Panel>

      <CounterDialog parcel={counterTarget} onClose={() => setCounterTarget(null)} />
    </>
  )
}

function ProposalRow({ parcel, onCounter }: { parcel: Parcel; onCounter: () => void }) {
  const respond = useRespondToProposal()
  const proposal = parcel.proposal
  const error = respond.error instanceof ApiError ? respond.error.message : null

  // Le prix courant est celui de la dernière proposition, pas le prix initial.
  const price = proposal?.price ?? parcel.totalAmount ?? parcel.price ?? 0
  const canAccept = proposal?.canDriverAccept ?? true
  const pendingAction = respond.isPending ? respond.variables?.action : undefined

  return (
    <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--slate-100)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 15,
              color: 'var(--text-strong)',
            }}
          >
            {parcel.departureCity ?? parcel.departureZoneName ?? '—'}
            <Icon name="arrow_right_alt" size={16} style={{ color: 'var(--text-faint)' }} />
            {parcel.arrivalCity ?? parcel.arrivalZoneName ?? '—'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{parcel.trackingNumber}</span> · {parcel.senderName}
            {parcel.weight != null && ` · ${parcel.weight} kg`}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
            {proposal?.negotiationCount ? 'Dernier prix' : 'Proposition'}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 20, color: 'var(--teal-600)' }}>
            {formatFcfa(price)}
          </div>
        </div>
      </div>

      {parcel.description && (
        <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-body)', marginTop: 8 }}>{parcel.description}</div>
      )}

      {/* Le dernier commentaire accompagne toujours le dernier prix : c'est ce
          qui permet de trancher sans rouvrir tout le fil de négociation. */}
      {proposal?.lastMessage && (
        <div
          style={{
            marginTop: 10,
            padding: '8px 12px',
            borderRadius: 10,
            background: 'var(--surface-sunken)',
            fontSize: 'var(--fs-sm)',
            color: 'var(--text-body)',
          }}
        >
          <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-xs)' }}>
            {proposal.lastOfferBy === 'driver' ? 'Vous' : parcel.senderName} ·{' '}
          </span>
          {proposal.lastMessage}
        </div>
      )}

      {error && (
        <div style={{ marginTop: 10 }}>
          <Toast tone="error" message={error} />
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <Button
          size="sm"
          variant="danger"
          icon="close"
          loading={pendingAction === 'reject'}
          onClick={() => respond.mutate({ parcelId: parcel.id, action: 'reject' })}
        >
          Refuser
        </Button>
        <Button size="sm" variant="amber" icon="forum" onClick={onCounter}>
          Négocier
        </Button>
        {canAccept ? (
          <Button
            size="sm"
            variant="primary"
            icon="check"
            loading={pendingAction === 'accept'}
            onClick={() => respond.mutate({ parcelId: parcel.id, action: 'accept' })}
          >
            Accepter
          </Button>
        ) : (
          <NegotiationTurn waitingFor="client" />
        )}
      </div>
    </div>
  )
}

/** Contre-proposition du chauffeur : un prix, un commentaire. */
function CounterDialog({ parcel, onClose }: { parcel: Parcel | null; onClose: () => void }) {
  const respond = useRespondToProposal()
  const [price, setPrice] = useState('')
  const [message, setMessage] = useState('')

  if (!parcel) return null

  const amount = Number(price)
  const valid = amount > 0
  const error = respond.error instanceof ApiError ? respond.error.message : null
  const currentPrice = parcel.proposal?.price ?? parcel.totalAmount ?? parcel.price ?? 0

  const submit = () => {
    respond.mutate(
      { parcelId: parcel.id, action: 'counter', price: amount, message: message.trim() || undefined },
      {
        onSuccess: () => {
          setPrice('')
          setMessage('')
          onClose()
        },
      },
    )
  }

  return (
    <Dialog
      open
      onClose={onClose}
      icon="handshake"
      iconTone="amber"
      title="Contre-proposition"
      actions={
        <>
          <Button variant="secondary" block onClick={onClose}>
            Annuler
          </Button>
          <Button block icon="send" loading={respond.isPending} disabled={!valid} onClick={submit}>
            Envoyer
          </Button>
        </>
      }
    >
      <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-muted)' }}>
          {parcel.senderName} propose <strong style={{ color: 'var(--text-strong)' }}>{formatFcfa(currentPrice)}</strong>{' '}
          pour {parcel.trackingNumber}. Votre prix lui sera envoyé : c'est lui qui pourra alors accepter.
        </p>
        <Input
          label="Votre prix (FCFA)"
          icon="payments"
          inputMode="numeric"
          mono
          placeholder="Ex : 7500"
          value={price}
          onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))}
        />
        <Textarea
          label="Commentaire (optionnel)"
          placeholder="Ex : Le détour par la zone industrielle rallonge le trajet."
          maxLength={200}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        {error && <Toast tone="error" message={error} />}
      </div>
    </Dialog>
  )
}
