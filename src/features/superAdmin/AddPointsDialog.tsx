import { useState } from 'react'
import { Button, Dialog, Input, Textarea, Toast } from '@/ds'
import { useAddPoints } from './hooks'

interface AddPointsDialogProps {
  userId: string
  open: boolean
  onClose: () => void
}

export function AddPointsDialog({ userId, open, onClose }: AddPointsDialogProps) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const mutation = useAddPoints(userId)

  const handleSubmit = async () => {
    const num = Number(amount)
    if (!amount || Number.isNaN(num) || num <= 0) {
      setLocalError('Le montant doit être supérieur à 0.')
      return
    }
    if (!description.trim()) {
      setLocalError('Veuillez saisir une description.')
      return
    }
    setLocalError(null)
    try {
      await mutation.mutateAsync({ amount: num, description: description.trim() })
      setAmount('')
      setDescription('')
      onClose()
    } catch (_e) {
      setLocalError("Erreur lors de l'ajout de points.")
    }
  }

  const handleClose = () => {
    setAmount('')
    setDescription('')
    setLocalError(null)
    onClose()
  }

  return (
    <Dialog open={open} title="Ajouter des points" icon="add_circle" iconTone="green" onClose={handleClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
        <Input
          label="Points"
          type="number"
          placeholder="Ex: 150"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          icon="stars"
        />
        <Textarea
          label="Description"
          placeholder="Motif de l'ajout..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
        {localError && (
          <Toast tone="error" message={localError} onClose={() => setLocalError(null)} />
        )}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
        <Button variant="secondary" onClick={handleClose} block>
          Annuler
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          loading={mutation.isPending}
          disabled={mutation.isPending}
          block
        >
          Ajouter
        </Button>
      </div>
    </Dialog>
  )
}
