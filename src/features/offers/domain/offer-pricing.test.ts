import { calculateOfferPricing, isOfferAmountValid, isOfferMinimumValid } from './offer-pricing'

describe('offer rules', () => {
  it('calculates promotion totals from rounded product cents', () => {
    expect(calculateOfferPricing('promotion', 10, [10, 4])).toEqual({
      subtotalCents: 1400,
      total: 12.6,
    })
  })

  it('keeps fixed menu totals and validates offer inputs', () => {
    expect(calculateOfferPricing('menu', 12, [10, 4])).toEqual({
      subtotalCents: 1400,
      total: 12,
    })
    expect(isOfferAmountValid('menu', '0')).toBe(true)
    expect(isOfferAmountValid('promotion', '100')).toBe(true)
    expect(isOfferAmountValid('promotion', '100.01')).toBe(false)
    expect(isOfferAmountValid('promotion', '')).toBe(false)
    expect(isOfferMinimumValid('', 2)).toBe(true)
    expect(isOfferMinimumValid('2', 2)).toBe(true)
    expect(isOfferMinimumValid('3', 2)).toBe(false)
  })
})
