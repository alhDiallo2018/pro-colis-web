import { useState } from 'react'
import { Button, Dialog, Input, Textarea, Toast } from '@/ds'
import { useRemovePoints } from './hooks'
import { ApiError } from '@/lib/api/client'

interface RemovePointsDialogProps {
  userId: string
  open: boolean
  onClose: () => void
}

export function RemovePointsDialog({ userId, open, onClose }: RemovePointsDialogProps) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const mutation = useRemovePoints(userId)

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
    } catch (error) {
      setLocalError(error instanceof ApiError ? error.message : 'Erreur lors du retrait de points.')
    }
  }

  const handleClose = () => {
    setAmount('')
    setDescription('')
    setLocalError(null)
    onClose()
  }

  return (
    <Dialog open={open} title="Retirer des points" icon="remove_circle" iconTone="danger" onClose={handleClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
        <Input
          label="Points"
          type="number"
          placeholder="Ex: 50"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          icon="stars"
        />
        <Textarea
          label="Description"
          placeholder="Motif du retrait..."
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
          variant="danger"
          onClick={handleSubmit}
          loading={mutation.isPending}
          disabled={mutation.isPending}
          block
        >
          Retirer
        </Button>
      </div>
    </Dialog>
  )
}
