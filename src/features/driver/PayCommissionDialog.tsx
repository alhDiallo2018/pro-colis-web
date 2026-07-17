import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button, Dialog, Toast } from '@/ds'
import { formatFcfa } from '@/lib/format'
import { ApiError } from '@/lib/api/client'
import * as commissionApi from '@/lib/api/commission'
import * as scoreApi from '@/lib/api/score'
import { queryClient } from '@/lib/queryClient'
import type { Parcel } from '@/lib/api/types'

interface PayCommissionDialogProps {
  parcel: Parcel | null
  onClose: () => void
}

export function PayCommissionDialog({ parcel, onClose }: PayCommissionDialogProps) {
  const [source, setSource] = useState<'wallet' | 'score'>('wallet')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const price = parcel?.price ?? 0

  const { data: estimate } = useQuery({
    queryKey: ['commission', 'estimate', price],
    queryFn: () => commissionApi.estimate(price),
    enabled: price > 0,
  })

  const walletQuery = useQuery({ queryKey: ['driver', 'wallet'], queryFn: () => scoreApi.getWallet() })
  const scoreQuery = useQuery({ queryKey: ['score', 'balance'], queryFn: () => scoreApi.getBalance() })

  const commission = estimate?.commission ?? Math.min(Math.max(price * 0.05, 100), 500)
  const netAmount = estimate?.netAmount ?? price - commission
  const walletBalance = walletQuery.data?.balance ?? 0
  const scoreBalance = scoreQuery.data ?? 0

  const canPayWallet = walletBalance >= commission
  const canPayScore = scoreBalance >= commission

  useEffect(() => {
    if (!canPayWallet && source === 'wallet' && canPayScore) {
      setSource('score')
    }
  }, [canPayWallet, canPayScore, source])

  if (!parcel) return null
  if (success) return null

  const handlePay = async () => {
    setLoading(true)
    setError(null)
    try {
      await commissionApi.payCashCommission(parcel.id, source, price)
      setSuccess(true)
      queryClient.invalidateQueries({ queryKey: ['driver', 'wallet'] })
      queryClient.invalidateQueries({ queryKey: ['score', 'balance'] })
      queryClient.invalidateQueries({ queryKey: ['score', 'history'] })
      queryClient.invalidateQueries({ queryKey: ['driver', 'parcels'] })
      onClose()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Erreur lors du paiement de la commission')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      icon="receipt_long"
      iconTone="amber"
      title="Payer la commission"
      actions={
        <>
          <Button variant="secondary" block onClick={onClose}>
            Plus tard
          </Button>
          <Button
            variant="amber"
            block
            icon="payments"
            loading={loading}
            disabled={source === 'wallet' ? !canPayWallet : !canPayScore}
            onClick={handlePay}
          >
            Payer {formatFcfa(commission)}
          </Button>
        </>
      }
    >
      <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {error && <Toast tone="error" message={error} />}

        <div
          style={{
            background: 'var(--amber-50)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            border: '1px solid var(--amber-100)',
          }}
        >
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, color: 'var(--amber-600)', marginBottom: 6 }}>
            Détail commission
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 13.5, color: 'var(--text-body)' }}>Montant de la livraison</span>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-strong)' }}>{formatFcfa(price)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 13.5, color: 'var(--text-body)' }}>
              Commission ({estimate?.percentage ?? 5}%)
            </span>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--red-600)' }}>- {formatFcfa(commission)}</span>
          </div>
          <div style={{ borderTop: '1px solid var(--amber-200)', paddingTop: 4, marginTop: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-strong)' }}>Votre gain net</span>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--green-700)' }}>{formatFcfa(netAmount)}</span>
            </div>
          </div>
        </div>

        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-strong)' }}>
          Comment souhaitez-vous payer la commission ?
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button
            type="button"
            onClick={() => setSource('wallet')}
            disabled={!canPayWallet}
            style={{
              textAlign: 'left',
              padding: '12px 14px',
              border: source === 'wallet' ? '2px solid var(--teal-500)' : '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              background: source === 'wallet' ? 'var(--teal-50)' : 'var(--surface-card)',
              cursor: canPayWallet ? 'pointer' : 'not-allowed',
              opacity: canPayWallet ? 1 : 0.5,
              fontFamily: 'inherit',
            }}
          >
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 16, verticalAlign: 'middle', marginRight: 4 }}>
                account_balance_wallet
              </span>
              Portefeuille
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16, color: canPayWallet ? 'var(--text-strong)' : 'var(--red-600)' }}>
              {formatFcfa(walletBalance)}
            </div>
            <div style={{ fontSize: 11.5, color: canPayWallet ? 'var(--text-muted)' : 'var(--red-500)', marginTop: 2 }}>
              {canPayWallet ? 'Solde suffisant' : 'Solde insuffisant'}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSource('score')}
            disabled={!canPayScore}
            style={{
              textAlign: 'left',
              padding: '12px 14px',
              border: source === 'score' ? '2px solid var(--teal-500)' : '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              background: source === 'score' ? 'var(--teal-50)' : 'var(--surface-card)',
              cursor: canPayScore ? 'pointer' : 'not-allowed',
              opacity: canPayScore ? 1 : 0.5,
              fontFamily: 'inherit',
            }}
          >
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 16, verticalAlign: 'middle', marginRight: 4 }}>
                stars
              </span>
              Points Score
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16, color: canPayScore ? 'var(--text-strong)' : 'var(--red-600)' }}>
              {scoreBalance} pts
            </div>
            <div style={{ fontSize: 11.5, color: canPayScore ? 'var(--text-muted)' : 'var(--red-500)', marginTop: 2 }}>
              {canPayScore ? 'Solde suffisant' : 'Solde insuffisant'}
            </div>
          </button>
        </div>
      </div>
    </Dialog>
  )
}
