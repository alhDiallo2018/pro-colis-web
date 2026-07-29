import { useAuthStore } from '@/store/auth'
import { AdminSupportScreen } from './AdminSupportScreen'
import { MessagesScreen } from './MessagesScreen'

/**
 * Les agents spécialisés répondent avec leur propre compte via les routes
 * génériques /messages. Le compte support historique garde la boîte agrégée.
 */
export function SupportConversationsScreen() {
  const role = useAuthStore((state) => state.user?.role)
  const usesPersonalInbox = role === 'support_technique' || role === 'support_commercial'
  return usesPersonalInbox ? <MessagesScreen /> : <AdminSupportScreen />
}
