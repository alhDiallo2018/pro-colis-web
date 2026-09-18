/**
 * Miroir UX de la validation backend des libellés de zone. Le serveur reste la
 * source de vérité ; ce contrôle évite seulement une requête vouée à l'échec
 * lorsque la géolocalisation ne fournit qu'un texte générique ou des coordonnées.
 */
export function isMeaningfulLocationLabel(value: string | null | undefined): boolean {
  const label = value?.trim()
  if (!label) return false

  const normalized = label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  if (['ma position', 'position actuelle', 'current location'].includes(normalized)) return false

  return !/^[-+]?\d{1,3}(?:[.,]\d+)?\s*[,;]\s*[-+]?\d{1,3}(?:[.,]\d+)?$/.test(label)
}
