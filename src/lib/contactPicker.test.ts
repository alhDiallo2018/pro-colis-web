import { describe, expect, it, vi } from 'vitest'
import {
  getContactsManager,
  inferDialCode,
  normalizeContactPhone,
  toRecipientContact,
  type ContactsManager,
} from './contactPicker'

describe('contactPicker', () => {
  it('détecte uniquement un gestionnaire qui expose select', () => {
    const manager: ContactsManager = { select: vi.fn() }

    expect(getContactsManager({ contacts: manager })).toBe(manager)
    expect(getContactsManager({ contacts: {} as ContactsManager })).toBeNull()
    expect(getContactsManager(undefined)).toBeNull()
  })

  it('normalise un numéro international choisi dans le téléphone', () => {
    expect(normalizeContactPhone('tel:+221 77 123-45-67', '+221')).toBe('+221771234567')
    expect(normalizeContactPhone('00225 07 01 02 03 04', '+221')).toBe('+2250701020304')
  })

  it("ajoute l'indicatif du compte à un numéro local sans le dupliquer", () => {
    expect(normalizeContactPhone('77 123 45 67', '+221')).toBe('+221771234567')
    expect(normalizeContactPhone('221771234567', '+221')).toBe('+221771234567')
  })

  it("récupère le nom, le téléphone et l'email du premier contact partagé", () => {
    expect(
      toRecipientContact(
        {
          name: ['', 'Awa Ndiaye'],
          tel: ['77 123 45 67'],
          email: ['awa@example.com'],
        },
        '+221',
      ),
    ).toEqual({
      name: 'Awa Ndiaye',
      phone: '+221771234567',
      email: 'awa@example.com',
    })
  })

  it("déduit l'indicatif international le plus précis du compte", () => {
    expect(inferDialCode('+221771234567', ['+22', '+221', '+1'])).toBe('+221')
    expect(inferDialCode('771234567', ['+221'])).toBeNull()
  })
})
