import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Card, Dialog, Input, Toast } from '@/ds'
import { useScore, useScoreHistory, useAddPoints, useRemovePoints } from '@/features/superAdmin/hooks'

export function ScoreDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { data: score, isLoading, error } = useScore(userId)
  const { data: history = [] } = useScoreHistory(userId)

  const [showAdd, setShowAdd] = useState(false)
  const [showRemove, setShowRemove] = useState(false)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')

  const addPoints = useAddPoints(userId!)
  const removePoints = useRemovePoints(userId!)

  const driverName = score?.driverName ?? score?.fullName ?? 'Chauffeur'

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Chargement...</div>
  }

  if (error || !score) {
    return (
      <Card padding="lg" style={{ textAlign: 'center' }}>
        <h3 style={{ margin: '0 0 8px' }}>Score introuvable</h3>
        <p style={{ color: 'var(--text-muted)', margin: '0 0 16px' }}>Impossible de charger les données de score.</p>
        <Button variant="secondary" onClick={() => navigate('/admin/reputation/scores')}>
          Retour aux scores
        </Button>
      </Card>
    )
  }

  const level = score.level ?? 'NEW'
  const points = score.points ?? 0
  const levelColors: Record<string, string> = {
    ELITE: 'var(--color-primary)',
    PREMIUM: 'var(--amber-500)',
    STANDARD: 'var(--green-600)',
    NEW: 'var(--slate-500)',
  }
  const color = levelColors[level] ?? 'var(--slate-500)'

  const handleAction = (isAdd: boolean) => {
    const amt = Number(amount)
    if (!amt || amt <= 0) return
    const payload = { amount: amt, description: description.trim() || (isAdd ? 'Points ajoutés' : 'Points retirés') }
    if (isAdd) {
      addPoints.mutate(payload, {
        onSuccess: () => {
          setShowAdd(false)
          setAmount('')
          setDescription('')
        },
      })
    } else {
      removePoints.mutate(payload, {
        onSuccess: () => {
          setShowRemove(false)
          setAmount('')
          setDescription('')
        },
      })
    }
  }

  const actionError =
    (addPoints.error ?? removePoints.error) instanceof Error
      ? (addPoints.error ?? removePoints.error)!.message
      : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>
      <Card padding="lg">
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              padding: '4px 12px',
              borderRadius: 'var(--radius-pill)',
              background: `${color}1a`,
              marginBottom: 12,
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 14,
              color,
            }}
          >
            {level}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 36, color: 'var(--text-strong)' }}>
            {points} pts
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            Score de {driverName}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 16 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--green-600)' }}>
                +{score.totalEarned ?? 0} pts
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total gagné</div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--amber-500)' }}>
                -{score.totalSpent ?? 0} pts
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total dépensé</div>
            </div>
            {score.rating != null && (
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--amber-400)' }}>
                  {score.rating.toFixed(1)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Note</div>
              </div>
            )}
            {score.totalDeliveries != null && (
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--color-primary)' }}>
                  {score.totalDeliveries}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Livraisons</div>
              </div>
            )}
          </div>
        </div>
      </Card>

      <div style={{ display: 'flex', gap: 12 }}>
        <Button block icon="add" onClick={() => setShowAdd(true)} style={{ background: 'var(--green-600)', color: '#fff' }}>
          Ajouter
        </Button>
        <Button
          block
          variant="secondary"
          icon="remove"
          onClick={() => setShowRemove(true)}
          style={{ color: 'var(--red-500)', borderColor: 'var(--red-500)' }}
        >
          Retirer
        </Button>
      </div>

      <div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--text-strong)', margin: '0 0 10px' }}>
          Historique
        </h3>
        {history.length === 0 ? (
          <Card padding="lg">
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>
              Aucun historique
            </div>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {history.map((tx) => {
              const isCredit = tx.type === 'earn' || tx.type === 'add' || tx.amount > 0
              return (
                <Card key={tx.id} padding="md">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 18, color: isCredit ? 'var(--green-600)' : 'var(--red-400)' }}>
                      {isCredit ? 'arrow_downward' : 'arrow_upward'}
                    </span>
                    <span style={{ flex: 1, fontSize: 13, color: 'var(--text-body)' }}>
                      {tx.description ?? tx.type}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: isCredit ? 'var(--green-600)' : 'var(--red-400)' }}>
                      {isCredit ? '+' : '-'}{Math.abs(tx.amount)} pts
                    </span>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {showAdd && (
        <Dialog
          open
          onClose={() => setShowAdd(false)}
          icon="stars"
          iconTone="primary"
          title="Ajouter des points"
          actions={
            <>
              <Button variant="secondary" block onClick={() => setShowAdd(false)}>Annuler</Button>
              <Button block icon="add" loading={addPoints.isPending} onClick={() => handleAction(true)} style={{ background: 'var(--green-600)', color: '#fff' }}>
                Ajouter
              </Button>
            </>
          }
        >
          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input
              label="Nombre de points"
              icon="stars"
              type="number"
              inputMode="numeric"
              mono
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Input
              label="Description"
              icon="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            {actionError && <Toast tone="error" message={actionError} />}
          </div>
        </Dialog>
      )}

      {showRemove && (
        <Dialog
          open
          onClose={() => setShowRemove(false)}
          icon="stars"
          iconTone="danger"
          title="Retirer des points"
          actions={
            <>
              <Button variant="secondary" block onClick={() => setShowRemove(false)}>Annuler</Button>
              <Button block icon="remove" loading={removePoints.isPending} onClick={() => handleAction(false)} style={{ background: 'var(--red-500)', color: '#fff' }}>
                Retirer
              </Button>
            </>
          }
        >
          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input
              label="Nombre de points"
              icon="stars"
              type="number"
              inputMode="numeric"
              mono
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Input
              label="Description"
              icon="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            {actionError && <Toast tone="error" message={actionError} />}
          </div>
        </Dialog>
      )}
    </div>
  )
}
