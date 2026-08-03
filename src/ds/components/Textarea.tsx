import { useId, useState } from 'react'
import type { ChangeEvent, CSSProperties, ReactNode, TextareaHTMLAttributes } from 'react'

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'style' | 'rows'> {
  label?: ReactNode
  value?: string
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  rows?: number
  error?: ReactNode
  help?: ReactNode
  maxLength?: number
  disabled?: boolean
  id?: string
  /** Applied to the field wrapper (layout), not the `<textarea>` itself. */
  className?: string
  style?: CSSProperties
}

/** Multi-line text area (parcel notes, offer messages). */
export function Textarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  error,
  help,
  maxLength,
  disabled = false,
  id,
  className,
  style,
  ...rest
}: TextareaProps) {
  const [focus, setFocus] = useState(false)
  const autoId = useId()
  const fid = id || autoId
  const borderColor = error ? 'var(--color-danger)' : focus ? 'var(--border-focus)' : 'var(--border-default)'
  return (
    // A textarea's intrinsic width comes from `cols` (~20 chars), so both the
    // wrapper and the control must be told to follow the container instead.
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, ...style }}>
      {label && (
        <label htmlFor={fid} style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: 'var(--text-body)' }}>
          {label}
        </label>
      )}
      <textarea
        id={fid}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          resize: 'vertical',
          width: '100%',
          minWidth: 0,
          maxWidth: '100%',
          padding: '12px 14px',
          background: disabled ? 'var(--surface-sunken)' : 'var(--surface-card)',
          border: `1px solid ${borderColor}`,
          borderRadius: 'var(--radius-md)',
          boxShadow: focus && !error ? 'var(--ring-focus)' : 'none',
          fontFamily: 'var(--font-body)',
          fontWeight: 500,
          fontSize: 15,
          lineHeight: 1.5,
          color: 'var(--text-strong)',
          outline: 'none',
          transition: 'border-color var(--dur-fast), box-shadow var(--dur-fast)',
        }}
        {...rest}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 12, color: error ? 'var(--color-danger)' : 'var(--text-muted)', minWidth: 0, overflowWrap: 'anywhere' }}>{error || help || ''}</span>
        {maxLength != null && (
          <span style={{ flex: 'none', fontSize: 12, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
            {(value || '').length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  )
}
