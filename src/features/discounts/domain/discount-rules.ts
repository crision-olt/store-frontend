import type { DiscountKind } from '@/features/discounts/domain/discount'

export function isDiscountAmountValid(kind: DiscountKind, rawAmount: string) {
  const amount = Number(rawAmount)
  return rawAmount.trim() !== '' && Number.isFinite(amount) &&
    Math.round(amount * 100) / 100 === amount &&
    (kind === 'percentage' ? amount > 0 && amount <= 100 : amount > 0 && amount <= 99999999.99)
}
