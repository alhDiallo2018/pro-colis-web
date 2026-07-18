import { describe, expect, it } from 'vitest'
import { calculateCommission, canPayCommission, splitCommissionPayment, requiresBothWalletAndPoints } from './commission'

describe('calculateCommission', () => {
  it('default config: 1000 FCFA → 100 FCFA (min)', () => {
    const r = calculateCommission(1000)
    expect(r.commission).toBe(100)
    expect(r.netAmount).toBe(900)
  })

  it('default config: 5000 FCFA → 250 FCFA', () => {
    const r = calculateCommission(5000)
    expect(r.commission).toBe(250)
    expect(r.netAmount).toBe(4750)
    expect(r.percentage).toBe(5)
  })

  it('default config: 10000 FCFA → 500 FCFA (max)', () => {
    const r = calculateCommission(10000)
    expect(r.commission).toBe(500)
  })

  it('default config: 50000 FCFA → 500 FCFA (max)', () => {
    const r = calculateCommission(50000)
    expect(r.commission).toBe(500)
  })

  it('custom config: 10%, min 200, max 1000', () => {
    const r = calculateCommission(3000, { percentage: 10, minAmount: 200, maxAmount: 1000 })
    expect(r.commission).toBe(300)
  })

  it('returns 0 for 0 amount', () => {
    const r = calculateCommission(0)
    expect(r.commission).toBe(100)
    expect(r.netAmount).toBe(-100)
  })
})

describe('canPayCommission', () => {
  it('wallet only sufficient', () => {
    expect(canPayCommission(500, 0, 500)).toBe(true)
  })

  it('points only sufficient', () => {
    expect(canPayCommission(0, 500, 500)).toBe(true)
  })

  it('combined sufficient', () => {
    expect(canPayCommission(300, 300, 500)).toBe(true)
  })

  it('insufficient', () => {
    expect(canPayCommission(100, 200, 500)).toBe(false)
  })
})

describe('splitCommissionPayment', () => {
  it('wallet covers all', () => {
    const s = splitCommissionPayment(1000, 500, 500)
    expect(s.fromWallet).toBe(500)
    expect(s.fromPoints).toBe(0)
  })

  it('wallet covers part, points rest', () => {
    const s = splitCommissionPayment(300, 500, 500)
    expect(s.fromWallet).toBe(300)
    expect(s.fromPoints).toBe(200)
  })

  it('no wallet, all points', () => {
    const s = splitCommissionPayment(0, 1000, 500)
    expect(s.fromWallet).toBe(0)
    expect(s.fromPoints).toBe(500)
  })

  it('both insufficient', () => {
    const s = splitCommissionPayment(100, 200, 500)
    expect(s.fromWallet).toBe(100)
    expect(s.fromPoints).toBe(200)
  })
})

describe('requiresBothWalletAndPoints', () => {
  it('true when wallet alone insufficient but combined is', () => {
    expect(requiresBothWalletAndPoints(300, 200, 500)).toBe(true)
  })

  it('false when wallet alone sufficient', () => {
    expect(requiresBothWalletAndPoints(600, 200, 500)).toBe(false)
  })

  it('false when combined still insufficient', () => {
    expect(requiresBothWalletAndPoints(100, 100, 500)).toBe(false)
  })
})
