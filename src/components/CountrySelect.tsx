import { useState, useRef, useEffect, useMemo } from 'react'
import type { CSSProperties } from 'react'
import { Icon } from '@/ds'
import { ALL_COUNTRIES } from './CountryCodePicker'

export interface CountrySelectProps {
  label?: string
  placeholder?: string
  value?: string
  onChange: (countryName: string) => void
  error?: string
  disabled?: boolean
  required?: boolean
  style?: CSSProperties
}

/** Sélecteur de pays (tous les pays du monde) avec recherche — renvoie le nom du pays. */
export function CountrySelect({
  label,
  placeholder = 'Rechercher un pays...',
  value = '',
  onChange,
  error,
  disabled = false,
  required = false,
  style,
}: CountrySelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  const sorted = useMemo(
    () => [...ALL_COUNTRIES].sort((a, b) => a.name.localeCompare(b.name, 'fr')),
    [],
  )

  const selected = useMemo(
    () => sorted.find((c) => c.name.toLowerCase() === value.toLowerCase()),
    [sorted, value],
  )

  const filtered = useMemo(() => {
    if (!query.trim()) return sorted
    const q = query.toLowerCase()
    return sorted.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q)
  }, [sorted, query])

  const borderColor = error
    ? 'var(--color-danger)'
    : open
      ? 'var(--border-focus)'
      : 'var(--border-default)'

  const handleSelect = (name: string) => {
    onChange(name)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative', ...style }}>
      {label && (
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: 'var(--text-body)', marginBottom: 6 }}>
          {label} {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
        </div>
      )}

      <div
        onClick={() => { if (!disabled) { setOpen(!open); setTimeout(() => inputRef.current?.focus(), 50) } }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          height: 48,
          padding: '0 14px',
          background: disabled ? 'var(--surface-sunken)' : 'var(--surface-card)',
          border: `1px solid ${borderColor}`,
          borderRadius: 'var(--radius-md)',
          boxShadow: open && !error ? 'var(--ring-focus)' : 'none',
          transition: 'border-color var(--dur-fast), box-shadow var(--dur-fast)',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        {selected ? (
          <span style={{ fontSize: 18 }}>{selected.flag}</span>
        ) : (
          <span className="material-symbols-rounded" style={{ fontSize: 20, color: open ? 'var(--color-primary)' : 'var(--text-faint)' }}>
            public
          </span>
        )}

        {open ? (
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
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
        ) : (
          <span
            style={{
              flex: 1,
              minWidth: 0,
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
              fontSize: 15,
              color: value ? 'var(--text-strong)' : 'var(--text-faint)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {value || placeholder}
          </span>
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
            maxHeight: 280,
            overflowY: 'auto',
          }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center' }}>
              <Icon name="search_off" size={28} style={{ color: 'var(--text-faint)', marginBottom: 8 }} />
              <p style={{ margin: 0, fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>Aucun pays trouvé pour "{query}"</p>
            </div>
          ) : (
            filtered.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => handleSelect(c.name)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '10px 14px',
                  border: 'none',
                  borderBottom: '1px solid var(--border-subtle)',
                  background: c.name === value ? 'var(--surface-sunken)' : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'var(--font-body)',
                  fontSize: 14.5,
                  fontWeight: c.name === value ? 700 : 500,
                  color: 'var(--text-strong)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-sunken)' }}
                onMouseLeave={(e) => { if (c.name !== value) e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ fontSize: 19, width: 26 }}>{c.flag}</span>
                <span style={{ flex: 1 }}>{c.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
