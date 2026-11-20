import type { DiscountInput } from '@/features/discounts/domain/discount'
import type { DiscountRepository } from '@/features/discounts/domain/discount-repository'

export function createDiscountUseCases(repository: DiscountRepository) {
  return {
    listDiscounts: (signal: AbortSignal) => repository.listDiscounts(signal),
    listRoles: () => repository.listRoles(),
    saveDiscount: (input: DiscountInput, id?: number) => repository.saveDiscount(input, id),
  }
}
