import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { checkSupportRateLimit, recordSupportSend, formatWait } from './support'

vi.mock('axios', () => ({ default: { post: vi.fn() } }))
vi.mock('./client', () => ({ api: { post: vi.fn() } }))

describe('support rate limit', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useRealTimers()
  })

  it('allows the first send', () => {
    expect(checkSupportRateLimit()).toEqual({ allowed: true })
  })

  it('blocks a second send during the 60s cooldown', () => {
    recordSupportSend()
    const check = checkSupportRateLimit()
    expect(check.allowed).toBe(false)
    if (!check.allowed) expect(check.waitSeconds).toBeGreaterThan(0)
  })

  it('blocks after 3 sends within the rolling hour', () => {
    vi.useFakeTimers()
    const start = Date.now()
    for (let i = 0; i < 3; i++) {
      vi.setSystemTime(start + i * 120_000)
      recordSupportSend()
    }
    vi.setSystemTime(start + 3 * 120_000)
    const check = checkSupportRateLimit()
    expect(check.allowed).toBe(false)
  })

  it('allows again once the cooldown has elapsed and the window frees up', () => {
    vi.useFakeTimers()
    const start = Date.now()
    vi.setSystemTime(start)
    recordSupportSend()
    vi.setSystemTime(start + 61_000)
    expect(checkSupportRateLimit()).toEqual({ allowed: true })
  })

  it('ignores corrupt storage payloads', () => {
    localStorage.setItem('pc_support_sends', '{not json')
    expect(checkSupportRateLimit()).toEqual({ allowed: true })
  })

  it('formats wait durations', () => {
    expect(formatWait(45)).toBe('45 s')
    expect(formatWait(120)).toBe('2 min')
    expect(formatWait(61)).toBe('2 min')
  })
})

describe('sendSupportMessage delivery', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it('delivers via the backend when it responds', async () => {
    vi.resetModules()
    const { api } = await import('./client')
    ;(api.post as Mock).mockResolvedValue({ data: { supportMessage: { id: 'sm-1', subject: 'S', message: 'M' } } })
    const { sendSupportMessage } = await import('./support')
    const res = await sendSupportMessage({ subject: 'S', message: 'M' })
    expect(api.post).toHaveBeenCalledWith('/support/messages', { subject: 'S', message: 'M' })
    expect(res.id).toBe('sm-1')
  })

  it('falls back to a direct Brevo email to the support inbox when the backend is unreachable', async () => {
    vi.resetModules()
    vi.stubEnv('VITE_BREVO_API_KEY', 'xkeysib-test')
    const axios = (await import('axios')).default
    const { api } = await import('./client')
    ;(api.post as Mock).mockRejectedValue(new Error('network down'))
    ;(axios.post as Mock).mockResolvedValue({ data: { messageId: 'brevo-42' } })
    const { sendSupportMessage } = await import('./support')
    const res = await sendSupportMessage({ subject: '[Contact] Test', message: 'Bonjour', email: 'a@b.sn', name: 'Awa' })
    expect(axios.post).toHaveBeenCalledWith(
      'https://api.brevo.com/v3/smtp/email',
      expect.objectContaining({
        to: [{ email: 'support-commercial@sendprocolis.com', name: 'Support SendProColis' }],
        replyTo: { email: 'a@b.sn', name: 'Awa' },
        subject: '[Contact] Test',
        textContent: 'Bonjour',
      }),
      expect.objectContaining({ headers: expect.objectContaining({ 'api-key': 'xkeysib-test' }) }),
    )
    expect(res.id).toBe('brevo-42')
  })

  it('rethrows the backend error when no Brevo key is configured', async () => {
    vi.resetModules()
    vi.stubEnv('VITE_BREVO_API_KEY', '')
    const { api } = await import('./client')
    const boom = new Error('backend down')
    ;(api.post as Mock).mockRejectedValue(boom)
    const { sendSupportMessage } = await import('./support')
    await expect(sendSupportMessage({ subject: 'S', message: 'M' })).rejects.toThrow('backend down')
  })
})
