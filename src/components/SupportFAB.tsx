import { Icon } from '@/ds'

const style = {
  position: 'fixed',
  bottom: 24,
  right: 24,
  zIndex: 100,
  width: 56,
  height: 56,
  borderRadius: '50%',
  background: 'var(--teal-500)',
  color: '#fff',
  border: 'none',
  boxShadow: '0 4px 16px rgba(13,148,136,0.35)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'transform 0.2s, box-shadow 0.2s',
} as const

export function SupportFAB() {
  return (
    <a
      href="/support"
      style={{
        ...style,
        textDecoration: 'none',
      }}
      title="Chat support"
    >
      <Icon name="support_agent" style={{ fontSize: 26 }} />
    </a>
  )
}
