import { describe, expect, it } from 'vitest'
import { REDACTED, redactString, redactUrl, redactValue } from './redact'

describe('redactString', () => {
  it('masque un en-tête Authorization', () => {
    expect(redactString('Request failed with Authorization: Bearer eyJhbGciOi.J9payload.sig')).toContain(
      `Bearer ${REDACTED}`,
    )
  })

  it('masque un JWT nu dans une stack', () => {
    const stack = 'at refresh (token=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abc123)'
    expect(redactString(stack)).not.toContain('eyJhbGciOiJIUzI1NiJ9')
  })

  it('masque emails et téléphones', () => {
    const line = 'Échec pour awa.diop@example.com au +221 77 123 45 67'
    const cleaned = redactString(line)
    expect(cleaned).not.toContain('awa.diop@example.com')
    expect(cleaned).not.toContain('77 123 45 67')
    expect(cleaned).toContain('[REDACTED_EMAIL]')
    expect(cleaned).toContain('[REDACTED_PHONE]')
  })

  it('laisse intact un message technique sans donnée personnelle', () => {
    const message = 'Cannot read properties of undefined (reading parcelId)'
    expect(redactString(message)).toBe(message)
  })
})

describe('redactUrl', () => {
  it('retire la query string, qui porte jetons et références de paiement', () => {
    expect(redactUrl('https://sendprocolis.com/payment-status?token=abc&phone=771234567')).toBe(
      'https://sendprocolis.com/payment-status',
    )
  })

  it('conserve le chemin, utile au diagnostic', () => {
    expect(redactUrl('https://sendprocolis.com/admin/logs')).toBe('https://sendprocolis.com/admin/logs')
  })
})

describe('redactValue', () => {
  it('masque les clés sensibles quelle que soit leur valeur', () => {
    const cleaned = redactValue({
      accessToken: 'abc123',
      pin: '1234',
      phone: '771234567',
      parcelId: 'p-42',
    }) as Record<string, unknown>

    expect(cleaned.accessToken).toBe(REDACTED)
    expect(cleaned.pin).toBe(REDACTED)
    expect(cleaned.phone).toBe(REDACTED)
    // Un identifiant métier reste lisible : sans lui l'erreur n'est pas exploitable.
    expect(cleaned.parcelId).toBe('p-42')
  })

  it('descend dans les objets et les tableaux imbriqués', () => {
    const cleaned = redactValue({
      exceptions: [{ value: 'Échec pour awa@example.com', context: { refreshToken: 'zzz' } }],
    })
    const serialized = JSON.stringify(cleaned)
    expect(serialized).not.toContain('awa@example.com')
    expect(serialized).not.toContain('zzz')
  })

  it('borne la profondeur au lieu de boucler sur une structure cyclique', () => {
    const cyclic: Record<string, unknown> = { name: 'root' }
    cyclic.self = cyclic
    expect(() => redactValue(cyclic)).not.toThrow()
  })

  it('préserve les types non-textuels', () => {
    const cleaned = redactValue({ statusCode: 500, retried: false, missing: null }) as Record<string, unknown>
    expect(cleaned.statusCode).toBe(500)
    expect(cleaned.retried).toBe(false)
    expect(cleaned.missing).toBeNull()
  })
})
