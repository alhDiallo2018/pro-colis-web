import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthSession, User } from '@/lib/api/types'
import { clearAllFormDrafts } from '@/lib/formDraft'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  /** Becomes true once the persisted state has been rehydrated. */
  hydrated: boolean
  setSession: (session: AuthSession) => void
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void
  setUser: (user: User) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      hydrated: false,
      setSession: ({ user, accessToken, refreshToken }) => set({ user, accessToken, refreshToken }),
      setTokens: ({ accessToken, refreshToken }) => set({ accessToken, refreshToken }),
      setUser: (user) => set({ user }),
      clearSession: () => {
        // Les brouillons de formulaires sont des données personnelles : on ne
        // les laisse pas derrière soi sur un poste partagé.
        clearAllFormDrafts()
        set({ user: null, accessToken: null, refreshToken: null })
      },
    }),
    {
      name: 'sendprocolis-auth',
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken, refreshToken: s.refreshToken }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true
      },
    },
  ),
)

/** Read auth state outside React (e.g. axios interceptors). */
export const authStore = {
  get: () => useAuthStore.getState(),
}
