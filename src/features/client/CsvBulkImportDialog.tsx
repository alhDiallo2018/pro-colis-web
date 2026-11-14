import { useRef, useState } from 'react'
import { Button, Dialog, Icon, Toast } from '@/ds'
import { ApiError } from '@/lib/api/client'
import { bulkCreate, create as createParcel, type BulkCreateRowResult, type BulkParcelPayload } from '@/lib/api/parcels'
import { queryClient } from '@/lib/queryClient'

interface ParsedRow {
  lineNumber: number
  receiverName: string
  receiverPhone: string
  description: string
  weightKg: number
  receiverAddress?: string
  parseError?: string
}

interface Outcome {
  row: ParsedRow
  success: boolean
  message?: string
}

const EXAMPLE_CSV = 'Awa Diop;770000000;Boîte de livres;2.5;Mermoz\nMoussa Sy;770000001;Pièces auto;5;Guédiawaye'

function parseCsv(contents: string): ParsedRow[] {
  const rows: ParsedRow[] = []
  const lines = contents.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]?.trim() ?? ''
    if (!raw) continue
    const lower = raw.toLowerCase()
    if (i === 0 && (lower.includes('receiver') || lower.includes('destinataire') || (lower.includes('name') && lower.includes('phone')))) {
      continue
    }
    const parts = raw.split(';').map((v) => v.trim())
    if (parts.length < 4) {
      rows.push({ lineNumber: i + 1, receiverName: '', receiverPhone: '', description: '', weightKg: 0, parseError: 'Au moins 4 colonnes attendues (nom; téléphone; description; poids).' })
      continue
    }
    const [name, phone, desc, weightRaw, addr] = parts
    const weight = Number(String(weightRaw).replace(',', '.'))
    if (!name || !phone || !desc) {
      rows.push({ lineNumber: i + 1, receiverName: name, receiverPhone: phone, description: desc, weightKg: 0, parseError: 'Un des champs obligatoires est vide.' })
      continue
    }
    if (!Number.isFinite(weight) || weight <= 0) {
      rows.push({ lineNumber: i + 1, receiverName: name, receiverPhone: phone, description: desc, weightKg: 0, parseError: 'Poids invalide (nombre > 0 attendu).' })
      continue
    }
    rows.push({
      lineNumber: i + 1,
      receiverName: name,
      receiverPhone: phone,
      description: desc,
      weightKg: weight,
      receiverAddress: addr && addr.length > 0 ? addr : undefined,
    })
  }
  return rows
}

export function CsvBulkImportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [fileName, setFileName] = useState<string | null>(null)
  const [preview, setPreview] = useState<ParsedRow[]>([])
  const [outcomes, setOutcomes] = useState<Outcome[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validRows = preview.filter((r) => !r.parseError)
  const invalidCount = preview.length - validRows.length
  const successes = outcomes.filter((o) => o.success).length
  const failures = outcomes.filter((o) => !o.success).length

  const reset = () => {
    setFileName(null)
    setPreview([])
    setOutcomes([])
    setError('')
    setNotice('')
  }

  const handleFile = async (file: File) => {
    try {
      const text = await file.text()
      const rows = parseCsv(text)
      setFileName(file.name)
      setPreview(rows)
      setOutcomes([])
      setError('')
      setNotice('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lecture impossible')
    }
  }

  const upload = async () => {
    if (validRows.length === 0 || uploading) return
    setUploading(true)
    setError('')
    const payloads: BulkParcelPayload[] = validRows.map((r) => ({
      receiverName: r.receiverName,
      receiverPhone: r.receiverPhone,
      description: r.description,
      weight: r.weightKg,
      ...(r.receiverAddress ? { receiverAddress: r.receiverAddress } : {}),
    }))

    try {
      const bulk = await bulkCreate(payloads)
      const next: Outcome[] = validRows.map((row, i) => {
        const r: BulkCreateRowResult | undefined = bulk.results[i]
        return {
          row,
          success: r?.success === true,
          message: r?.message ?? (r?.success ? 'Importé' : 'Réponse serveur incomplète'),
        }
      })
      setOutcomes(next)
      setNotice(`${bulk.createdCount} importé(s) · ${bulk.failedCount} échec(s)`)
      void queryClient.invalidateQueries({ queryKey: ['client', 'parcels'] })
    } catch (e) {
      // Fallback séquentiel si endpoint bulk absent (ancienne API)
      const next: Outcome[] = []
      const ApiErrorCtor = ApiError
      for (const row of validRows) {
        try {
          await createParcel({
            senderName: '',
            senderPhone: '',
            receiverName: row.receiverName,
            receiverPhone: row.receiverPhone,
            description: row.description,
            weight: row.weightKg,
            ...(row.receiverAddress ? { receiverAddress: row.receiverAddress } : {}),
          })
          next.push({ row, success: true })
        } catch (err) {
          const msg = err instanceof ApiErrorCtor ? err.message : err instanceof Error ? err.message : 'Échec'
          next.push({ row, success: false, message: msg })
        }
        setOutcomes([...next])
      }
      void queryClient.invalidateQueries({ queryKey: ['client', 'parcels'] })
      if (next.every((o) => !o.success)) {
        setError(e instanceof Error ? e.message : 'Import impossible')
      }
    } finally {
      setUploading(false)
    }
  }

  const copyExample = async () => {
    try {
      await navigator.clipboard.writeText(EXAMPLE_CSV)
      setNotice('Exemple copié dans le presse-papiers.')
    } catch {
      setError('Copie impossible — copiez manuellement.')
    }
  }

  if (!open) return null

  return (
    <Dialog
      open
      onClose={onClose}
      icon="upload_file"
      iconTone="primary"
      title="Import groupé CSV"
      style={{ maxWidth: 680 }}
      actions={
        <>
          <Button variant="secondary" onClick={onClose} disabled={uploading}>
            Fermer
          </Button>
          <Button icon="cloud_upload" disabled={validRows.length === 0 || uploading} loading={uploading} onClick={upload}>
            {uploading ? `Import en cours… ${outcomes.length}/${validRows.length}` : `Importer ${validRows.length} colis`}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' }}>
        <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)', margin: 0 }}>
          Chaque ligne : <code>destinataire;téléphone;description;poids(kg);adresse(optionnelle)</code>
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt,text/csv,text/plain"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleFile(file)
              e.target.value = ''
            }}
          />
          <Button variant="secondary" icon="upload_file" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {fileName ? 'Changer de fichier' : 'Choisir un fichier'}
          </Button>
          <Button variant="ghost" size="sm" icon="content_copy" onClick={copyExample}>
            Copier un exemple
          </Button>
          {preview.length > 0 && !uploading && (
            <Button variant="ghost" size="sm" icon="refresh" onClick={reset}>
              Réinitialiser
            </Button>
          )}
        </div>

        {fileName && (
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
            {fileName} · {preview.length} ligne(s) ({validRows.length} valides, {invalidCount} à corriger)
          </div>
        )}

        {error && <Toast tone="error" message={error} />}
        {notice && !error && <Toast tone="info" message={notice} />}

        <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {preview.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 28, color: 'var(--text-muted)', gap: 6 }}>
              <Icon name="description" size={32} />
              <span style={{ fontSize: 'var(--fs-sm)', textAlign: 'center' }}>
                Choisissez un fichier CSV pour prévisualiser les colis.
              </span>
            </div>
          ) : (
            preview.map((row, i) => {
              const outcome = outcomes[i]
              const state = outcome ? (outcome.success ? 'ok' : 'err') : row.parseError ? 'invalid' : 'pending'
              const bg = state === 'ok' ? 'rgba(16, 185, 129, 0.08)' : state === 'err' || state === 'invalid' ? 'rgba(239, 68, 68, 0.08)' : 'var(--surface-sunken)'
              const toneColor = state === 'ok' ? 'var(--green-700)' : state === 'err' || state === 'invalid' ? 'var(--red-600)' : 'var(--text-muted)'
              const icon = state === 'ok' ? 'check_circle' : state === 'err' || state === 'invalid' ? 'error' : 'pending'
              const label = outcome
                ? (outcome.success ? 'Importé' : outcome.message ?? 'Échec')
                : row.parseError ?? `${row.weightKg.toFixed(1)} kg`
              return (
                <div
                  key={`${row.lineNumber}-${i}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 'var(--radius-sm)', background: bg }}
                >
                  <Icon name={icon} size={18} style={{ color: toneColor }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>
                      {row.parseError ? `Ligne ${row.lineNumber}` : `${row.receiverName} · ${row.receiverPhone}`}
                    </div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: toneColor }}>{label}</div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {outcomes.length > 0 && (
          <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: failures === 0 ? 'var(--green-700)' : 'var(--text-body)' }}>
            ✓ {successes} importé{successes > 1 ? 's' : ''} · ✗ {failures} échec{failures > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </Dialog>
  )
}
