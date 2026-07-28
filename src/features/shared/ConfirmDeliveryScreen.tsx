import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Button, Toast } from '@/ds'
import { Panel } from '@/components/Panel'
import * as roles from '@/lib/api/roles'
import { queryClient } from '@/lib/queryClient'
import { useAuthStore } from '@/store/auth'

export function ConfirmDeliveryScreen() {
  const { parcelId } = useParams<{ parcelId: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [pin, setPin] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deliver = useMutation({
    mutationFn: (otp: string) => roles.driverDeliver(parcelId!, { otp }),
    onSuccess: () => {
      setSuccess(true)
      queryClient.invalidateQueries({ queryKey: ['driver', 'parcels'] })
      queryClient.invalidateQueries({ queryKey: ['parcels', 'my'] })
    },
  })

  const pushKey = useCallback(
    (key: string) => {
      if (submitting || success) return
      if (key === 'del') {
        setPin((p) => p.slice(0, -1))
        return
      }
      if (pin.length >= 4) return
      const next = pin + key
      setPin(next)
      if (next.length === 4) {
        submitPin(next)
      }
    },
    [pin, submitting, success],
  )

  const submitPin = async (entered: string) => {
    setSubmitting(true)
    setError(null)
    deliver.mutate(entered, {
      onError: (err) => {
        setError(err instanceof Error ? err.message : 'Code PIN incorrect')
        setPin('')
        setSubmitting(false)
      },
      onSettled: () => {
        if (!deliver.isSuccess) setSubmitting(false)
      },
    })
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') pushKey(e.key)
      else if (e.key === 'Backspace') pushKey('del')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [pushKey])

  if (success) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center', paddingTop: 48 }}>
        <div
          style={{
            width: 92,
            height: 92,
            borderRadius: '50%',
            background: 'var(--green-50)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 22,
          }}
        >
          <span className="material-symbols-rounded fill" style={{ fontSize: 56, color: 'var(--green-600)' }}>
            task_alt
          </span>
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--text-strong)', margin: '0 0 10px' }}>
          Colis livré !
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 20px', lineHeight: 1.5 }}>
          Le colis a bien été remis au destinataire.
        </p>
        <div
          style={{
            display: 'inline-flex',
            padding: '8px 16px',
            background: 'var(--amber-50)',
            borderRadius: 'var(--radius-pill)',
            fontFamily: 'var(--font-mono)',
            fontWeight: 900,
            fontSize: 14,
            color: 'var(--amber-700)',
            marginBottom: 24,
          }}
        >
          +150 pts crédités
        </div>
        <div>
          <Button onClick={() => navigate(user?.role === 'driver' ? '/driver/missions' : '/client/colis')}>
            Retour aux colis
          </Button>
        </div>
      </div>
    )
  }

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del']

  return (
    <div style={{ maxWidth: 400, margin: '0 auto' }}>
      <Panel>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 'var(--radius-lg)',
              background: 'var(--color-primary-soft)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 30, color: 'var(--color-primary)' }}>
              lock_open
            </span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--text-strong)', margin: '0 0 8px' }}>
            Code du destinataire
          </h2>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', margin: '0 0 28px', lineHeight: 1.45 }}>
            Demandez au destinataire le code PIN à 4 chiffres reçu par SMS pour valider la remise.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 18 }}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  width: 52,
                  height: 58,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--surface-card)',
                  border: `2px solid ${pin.length > i ? 'var(--color-primary)' : 'var(--border-default)'}`,
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 24,
                  fontWeight: 900,
                  color: 'var(--text-strong)',
                }}
              >
                {pin[i] || ''}
              </div>
            ))}
          </div>

          {error && <Toast tone="error" message={error} style={{ marginBottom: 12 }} />}
          {submitting && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ width: 24, height: 24, border: '3px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 8 }}>
          {keys.map((k) => {
            if (!k) return <div key="empty" />
            return (
              <button
                key={k}
                type="button"
                onClick={() => pushKey(k)}
                style={{
                  height: 50,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontFamily: k === 'del' ? 'var(--font-body)' : 'var(--font-mono)',
                  fontSize: k === 'del' ? 18 : 22,
                  fontWeight: 900,
                  color: 'var(--text-strong)',
                }}
              >
                {k === 'del' ? (
                  <span className="material-symbols-rounded" style={{ fontSize: 22 }}>backspace</span>
                ) : k}
              </button>
            )
          })}
        </div>
      </Panel>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
