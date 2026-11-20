import { listRoles } from '@/lib/access-api'
import { listDiscounts, saveDiscount } from '@/lib/discounts-api'
import type { DiscountRepository } from '@/features/discounts/domain/discount-repository'

export class DiscountsApiAdapter implements DiscountRepository {
  listDiscounts = listDiscounts

  async listRoles() {
    return (await listRoles()).map(({ id, name }) => ({ id, name }))
  }

  saveDiscount = saveDiscount
}
