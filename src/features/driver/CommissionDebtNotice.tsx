import { useNavigate } from 'react-router-dom'
import { Button } from '@/ds'
import { formatFcfa } from '@/lib/format'
import { useDriverFinancialState } from './hooks'

interface CommissionDebtNoticeProps {
  /** Variante compacte pour les listes (moins de padding, pas de bouton). */
  compact?: boolean
  /** Affiche aussi l'état sain (« Vous pouvez accepter de nouveaux colis. »). */
  showClearState?: boolean
}

/**
 * Bandeau d'état de la dette de commission du chauffeur.
 *
 * Réfléchit uniquement l'état renvoyé par `/driver/wallet` : le Web ne décide
 * jamais lui-même si le chauffeur peut accepter un colis. Tant que le
 * portefeuille charge, rien n'est affiché (jamais « Dette = 0 » par défaut).
 */
export function CommissionDebtNotice({ compact = false, showClearState = false }: CommissionDebtNoticeProps) {
  const navigate = useNavigate()
  const fin = useDriverFinancialState()

  if (fin.isLoading || fin.isError) return null

  if (fin.hasDebt) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          padding: compact ? '10px 14px' : '14px 16px',
          background: 'var(--amber-50)',
          border: '1px solid var(--amber-100)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 30,
            height: 30,
            flex: 'none',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--amber-100)',
            color: 'var(--amber-600)',
          }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>
            error_outline
          </span>
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5, color: 'var(--text-strong)' }}>
            Dette de commission
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 18, color: 'var(--amber-700)', marginTop: 2 }}>
            {formatFcfa(fin.commissionDebt)}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--amber-700)', marginTop: 4, lineHeight: 1.4 }}>
            {fin.isBlocked
              ? 'Le seuil de blocage est atteint : réglez une partie de cette dette avant d’accepter un nouveau colis. Vous pouvez toujours terminer les livraisons déjà acceptées.'
              : 'Cette dette reste inférieure au seuil de blocage : vous pouvez continuer à accepter des colis.'}
            {fin.debtLimit > 0 && <> Seuil de blocage : {formatFcfa(fin.debtLimit)}.</>}
          </div>
          {!compact && (
            <Button size="sm" variant="amber" icon="payments" style={{ marginTop: 10 }} onClick={() => navigate('/driver/points')}>
              Régler la dette
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (showClearState) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: compact ? '8px 14px' : '10px 16px',
          background: 'var(--green-50)',
          border: '1px solid var(--green-100)',
          borderRadius: 'var(--radius-md)',
          fontSize: 12.5,
          fontWeight: 600,
          color: 'var(--green-700)',
        }}
      >
        <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
          check_circle
        </span>
        Vous pouvez accepter de nouveaux colis.
      </div>
    )
  }

  return null
}
