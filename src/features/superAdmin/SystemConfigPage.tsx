/**
 * Page admin pour éditer `SystemConfig` (clés K-V JSON).
 *
 * Chaque section du schéma (`systemConfigSchema.ts`) rend un formulaire
 * typé (color picker, number input, textarea JSON, switch, …) et expose
 * un bouton « Enregistrer » qui envoie en batch uniquement les clés
 * modifiées. Après enregistrement, la query `['public', 'config']` est
 * invalidée côté React Query — les hooks `useBranding`, `useTimings`, etc.
 * refetchent immédiatement les nouvelles valeurs.
 *
 * Les clés non référencées par le schéma restent visibles dans l'onglet
 * "Clés brutes" (éditeur JSON générique) : ajouter une clé en DB ne casse
 * jamais l'UI.
 */

import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Icon, Input, Select, Switch, Textarea, Toast } from '@/ds'
import { Panel } from '@/components/Panel'
import { QueryState } from '@/components/QueryState'
import {
  batchUpdateSystemConfig,
  deleteSystemConfigKey,
  getSystemConfig,
  type SystemConfigKey,
} from '@/lib/api/system-config'
import {
  SYSTEM_CONFIG_SECTIONS,
  SCHEMA_KEYS,
  parseFieldInput,
  stringifyFieldValue,
  type FieldDef,
  type SectionDef,
} from './systemConfigSchema'
import { ApiError } from '@/lib/api/client'

type ToastMsg = { tone: 'success' | 'error' | 'info'; text: string } | null

interface FieldInputProps {
  field: FieldDef
  value: string
  error?: string
  onChange: (next: string) => void
}

/** Rendu générique d'un champ selon son `kind`. */
function FieldInput({ field, value, error, onChange }: FieldInputProps) {
  const sharedLabel = (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <code style={{ fontSize: 11, color: 'var(--text-muted)' }}>{field.key}</code>
    </span>
  )
  const description = field.description ? (
    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{field.description}</span>
  ) : undefined

  switch (field.kind) {
    case 'boolean':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Switch
              checked={value === 'true'}
              onChange={(next) => onChange(next ? 'true' : 'false')}
              label={field.label}
              description={field.description}
            />
          </div>
          {sharedLabel}
          {error && <span style={{ color: 'var(--color-danger)', fontSize: 12 }}>{error}</span>}
        </div>
      )
    case 'select':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Select
            label={field.label}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            options={field.options ?? []}
            error={error}
          />
          {description}
          {sharedLabel}
        </div>
      )
    case 'color':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{field.label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#018982'}
                onChange={(e) => onChange(e.target.value)}
                style={{ width: 48, height: 36, border: '1px solid var(--border-subtle)', borderRadius: 6, padding: 0, background: 'transparent' }}
              />
              <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="#RRGGBB"
                error={error}
              />
            </div>
          </label>
          {sharedLabel}
          {description}
        </div>
      )
    case 'url':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Input
            label={field.label}
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="/icons/... ou https://..."
            help={field.description}
            error={error}
          />
          {value && /\.(png|jpg|jpeg|svg|webp)(\?|$)/i.test(value) && (
            <img
              src={value}
              alt=""
              style={{ maxWidth: 80, maxHeight: 80, border: '1px solid var(--border-subtle)', borderRadius: 4, padding: 4 }}
              onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
            />
          )}
          {sharedLabel}
        </div>
      )
    case 'number':
      return (
        <Input
          label={field.label}
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          suffix={field.unit}
          help={field.description}
          error={error}
          min={field.min}
          max={field.max}
        />
      )
    case 'textarea':
      return (
        <Textarea
          label={field.label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          help={field.description}
          error={error}
        />
      )
    case 'json':
      return (
        <Textarea
          label={field.label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={6}
          placeholder='{ "foo": 1 }'
          help={field.description ?? 'Format JSON valide requis.'}
          error={error}
        />
      )
    case 'string-array':
      return (
        <Textarea
          label={field.label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          placeholder="Valeur1, Valeur2, Valeur3"
          help={field.description ?? 'Séparer les valeurs par une virgule ou un retour à la ligne.'}
          error={error}
        />
      )
    case 'text':
    default:
      return (
        <Input
          label={field.label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          help={field.description}
          error={error}
        />
      )
  }
}

/** Formulaire d'une section (collapsible). */
interface SectionFormProps {
  section: SectionDef
  values: Record<string, string>
  original: Record<string, string>
  errors: Record<string, string>
  onChange: (key: string, raw: string) => void
  onSave: (section: SectionDef) => void
  saving: boolean
  open: boolean
  onToggle: () => void
}

function SectionForm({
  section,
  values,
  original,
  errors,
  onChange,
  onSave,
  saving,
  open,
  onToggle,
}: SectionFormProps) {
  // Détecte les champs modifiés pour l'indicateur et le bouton « Enregistrer ».
  const dirtyCount = section.fields.reduce((acc, f) => (values[f.key] !== original[f.key] ? acc + 1 : acc), 0)

  return (
    <Panel
      title={
        <button
          type="button"
          onClick={onToggle}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'transparent',
            border: 0,
            padding: 0,
            cursor: 'pointer',
            width: '100%',
            textAlign: 'left',
          }}
        >
          <Icon name={section.icon} />
          <span style={{ flex: 1 }}>
            <span style={{ fontWeight: 600 }}>{section.title}</span>
            {section.subtitle && (
              <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>
                {section.subtitle}
              </span>
            )}
          </span>
          {dirtyCount > 0 && (
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 'var(--radius-pill)',
                background: 'var(--color-warning-soft)',
                color: 'var(--color-warning)',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {dirtyCount} modifié{dirtyCount > 1 ? 's' : ''}
            </span>
          )}
          <Icon name={open ? 'expand_less' : 'expand_more'} />
        </button>
      }
    >
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {section.fields.map((field) => (
            <FieldInput
              key={field.key}
              field={field}
              value={values[field.key] ?? ''}
              error={errors[field.key]}
              onChange={(next) => onChange(field.key, next)}
            />
          ))}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Button
              icon="save"
              loading={saving}
              disabled={dirtyCount === 0}
              onClick={() => onSave(section)}
            >
              Enregistrer ({dirtyCount})
            </Button>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Les changements s'appliquent immédiatement (cache invalidé).
            </span>
          </div>
        </div>
      )}
    </Panel>
  )
}

/** Onglet "Clés brutes" pour les clés orphelines (en DB mais pas dans le
 *  schéma) ou pour l'édition JSON directe. */
function RawKeysPanel({
  keys,
  onDelete,
}: {
  keys: SystemConfigKey[]
  onDelete: (key: string) => void
}) {
  const orphans = keys.filter((k) => !SCHEMA_KEYS.has(k.key))
  if (orphans.length === 0) {
    return (
      <Panel title="Clés orphelines">
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          Toutes les clés en base sont référencées par le schéma UI.
        </p>
      </Panel>
    )
  }
  return (
    <Panel title={`Clés orphelines (${orphans.length})`}>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 16px' }}>
        Clés présentes en base mais non référencées par le schéma. Utile pour les clés
        expérimentales ou les anciennes versions. Éditer via l'API directe ou supprimer.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {orphans.map((k) => (
          <div
            key={k.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '8px 12px',
              border: '1px solid var(--border-subtle)',
              borderRadius: 6,
            }}
          >
            <code style={{ flex: 1, fontSize: 12 }}>{k.key}</code>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {JSON.stringify(k.value)}
            </span>
            <Button
              variant="ghost"
              icon="delete"
              onClick={() => {
                if (confirm(`Supprimer définitivement la clé « ${k.key} » ?`)) onDelete(k.key)
              }}
            >
              Supprimer
            </Button>
          </div>
        ))}
      </div>
    </Panel>
  )
}

export function SystemConfigPage() {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['super-admin', 'system-config'],
    queryFn: getSystemConfig,
    staleTime: 0,
  })

  // État formulaire : valeur courante par clé + valeurs initiales (pour détecter le "dirty").
  const [values, setValues] = useState<Record<string, string>>({})
  const [original, setOriginal] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ auth: true })
  const [saving, setSaving] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastMsg>(null)

  // Dès que la query a chargé, initialise les formulaires avec les valeurs DB.
  useEffect(() => {
    if (!query.data) return
    const byKey: Record<string, SystemConfigKey> = Object.fromEntries(
      query.data.keys.map((k) => [k.key, k]),
    )
    const next: Record<string, string> = {}
    for (const section of SYSTEM_CONFIG_SECTIONS) {
      for (const field of section.fields) {
        const row = byKey[field.key]
        next[field.key] = row ? stringifyFieldValue(field, row.value) : ''
      }
    }
    setValues(next)
    setOriginal(next)
    setErrors({})
  }, [query.data])

  const handleChange = (key: string, raw: string) => {
    setValues((v) => ({ ...v, [key]: raw }))
    // Nettoie l'erreur dès que l'utilisateur modifie.
    setErrors((e) => {
      if (!e[key]) return e
      const copy = { ...e }
      delete copy[key]
      return copy
    })
  }

  const toggleSection = (id: string) => {
    setOpenSections((s) => ({ ...s, [id]: !s[id] }))
  }

  const handleSave = async (section: SectionDef) => {
    // Pour chaque champ modifié : parse la valeur. On agrège les erreurs
    // avant d'envoyer pour éviter un aller-retour API en cas d'erreur
    // locale (JSON mal formé, couleur invalide, …).
    const updates: { key: string; value: unknown }[] = []
    const localErrors: Record<string, string> = {}
    for (const field of section.fields) {
      const current = values[field.key] ?? ''
      const before = original[field.key] ?? ''
      if (current === before) continue
      try {
        const parsed = parseFieldInput(field, current)
        updates.push({ key: field.key, value: parsed })
      } catch (err) {
        localErrors[field.key] = err instanceof Error ? err.message : 'Valeur invalide'
      }
    }
    if (Object.keys(localErrors).length > 0) {
      setErrors((e) => ({ ...e, ...localErrors }))
      setToast({ tone: 'error', text: 'Certains champs sont invalides.' })
      return
    }
    if (updates.length === 0) {
      setToast({ tone: 'info', text: 'Aucun changement à enregistrer.' })
      return
    }

    setSaving(section.id)
    try {
      const result = await batchUpdateSystemConfig(updates)
      // Met à jour les "originaux" avec les nouvelles valeurs envoyées.
      setOriginal((o) => {
        const next = { ...o }
        for (const u of updates) next[u.key] = values[u.key] ?? ''
        return next
      })
      // Invalide /public/config pour que les hooks consommateurs (useBranding,
      // useTimings, useLimits, useSupportContact, …) refetchent les nouvelles
      // valeurs immédiatement. La query admin est également reseed pour
      // refléter le `updatedAt`.
      await queryClient.invalidateQueries({ queryKey: ['public', 'config'] })
      await queryClient.invalidateQueries({ queryKey: ['super-admin', 'system-config'] })
      setToast({
        tone: 'success',
        text:
          result.cacheInvalidatedGroups.length > 0
            ? `${result.count} clé(s) enregistrée(s) — caches ${result.cacheInvalidatedGroups.join(', ')} invalidés.`
            : `${result.count} clé(s) enregistrée(s).`,
      })
    } catch (err) {
      setToast({
        tone: 'error',
        text: err instanceof ApiError ? err.message : 'Échec de l\'enregistrement.',
      })
    } finally {
      setSaving(null)
    }
  }

  const handleDelete = async (key: string) => {
    try {
      await deleteSystemConfigKey(key)
      await queryClient.invalidateQueries({ queryKey: ['public', 'config'] })
      await queryClient.invalidateQueries({ queryKey: ['super-admin', 'system-config'] })
      setToast({ tone: 'success', text: `Clé « ${key} » supprimée.` })
    } catch (err) {
      setToast({
        tone: 'error',
        text: err instanceof ApiError ? err.message : 'Échec de la suppression.',
      })
    }
  }

  // Résumé du nombre de clés modifiées global (pour un indicateur header).
  const totalDirty = useMemo(() => {
    let count = 0
    for (const key of Object.keys(values)) {
      if (values[key] !== original[key]) count += 1
    }
    return count
  }, [values, original])

  return (
    <div className="cm-detail-page" style={{ maxWidth: 1040 }}>
      <div className="cm-page-head">
        <div className="cm-page-head-body">
          <h1>Configuration système</h1>
          <p className="cm-page-head-sub">
            Édition en runtime de toutes les clés `SystemConfig` (branding, timings, limites,
            commission, support, légal…). Les changements prennent effet immédiatement grâce à
            l'invalidation automatique des caches mémoire.
            {totalDirty > 0 && (
              <span style={{ marginLeft: 8, color: 'var(--color-warning)', fontWeight: 600 }}>
                — {totalDirty} modification{totalDirty > 1 ? 's' : ''} non enregistrée{totalDirty > 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
      </div>

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {SYSTEM_CONFIG_SECTIONS.map((section) => (
            <SectionForm
              key={section.id}
              section={section}
              values={values}
              original={original}
              errors={errors}
              onChange={handleChange}
              onSave={handleSave}
              saving={saving === section.id}
              open={openSections[section.id] ?? false}
              onToggle={() => toggleSection(section.id)}
            />
          ))}
          {query.data && <RawKeysPanel keys={query.data.keys} onDelete={handleDelete} />}
        </div>
      </QueryState>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
          <Toast tone={toast.tone} message={toast.text} />
        </div>
      )}
    </div>
  )
}
