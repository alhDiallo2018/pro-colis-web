import { useState } from 'react'
import { Button, Checkbox, Dialog, Input, Select, Textarea, SegmentedControl } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import { UserSearchSelect } from '@/components/UserSearchSelect'
import { DetailList, DetailRow, DetailSection, DetailText } from '@/components/DetailList'
import { formatDateTime } from '@/lib/format'
import { useIsMobile } from '@/lib/useMediaQuery'
import {
  useAssistances,
  useCreateAssistance,
  useUpdateAssistance,
  useDeleteAssistance,
} from '@/features/superAdmin/hooks'
import { useAuthStore } from '@/store/auth'
import { isSupportRole } from '@/lib/api/types'
import type {
  Assistance,
  AssistanceChannel,
  AssistanceStatus,
  AssistancePayload,
  AssistanceUser,
} from '@/lib/api/assistances'

const CHANNEL_META: Record<AssistanceChannel, { label: string; icon: string; color: string }> = {
  email: { label: 'E-mail', icon: 'mail', color: 'var(--slate-600)' },
  chat: { label: 'Chat', icon: 'chat', color: 'var(--color-primary)' },
  call: { label: 'Appel', icon: 'call', color: 'var(--green-600)' },
}

const STATUS_META: Record<AssistanceStatus, { label: string; color: string; bg: string }> = {
  open: { label: 'Ouvert', color: 'var(--amber-700)', bg: 'var(--amber-50)' },
  in_progress: { label: 'En cours', color: 'var(--teal-600)', bg: 'var(--teal-50)' },
  resolved: { label: 'Résolu', color: 'var(--green-700)', bg: 'var(--green-50)' },
}

const COL_GRID = '110px 90px 1.4fr 1fr 100px 120px 150px'
/** Fixed tracks + a workable minimum for the motif / utilisateur columns. */
const TABLE_MIN_WIDTH = 980

const EMPTY_FORM: AssistancePayload = {
  channel: 'chat',
  subject: '',
  notes: '',
  userId: null,
  contactName: '',
  contactPhone: '',
  status: 'open',
}

export function AssistancesPage() {
  const isMobile = useIsMobile()
  const role = useAuthStore((s) => s.user?.role)
  const isSupport = isSupportRole(role)
  // La suppression efface la trace d'une intervention : elle reste au super
  // admin (et au rôle `support` historique), comme côté API.
  const canDelete = role === 'super_admin' || role === 'support'

  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  // Un agent support arrive sur ses propres assistances ; il peut élargir.
  const [onlyMine, setOnlyMine] = useState(isSupport)
  const limit = 20

  const params = {
    page,
    limit,
    ...(status ? { status } : {}),
    ...(search ? { search } : {}),
    ...(onlyMine ? { mine: 1 } : {}),
  }
  const assistances = useAssistances(params)
  const create = useCreateAssistance()
  const update = useUpdateAssistance()
  const remove = useDeleteAssistance()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [detail, setDetail] = useState<Assistance | null>(null)
  const [editing, setEditing] = useState<Assistance | null>(null)
  const [form, setForm] = useState<AssistancePayload>(EMPTY_FORM)
  /** Personne assistée non inscrite : bascule sur la saisie libre. */
  const [manualContact, setManualContact] = useState(false)
  const [pickedUser, setPickedUser] = useState<AssistanceUser | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const items = assistances.data?.assistances ?? []
  const summary = assistances.data?.summary
  const pagination = assistances.data?.pagination

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setManualContact(false)
    setPickedUser(null)
    setFormError(null)
    setDialogOpen(true)
  }

  const openEdit = (a: Assistance) => {
    setDetail(null)
    setEditing(a)
    setForm({
      channel: a.channel,
      subject: a.subject,
      notes: a.notes ?? '',
      userId: a.userId ?? null,
      contactName: a.contactName ?? '',
      contactPhone: a.contactPhone ?? '',
      status: a.status,
    })
    setManualContact(!a.userId && Boolean(a.contactName || a.contactPhone))
    setPickedUser(
      a.user
        ? { id: a.user.id, fullName: a.user.fullName, phone: a.user.phone, email: a.user.email, role: a.user.role }
        : null,
    )
    setFormError(null)
    setDialogOpen(true)
  }

  const pickUser = (user: AssistanceUser | null) => {
    setPickedUser(user)
    setForm((f) => ({ ...f, userId: user?.id ?? null, contactName: '', contactPhone: '' }))
    setFormError(null)
  }

  const switchToManual = () => {
    setManualContact(true)
    setPickedUser(null)
    setForm((f) => ({ ...f, userId: null }))
  }

  const switchToRegistered = () => {
    setManualContact(false)
    setForm((f) => ({ ...f, contactName: '', contactPhone: '' }))
  }

  const submit = () => {
    if (!form.subject.trim()) return
    if (!form.userId && !(form.contactName ?? '').trim()) {
      setFormError('Sélectionnez l’utilisateur assisté, ou saisissez son nom s’il n’est pas inscrit.')
      return
    }
    setFormError(null)
    const payload: AssistancePayload = manualContact
      ? { ...form, userId: null }
      : { ...form, contactName: '', contactPhone: '' }
    if (editing) {
      update.mutate({ id: editing.id, payload }, { onSuccess: () => setDialogOpen(false) })
    } else {
      create.mutate(payload, { onSuccess: () => setDialogOpen(false) })
    }
  }

  /** Clôture en un clic depuis la liste, sans réouvrir le formulaire. */
  const resolve = (a: Assistance) => update.mutate({ id: a.id, payload: { status: 'resolved' } })

  return (
    <Panel
      title="Assistances"
      action={<Button icon="add" onClick={openCreate}>Nouvelle assistance</Button>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {summary && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <SummaryTile label="Total" value={summary.total} color="var(--text-strong)" />
            <SummaryTile label="Ouverts" value={summary.open} color="var(--amber-700)" />
            <SummaryTile label="En cours" value={summary.inProgress} color="var(--teal-600)" />
            <SummaryTile label="Résolus" value={summary.resolved} color="var(--green-700)" />
          </div>
        )}

        <div className="pc-filters">
          <SegmentedControl
            options={[
              { value: '', label: 'Tous' },
              { value: 'open', label: 'Ouverts' },
              { value: 'in_progress', label: 'En cours' },
              { value: 'resolved', label: 'Résolus' },
            ]}
            value={status}
            onChange={(s) => { setStatus(s); setPage(1) }}
          />
          <Input
            className="pc-filters-search"
            icon="search"
            placeholder="Rechercher (code, motif, utilisateur…)"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            style={{ minWidth: 240, flex: 1 }}
          />
          <Checkbox
            checked={onlyMine}
            onChange={(v) => { setOnlyMine(v); setPage(1) }}
            label="Mes assistances"
          />
        </div>

        <QueryState
          isLoading={assistances.isLoading}
          isError={assistances.isError}
          error={assistances.error}
          isEmpty={!assistances.isLoading && items.length === 0}
          emptyMessage="Aucune assistance enregistrée."
          onRetry={() => assistances.refetch()}
        >
          {isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {items.map((a) => {
                const ch = CHANNEL_META[a.channel] ?? { label: a.channel, icon: 'help', color: 'var(--text-muted)' }
                const st = STATUS_META[a.status] ?? { label: a.status, color: 'var(--text-muted)', bg: 'var(--surface-sunken)' }
                const who = a.user?.fullName ?? a.contactName ?? '—'
                return (
                  <div key={a.id} onClick={() => setDetail(a)} style={mobileCardStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--color-primary)' }}>{a.code}</span>
                      <span style={{ flex: 'none', fontSize: 11.5, fontWeight: 700, color: st.color, background: st.bg, padding: '3px 10px', borderRadius: 'var(--radius-pill)' }}>{st.label}</span>
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-strong)', overflowWrap: 'anywhere' }}>{a.subject}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-muted)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: ch.color, fontWeight: 600 }}>
                        <span className="material-symbols-rounded" style={{ fontSize: 15 }}>{ch.icon}</span>
                        {ch.label}
                      </span>
                      <span style={{ overflowWrap: 'anywhere' }}>{who}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, flexWrap: 'wrap' }} onClick={(ev) => ev.stopPropagation()}>
                      <Button icon="visibility" size="sm" variant="ghost" onClick={() => setDetail(a)}>Détails</Button>
                      {a.status !== 'resolved' && (
                        <Button icon="task_alt" size="sm" variant="ghost" onClick={() => resolve(a)} aria-label="Marquer résolu" title="Marquer résolu" />
                      )}
                      <Button icon="edit" size="sm" variant="ghost" onClick={() => openEdit(a)} aria-label="Modifier" />
                      {canDelete && (
                        <Button icon="delete" size="sm" variant="ghost" tone="danger"
                          onClick={() => { if (confirm(`Supprimer l'assistance ${a.code} ?`)) remove.mutate(a.id) }}
                          aria-label="Supprimer" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
          <div className="pc-table-scroll">
          <div style={{ minWidth: TABLE_MIN_WIDTH, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={headerRowStyle}>
              <span>Code</span>
              <span>Canal</span>
              <span>Motif</span>
              <span>Utilisateur</span>
              <span>Statut</span>
              <span>Traité par</span>
              <span />
            </div>

            {items.map((a) => {
              const ch = CHANNEL_META[a.channel] ?? { label: a.channel, icon: 'help', color: 'var(--text-muted)' }
              const st = STATUS_META[a.status] ?? { label: a.status, color: 'var(--text-muted)', bg: 'var(--surface-sunken)' }
              const who = a.user?.fullName ?? a.contactName ?? '—'
              const contact = a.user?.phone ?? a.contactPhone ?? ''
              return (
                <div key={a.id} style={rowStyle} onClick={() => setDetail(a)}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--color-primary)' }}>{a.code}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: ch.color, fontWeight: 600 }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 16 }}>{ch.icon}</span>
                    {ch.label}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={a.subject}>{a.subject}</span>
                  <span style={{ fontSize: 12.5 }}>
                    <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {who}
                      {a.user ? (
                        <span
                          className="material-symbols-rounded"
                          title="Compte inscrit"
                          style={{ fontSize: 14, color: 'var(--green-600)' }}
                        >
                          verified_user
                        </span>
                      ) : null}
                    </div>
                    {contact ? <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{contact}</div> : null}
                  </span>
                  <span>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: st.color, background: st.bg, padding: '3px 10px', borderRadius: 'var(--radius-pill)' }}>{st.label}</span>
                  </span>
                  <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                    <div>{a.handledBy?.fullName ?? '—'}</div>
                    <div style={{ fontSize: 10.5 }}>{a.createdAt ? new Date(a.createdAt).toLocaleDateString('fr-FR') : ''}</div>
                  </span>
                  <span style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }} onClick={(ev) => ev.stopPropagation()}>
                    <Button icon="visibility" size="sm" variant="ghost" onClick={() => setDetail(a)} aria-label="Détails" title="Détails" />
                    {a.status !== 'resolved' && (
                      <Button
                        icon="task_alt"
                        size="sm"
                        variant="ghost"
                        onClick={() => resolve(a)}
                        aria-label="Marquer résolu"
                        title="Marquer résolu"
                      />
                    )}
                    <Button icon="edit" size="sm" variant="ghost" onClick={() => openEdit(a)} aria-label="Modifier" title="Modifier" />
                    {canDelete && (
                      <Button icon="delete" size="sm" variant="ghost" tone="danger"
                        onClick={() => { if (confirm(`Supprimer l'assistance ${a.code} ?`)) remove.mutate(a.id) }}
                        aria-label="Supprimer" title="Supprimer" />
                    )}
                  </span>
                </div>
              )
            })}
          </div>
          </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12 }}>
              <Button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} size="sm">Précédent</Button>
              <span style={{ lineHeight: '32px', fontSize: 13, color: 'var(--text-muted)' }}>Page {page} / {pagination.totalPages}</span>
              <Button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)} size="sm">Suivant</Button>
            </div>
          )}
        </QueryState>
      </div>

      {detail && (
        <AssistanceDetailDialog
          assistance={detail}
          onClose={() => setDetail(null)}
          onEdit={() => openEdit(detail)}
        />
      )}

      {dialogOpen && (
        <Dialog
          open
          size="lg"
          title={editing ? `Assistance ${editing.code}` : 'Nouvelle assistance'}
          onClose={() => setDialogOpen(false)}
          actions={
            <>
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button onClick={submit} loading={create.isPending || update.isPending} disabled={!form.subject.trim()}>
                {editing ? 'Enregistrer' : 'Créer'}
              </Button>
            </>
          }
        >
          <div className="pc-form" style={{ gap: 14 }}>
            <Select
              label="Canal"
              value={form.channel}
              onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value as AssistanceChannel }))}
              options={[
                { value: 'chat', label: 'Chat' },
                { value: 'email', label: 'E-mail' },
                { value: 'call', label: 'Appel téléphonique' },
              ]}
            />
            {manualContact ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="pc-field-pair">
                  <Input
                    label="Nom du contact"
                    value={form.contactName ?? ''}
                    onChange={(e) => { setForm((f) => ({ ...f, contactName: e.target.value })); setFormError(null) }}
                    placeholder="Personne non inscrite"
                  />
                  <Input
                    label="Téléphone"
                    value={form.contactPhone ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
                    placeholder="+221…"
                  />
                </div>
                <button
                  type="button"
                  onClick={switchToRegistered}
                  style={linkButtonStyle}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 16 }}>person_search</span>
                  Finalement, choisir un utilisateur inscrit
                </button>
              </div>
            ) : (
              <UserSearchSelect
                label="Utilisateur assisté"
                required
                value={form.userId ?? null}
                initialUser={pickedUser}
                onChange={pickUser}
                onNotRegistered={switchToManual}
              />
            )}
            {formError && (
              <span style={{ fontSize: 12, color: 'var(--color-danger)' }}>{formError}</span>
            )}
            <Input
              label="Motif / résumé"
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              placeholder="Ex: Problème de paiement PayDunya"
            />
            <Textarea
              label="Notes"
              value={form.notes ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              placeholder="Détails de l'échange, actions menées…"
            />
            <Select
              label="Statut"
              value={form.status ?? 'open'}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as AssistanceStatus }))}
              options={[
                { value: 'open', label: 'Ouvert' },
                { value: 'in_progress', label: 'En cours' },
                { value: 'resolved', label: 'Résolu' },
              ]}
            />
          </div>
        </Dialog>
      )}
    </Panel>
  )
}

/** Fiche lecture seule — les notes de l'échange n'étaient visibles qu'en édition. */
function AssistanceDetailDialog({ assistance, onClose, onEdit }: { assistance: Assistance; onClose: () => void; onEdit: () => void }) {
  const a = assistance
  const ch = CHANNEL_META[a.channel] ?? { label: a.channel, icon: 'help', color: 'var(--text-muted)' }
  const st = STATUS_META[a.status] ?? { label: a.status, color: 'var(--text-muted)', bg: 'var(--surface-sunken)' }
  return (
    <Dialog
      open
      size="lg"
      title={`Assistance ${a.code}`}
      onClose={onClose}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>Fermer</Button>
          <Button icon="edit" onClick={onEdit}>Modifier</Button>
        </>
      }
    >
      <div className="pc-form" style={{ gap: 18 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-strong)', overflowWrap: 'anywhere' }}>{a.subject}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600, color: ch.color }}>
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>{ch.icon}</span>
              {ch.label}
            </span>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: st.color, background: st.bg, padding: '3px 10px', borderRadius: 'var(--radius-pill)' }}>
              {st.label}
            </span>
          </div>
        </div>

        <DetailSection title="Personne assistée">
          <DetailList>
            <DetailRow label="Nom" always>{a.user?.fullName ?? a.contactName}</DetailRow>
            <DetailRow label="Téléphone" mono>{a.user?.phone ?? a.contactPhone}</DetailRow>
            <DetailRow label="E-mail">{a.user?.email}</DetailRow>
            <DetailRow label="Compte" always>
              {a.user ? `Inscrit · ${a.user.role}` : 'Non inscrit (saisie libre)'}
            </DetailRow>
          </DetailList>
        </DetailSection>

        <DetailSection title="Suivi">
          <DetailList>
            <DetailRow label="Code" mono always>{a.code}</DetailRow>
            <DetailRow label="Traité par" always>{a.handledBy?.fullName}</DetailRow>
            <DetailRow label="Ouverte le">{formatDateTime(a.createdAt)}</DetailRow>
            <DetailRow label="Résolue le">{formatDateTime(a.resolvedAt)}</DetailRow>
            <DetailRow label="Mise à jour">{formatDateTime(a.updatedAt)}</DetailRow>
          </DetailList>
        </DetailSection>

        <DetailSection title="Notes">
          {a.notes ? <DetailText>{a.notes}</DetailText> : (
            <span style={{ fontSize: 13, color: 'var(--text-faint)' }}>Aucune note enregistrée.</span>
          )}
        </DetailSection>
      </div>
    </Dialog>
  )
}

function SummaryTile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ flex: '1 1 120px', minWidth: 120, background: 'var(--surface-sunken)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color }}>{value}</div>
    </div>
  )
}

/** Bascule discrète entre sélection d'un compte et saisie libre. */
const linkButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  alignSelf: 'flex-start',
  padding: 0,
  border: 'none',
  background: 'transparent',
  color: 'var(--color-primary)',
  fontFamily: 'inherit',
  fontSize: 12.5,
  fontWeight: 600,
  cursor: 'pointer',
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
  cursor: 'pointer',
}

const mobileCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  minWidth: 0,
  padding: 14,
  background: 'var(--surface-card)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
}
