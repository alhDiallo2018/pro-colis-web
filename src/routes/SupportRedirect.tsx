import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { isSupportAccount } from '@/lib/support'

export function SupportAdminRedirect({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (isSupportAccount(user?.id)) {
    return <Navigate to="/support-admin" replace />
  }
  return <>{children}</>
}
