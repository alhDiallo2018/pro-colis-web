import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { homeForRole } from './paths'

/** Redirige une URL inconnue vers l'accueil propre au rôle connecté. */
export function RoleHomeRedirect() {
  const role = useAuthStore((state) => state.user?.role)
  return <Navigate to={homeForRole(role)} replace />
}
