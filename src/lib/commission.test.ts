import { describe, expect, it } from 'vitest'
import { calculateCommission, canPayCommission, pointsCoverCommission, splitCommissionPayment, requiresBothWalletAndPoints } from './commission'

const CONFIG = { percentage: 5, minAmount: 100, maxAmount: 500 }

describe('calculateCommission', () => {
  it('config: 1000 FCFA → 100 FCFA (min)', () => {
    const r = calculateCommission(1000, CONFIG)
    expect(r.commission).toBe(100)
    expect(r.netAmount).toBe(900)
  })

  it('config: 5000 FCFA → 250 FCFA', () => {
    const r = calculateCommission(5000, CONFIG)
    expect(r.commission).toBe(250)
    expect(r.netAmount).toBe(4750)
    expect(r.percentage).toBe(5)
  })

  it('config: 10000 FCFA → 500 FCFA (max)', () => {
    const r = calculateCommission(10000, CONFIG)
    expect(r.commission).toBe(500)
  })

  it('config: 50000 FCFA → 500 FCFA (max)', () => {
    const r = calculateCommission(50000, CONFIG)
    expect(r.commission).toBe(500)
  })

  it('custom config: 10%, min 200, max 1000', () => {
    const r = calculateCommission(3000, { percentage: 10, minAmount: 200, maxAmount: 1000 })
    expect(r.commission).toBe(300)
  })

  it('returns minimum for 0 amount', () => {
    const r = calculateCommission(0, CONFIG)
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

describe('pointsCoverCommission', () => {
  it('cfaPerPoint = 1 : 500 pts couvrent 500 FCFA', () => {
    expect(pointsCoverCommission(500, 1, 500)).toBe(true)
  })

  it('cfaPerPoint = 1 : 499 pts ne couvrent pas 500 FCFA', () => {
    expect(pointsCoverCommission(499, 1, 500)).toBe(false)
  })

  it('cfaPerPoint = 2 : 250 pts couvrent 500 FCFA', () => {
    expect(pointsCoverCommission(250, 2, 500)).toBe(true)
  })

  it('cfaPerPoint = 2 : 249 pts ne couvrent pas 500 FCFA', () => {
    expect(pointsCoverCommission(249, 2, 500)).toBe(false)
  })

  it('arrondi supérieur : 151 FCFA à 2 FCFA/pt requiert 76 pts', () => {
    expect(pointsCoverCommission(75, 2, 151)).toBe(false)
    expect(pointsCoverCommission(76, 2, 151)).toBe(true)
  })

  it('commission nulle toujours couverte', () => {
    expect(pointsCoverCommission(0, 1, 0)).toBe(true)
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
