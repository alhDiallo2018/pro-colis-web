import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { PwaProvider } from './PwaProvider'
import { InstallPage } from './InstallPage'

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('iPhone')
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
})
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

it('propose le guide Safari sur iPhone et permet de masquer le bandeau', async () => {
  render(<PwaProvider><MemoryRouter><InstallPage /></MemoryRouter></PwaProvider>)
  expect(screen.getByRole('link', { name: /ProColis sur votre iPhone/ })).toHaveAttribute('href', '/installer')
  expect(screen.getByText('Touchez Partager')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /Masquer l’aide/ }))
  expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
})

it('reconnaît un iPad en mode ordinateur', () => {
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Macintosh')
  vi.spyOn(navigator, 'platform', 'get').mockReturnValue('MacIntel')
  Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, value: 5 })
  render(<PwaProvider>Application</PwaProvider>)
  expect(screen.getByRole('complementary')).toBeInTheDocument()
  delete (navigator as unknown as Record<string, unknown>).maxTouchPoints
})

it('ne propose plus l’installation en mode standalone', () => {
  vi.mocked(window.matchMedia).mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() } as unknown as MediaQueryList)
  render(<PwaProvider><MemoryRouter><InstallPage /></MemoryRouter></PwaProvider>)
  expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Ouvrir mon espace/ })).toHaveAttribute('href', '/app')
})

it('signale la coupure puis retire le message au retour du réseau', () => {
  render(<PwaProvider>Application</PwaProvider>)
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
  act(() => window.dispatchEvent(new Event('offline')))
  expect(screen.getByRole('status')).toHaveTextContent('hors connexion')
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
  act(() => window.dispatchEvent(new Event('online')))
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})
