import { Icon } from '@/ds'

/**
 * Rappel du tour de parole dans une négociation.
 *
 * Le camp qui vient de poser un prix ne peut pas l'accepter lui-même : à la
 * place du bouton « Accepter », on affiche de qui on attend la réponse. L'API
 * applique la même règle (409 sinon), ceci n'en est que la traduction visuelle.
 */
export function NegotiationTurn({ waitingFor }: { waitingFor: 'client' | 'driver' }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 'var(--fs-sm)',
        color: 'var(--text-muted)',
        fontStyle: 'italic',
      }}
    >
      <Icon name="hourglass_top" size={16} style={{ color: 'var(--text-faint)' }} />
      En attente de la réponse {waitingFor === 'client' ? 'du client' : 'du chauffeur'}
    </span>
  )
}
