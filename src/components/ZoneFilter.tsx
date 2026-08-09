import { SegmentedControl } from '@/ds'
import type { ZoneFilterMode } from '@/lib/useZoneFilter'

export interface ZoneFilterProps {
  mode: ZoneFilterMode
  onChange: (mode: ZoneFilterMode) => void
  zoneName: string | null
  hasZone: boolean
  size?: 'sm' | 'md'
}

export function ZoneFilter({ mode, onChange, zoneName, hasZone, size = 'sm' }: ZoneFilterProps) {
  if (!hasZone) return null

  return (
    <SegmentedControl
      size={size}
      value={mode}
      onChange={(value) => onChange(value as ZoneFilterMode)}
      options={[
        { value: 'all', label: 'Toutes', icon: 'public' },
        { value: 'zone', label: zoneName ?? 'Ma zone', icon: 'location_on' },
      ]}
    />
  )
}
