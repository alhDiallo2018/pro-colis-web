import { describe, it, expect } from 'vitest'
import { departures, freshJourney, type LiveJourney } from './domain'
describe('planning et positions web', () => {
  it('prépare 50 départs alternés distincts sans raccourcir les durées', () => {
    const rows = departures('2030-01-01T08:00:00Z', 50, 75, 60, false, true)
    expect(rows).toHaveLength(50)
    expect(new Set(rows.map((r) => r.departureAt)).size).toBe(50)
    expect(rows[1].reverse).toBe(true)
    expect(rows[49].departureAt).toBe('2030-01-03T21:15:00.000Z')
  })
  it('refuse un chevauchement et les séries hors limites', () => {
    expect(() => departures('2030-01-01', 50, 30, 60, false, false)).toThrow()
    expect(() => departures('2030-01-01', 101, 60, 60, false, false)).toThrow()
    expect(() => departures('incorrect', 2, 60, 60, false, false)).toThrow()
  })
  it('ne considère jamais une position périmée ou impossible comme réelle', () => {
    const now = Date.now(),
      row = {
        position: {
          latitude: 14.7,
          longitude: -17.4,
          capturedAt: new Date(now - 5000).toISOString(),
          expiresAt: new Date(now + 55000).toISOString(),
        },
      } as LiveJourney
    expect(freshJourney(row, now)).toBe(true)
    expect(freshJourney(row, now + 60000)).toBe(false)
    expect(freshJourney({ ...row, position: { ...row.position, latitude: 91 } }, now)).toBe(false)
  })
})
