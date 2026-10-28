import type { ShipmentDraft } from './api'

// Format volontairement simple et borné : une ligne = un destinataire. Les
// zones et le prix restent à relire dans le parcours normal avant publication.
export function parseShipmentLines(text: string): ShipmentDraft[] {
  const lines = text.split(/\r?\n/).map(v => v.trim()).filter(Boolean)
  if (!lines.length || lines.length > 50) throw new Error('Ajoutez entre 1 et 50 lignes.')
  return lines.map((line, index) => {
    const fields = line.split(';').map(v => v.trim())
    const [receiverName, receiverPhone, description, rawWeight] = fields
    const weight = Number(rawWeight?.replace(',', '.'))
    if (fields.length !== 4 || !receiverName || !receiverPhone || !description || !Number.isFinite(weight) || weight <= 0) throw new Error(`Ligne ${index + 1} : indiquez nom ; téléphone ; description ; poids en kg.`)
    return { id: crypto.randomUUID(), label: receiverName, data: { receiverName, receiverPhone, description, weight } }
  })
}
