import { useState, useRef, useEffect, useMemo } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Icon } from '@/ds'
import type { Garage } from '@/lib/api/types'

export interface GarageSearchSelectProps {
  label?: ReactNode
  icon?: string
  placeholder?: string
  garages: Garage[]
  value?: string
  onChange: (garageId: string) => void
  error?: string
  disabled?: boolean
  required?: boolean
  style?: CSSProperties
}

export function GarageSearchSelect({
  label,
  icon = 'garage',
  placeholder = 'Rechercher une zone...',
  garages,
  value = '',
  onChange,
  error,
  disabled = false,
  required = false,
  style,
}: GarageSearchSelectProps) {
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

  const selected = useMemo(
    () => garages.find((g) => g.id === value),
    [garages, value],
  )

  const filtered = useMemo(() => {
    if (!query) return garages
    const q = query.toLowerCase()
    return garages.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        (g.city ?? '').toLowerCase().includes(q) ||
        (g.region ?? '').toLowerCase().includes(q) ||
        (g.address ?? '').toLowerCase().includes(q),
    )
  }, [garages, query])

  const grouped = useMemo(() => {
    const map = new Map<string, Garage[]>()
    for (const g of filtered) {
      const city = g.city || 'Autre'
      const list = map.get(city) || []
      list.push(g)
      map.set(city, list)
    }
    return Array.from(map.entries())
  }, [filtered])

  const borderColor = error
    ? 'var(--color-danger)'
    : open
      ? 'var(--border-focus)'
      : 'var(--border-default)'

  const handleSelect = (garageId: string) => {
    onChange(garageId)
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
        {icon && (
          <span className="material-symbols-rounded" style={{ fontSize: 20, color: open ? 'var(--color-primary)' : 'var(--text-faint)' }}>
            {icon}
          </span>
        )}

        {open ? (
          <input
            ref={inputRef}
            type="text"
            placeholder="Tapez une ville ou zone..."
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
              color: selected ? 'var(--text-strong)' : 'var(--text-faint)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {selected ? `${selected.name} — ${selected.city ?? ''}` : placeholder}
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
            maxHeight: 300,
            overflowY: 'auto',
          }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center' }}>
              <Icon name="search_off" size={28} style={{ color: 'var(--text-faint)', marginBottom: 8 }} />
              <p style={{ margin: 0, fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>Aucune zone trouvée pour "{query}"</p>
            </div>
          ) : grouped.length === 1 ? (
            filtered.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => handleSelect(g.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  borderBottom: '1px solid var(--border-subtle)',
                  background: g.id === value ? 'var(--surface-sunken)' : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-sunken)' }}
                onMouseLeave={(e) => { if (g.id !== value) e.currentTarget.style.background = 'transparent' }}
              >
                <Icon name="garage" size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--text-strong)' }}>{g.name}</div>
                  {(g.city || g.region) && (
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                      {[g.city, g.region].filter(Boolean).join(', ')}
                      {g.address ? ` · ${g.address}` : ''}
                    </div>
                  )}
                </div>
              </button>
            ))
          ) : (
            grouped.map(([city, list]) => (
              <div key={city}>
                <div style={{ padding: '8px 16px', fontSize: 'var(--fs-xs)', fontWeight: 600, color: 'var(--color-primary)', background: 'var(--surface-sunken)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {city}
                </div>
                {list.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => handleSelect(g.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      width: '100%',
                      padding: '10px 16px 10px 28px',
                      border: 'none',
                      borderBottom: '1px solid var(--border-subtle)',
                      background: g.id === value ? 'var(--surface-sunken)' : 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-sunken)' }}
                    onMouseLeave={(e) => { if (g.id !== value) e.currentTarget.style.background = 'transparent' }}
                  >
                    <Icon name="garage" size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--text-strong)' }}>{g.name}</div>
                      {g.address && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{g.address}</div>}
                    </div>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
