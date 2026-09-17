import { describe, expect, it } from 'vitest'
import { formatFcfa, formatPoints, formatTimeAgo, toStatusKey } from './format'

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

  it('formats relative time in seconds, minutes, hours and days', () => {
    const now = new Date('2026-09-11T12:00:00Z').getTime()
    const at = (msAgo: number) => new Date(now - msAgo).toISOString()
    expect(formatTimeAgo(at(12_000), now)).toBe('il y a 12 secondes')
    expect(formatTimeAgo(at(1_000), now)).toBe('il y a 1 seconde')
    expect(formatTimeAgo(at(8 * 60_000), now)).toBe('il y a 8 minutes')
    expect(formatTimeAgo(at(2 * 3600_000), now)).toBe('il y a 2 heures')
    expect(formatTimeAgo(at(3 * 24 * 3600_000), now)).toBe('il y a 3 jours')
    expect(formatTimeAgo(null, now)).toBe('à l’instant')
  })
})
