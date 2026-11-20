import type { Discount, DiscountInput, DiscountRole } from '@/features/discounts/domain/discount'

export interface DiscountRepository {
  listDiscounts(signal: AbortSignal): Promise<Discount[]>
  listRoles(): Promise<DiscountRole[]>
  saveDiscount(input: DiscountInput, id?: number): Promise<Discount>
}
