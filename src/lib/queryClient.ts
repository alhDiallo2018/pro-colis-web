import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './api/client'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        // Never retry auth/permission errors — they won't fix themselves.
        if (error instanceof ApiError && [400, 401, 403, 404, 422].includes(error.status)) return false
        return failureCount < 2
      },
      refetchOnWindowFocus: false,
    },
  },
})
