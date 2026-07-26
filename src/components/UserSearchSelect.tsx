import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Icon } from '@/ds'
import { useAssistanceUserSearch } from '@/features/superAdmin/hooks'
import type { AssistanceUser } from '@/lib/api/assistances'

const ROLE_LABEL: Record<string, string> = {
  client: 'Client',
  driver: 'Chauffeur',
  admin: 'Admin zone',
  super_admin: 'Super admin',
  support: 'Support',
  support_technique: 'Support technique',
  support_commercial: 'Support commercial',
}

export interface UserSearchSelectProps {
  label?: ReactNode
  placeholder?: string
  value?: string | null
  /** Utilisateur déjà rattaché (édition) : évite un aller-retour pour l'afficher. */
  initialUser?: AssistanceUser | null
  onChange: (user: AssistanceUser | null) => void
  /** Rendu sous la liste : « la personne n'est pas inscrite ». */
  onNotRegistered?: () => void
  error?: string
  disabled?: boolean
  required?: boolean
  style?: CSSProperties
}

/**
 * Sélecteur d'utilisateur inscrit, recherche côté serveur (nom, téléphone,
 * e-mail). Sert au support à rattacher l'assistance au bon compte plutôt que de
 * retaper les coordonnées ; la saisie libre reste accessible via
 * `onNotRegistered` quand la personne n'a pas de compte.
 */
export function UserSearchSelect({
  label,
  placeholder = 'Rechercher un utilisateur…',
  value = null,
  initialUser = null,
  onChange,
  onNotRegistered,
  error,
  disabled = false,
  required = false,
  style,
}: UserSearchSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [picked, setPicked] = useState<AssistanceUser | null>(initialUser)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!value) setPicked(null)
    else if (initialUser && initialUser.id === value) setPicked(initialUser)
  }, [value, initialUser])

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const { data, isFetching } = useAssistanceUserSearch(debounced, open)
  const users = useMemo(() => data ?? [], [data])

  const borderColor = error
    ? 'var(--color-danger)'
    : open
      ? 'var(--border-focus)'
      : 'var(--border-default)'

  const select = (user: AssistanceUser) => {
    setPicked(user)
    onChange(user)
    setOpen(false)
    setQuery('')
  }

  const clear = () => {
    setPicked(null)
    onChange(null)
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative', ...style }}>
      {label && (
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: 'var(--text-body)', marginBottom: 6 }}>
          {label} {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
        </div>
      )}

      <div
        onClick={() => {
          if (disabled) return
          setOpen(!open)
          setTimeout(() => inputRef.current?.focus(), 50)
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          minHeight: 48,
          padding: '0 12px 0 14px',
          background: disabled ? 'var(--surface-sunken)' : 'var(--surface-card)',
          border: `1px solid ${borderColor}`,
          borderRadius: 'var(--radius-md)',
          boxShadow: open && !error ? 'var(--ring-focus)' : 'none',
          transition: 'border-color var(--dur-fast), box-shadow var(--dur-fast)',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        <span className="material-symbols-rounded" style={{ fontSize: 20, color: open ? 'var(--color-primary)' : 'var(--text-faint)' }}>
          person_search
        </span>

        {open ? (
          <input
            ref={inputRef}
            type="text"
            placeholder="Nom, téléphone ou e-mail…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            style={{
              flex: 1,
              minWidth: 0,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
              fontSize: 15,
              color: 'var(--text-strong)',
            }}
          />
        ) : picked ? (
          <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', padding: '6px 0' }}>
            <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {picked.fullName}
            </span>
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
              {[picked.phone, ROLE_LABEL[picked.role] ?? picked.role].filter(Boolean).join(' · ')}
            </span>
          </span>
        ) : (
          <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 500, color: 'var(--text-faint)' }}>{placeholder}</span>
        )}

        {picked && !open && !disabled && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); clear() }}
            aria-label="Retirer l'utilisateur"
            style={{ display: 'flex', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 20 }}>close</span>
          </button>
        )}

        <span className="material-symbols-rounded" style={{ fontSize: 22, color: 'var(--text-muted)' }}>
          {open ? 'search' : 'expand_more'}
        </span>
      </div>

      {error && <span style={{ fontSize: 12, color: 'var(--color-danger)', display: 'block', marginTop: 4 }}>{error}</span>}

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            background: 'var(--surface-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            marginTop: 4,
            maxHeight: 300,
            overflowY: 'auto',
          }}
        >
          {!debounced && (
            <div style={{ padding: '8px 16px', fontSize: 'var(--fs-xs)', fontWeight: 600, color: 'var(--color-primary)', background: 'var(--surface-sunken)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Récemment actifs
            </div>
          )}

          {isFetching && users.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>Recherche…</div>
          ) : users.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center' }}>
              <Icon name="person_off" size={26} style={{ color: 'var(--text-faint)', marginBottom: 6 }} />
              <p style={{ margin: 0, fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
                {debounced ? `Aucun compte pour « ${debounced} »` : 'Aucun utilisateur'}
              </p>
            </div>
          ) : (
            users.map((u) => (
              <UserRow key={u.id} user={u} selected={u.id === value} onSelect={select} />
            ))
          )}

          {onNotRegistered && (
            <button
              type="button"
              onClick={() => { onNotRegistered(); setOpen(false); setQuery('') }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                borderTop: '1px solid var(--border-subtle)',
                background: 'var(--teal-50)',
                cursor: 'pointer',
                textAlign: 'left',
                color: 'var(--teal-700)',
                fontFamily: 'inherit',
                fontSize: 'var(--fs-sm)',
                fontWeight: 600,
                position: 'sticky',
                bottom: 0,
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 20 }}>person_add</span>
              Cette personne n’est pas inscrite — saisir ses coordonnées
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function UserRow({
  user,
  selected,
  onSelect,
}: {
  user: AssistanceUser
  selected: boolean
  onSelect: (user: AssistanceUser) => void
}) {
  const subtitle = [user.phone, ROLE_LABEL[user.role] ?? user.role, user.city].filter(Boolean).join(' · ')
  return (
    <button
      type="button"
      onClick={() => onSelect(user)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        padding: '10px 16px',
        border: 'none',
        borderBottom: '1px solid var(--border-subtle)',
        background: selected ? 'var(--surface-sunken)' : 'transparent',
        cursor: 'pointer',
        textAlign: 'left',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-sunken)' }}
      onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = 'transparent' }}
    >
      <Icon name="account_circle" size={20} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--text-strong)' }}>{user.fullName}</div>
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{subtitle}</div>
      </div>
      {user.status === 'suspended' && (
        <span style={{ marginLeft: 'auto', fontSize: 10.5, fontWeight: 700, color: 'var(--color-danger)' }}>SUSPENDU</span>
      )}
    </button>
  )
}
