import { useEffect, useMemo, useState } from 'react'
import { Button, Dialog, Input, Toast } from '@/ds'
import {
  deleteParcelTemplate,
  listParcelTemplates,
  saveParcelTemplate,
  type ParcelTemplate,
  type ParcelTemplateData,
} from '@/lib/parcelTemplateStore'
import { formatDateTime } from '@/lib/format'

interface ParcelTemplatesDialogProps {
  ownerId: string
  /** Snapshot optionnel du formulaire courant, utilisé pour « Enregistrer comme modèle ». */
  currentDraft?: ParcelTemplateData
  onClose: () => void
  onApply: (template: ParcelTemplate) => void
}

/**
 * Modale « Mes modèles » : liste les templates enregistrés localement, permet
 * de les appliquer sur le wizard en cours, d'en enregistrer un nouveau depuis
 * le brouillon et d'en supprimer. Comportement calqué sur la bottom-sheet
 * mobile `parcel_templates_sheet.dart`.
 */
export function ParcelTemplatesDialog({ ownerId, currentDraft, onClose, onApply }: ParcelTemplatesDialogProps) {
  const [templates, setTemplates] = useState<ParcelTemplate[]>([])
  const [saveName, setSaveName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setTemplates(listParcelTemplates(ownerId))
  }, [ownerId])

  const hasDraft = useMemo(() => {
    if (!currentDraft) return false
    const keys: (keyof ParcelTemplateData)[] = [
      'receiverName',
      'receiverPhone',
      'description',
      'departureZoneId',
      'arrivalZoneId',
    ]
    return keys.some((k) => {
      const value = currentDraft[k]
      return typeof value === 'string' && value.trim().length > 0
    })
  }, [currentDraft])

  const handleSave = () => {
    if (!currentDraft || !saveName.trim()) return
    setSaving(true)
    try {
      saveParcelTemplate(ownerId, { name: saveName.trim(), data: currentDraft })
      setTemplates(listParcelTemplates(ownerId))
      setSaveName('')
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Enregistrement impossible.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (id: string) => {
    deleteParcelTemplate(ownerId, id)
    setTemplates(listParcelTemplates(ownerId))
  }

  return (
    <Dialog
      open
      title="Mes modèles de colis"
      onClose={onClose}
      actions={<Button variant="ghost" onClick={onClose}>Fermer</Button>}
    >
      <div className="pc-form" style={{ gap: 14 }}>
        {hasDraft && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              padding: 12,
              background: 'var(--surface-sunken)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-strong)' }}>
              Enregistrer la saisie en cours
            </div>
            <Input
              label="Nom du modèle"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Ex : courses hebdo clinique"
            />
            <Button
              size="sm"
              icon="save"
              loading={saving}
              disabled={!saveName.trim()}
              onClick={handleSave}
            >
              Enregistrer comme modèle
            </Button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {templates.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-muted)' }}>
              Aucun modèle enregistré. Préparez votre colis puis utilisez « Enregistrer comme modèle ».
            </p>
          ) : (
            templates.map((template) => (
              <div
                key={template.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-card)',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5, color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {template.name}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>
                    {template.data.receiverName ?? '—'}
                    {template.data.description ? ` · ${template.data.description}` : ''}
                    {template.createdAt ? ` · ${formatDateTime(template.createdAt) ?? ''}` : ''}
                  </div>
                </div>
                <Button size="sm" variant="ghost" icon="content_paste" onClick={() => onApply(template)}>
                  Appliquer
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  tone="danger"
                  icon="delete"
                  onClick={() => handleDelete(template.id)}
                  aria-label="Supprimer"
                  title="Supprimer"
                />
              </div>
            ))
          )}
        </div>

        {error && <Toast tone="error" message={error} />}

        <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text-faint)' }}>
          Les modèles restent sur cet appareil — ils ne sont ni partagés avec d'autres navigateurs
          ni synchronisés avec l'application mobile.
        </p>
      </div>
    </Dialog>
  )
}
