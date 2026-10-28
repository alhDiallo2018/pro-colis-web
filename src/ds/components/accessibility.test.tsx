import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Dialog } from './Dialog'
import { Input } from './Input'
import { Select } from './Select'
import { SegmentedControl } from './SegmentedControl'

it('associe les erreurs aux champs et conserve les callbacks du formulaire', () => {
  const onFocus = vi.fn(), onBlur = vi.fn()
  render(<Input label="Téléphone" error="Numéro incomplet" help="Format international" onFocus={onFocus} onBlur={onBlur} aria-describedby="extra" />)
  const field = screen.getByLabelText('Téléphone')
  fireEvent.focus(field)
  fireEvent.blur(field)
  expect(onFocus).toHaveBeenCalledOnce()
  expect(onBlur).toHaveBeenCalledOnce()
  expect(field).toHaveAttribute('aria-invalid', 'true')
  expect(field.getAttribute('aria-describedby')?.split(' ')).toContain(screen.getByRole('alert').id)
  expect(field.getAttribute('aria-describedby')).toContain('extra')
  expect(screen.getByRole('alert')).toHaveTextContent('Numéro incomplet')
})

it('annonce le filtre sélectionné et les erreurs de sélection', () => {
  render(<><Select label="Zone" error="Choisissez une zone" options={['Dakar']} /><SegmentedControl options={['Tous', 'Livrés']} value="Livrés" /></>)
  expect(screen.getByLabelText('Zone')).toHaveAccessibleDescription('Choisissez une zone')
  expect(screen.getByRole('button', { name: 'Livrés' })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByRole('button', { name: 'Tous' })).toHaveAttribute('aria-pressed', 'false')
})

describe('navigation clavier des dialogues', () => {
  it('garde le focus, ferme avec Échap puis rend le focus au déclencheur', async () => {
    function Example() {
      const [open, setOpen] = useState(false)
      return <><button onClick={() => setOpen(true)}>Ouvrir</button><Dialog title="Votre offre" open={open} onClose={() => setOpen(false)}><button>Premier</button><button>Dernier</button></Dialog></>
    }
    const user = userEvent.setup()
    render(<Example />)
    await user.click(screen.getByRole('button', { name: 'Ouvrir' }))
    expect(screen.getByRole('dialog', { name: 'Votre offre' })).toHaveFocus()
    expect(document.body.style.overflow).toBe('hidden')
    await user.tab()
    expect(screen.getByText('Premier')).toHaveFocus()
    await user.tab({ shift: true })
    expect(screen.getByText('Dernier')).toHaveFocus()
    await user.tab()
    expect(screen.getByText('Premier')).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('Ouvrir')).toHaveFocus()
    expect(document.body.style.overflow).not.toBe('hidden')
  })
  it('ferme uniquement le dialogue au premier plan', async () => {
    const closeParent = vi.fn(), closeChild = vi.fn()
    function Nested() {
      const [child, setChild] = useState(false)
      return <Dialog title="Parent" onClose={closeParent}><button onClick={() => setChild(true)}>Confirmer</button><Dialog open={child} title="Enfant" onClose={closeChild}><button>Valider</button></Dialog></Dialog>
    }
    const user = userEvent.setup()
    render(<Nested />)
    await user.click(screen.getByText('Confirmer'))
    await user.keyboard('{Escape}')
    expect(closeChild).toHaveBeenCalledOnce()
    expect(closeParent).not.toHaveBeenCalled()
  })
})
