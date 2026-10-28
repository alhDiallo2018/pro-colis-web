import { useEffect, useRef, type RefObject } from 'react'

// Une pile évite que deux fenêtres imbriquées capturent Tab/Échap ensemble.
const layers: HTMLElement[] = []
let savedOverflow = ''
const focusable = 'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'

export function useModalFocus(active: boolean, ref: RefObject<HTMLElement | null>, onClose?: () => void) {
  const close = useRef(onClose)
  useEffect(() => { close.current = onClose }, [onClose])
  useEffect(() => {
    const root = ref.current
    if (!active || !root) return
    const previous = document.activeElement as HTMLElement | null
    if (layers.length === 0) {
      savedOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }
    layers.push(root)
    // Le conteneur reçoit le focus sans ouvrir le clavier du téléphone.
    root.focus({ preventScroll: true })
    const onKeyDown = (event: KeyboardEvent) => {
      if (layers.at(-1) !== root) return
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        close.current?.()
      }
      if (event.key !== 'Tab') return
      const targets = [...root.querySelectorAll<HTMLElement>(focusable)].filter(
        element => !element.closest('[hidden], [inert], [aria-hidden="true"]') && getComputedStyle(element).display !== 'none' && getComputedStyle(element).visibility !== 'hidden',
      )
      const first = targets[0]
      const last = targets.at(-1)
      if (!first) { event.preventDefault(); root.focus(); return }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === root || !root.contains(document.activeElement))) {
        event.preventDefault(); last?.focus()
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === root || !root.contains(document.activeElement))) {
        event.preventDefault(); first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      const wasTop = layers.at(-1) === root
      layers.splice(layers.indexOf(root), 1)
      if (layers.length === 0) document.body.style.overflow = savedOverflow
      if (wasTop && previous?.isConnected) previous.focus({ preventScroll: true })
    }
  }, [active, ref])
}
