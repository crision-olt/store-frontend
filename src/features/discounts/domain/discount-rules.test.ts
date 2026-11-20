import { isDiscountAmountValid } from './discount-rules'

describe('discount rules', () => {
  it('validates percentage and fixed-amount bounds and cent precision', () => {
    expect(isDiscountAmountValid('percentage', '10')).toBe(true)
    expect(isDiscountAmountValid('percentage', '100')).toBe(true)
    expect(isDiscountAmountValid('percentage', '100.01')).toBe(false)
    expect(isDiscountAmountValid('percentage', '0')).toBe(false)
    expect(isDiscountAmountValid('fixed_amount', '0.01')).toBe(true)
    expect(isDiscountAmountValid('fixed_amount', '1.001')).toBe(false)
    expect(isDiscountAmountValid('fixed_amount', '')).toBe(false)
  })
})
