import { useState } from 'react'
import { Avatar, Badge, Button, Card, Dialog, Input, Textarea, Toast } from '@/ds'
import { NegotiationTurn } from '@/components/NegotiationTurn'
import { useRespondToProposal } from './hooks'
import { ApiError } from '@/lib/api/client'
import { formatFcfa } from '@/lib/format'
import type { Parcel } from '@/lib/api/types'

const STATUS_META: Record<string, { label: string; tone: 'amber' | 'primary' | 'green' | 'red'; icon: string }> = {
  pending: { label: 'En attente du chauffeur', tone: 'amber', icon: 'schedule' },
  countered: { label: 'Contre-offre reçue', tone: 'primary', icon: 'handshake' },
  accepted: { label: 'Proposition acceptée', tone: 'green', icon: 'check_circle' },
  rejected: { label: 'Proposition refusée', tone: 'red', icon: 'cancel' },
  expired: { label: 'Proposition expirée', tone: 'red', icon: 'timer_off' },
}

/**
 * État d'une proposition directe côté client.
 *
 * Choisir un chauffeur n'est pas le lui assigner : tant qu'il n'a pas accepté,
 * le colis est une offre en attente. Cette carte le dit explicitement et donne
 * au client les deux seules réponses possibles à une contre-offre — accepter ou
 * reproposer un prix — le bouton « Accepter » n'apparaissant que si le dernier
 * prix vient du chauffeur.
 */
export function ProposalStatusCard({ parcel }: { parcel: Parcel }) {
  const respond = useRespondToProposal()
  const [countering, setCountering] = useState(false)
  const proposal = parcel.proposal

  if (!proposal) return null

  const meta = STATUS_META[proposal.status] ?? STATUS_META.pending
  const driverName = proposal.driverName ?? parcel.proposedDriverName ?? 'Chauffeur'
  const price = proposal.price ?? parcel.totalAmount ?? parcel.price ?? 0
  const isOpen = proposal.status === 'pending' || proposal.status === 'countered'
  const error = respond.error instanceof ApiError ? respond.error.message : null

  return (
    <>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)', color: 'var(--text-strong)' }}>
            Proposition au chauffeur
          </h2>
          <Badge tone={meta.tone} icon={meta.icon}>
            {meta.label}
          </Badge>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar name={driverName} src={proposal.driverName ? undefined : parcel.proposedDriver?.profilePhoto ?? undefined} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-strong)' }}>{driverName}</div>
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
              {proposal.negotiationCount > 0
                ? `${proposal.negotiationCount} échange${proposal.negotiationCount > 1 ? 's' : ''} de prix`
                : 'Aucune contre-offre pour le moment'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
              {proposal.negotiationCount > 0 ? 'Dernier prix' : 'Votre prix'}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 20, color: 'var(--teal-600)' }}>
              {formatFcfa(price)}
            </div>
          </div>
        </div>

        {/* Le dernier commentaire reste collé au dernier prix : c'est lui qui
            justifie le montant au moment de trancher. */}
        {proposal.lastMessage && (
          <div
            style={{
              marginTop: 12,
              padding: '8px 12px',
              borderRadius: 10,
              background: 'var(--surface-sunken)',
              fontSize: 'var(--fs-sm)',
              color: 'var(--text-body)',
            }}
          >
            <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-xs)' }}>
              {proposal.lastOfferBy === 'client' ? 'Vous' : driverName} ·{' '}
            </span>
            {proposal.lastMessage}
          </div>
        )}

        {error && (
          <div style={{ marginTop: 12 }}>
            <Toast tone="error" message={error} />
          </div>
        )}

        {isOpen && (
          <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button size="sm" variant="secondary" icon="handshake" onClick={() => setCountering(true)}>
              Proposer un autre prix
            </Button>
            {proposal.canClientAccept ? (
              <Button
                size="sm"
                icon="check"
                loading={respond.isPending && respond.variables?.action === 'accept'}
                onClick={() => respond.mutate({ parcelId: parcel.id, action: 'accept' })}
              >
                Accepter {formatFcfa(price)}
              </Button>
            ) : (
              <NegotiationTurn waitingFor="driver" />
            )}
          </div>
        )}

        {proposal.status === 'rejected' && (
          <p style={{ margin: '12px 0 0', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
            {driverName} a décliné. Votre colis est revenu en attente : choisissez un autre chauffeur ou ouvrez-le aux
            offres.
          </p>
        )}
      </Card>

      <CounterDialog
        parcel={countering ? parcel : null}
        driverName={driverName}
        currentPrice={price}
        onClose={() => setCountering(false)}
      />
    </>
  )
}

function CounterDialog({
  parcel,
  driverName,
  currentPrice,
  onClose,
}: {
  parcel: Parcel | null
  driverName: string
  currentPrice: number
  onClose: () => void
}) {
  const respond = useRespondToProposal()
  const [price, setPrice] = useState('')
  const [message, setMessage] = useState('')

  if (!parcel) return null

  const amount = Number(price)
  const error = respond.error instanceof ApiError ? respond.error.message : null

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
      title="Proposer un autre prix"
      actions={
        <>
          <Button variant="secondary" block onClick={onClose}>
            Annuler
          </Button>
          <Button block icon="send" loading={respond.isPending} disabled={!(amount > 0)} onClick={submit}>
            Envoyer
          </Button>
        </>
      }
    >
      <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-muted)' }}>
          Le dernier prix en discussion est <strong style={{ color: 'var(--text-strong)' }}>{formatFcfa(currentPrice)}</strong>.
          Votre nouveau prix part chez {driverName} : c'est lui qui pourra l'accepter.
        </p>
        <Input
          label="Votre prix (FCFA)"
          icon="payments"
          inputMode="numeric"
          mono
          placeholder="Ex : 6000"
          value={price}
          onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))}
        />
        <Textarea
          label="Commentaire (optionnel)"
          placeholder="Ex : C'est mon budget maximum pour ce trajet."
          maxLength={200}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        {error && <Toast tone="error" message={error} />}
      </div>
    </Dialog>
  )
}
