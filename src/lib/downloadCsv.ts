/**
 * Conversion d'un jeu d'enregistrements en CSV, puis téléchargement navigateur.
 *
 * Les exports métier de l'API renvoient du JSON : la mise en forme tabulaire se
 * fait ici, ce qui évite un second endpoint et garde les colonnes alignées sur
 * ce que l'écran affiche réellement.
 */

/** Aplati les valeurs imbriquées : un objet devient sa forme JSON compacte. */
function cellValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/** Échappe selon RFC 4180 : guillemets doublés, champ cité si besoin. */
function escapeCell(raw: string): string {
  if (!/[",\n\r;]/.test(raw)) return raw
  return `"${raw.replace(/"/g, '""')}"`
}

export function toCsv(rows: Record<string, unknown>[], columns?: string[]): string {
  if (rows.length === 0) return ''
  // Sans liste explicite, on prend l'union des clés : deux enregistrements de
  // l'API peuvent ne pas porter exactement les mêmes champs optionnels.
  const headers = columns ?? [...new Set(rows.flatMap((row) => Object.keys(row)))]
  const lines = [headers.map(escapeCell).join(',')]
  for (const row of rows) {
    lines.push(headers.map((header) => escapeCell(cellValue(row[header]))).join(','))
  }
  return lines.join('\r\n')
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[], columns?: string[]): void {
  // Le BOM force Excel à lire l'UTF-8 : sans lui les accents sortent cassés.
  const blob = new Blob([`﻿${toCsv(rows, columns)}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/** Horodatage compact utilisable dans un nom de fichier. */
export function fileStamp(date = new Date()): string {
  return date.toISOString().slice(0, 19).replace(/[:]/g, '-')
}
