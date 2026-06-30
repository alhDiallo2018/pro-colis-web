import { useMutation, useQuery } from '@tanstack/react-query'
import { loginWithPin, me, register, type LoginPayload, type RegisterPayload } from '@/lib/api/auth'
import { useAuthStore } from '@/store/auth'
import { queryClient } from '@/lib/queryClient'

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
    clearSession()
    queryClient.clear()
  }
}

/** Revalidate the current session against the API (and refresh the cached user). */
export function useCurrentUser() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const setUser = useAuthStore((s) => s.setUser)
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const user = await me()
      setUser(user)
      return user
    },
    enabled: !!accessToken,
  })
}
