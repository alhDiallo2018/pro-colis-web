import { useEffect, useState } from 'react'

/**
 * Retarde la propagation d'une valeur qui change à chaque frappe.
 * Utilisé pour les champs de recherche adossés à une requête serveur : sans
 * cela, chaque caractère déclenche un appel.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
