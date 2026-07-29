import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import type { Role } from '@/lib/api/types'
import { homeForRole } from './paths'

/** Require an authenticated session; otherwise send to login. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { accessToken, hydrated } = useAuthStore()
  const location = useLocation()
  if (!hydrated) return null
  if (!accessToken) return <Navigate to="/login" replace state={{ from: location }} />
  return <>{children}</>
}

/** Require one of the given roles; otherwise redirect to the user's own home. */
export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user, accessToken, hydrated } = useAuthStore()
  if (!hydrated) return null
  if (!accessToken) return <Navigate to="/login" replace />
  // Un jeton sans profil ne doit jamais suffire à afficher une zone privilégiée.
  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) return <Navigate to={homeForRole(user.role)} replace />
  return <>{children}</>
}
