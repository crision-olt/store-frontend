import type { OfferKind } from '@/features/offers/domain/offer'

export function isOfferAmountValid(kind: OfferKind, rawAmount: string) {
  const amount = Number(rawAmount)
  return rawAmount.trim() !== '' && Number.isFinite(amount) &&
    Math.round(amount * 100) / 100 === amount &&
    (kind === 'menu' ? amount >= 0 && amount <= 99999999.99 : amount > 0 && amount <= 100)
}

export function isOfferMinimumValid(rawMinimum: string, selectedCount: number) {
  if (rawMinimum === '') return true
  const minimum = Number(rawMinimum)
  return Number.isInteger(minimum) && minimum >= 1 && minimum <= selectedCount
}

export function calculateOfferPricing(kind: OfferKind, amount: number, prices: number[]) {
  const subtotalCents = prices.reduce((sum, price) => sum + Math.round(price * 100), 0)
  const total = kind === 'menu'
    ? amount
    : Number.isFinite(amount * 100)
      ? Number((BigInt(subtotalCents) * BigInt(10000 - Math.round(amount * 100)) + 5000n) / 10000n) / 100
      : undefined
  return { subtotalCents, total }
}
