import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge, Button, Card, Dialog, EmptyState, Input, Toast } from '@/ds'
import { QueryState } from '@/components/QueryState'
import { Panel } from '@/components/Panel'
import * as debtsApi from '@/lib/api/client-debts'
import { ApiError } from '@/lib/api/client'
import { createPaydunyaPayment } from '@/lib/api/paydunya'
import { formatDate, formatFcfa } from '@/lib/format'
import { useAuthStore } from '@/store/auth'

export function ClientDebtsScreen() {
  const userId = useAuthStore((s) => s.user?.id)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<debtsApi.ClientDebt | null>(null)
  const query = useQuery({
    queryKey: ['client', 'debts', userId, page],
    queryFn: () => debtsApi.list(page),
    // Au retour de PayDunya, seule une relecture serveur peut confirmer le
    // reliquat. Un paiement ouvert ne modifie jamais le total localement.
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Mes dettes</h1>
        <Button variant="secondary" icon="refresh" loading={query.isFetching} onClick={() => query.refetch()}>Actualiser</Button>
      </div>
      <QueryState isLoading={query.isLoading} isError={query.isError} error={query.error} onRetry={() => query.refetch()}>
        {query.data && <>
          <Card padding="lg">
            <p style={{ margin: '0 0 10px', fontSize: 12, letterSpacing: '0.08em', fontWeight: 700, color: 'var(--text-muted)' }}>TOTAL RESTANT À RÉGLER</p>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 700, color: query.data.summary.totalDebt > 0 ? 'var(--amber-700)' : 'var(--green-700)' }}>
              {formatFcfa(query.data.summary.totalDebt)}
            </div>
            <p style={{ color: 'var(--text-muted)', marginBottom: 0 }}>{query.data.summary.totalDebt === 0 ? 'Vous êtes à jour.' : 'Pénalités d’annulation de vos colis.'}</p>
            {!query.data.summary.canCreateParcel && <Toast tone="warning" message="Régularisez vos dettes pour pouvoir créer un nouveau colis." />}
          </Card>
          <Panel title="Historique des dettes">
            {query.data.debts.length === 0 ? <EmptyState icon="task_alt" title="Aucune dette" message="Vos pénalités éventuelles apparaîtront ici." /> :
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {query.data.debts.map((debt) => <article key={debt.id} style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <strong>{debt.trackingNumber}</strong>
                      <p style={{ color: 'var(--text-muted)', margin: '6px 0', fontSize: 12 }}>{debt.reference} · {formatDate(debt.createdAt)}</p>
                      {debt.reason && <p style={{ margin: '6px 0' }}>{debt.reason}</p>}
                    </div>
                    <Badge tone={debt.remaining === 0 ? 'green' : 'amber'}>{debt.remaining === 0 ? 'Réglée' : debt.status === 'partially_paid' ? 'Partiellement réglée' : 'À régler'}</Badge>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{formatFcfa(debt.remaining)} restants</span>
                    {debt.remaining > 0 && debt.status !== 'paid' && <Button size="sm" icon="payments" onClick={() => setSelected(debt)}>Régler cette dette</Button>}
                  </div>
                </article>)}
              </div>}
            {query.data.pagination.totalPages > 1 && <nav aria-label="Pages des dettes" style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center', marginTop: 20 }}>
              <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Précédent</Button>
              <span>{page} / {query.data.pagination.totalPages}</span>
              <Button variant="secondary" disabled={page >= query.data.pagination.totalPages} onClick={() => setPage(page + 1)}>Suivant</Button>
            </nav>}
          </Panel>
        </>}
      </QueryState>
      {selected && <PayClientDebtDialog debt={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

export function PayClientDebtDialog({ debt, onClose }: { debt: debtsApi.ClientDebt; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [amount, setAmount] = useState('')
  const parsed = amount.trim() ? Number(amount.replace(',', '.')) : undefined
  const valid = parsed === undefined || (Number.isFinite(parsed) && parsed > 0 && parsed <= debt.remaining)
  const payment = useMutation({
    mutationFn: async () => {
      const result = await createPaydunyaPayment('penalty_debt', { debtId: debt.id, ...(parsed === undefined ? {} : { amount: parsed }) })
      if (!result.token || !result.paymentUrl) throw new Error('Réponse de paiement incomplète')
      return result
    },
    onSuccess: (result) => window.location.assign(result.paymentUrl),
    onError: (error) => console.error('Création du règlement de dette impossible', error),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['client', 'debts'] }),
  })
  return (
    <Dialog open title="Régler la pénalité" icon="payments" iconTone="amber" onClose={onClose} actions={<>
      <Button variant="secondary" disabled={payment.isPending} onClick={onClose}>Fermer</Button>
      <Button icon="payments" loading={payment.isPending} disabled={!valid} onClick={() => payment.mutate()}>Payer avec PayDunya</Button>
    </>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left' }}>
        <p>Référence : {debt.reference || debt.trackingNumber}</p>
        <strong>Restant à régler : {formatFcfa(debt.remaining)}</strong>
        <Input label="Montant personnalisé (FCFA)" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} help="Laissez vide pour régler la totalité." />
        {!valid && <Toast tone="warning" message="Saisissez un montant positif inférieur ou égal au reliquat." />}
        {payment.isError && <Toast tone="error" message={payment.error instanceof ApiError ? payment.error.message : 'Impossible de créer le paiement. Veuillez réessayer.'} />}
      </div>
    </Dialog>
  )
}
