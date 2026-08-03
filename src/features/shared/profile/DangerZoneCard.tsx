import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Dialog, Input, Toast } from '@/ds'
import { ApiError } from '@/lib/api/client'
import * as usersApi from '@/lib/api/users'
import { useAuthStore } from '@/store/auth'

const CONFIRM_WORD = 'SUPPRIMER'

/**
 * Fermeture de compte à l'initiative de l'utilisateur.
 *
 * L'API applique une suppression logique : le compte passe en `deleted`, les
 * sessions sont révoquées, mais l'historique reste disponible au support tant
 * qu'un litige peut porter dessus. On l'annonce explicitement plutôt que de
 * laisser croire à un effacement complet.
 */
export function DangerZoneCard() {
  const navigate = useNavigate()
  const clearSession = useAuthStore((s) => s.clearSession)
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const remove = useMutation({
    mutationFn: () => usersApi.deleteAccount(),
    onSuccess: () => {
      clearSession()
      navigate('/', { replace: true })
    },
  })

  const error = remove.error instanceof ApiError ? remove.error.message : remove.error ? 'Suppression impossible' : null

  return (
    <Card padding="lg" style={{ borderColor: 'var(--color-danger)' }}>
      <h3 style={{ margin: '0 0 4px', fontFamily: 'var(--font-display)', fontSize: 'var(--fs-h3)', color: 'var(--color-danger)' }}>
        Supprimer mon compte
      </h3>
      <p style={{ margin: '0 0 16px', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
        Votre accès est fermé immédiatement et toutes vos sessions sont déconnectées.
        L'historique de vos colis est conservé pour le traitement d'éventuels litiges.
      </p>

      {error && <Toast tone="error" message={error} style={{ marginBottom: 12 }} />}

      <Button variant="ghost" tone="danger" icon="person_remove" onClick={() => setOpen(true)}>
        Supprimer mon compte
      </Button>

      {open && (
        <Dialog
          open
          onClose={() => setOpen(false)}
          icon="warning"
          iconTone="danger"
          title="Supprimer définitivement votre compte ?"
          style={{ maxWidth: 440 }}
          actions={
            <>
              <Button variant="secondary" block onClick={() => { setOpen(false); setConfirmText('') }}>
                Annuler
              </Button>
              <Button
                variant="danger"
                block
                loading={remove.isPending}
                disabled={confirmText.trim().toUpperCase() !== CONFIRM_WORD}
                onClick={() => remove.mutate()}
              >
                Supprimer
              </Button>
            </>
          }
        >
          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ margin: 0, fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
              Vous ne pourrez plus vous connecter, ni suivre vos colis en cours.
              Cette action ne peut pas être annulée depuis l'application.
            </p>
            <Input
              label={`Tapez « ${CONFIRM_WORD} » pour confirmer`}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={CONFIRM_WORD}
            />
          </div>
        </Dialog>
      )}
    </Card>
  )
}
