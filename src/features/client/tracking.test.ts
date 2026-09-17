import { describe, expect, it } from 'vitest'
import type { Parcel } from '@/lib/api/types'
import { getDriverLocationState, hasAssignedDriver, STALE_AFTER_MS } from './tracking'

const NOW = new Date('2026-09-11T12:00:00Z').getTime()

function parcel(overrides: Partial<Parcel> = {}): Parcel {
  return {
    id: 'p1',
    trackingNumber: 'PC-TEST-0001',
    status: 'in_transit',
    senderName: 'Sender',
    senderPhone: '+221700000000',
    receiverName: 'Receiver',
    receiverPhone: '+221700000001',
    driverId: 'd1',
    ...overrides,
  }
}

describe('hasAssignedDriver', () => {
  it('detects a driver from driverId or assignedDriverId', () => {
    expect(hasAssignedDriver(parcel({ driverId: 'd1' }))).toBe(true)
    expect(hasAssignedDriver(parcel({ driverId: null, assignedDriverId: 'd2' }))).toBe(true)
    expect(hasAssignedDriver(parcel({ driverId: null, assignedDriverId: null }))).toBe(false)
  })
})

describe('getDriverLocationState', () => {
  it('returns finished for delivered or cancelled parcels', () => {
    expect(getDriverLocationState(parcel({ status: 'delivered' }), NOW).kind).toBe('finished')
    expect(getDriverLocationState(parcel({ status: 'cancelled' }), NOW).kind).toBe('finished')
  })

  it('returns unavailable when no driver is assigned', () => {
    expect(getDriverLocationState(parcel({ driverId: null, status: 'pending' }), NOW).kind).toBe('unavailable')
  })

  it('returns waiting when a driver is assigned but no position is available', () => {
    expect(getDriverLocationState(parcel({ driverId: 'd1', driverLocation: null }), NOW).kind).toBe('waiting')
    expect(
      getDriverLocationState(parcel({ driverId: 'd1', driverLocation: { available: false } }), NOW).kind,
    ).toBe('waiting')
    expect(
      getDriverLocationState(parcel({ driverId: 'd1', driverLocation: { available: true, latitude: null, longitude: null } }), NOW)
        .kind,
    ).toBe('waiting')
  })

  it('returns active for a fresh position', () => {
    const updatedAt = new Date(NOW - 30_000).toISOString()
    const state = getDriverLocationState(
      parcel({ driverLocation: { available: true, latitude: 14.7, longitude: -17.4, updatedAt } }),
      NOW,
    )
    expect(state.kind).toBe('active')
    if (state.kind === 'active') expect(state.location.updatedAt).toBe(updatedAt)
  })

  it('returns stale for a position older than the threshold', () => {
    const updatedAt = new Date(NOW - STALE_AFTER_MS - 60_000).toISOString()
    const state = getDriverLocationState(
      parcel({ driverLocation: { available: true, latitude: 14.7, longitude: -17.4, updatedAt } }),
      NOW,
    )
    expect(state.kind).toBe('stale')
  })

  it('never treats a missing updatedAt as stale', () => {
    const state = getDriverLocationState(
      parcel({ driverLocation: { available: true, latitude: 14.7, longitude: -17.4 } }),
      NOW,
    )
    expect(state.kind).toBe('active')
  })
})
