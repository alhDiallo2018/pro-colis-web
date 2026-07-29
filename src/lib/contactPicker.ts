export const CONTACT_PICKER_PROPERTIES = ['name', 'tel', 'email'] as const

export type ContactPickerProperty = (typeof CONTACT_PICKER_PROPERTIES)[number]

export interface ContactPickerEntry {
  name?: string[]
  tel?: string[]
  email?: string[]
}

export interface ContactsManager {
  getProperties?: () => Promise<string[]>
  select: (
    properties: ContactPickerProperty[],
    options: { multiple: boolean },
  ) => Promise<ContactPickerEntry[]>
}

type NavigatorWithContacts = { contacts?: ContactsManager }

export interface RecipientContact {
  name: string
  phone: string
  email: string
}

/** Retourne l'API native uniquement lorsqu'elle est réellement exposée par le navigateur. */
export function getContactsManager(
  currentNavigator: NavigatorWithContacts | undefined =
    typeof navigator === 'undefined' ? undefined : (navigator as NavigatorWithContacts),
): ContactsManager | null {
  const manager = currentNavigator?.contacts
  return manager && typeof manager.select === 'function' ? manager : null
}

/** Déduit l'indicatif le plus long afin d'éviter que +221 soit confondu avec un préfixe plus court. */
export function inferDialCode(phone: string | null | undefined, dialCodes: string[]): string | null {
  const normalizedPhone = phone?.trim().replace(/^00/, '+') ?? ''
  if (!normalizedPhone.startsWith('+')) return null

  return (
    [...new Set(dialCodes)]
      .sort((left, right) => right.length - left.length)
      .find((dialCode) => normalizedPhone.startsWith(dialCode)) ?? null
  )
}

/**
 * Nettoie les séparateurs habituels. Un numéro local reçoit l'indicatif du
 * compte connecté pour rester comparable aux numéros enregistrés par l'API.
 */
export function normalizeContactPhone(
  rawPhone: string | null | undefined,
  defaultDialCode?: string | null,
): string {
  const raw = rawPhone?.trim().replace(/^tel:/i, '') ?? ''
  if (!raw) return ''

  const startsInternational = raw.startsWith('+') || raw.startsWith('00')
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  if (startsInternational) return `+${digits.replace(/^00/, '')}`

  const dialCode = defaultDialCode?.trim().replace(/^00/, '+') ?? ''
  const dialDigits = dialCode.replace(/\D/g, '')
  if (!dialDigits) return digits
  if (digits.startsWith(dialDigits)) return `+${digits}`

  return `+${dialDigits}${digits.replace(/^0+/, '')}`
}

function firstValue(values: string[] | undefined): string {
  return values?.find((value) => value.trim().length > 0)?.trim() ?? ''
}

export function toRecipientContact(
  contact: ContactPickerEntry,
  defaultDialCode?: string | null,
): RecipientContact {
  return {
    name: firstValue(contact.name),
    phone: normalizeContactPhone(firstValue(contact.tel), defaultDialCode),
    email: firstValue(contact.email),
  }
}

export function isContactPickerCancellation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name?: string }).name === 'AbortError'
  )
}
