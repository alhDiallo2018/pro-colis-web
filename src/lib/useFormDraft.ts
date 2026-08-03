import { useCallback, useEffect, useRef, useState } from 'react'
import { clearFormDraft, loadFormDraft, saveFormDraft, type FormDraft } from './formDraft'
import { useAuthStore } from '@/store/auth'

/** Délai d'inactivité avant écriture — la frappe ne doit pas marteler le stockage. */
const SAVE_DEBOUNCE_MS = 600

interface UseFormDraftOptions<T> {
  /** Identifie le formulaire : `colis`, `annonce`… */
  slot: string
  /** Valeurs courantes à sauvegarder. */
  values: T
  /** Faux tant que le formulaire est vide : un brouillon vide n'a rien à dire. */
  hasContent: boolean
  /** Suspend la sauvegarde (envoi en cours, brouillon en attente de décision). */
  paused?: boolean
}

/**
 * Brouillon automatique d'un formulaire — pendant web de la mécanique
 * `FormDraftStore` du mobile.
 *
 * Au montage, un brouillon exploitable est exposé via `pending` sans être
 * appliqué : c'est l'utilisateur qui décide de le reprendre ou de repartir à
 * zéro. Tant qu'il n'a pas tranché, rien n'est réécrit — sinon le formulaire
 * vide affiché à l'écran écraserait le brouillon qu'on vient de lui proposer.
 */
export function useFormDraft<T>({ slot, values, hasContent, paused = false }: UseFormDraftOptions<T>) {
  const ownerId = useAuthStore((state) => state.user?.id)
  const [pending, setPending] = useState<FormDraft<T> | null>(null)
  const [resolved, setResolved] = useState(false)

  useEffect(() => {
    const draft = loadFormDraft<T>(slot, ownerId)
    setPending(draft)
    setResolved(draft == null)
  }, [slot, ownerId])

  // `values` change à chaque frappe : le garder dans une ref évite de relancer
  // l'effet de sauvegarde à chaque rendu tout en écrivant la dernière valeur.
  const latest = useRef(values)
  latest.current = values

  useEffect(() => {
    if (!resolved || paused || !hasContent) return
    const timer = window.setTimeout(() => saveFormDraft(slot, ownerId, latest.current), SAVE_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [values, resolved, paused, hasContent, slot, ownerId])

  const restore = useCallback(() => {
    const data = pending?.data ?? null
    setPending(null)
    setResolved(true)
    return data
  }, [pending])

  const discard = useCallback(() => {
    clearFormDraft(slot, ownerId)
    setPending(null)
    setResolved(true)
  }, [slot, ownerId])

  /** À appeler après un envoi réussi : la saisie n'a plus à être conservée. */
  const clear = useCallback(() => {
    clearFormDraft(slot, ownerId)
    setPending(null)
    setResolved(true)
  }, [slot, ownerId])

  return { pending, restore, discard, clear }
}
