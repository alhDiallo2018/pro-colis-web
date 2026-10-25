import { useMutation, useQuery } from '@tanstack/react-query'
import { loginWithPin, me, register, type LoginPayload, type RegisterPayload } from '@/lib/api/auth'
import { useAuthStore } from '@/store/auth'
import { queryClient } from '@/lib/queryClient'
import { api } from '@/lib/api/client'

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession)
  return useMutation({
    mutationFn: (payload: LoginPayload) => loginWithPin(payload),
    onSuccess: (session) => setSession(session),
  })
}

export function useRegister() {
  const setSession = useAuthStore((s) => s.setSession)
  return useMutation({
    mutationFn: (payload: RegisterPayload) => register(payload),
    onSuccess: (session) => setSession(session),
  })
}

export function useLogout() {
  const clearSession = useAuthStore((s) => s.clearSession)
  return () => {
    const { refreshToken } = useAuthStore.getState()
    clearSession()
    queryClient.clear()
    if (refreshToken) {
      // La fermeture locale est immediate ; le serveur ferme toute la famille,
      // y compris si un refresh etait en vol au moment du clic.
      void api.post('/auth/logout', { refreshToken }).catch(() => {
        console.warn('Déconnexion serveur indisponible ; session locale fermée')
      })
    }
  }
}

/** Revalidate the current session against the API (and refresh the cached user). */
export function useCurrentUser() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const setUser = useAuthStore((s) => s.setUser)
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const sessionId = useAuthStore.getState().sessionId
      const user = await me()
      if (useAuthStore.getState().sessionId === sessionId && useAuthStore.getState().accessToken) setUser(user)
      return user
    },
    enabled: !!accessToken,
  })
}
