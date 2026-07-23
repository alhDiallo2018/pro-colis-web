import { useState } from 'react'
import { NegotiationChat } from '@/components/NegotiationChat'
import { Icon } from '@/ds'

const SUPPORT_USERS = {
  commercial: {
    id: import.meta.env.VITE_SUPPORT_COMMERCIAL_ID || 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    name: import.meta.env.VITE_SUPPORT_COMMERCIAL_NAME || 'Support Commercial SENDPROCOLIS',
    label: 'Commercial',
    desc: 'Aide pour les commandes, paiements, litiges',
  },
  technique: {
    id: import.meta.env.VITE_SUPPORT_TECHNIC_ID || 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e7',
    name: import.meta.env.VITE_SUPPORT_TECHNIC_NAME || 'Support Technique SENDPROCOLIS',
    label: 'Technique',
    desc: 'Problèmes techniques, bugs, application',
  },
} as const

type SupportType = keyof typeof SUPPORT_USERS

export function SupportChatScreen() {
  const [selected, setSelected] = useState<SupportType | null>(null)

  if (!selected) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Icon name="support_agent" style={{ fontSize: 48, color: 'var(--teal-500)', marginBottom: 12 }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-strong)', margin: '0 0 8px' }}>
            Support SENDPROCOLIS
          </h2>
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)', margin: 0 }}>
            Sélectionnez le type de support souhaité
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 380 }}>
          {(
            Object.entries(SUPPORT_USERS) as [SupportType, typeof SUPPORT_USERS.commercial][]
          ).map(([key, su]) => (
            <button
              key={key}
              onClick={() => setSelected(key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 18px',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface-card)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'box-shadow 0.15s, border-color 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--teal-400)'
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(13,148,136,0.12)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'var(--teal-500)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 'none',
                }}
              >
                <Icon
                  name={key === 'commercial' ? 'store' : 'build'}
                  style={{ color: '#fff', fontSize: 22 }}
                />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--fs-body)', color: 'var(--text-strong)' }}>
                  {su.name}
                </div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginTop: 2 }}>
                  {su.desc}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const su = SUPPORT_USERS[selected]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 480 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--surface-card)',
        }}
      >
        <button
          onClick={() => setSelected(null)}
          aria-label="Retour"
          style={{
            flex: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            border: 'none',
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            borderRadius: '50%',
          }}
        >
          <Icon name="arrow_back" size={20} />
        </button>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            background: 'var(--teal-500)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="support_agent" style={{ color: '#fff', fontSize: 22 }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--fs-body)', color: 'var(--text-strong)' }}>
            {su.name}
          </div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--teal-600)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--green-500)',
                display: 'inline-block',
              }}
            />
            En ligne · Réponse sous 24h
          </div>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: '8px 12px 0' }}>
        <NegotiationChat
          peerId={su.id}
          peerName={su.name}
        />
      </div>
    </div>
  )
}
