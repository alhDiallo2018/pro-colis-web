import { useId } from 'react'
import type { CSSProperties, ReactNode } from 'react'

export interface SwitchProps {
  checked?: boolean
  onChange?: (checked: boolean) => void
  label?: ReactNode
  description?: ReactNode
  disabled?: boolean
  id?: string
  style?: CSSProperties
}

/** Switch toggle (assurance, urgence, disponibilité chauffeur). */
export function Switch({ checked = false, onChange, label, description, disabled = false, id, style }: SwitchProps) {
  const autoId = useId()
  const fid = id || autoId
  return (
    <label
      htmlFor={fid}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      <button
        id={fid}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange && onChange(!checked)}
        style={{
          position: 'relative',
          width: 46,
          height: 28,
          flex: 'none',
          padding: 0,
          background: checked ? 'var(--color-primary)' : 'var(--slate-300)',
          border: 'none',
          borderRadius: 'var(--radius-pill)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'background var(--dur-base) var(--ease-standard)',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 3,
            left: checked ? 21 : 3,
            width: 22,
            height: 22,
            background: '#fff',
            borderRadius: '50%',
            boxShadow: 'var(--shadow-sm)',
            transition: 'left var(--dur-base) var(--ease-standard)',
          }}
        />
      </button>
      {(label || description) && (
        <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {label && (
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, color: 'var(--text-strong)' }}>{label}</span>
          )}
          {description && <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{description}</span>}
        </span>
      )}
    </label>
  )
}
