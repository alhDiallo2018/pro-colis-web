import { describe, expect, it } from 'vitest'
import { formatFcfa, formatPoints, toStatusKey } from './format'

describe('format helpers', () => {
  it('formats FCFA with grouped thousands and currency suffix', () => {
    // Uses a narrow no-break space as the fr-FR group separator.
    expect(formatFcfa(12500).replace(/ | /g, ' ')).toBe('12 500 FCFA')
    expect(formatFcfa(null)).toBe('—')
  })

  it('formats points with a sign', () => {
    expect(formatPoints(150)).toBe('+150 pts')
    expect(formatPoints(-50)).toBe('-50 pts')
  })

  it('maps API parcel statuses to design-system status keys', () => {
    expect(toStatusKey('picked_up')).toBe('pickup')
    expect(toStatusKey('in_transit')).toBe('transit')
    expect(toStatusKey('out_for_delivery')).toBe('delivering')
    expect(toStatusKey('delivered')).toBe('delivered')
    expect(toStatusKey(undefined)).toBe('pending')
    expect(toStatusKey('unknown_value')).toBe('pending')
  })
})
