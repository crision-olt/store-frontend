import { localizedName } from './localized-name'

describe('localizedName', () => {
  it('uses the Spanish name for Spanish and falls back to English when missing', () => {
    expect(localizedName('Kitchen', 'Cocina', 'es')).toBe('Cocina')
    expect(localizedName('Kitchen', null, 'es')).toBe('Kitchen')
  })

  it('uses the English name for other locales', () => {
    expect(localizedName('Kitchen', 'Cocina', 'en')).toBe('Kitchen')
  })
})
