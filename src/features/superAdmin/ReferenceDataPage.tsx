// Ecran admin generique de gestion des referentiels editables.
//
// Les trois listes (vehicle-types, document-types, expense-categories)
// partagent la meme page : chaque entite declare ici ses colonnes
// specifiques (category, appliesTo, ...) tandis que `code`, `label`,
// `isActive` et `sortOrder` restent communs. On evite ainsi 3 copies d'une
// table + modale qui divergeraient a terme.
import { useMemo, useState } from 'react'
import { Button, Dialog, Input, Select, Switch, Toast } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import {
  useAdminReferenceList,
  useCreateReferenceItem,
  useDeactivateReferenceItem,
  useUpdateReferenceItem,
} from '@/lib/useReferenceData'
import type {
  DocumentTypeItem,
  ExpenseCategoryItem,
  ReferencePayload,
  ReferenceType,
  VehicleTypeItem,
} from '@/lib/api/reference-data'

type AnyItem = VehicleTypeItem | DocumentTypeItem | ExpenseCategoryItem

interface ColumnDef {
  key: string
  label: string
  // Rendu personnalise pour afficher category, appliesTo, isRequired, etc.
  render: (item: AnyItem) => React.ReactNode
}

interface Config {
  title: string
  subtitle: string
  // Champs additionnels (hors common) exposes dans la modale.
  extraFields: Array<'category' | 'appliesTo' | 'isRequired' | 'maxWeightKg' | 'maxVolumeM3'>
  // Colonnes specifiques affichees dans le tableau avant les colonnes communes.
  extraColumns: ColumnDef[]
}

const CONFIG: Record<ReferenceType, Config> = {
  'vehicle-types': {
    title: 'Types de véhicule',
    subtitle: 'Bus, Tata, moto, voiture… affichés dans les formulaires chauffeur et client.',
    extraFields: ['category', 'maxWeightKg', 'maxVolumeM3'],
    extraColumns: [
      {
        key: 'category',
        label: 'Catégorie',
        render: (item) => (item as VehicleTypeItem).category,
      },
      {
        key: 'maxWeightKg',
        label: 'Poids max.',
        render: (item) => {
          const value = (item as VehicleTypeItem).maxWeightKg
          return value != null ? `${value} kg` : '—'
        },
      },
    ],
  },
  'document-types': {
    title: 'Types de document',
    subtitle: 'Permis, carte grise, assurance, CNI… demandés aux chauffeurs et véhicules.',
    extraFields: ['appliesTo', 'isRequired'],
    extraColumns: [
      {
        key: 'appliesTo',
        label: 'Concerne',
        render: (item) => (item as DocumentTypeItem).appliesTo,
      },
      {
        key: 'isRequired',
        label: 'Requis',
        render: (item) => ((item as DocumentTypeItem).isRequired ? 'Oui' : 'Non'),
      },
    ],
  },
  'expense-categories': {
    title: 'Catégories de dépenses',
    subtitle: 'Loyer, salaires, carburant, maintenance… pour la comptabilité.',
    extraFields: [],
    extraColumns: [],
  },
}

interface Props {
  type: ReferenceType
}

type FormState = {
  id: string | null
  code: string
  label: string
  isActive: boolean
  sortOrder: string
  category: string
  appliesTo: string
  isRequired: boolean
  maxWeightKg: string
  maxVolumeM3: string
}

function emptyForm(): FormState {
  return {
    id: null,
    code: '',
    label: '',
    isActive: true,
    sortOrder: '0',
    category: '',
    appliesTo: 'driver',
    isRequired: true,
    maxWeightKg: '',
    maxVolumeM3: '',
  }
}

function buildPayload(form: FormState, type: ReferenceType): ReferencePayload {
  const base: ReferencePayload = {
    code: form.code.trim(),
    label: form.label.trim(),
    isActive: form.isActive,
    sortOrder: Number(form.sortOrder) || 0,
  }
  if (type === 'vehicle-types') {
    base.category = form.category.trim() || 'car'
    base.maxWeightKg = form.maxWeightKg ? Number(form.maxWeightKg) : null
    base.maxVolumeM3 = form.maxVolumeM3 ? Number(form.maxVolumeM3) : null
  } else if (type === 'document-types') {
    base.appliesTo = form.appliesTo.trim() || 'driver'
    base.isRequired = form.isRequired
  }
  return base
}

export function ReferenceDataPage({ type }: Props) {
  const config = CONFIG[type]
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const listQ = useAdminReferenceList(type, { page, limit: 20, ...(search ? { search } : {}) })
  const create = useCreateReferenceItem(type)
  const update = useUpdateReferenceItem(type)
  const deactivate = useDeactivateReferenceItem(type)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [toast, setToast] = useState<string | null>(null)

  const items = listQ.data?.items ?? []
  const pagination = listQ.data?.pagination

  const columns = useMemo<ColumnDef[]>(
    () => [
      { key: 'code', label: 'Code', render: (item) => <code>{item.code}</code> },
      { key: 'label', label: 'Libellé', render: (item) => item.label },
      ...config.extraColumns,
      { key: 'sortOrder', label: 'Ordre', render: (item) => item.sortOrder },
      {
        key: 'isActive',
        label: 'Actif',
        render: (item) => (item.isActive ? 'Oui' : 'Non'),
      },
    ],
    [config.extraColumns],
  )

  function openCreate() {
    setForm(emptyForm())
    setDialogOpen(true)
  }

  function openEdit(item: AnyItem) {
    const vt = item as VehicleTypeItem
    const dt = item as DocumentTypeItem
    setForm({
      id: item.id,
      code: item.code,
      label: item.label,
      isActive: item.isActive,
      sortOrder: String(item.sortOrder ?? 0),
      category: vt.category ?? '',
      appliesTo: dt.appliesTo ?? 'driver',
      isRequired: dt.isRequired ?? true,
      maxWeightKg: vt.maxWeightKg != null ? String(vt.maxWeightKg) : '',
      maxVolumeM3: vt.maxVolumeM3 != null ? String(vt.maxVolumeM3) : '',
    })
    setDialogOpen(true)
  }

  async function submit() {
    if (!form.code.trim() || !form.label.trim()) {
      setToast('Code et libellé sont obligatoires.')
      return
    }
    const payload = buildPayload(form, type)
    try {
      if (form.id) {
        await update.mutateAsync({ id: form.id, payload })
      } else {
        await create.mutateAsync(payload)
      }
      setDialogOpen(false)
      setToast('Enregistré.')
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Erreur lors de l\'enregistrement')
    }
  }

  async function toggleActive(item: AnyItem) {
    if (item.isActive) {
      // Desactivation = suppression douce cote API.
      await deactivate.mutateAsync(item.id)
    } else {
      await update.mutateAsync({ id: item.id, payload: { isActive: true } })
    }
  }

  return (
    <div className="cm-detail-page">
      <div className="cm-page-head">
        <div className="cm-page-head-body">
          <h1>{config.title}</h1>
          <p className="cm-page-head-sub">{config.subtitle}</p>
        </div>
        <Button icon="add" onClick={openCreate}>Nouvel élément</Button>
      </div>

      {toast && <Toast tone="info" message={toast} />}

      <Panel title="Entrées">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            icon="search"
            placeholder="Rechercher par code ou libellé…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            style={{ minWidth: 240, maxWidth: 360 }}
          />

          <QueryState
            isLoading={listQ.isLoading}
            isError={listQ.isError}
            error={listQ.error}
            isEmpty={!listQ.isLoading && items.length === 0}
            emptyMessage="Aucune entrée."
            onRetry={() => listQ.refetch()}
          >
            <div className="pc-table-scroll">
              <div style={{ minWidth: 720, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={headerRowStyle(columns.length)}>
                  {columns.map((col) => <span key={col.key}>{col.label}</span>)}
                  <span style={{ textAlign: 'right' }}>Actions</span>
                </div>
                {items.map((item) => (
                  <div key={item.id} style={rowStyle(columns.length)}>
                    {columns.map((col) => (
                      <span key={col.key} style={{ fontSize: 13, color: 'var(--text-strong)' }}>
                        {col.render(item)}
                      </span>
                    ))}
                    <span style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <Button icon="edit" size="sm" variant="ghost" onClick={() => openEdit(item)} aria-label="Modifier" />
                      <Button
                        icon={item.isActive ? 'toggle_on' : 'toggle_off'}
                        size="sm"
                        variant="ghost"
                        tone={item.isActive ? 'danger' : undefined}
                        onClick={() => toggleActive(item)}
                        aria-label={item.isActive ? 'Désactiver' : 'Réactiver'}
                        title={item.isActive ? 'Désactiver' : 'Réactiver'}
                      />
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12 }}>
                <Button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} size="sm">Précédent</Button>
                <span style={{ lineHeight: '32px', fontSize: 13, color: 'var(--text-muted)' }}>
                  Page {page} / {pagination.totalPages}
                </span>
                <Button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)} size="sm">
                  Suivant
                </Button>
              </div>
            )}
          </QueryState>
        </div>
      </Panel>

      {dialogOpen && (
        <Dialog
          open
          size="md"
          title={form.id ? 'Modifier l\'entrée' : 'Nouvelle entrée'}
          onClose={() => setDialogOpen(false)}
          actions={
            <>
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button onClick={submit} loading={create.isPending || update.isPending}>
                {form.id ? 'Enregistrer' : 'Créer'}
              </Button>
            </>
          }
        >
          <div className="pc-form" style={{ gap: 12 }}>
            <Input
              label="Code (identifiant technique)"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              disabled={!!form.id}
              placeholder="snake_case ex: driver_license"
              mono
            />
            <Input
              label="Libellé affiché"
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              placeholder="Permis de conduire"
            />

            {config.extraFields.includes('category') && (
              <Select
                label="Catégorie"
                value={form.category || 'car'}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                options={[
                  { value: 'shuttle', label: 'Transport collectif (bus/tata)' },
                  { value: 'moto', label: 'Moto' },
                  { value: 'car', label: 'Voiture' },
                  { value: 'truck', label: 'Camion' },
                ]}
              />
            )}
            {config.extraFields.includes('appliesTo') && (
              <Select
                label="S'applique à"
                value={form.appliesTo}
                onChange={(e) => setForm((f) => ({ ...f, appliesTo: e.target.value }))}
                options={[
                  { value: 'driver', label: 'Chauffeur' },
                  { value: 'vehicle', label: 'Véhicule' },
                  { value: 'user', label: 'Utilisateur' },
                ]}
              />
            )}
            {config.extraFields.includes('isRequired') && (
              <Switch
                label="Document obligatoire"
                checked={form.isRequired}
                onChange={(v) => setForm((f) => ({ ...f, isRequired: v }))}
              />
            )}
            {config.extraFields.includes('maxWeightKg') && (
              <Input
                label="Poids maximum (kg) — optionnel"
                type="number"
                value={form.maxWeightKg}
                onChange={(e) => setForm((f) => ({ ...f, maxWeightKg: e.target.value }))}
              />
            )}
            {config.extraFields.includes('maxVolumeM3') && (
              <Input
                label="Volume maximum (m³) — optionnel"
                type="number"
                value={form.maxVolumeM3}
                onChange={(e) => setForm((f) => ({ ...f, maxVolumeM3: e.target.value }))}
              />
            )}

            <Input
              label="Ordre d'affichage"
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
            />
            <Switch
              label="Actif (visible dans les écrans)"
              checked={form.isActive}
              onChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
            />
          </div>
        </Dialog>
      )}
    </div>
  )
}

function headerRowStyle(cols: number): React.CSSProperties {
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, minmax(100px, 1fr)) 120px`,
    gap: 8,
    padding: '6px 12px',
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '1px solid var(--border)',
  }
}

function rowStyle(cols: number): React.CSSProperties {
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, minmax(100px, 1fr)) 120px`,
    gap: 8,
    padding: '10px 12px',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-subtle)',
  }
}

// Wrappers legers : chaque route pointe un composant dedie pour rester
// coherent avec les autres pages superAdmin (une entree par route).
export function VehicleTypesPage() {
  return <ReferenceDataPage type="vehicle-types" />
}
export function DocumentTypesPage() {
  return <ReferenceDataPage type="document-types" />
}
export function ExpenseCategoriesPage() {
  return <ReferenceDataPage type="expense-categories" />
}
