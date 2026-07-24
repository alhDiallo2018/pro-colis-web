import { useRef, useState } from 'react'
import { Button, Dialog, Input, Select, Textarea, SegmentedControl } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import {
  useExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
} from '@/features/superAdmin/hooks'
import { uploadChatPhoto } from '@/lib/api/uploads'
import { formatFcfa } from '@/lib/format'
import type { Expense, ExpenseStatus, ExpensePayload } from '@/lib/api/expenses'

const CATEGORIES = ['Loyer', 'Salaires', 'Marketing', 'Transport', 'Fournitures', 'Maintenance', 'Commissions', 'Autre']

const STATUS_META: Record<ExpenseStatus, { label: string; color: string; bg: string }> = {
  paid: { label: 'Payé', color: 'var(--green-700)', bg: 'var(--green-50)' },
  pending: { label: 'En attente', color: 'var(--amber-700)', bg: 'var(--amber-50)' },
}

const COL_GRID = '110px 1.4fr 110px 120px 100px 110px 70px 90px'

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

const EMPTY_FORM: ExpensePayload = {
  title: '',
  category: 'Autre',
  amount: 0,
  description: '',
  proofUrl: null,
  status: 'paid',
  spentAt: todayIso(),
}

export function ExpensesPage() {
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const limit = 20

  const params = { page, limit, ...(status ? { status } : {}), ...(search ? { search } : {}) }
  const expenses = useExpenses(params)
  const create = useCreateExpense()
  const update = useUpdateExpense()
  const remove = useDeleteExpense()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [form, setForm] = useState<ExpensePayload>(EMPTY_FORM)
  const [amountText, setAmountText] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const items = expenses.data?.expenses ?? []
  const summary = expenses.data?.summary
  const pagination = expenses.data?.pagination

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setAmountText('')
    setDialogOpen(true)
  }

  const openEdit = (e: Expense) => {
    setEditing(e)
    setForm({
      title: e.title,
      category: e.category,
      amount: e.amount,
      description: e.description ?? '',
      proofUrl: e.proofUrl ?? null,
      status: e.status,
      spentAt: e.spentAt ? e.spentAt.slice(0, 10) : todayIso(),
    })
    setAmountText(String(e.amount))
    setDialogOpen(true)
  }

  const handleProof = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadChatPhoto(file)
      setForm((f) => ({ ...f, proofUrl: url }))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const submit = () => {
    const amount = Number(amountText)
    if (!form.title.trim() || !amount || amount <= 0) return
    const payload = { ...form, amount }
    if (editing) {
      update.mutate({ id: editing.id, payload }, { onSuccess: () => setDialogOpen(false) })
    } else {
      create.mutate(payload, { onSuccess: () => setDialogOpen(false) })
    }
  }

  return (
    <Panel
      title="Dépenses"
      action={<Button icon="add" onClick={openCreate}>Nouvelle dépense</Button>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {summary && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <SummaryTile label="Total dépensé" value={formatFcfa(summary.totalAmount)} color="var(--text-strong)" />
            <SummaryTile label="Payé" value={formatFcfa(summary.paidAmount)} color="var(--green-700)" />
            <SummaryTile label="En attente" value={formatFcfa(summary.pendingAmount)} color="var(--amber-700)" />
            <SummaryTile label="Nombre" value={String(summary.count)} color="var(--text-strong)" />
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <SegmentedControl
            options={[
              { value: '', label: 'Toutes' },
              { value: 'paid', label: 'Payées' },
              { value: 'pending', label: 'En attente' },
            ]}
            value={status}
            onChange={(s) => { setStatus(s); setPage(1) }}
          />
          <Input
            icon="search"
            placeholder="Rechercher (référence, libellé…)"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            style={{ minWidth: 240, flex: 1 }}
          />
        </div>

        <QueryState
          isLoading={expenses.isLoading}
          isError={expenses.isError}
          error={expenses.error}
          isEmpty={!expenses.isLoading && items.length === 0}
          emptyMessage="Aucune dépense enregistrée."
          onRetry={() => expenses.refetch()}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={headerRowStyle}>
              <span>Réf.</span>
              <span>Libellé</span>
              <span>Catégorie</span>
              <span>Montant</span>
              <span>Statut</span>
              <span>Date</span>
              <span>Preuve</span>
              <span />
            </div>

            {items.map((e) => {
              const st = STATUS_META[e.status] ?? { label: e.status, color: 'var(--text-muted)', bg: 'var(--surface-sunken)' }
              return (
                <div key={e.id} style={rowStyle}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--color-primary)' }}>{e.reference}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={e.title}>{e.title}</span>
                  <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{e.category}</span>
                  <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: 13 }}>{formatFcfa(e.amount)}</span>
                  <span>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: st.color, background: st.bg, padding: '3px 10px', borderRadius: 'var(--radius-pill)' }}>{st.label}</span>
                  </span>
                  <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{e.spentAt ? new Date(e.spentAt).toLocaleDateString('fr-FR') : ''}</span>
                  <span>
                    {e.proofUrl ? (
                      <a href={e.proofUrl} target="_blank" rel="noopener noreferrer" title="Voir le justificatif"
                        style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--color-primary)' }}>
                        <span className="material-symbols-rounded" style={{ fontSize: 20 }}>receipt_long</span>
                      </a>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>—</span>
                    )}
                  </span>
                  <span style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                    <Button icon="edit" size="sm" variant="ghost" onClick={() => openEdit(e)} aria-label="Modifier" />
                    <Button icon="delete" size="sm" variant="ghost" tone="danger"
                      onClick={() => { if (confirm(`Supprimer la dépense ${e.reference} ?`)) remove.mutate(e.id) }}
                      aria-label="Supprimer" />
                  </span>
                </div>
              )
            })}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12 }}>
              <Button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} size="sm">Précédent</Button>
              <span style={{ lineHeight: '32px', fontSize: 13, color: 'var(--text-muted)' }}>Page {page} / {pagination.totalPages}</span>
              <Button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)} size="sm">Suivant</Button>
            </div>
          )}
        </QueryState>
      </div>

      {dialogOpen && (
        <Dialog
          open
          title={editing ? `Dépense ${editing.reference}` : 'Nouvelle dépense'}
          onClose={() => setDialogOpen(false)}
          actions={
            <>
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button onClick={submit} loading={create.isPending || update.isPending}
                disabled={!form.title.trim() || !Number(amountText)}>
                {editing ? 'Enregistrer' : 'Créer'}
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 'min(440px, 80vw)' }}>
            <Input
              label="Libellé"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Ex: Loyer bureau juillet"
            />
            <div className="pc-field-pair">
              <Input
                label="Montant (FCFA)"
                type="number"
                mono
                value={amountText}
                onChange={(e) => setAmountText(e.target.value)}
                placeholder="0"
              />
              <Input
                label="Date"
                type="date"
                value={form.spentAt ?? todayIso()}
                onChange={(e) => setForm((f) => ({ ...f, spentAt: e.target.value }))}
              />
            </div>
            <div className="pc-field-pair">
              <Select
                label="Catégorie"
                value={form.category ?? 'Autre'}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                options={CATEGORIES.map((c) => ({ value: c, label: c }))}
              />
              <Select
                label="Statut"
                value={form.status ?? 'paid'}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ExpenseStatus }))}
                options={[
                  { value: 'paid', label: 'Payé' },
                  { value: 'pending', label: 'En attente' },
                ]}
              />
            </div>
            <Textarea
              label="Description"
              value={form.description ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              placeholder="Détails, fournisseur…"
            />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-body)', marginBottom: 6 }}>Justificatif (photo)</div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleProof} />
              {form.proofUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <a href={form.proofUrl} target="_blank" rel="noopener noreferrer">
                    <img src={form.proofUrl} alt="Justificatif" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }} />
                  </a>
                  <Button size="sm" variant="ghost" tone="danger" icon="delete" onClick={() => setForm((f) => ({ ...f, proofUrl: null }))}>
                    Retirer
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="secondary" icon="upload" loading={uploading} onClick={() => fileRef.current?.click()}>
                  Ajouter une preuve
                </Button>
              )}
            </div>
          </div>
        </Dialog>
      )}
    </Panel>
  )
}

function SummaryTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ flex: '1 1 150px', minWidth: 150, background: 'var(--surface-sunken)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color }}>{value}</div>
    </div>
  )
}

const headerRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: COL_GRID,
  gap: 8,
  padding: '6px 12px',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  borderBottom: '1px solid var(--border)',
}

const rowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: COL_GRID,
  gap: 8,
  padding: '10px 12px',
  alignItems: 'center',
  borderBottom: '1px solid var(--border-subtle)',
}
