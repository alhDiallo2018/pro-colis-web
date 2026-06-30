import { useCurrentUser } from './useAuth'

/**
 * Revalidates the persisted session against `GET /auth/me` on app start.
 * Renders nothing; a 401 triggers the client's refresh/clear logic.
 */
export function SessionBootstrap() {
  useCurrentUser()
  return null
}
