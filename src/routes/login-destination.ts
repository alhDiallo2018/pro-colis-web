import type { Role } from '@/lib/api/types'
import { homeForRole } from './paths'

/** Retrouve la page protegee demandee, sans accepter de redirection externe. */
export function loginDestination(state: unknown, role: Role): string {
  const fallback = homeForRole(role)
  if (!state || typeof state !== 'object' || !('from' in state)) return fallback
  const from = state.from
  if (!from || typeof from !== 'object' || !('pathname' in from)) return fallback
  const { pathname } = from
  if (typeof pathname !== 'string' || !pathname.startsWith('/') || pathname.startsWith('//')) return fallback
  const search = 'search' in from && typeof from.search === 'string' ? from.search : ''
  const hash = 'hash' in from && typeof from.hash === 'string' ? from.hash : ''
  const destination = pathname + search + hash
  // Les separateurs alternatifs et caracteres de controle peuvent transformer
  // un chemin local en URL externe. Les pages d'auth ne sont pas des retours.
  if (destination.includes('\\') || [...destination].some(character => character.charCodeAt(0) <= 32)
    || (search && !search.startsWith('?')) || (hash && !hash.startsWith('#'))
    || ['/login', '/register', '/pin-oublie'].includes(pathname.replace(/\/+$/, ''))) return fallback
  // Les gardes de la page cible reverifient les droits du compte reconnecte.
  return destination
}
