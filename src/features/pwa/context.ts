import { createContext, useContext } from 'react'

export function isAppleMobile() {
  // iPadOS peut annoncer un Mac : les points tactiles distinguent l'iPad.
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

export const PwaContext = createContext({ installed: false, appleMobile: false })
export const usePwa = () => useContext(PwaContext)
