import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { queryClient } from '@/lib/queryClient'
import { router } from '@/routes'
import { SessionBootstrap } from '@/features/auth/SessionBootstrap'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionBootstrap />
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
