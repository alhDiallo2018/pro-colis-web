import { Link } from 'react-router-dom'
import { Icon } from '@/ds'
import { useAuthStore } from '@/store/auth'
import { homeForRole } from '@/routes/paths'
import { SupportChatScreen } from './SupportChatScreen'

export function SupportChatWrapper() {
  const user = useAuthStore((s) => s.user)
  const home = homeForRole(user?.role)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--surface-page)' }}>
      <div style={{ flex: 'none', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-card)', borderBottom: '1px solid var(--border-subtle)' }}>
        <Link to={home} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', textDecoration: 'none', fontSize: 'var(--fs-sm)', fontWeight: 600 }}>
          <Icon name="arrow_back" size={18} />
          Retour
        </Link>
      </div>
      <div style={{ flex: 1, minHeight: 0, maxWidth: 680, width: '100%', margin: '0 auto' }}>
        <SupportChatScreen />
      </div>
    </div>
  )
}
