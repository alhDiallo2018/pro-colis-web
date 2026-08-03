import { Button, Icon } from '@/ds'
import { formatDraftTimestamp } from '@/lib/formDraft'

/**
 * Bandeau proposant de reprendre une saisie interrompue. Tant qu'il est
 * affiché, le formulaire ne réécrit pas le brouillon : l'utilisateur tranche
 * avant qu'on touche à quoi que ce soit.
 */
export function DraftRestoreBanner({
  savedAt,
  onRestore,
  onDiscard,
  note,
}: {
  savedAt: Date
  onRestore: () => void
  onDiscard: () => void
  /** Précision facultative, p. ex. sur ce qui n'a pas pu être conservé. */
  note?: string
}) {
  return (
    <div
      style={{
        padding: '12px 14px',
        marginBottom: 16,
        borderRadius: 'var(--radius-md)',
        background: 'var(--amber-50)',
        border: '1px solid var(--amber-200)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon name="history" size={18} style={{ color: 'var(--amber-600)' }} />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--amber-700)' }}>
          Reprendre votre saisie ?
        </span>
      </div>
      <span style={{ fontSize: 12.5, color: 'var(--text-muted)', paddingLeft: 26 }}>
        Brouillon enregistré {formatDraftTimestamp(savedAt)}.{note ? ` ${note}` : ''}
      </span>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <Button size="sm" icon="restore" onClick={onRestore}>
          Reprendre
        </Button>
        <Button size="sm" variant="secondary" onClick={onDiscard}>
          Repartir à zéro
        </Button>
      </div>
    </div>
  )
}
