import { useId, useState } from 'react'
import type { ChangeEvent, CSSProperties, ReactNode, SelectHTMLAttributes } from 'react'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'style'> {
  label?: ReactNode
  value?: string
  onChange?: (e: ChangeEvent<HTMLSelectElement>) => void
  options?: (SelectOption | string)[]
  placeholder?: string
  icon?: string
  error?: ReactNode
  disabled?: boolean
  id?: string
  /** Applied to the field wrapper (layout), not the `<select>` itself. */
  className?: string
  style?: CSSProperties
}

/** Native select styled to match SendProcolis inputs. */
export function Select({
  label,
  value,
  onChange,
  options = [],
  placeholder,
  icon,
  error,
  disabled = false,
  id,
  className,
  style,
  ...rest
}: SelectProps) {
  const [focus, setFocus] = useState(false)
  const autoId = useId()
  const fid = id || autoId
  const borderColor = error ? 'var(--color-danger)' : focus ? 'var(--border-focus)' : 'var(--border-default)'
  const norm: SelectOption[] = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o))
  return (
    // `minWidth: 0` — a native select is as wide as its widest option unless
    // its container is allowed to shrink, which blows out narrow form rows.
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, ...style }}>
      {label && (
        <label htmlFor={fid} style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: 'var(--text-body)' }}>
          {label}
        </label>
      )}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          minWidth: 0,
          height: 48,
          padding: '0 14px',
          background: disabled ? 'var(--surface-sunken)' : 'var(--surface-card)',
          border: `1px solid ${borderColor}`,
          borderRadius: 'var(--radius-md)',
          boxShadow: focus && !error ? 'var(--ring-focus)' : 'none',
          transition: 'border-color var(--dur-fast), box-shadow var(--dur-fast)',
        }}
      >
        {icon && (
          <span className="material-symbols-rounded" style={{ flex: 'none', fontSize: 20, color: focus ? 'var(--color-primary)' : 'var(--text-faint)' }}>
            {icon}
          </span>
        )}
        <select
          id={fid}
          value={value}
          onChange={onChange}
          disabled={disabled}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            flex: 1,
            minWidth: 0,
            appearance: 'none',
            WebkitAppearance: 'none',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontFamily: 'var(--font-body)',
            fontWeight: 500,
            fontSize: 15,
            color: value ? 'var(--text-strong)' : 'var(--text-faint)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            textOverflow: 'ellipsis',
          }}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {norm.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="material-symbols-rounded" style={{ flex: 'none', fontSize: 22, color: 'var(--text-muted)', pointerEvents: 'none' }}>
          expand_more
        </span>
      </div>
      {error && <span style={{ fontSize: 12, color: 'var(--color-danger)', overflowWrap: 'anywhere' }}>{error}</span>}
    </div>
  )
}
