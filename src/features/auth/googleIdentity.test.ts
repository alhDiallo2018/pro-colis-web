import { afterEach, beforeEach, expect, it, vi } from 'vitest'

beforeEach(() => { vi.resetModules() })
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); document.body.replaceChildren(); document.head.querySelectorAll('script[src*="accounts.google.com"]').forEach(script => script.remove()) })

it('initialise GIS une seule fois et ne laisse pas un ancien nettoyage effacer le nouveau bouton', async () => {
  const sdk = { initialize: vi.fn(), renderButton: vi.fn((element: HTMLElement) => { element.textContent = 'Google' }) }
  vi.stubGlobal('google', { accounts: { id: sdk } })
  const { renderGoogleButton } = await import('./googleIdentity')
  const host = document.createElement('div'); document.body.append(host)
  const oldCallback = vi.fn(), nextCallback = vi.fn()
  const previous = await renderGoogleButton(host, 'client-id', oldCallback)
  const next = await renderGoogleButton(host, 'client-id', nextCallback)
  previous()
  expect(host).toHaveTextContent('Google')
  expect(sdk.initialize).toHaveBeenCalledTimes(1)
  const configuration = sdk.initialize.mock.calls[0][0] as { callback: (response: { credential: string }) => void }
  configuration.callback({ credential: 'verified-by-server' })
  expect(oldCallback).not.toHaveBeenCalled()
  expect(nextCallback).toHaveBeenCalledWith('verified-by-server')
  next(); configuration.callback({ credential: 'late' })
  expect(nextCallback).toHaveBeenCalledTimes(1)
  expect(host).toBeEmptyDOMElement()
})

it('ne monte pas un bouton sur une page quittee pendant le chargement', async () => {
  vi.stubGlobal('google', undefined)
  const { renderGoogleButton } = await import('./googleIdentity')
  const host = document.createElement('div'); document.body.append(host)
  const pending = renderGoogleButton(host, 'client-id', vi.fn())
  host.remove()
  const sdk = { initialize: vi.fn(), renderButton: vi.fn() }
  vi.stubGlobal('google', { accounts: { id: sdk } })
  document.head.querySelector('script[src*="accounts.google.com"]')!.dispatchEvent(new Event('load'))
  await pending
  expect(sdk.initialize).not.toHaveBeenCalled()
  expect(sdk.renderButton).not.toHaveBeenCalled()
})

it('borne le chargement et autorise une nouvelle tentative apres une panne reseau', async () => {
  vi.useFakeTimers(); vi.stubGlobal('google', undefined)
  const { renderGoogleButton } = await import('./googleIdentity')
  const host = document.createElement('div'); document.body.append(host)
  const first = renderGoogleButton(host, 'client-id', vi.fn())
  const rejected = expect(first).rejects.toThrow('Google indisponible')
  await vi.advanceTimersByTimeAsync(15000); await rejected
  expect(document.head.querySelector('script[src*="accounts.google.com"]')).toBeNull()
  const second = renderGoogleButton(host, 'client-id', vi.fn())
  const sdk = { initialize: vi.fn(), renderButton: vi.fn() }
  vi.stubGlobal('google', { accounts: { id: sdk } })
  document.head.querySelector('script[src*="accounts.google.com"]')!.dispatchEvent(new Event('load'))
  await second
  expect(sdk.renderButton).toHaveBeenCalledOnce()
})
