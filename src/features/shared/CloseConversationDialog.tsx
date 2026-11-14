import { useState } from 'react'
import { Button, Dialog, Select, Textarea } from '@/ds'
import {
  SUPPORT_CLOSE_CATEGORIES,
  type SupportCloseCategory,
  type SupportCloseOptions,
} from '@/lib/api/supportChat'

const CATEGORY_LABELS: Record<SupportCloseCategory, string> = {
  resolved: 'Résolue',
  duplicate: 'Doublon',
  spam: 'Spam',
  no_answer: 'Sans réponse',
}

const CATEGORY_OPTIONS = SUPPORT_CLOSE_CATEGORIES.map(value => ({
  value,
  label: CATEGORY_LABELS[value],
}))

interface Props {
  open: boolean
  busy?: boolean
  onConfirm: (options: SupportCloseOptions) => Promise<void> | void
  onCancel: () => void
}

export function CloseConversationDialog({ open, busy = false, onConfirm, onCancel }: Props) {
  const [category, setCategory] = useState<SupportCloseCategory | ''>('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const reasonTrim = reason.trim()
  const reasonTooShort = reasonTrim.length > 0 && reasonTrim.length < 5

  const submit = async () => {
    if (!category) {
      setError('Sélectionnez un motif de clôture.')
      return
    }
    if (reasonTooShort) {
      setError('Le commentaire doit contenir au moins 5 caractères (ou être vide).')
      return
    }
    setError('')
    await onConfirm({ category, reason: reasonTrim || undefined })
  }

  const close = () => {
    setCategory('')
    setReason('')
    setError('')
    onCancel()
  }

  return (
    <Dialog
      open={open}
      title="Clôturer la conversation"
      icon="task_alt"
      iconTone="amber"
      size="md"
      onClose={busy ? undefined : close}
      actions={
        <>
          <Button variant="ghost" disabled={busy} onClick={close}>
            Annuler
          </Button>
          <Button
            disabled={busy || !category || reasonTooShort}
            loading={busy}
            onClick={submit}
          >
            Clôturer
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>
          Choisissez un motif pour alimenter les statistiques et la base de connaissance support.
        </p>
        <Select
          label="Motif"
          value={category}
          placeholder="Sélectionner un motif"
          options={CATEGORY_OPTIONS}
          onChange={event => setCategory(event.target.value as SupportCloseCategory)}
          disabled={busy}
        />
        <Textarea
          label="Commentaire (optionnel)"
          rows={4}
          value={reason}
          maxLength={2000}
          onChange={event => setReason(event.target.value)}
          disabled={busy}
          help="Minimum 5 caractères si renseigné."
        />
        {error && (
          <p role="alert" style={{ color: 'var(--color-danger)', margin: 0 }}>
            {error}
          </p>
        )}
      </div>
    </Dialog>
  )
}
