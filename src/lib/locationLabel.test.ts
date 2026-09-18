import { describe, expect, it } from 'vitest'
import { isMeaningfulLocationLabel } from './locationLabel'

describe('isMeaningfulLocationLabel', () => {
  it.each(['Ma position', 'Position actuelle', 'current location', '14.72, -17.49'])(
    'refuse le libellé technique %s',
    (label) => expect(isMeaningfulLocationLabel(label)).toBe(false),
  )

  it.each(['Ouakam', 'Grand Dakar, Dakar, Sénégal', 'Thiès'])(
    'accepte la localité %s',
    (label) => expect(isMeaningfulLocationLabel(label)).toBe(true),
  )
})
