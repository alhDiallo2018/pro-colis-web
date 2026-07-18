import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/ds'
import { MarketingHeader } from '@/features/marketing/MarketingHeader'
import { confirmPaydunyaPayment } from '@/lib/api/paydunya'
import { formatFcfa } from '@/lib/format'
import { useAuthStore } from '@/store/auth'
import { homeForRole } from '@/routes/paths'

type UiState = 'success' | 'pending' | 'failed'

function uiStateFor(status: string | undefined): UiState {
  switch (status) {
    case 'completed':
    case 'confirmed':
    case 'success':
    case 'reussi':
      return 'success'
    case 'cancelled':
    case 'canceled':
    case 'failed':
    case 'echoue':
      return 'failed'
    default:
      return 'pending'
  }
}

const UI: Record<UiState, { icon: string; color: string; bg: string; title: string; text: string }> = {
  success: {
    icon: 'check_circle',
    color: 'var(--green-600)',
    bg: 'var(--green-50)',
    title: 'Paiement confirmé',
    text: 'Votre paiement a bien été reçu. Un reçu vous a été envoyé et votre opération est validée.',
  },
  pending: {
    icon: 'hourglass_top',
    color: 'var(--amber-500)',
    bg: 'var(--amber-50)',
    title: 'Paiement en cours de vérification',
    text: 'Nous vérifions votre paiement auprès de PayDunya. Cette page se met à jour automatiquement.',
  },
  failed: {
    icon: 'cancel',
    color: 'var(--red-400)',
    bg: 'var(--red-50)',
    title: 'Paiement non abouti',
    text: "Le paiement a été annulé ou a échoué. Aucun montant n'a été débité. Vous pouvez réessayer.",
  },
}

export function PaymentStatusPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const user = useAuthStore((s) => s.user)
  const token = params.get('token') || params.get('invoice_token') || ''

  const query = useQuery({
    queryKey: ['paydunya', 'confirm', token],
    queryFn: () => confirmPaydunyaPayment(token),
    enabled: !!token,
    refetchInterval: (q) => (uiStateFor(q.state.data?.status) === 'pending' ? 5000 : false),
  })

  const state: UiState = !token || query.isError ? 'failed' : query.isLoading ? 'pending' : uiStateFor(query.data?.status)
  const ui = UI[state]
  const homeLabel = user ? 'Retour à mon espace' : 'Se connecter'
  const goHome = () => navigate(user ? homeForRole(user.role) : '/login')

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 20px', fontFamily: 'var(--font-body)', color: 'var(--text-body)' }}>
      <MarketingHeader />

      <div
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          padding: '40px 28px',
          textAlign: 'center',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 84,
            height: 84,
            borderRadius: '50%',
            background: ui.bg,
            color: ui.color,
            marginBottom: 20,
          }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 46, fontVariationSettings: "'FILL' 1" }}>
            {ui.icon}
          </span>
        </span>

        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: 'var(--text-strong)', margin: '0 0 10px' }}>
          {ui.title}
        </h1>
        <p style={{ fontSize: 14.5, color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 auto 24px', maxWidth: 420 }}>
          {!token ? 'Référence de paiement introuvable. Vérifiez le lien ou contactez le support.' : ui.text}
        </p>

        {query.data && (
          <div
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              gap: 8,
              background: 'var(--surface-sunken)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 24px',
              marginBottom: 28,
              minWidth: 260,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)' }}>Montant</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-strong)' }}>
                {formatFcfa(query.data.amount)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)' }}>Référence</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 12 }}>{query.data.token}</span>
            </div>
            {query.data.customer?.name && (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>Payé par</span>
                <span style={{ fontWeight: 600 }}>{query.data.customer.name}</span>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {state === 'pending' && token && (
            <Button variant="secondary" icon="refresh" loading={query.isFetching} onClick={() => query.refetch()}>
              Vérifier maintenant
            </Button>
          )}
          {query.data?.receiptUrl && (
            <Button variant="secondary" icon="receipt_long" onClick={() => window.open(query.data.receiptUrl, '_blank')}>
              Voir le reçu
            </Button>
          )}
          <Button variant="primary" iconTrailing="arrow_forward" onClick={goHome}>
            {homeLabel}
          </Button>
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--text-faint)', marginTop: 18 }}>
        Un doute sur ce paiement ? Écrivez-nous à{' '}
        <a href="mailto:support-commercial@sendprocolis.com" style={{ color: 'var(--color-primary)' }}>
          support-commercial@sendprocolis.com
        </a>
      </p>
    </div>
  )
}
