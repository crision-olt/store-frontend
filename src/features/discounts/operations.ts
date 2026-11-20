import { createDiscountUseCases } from '@/features/discounts/application/discounts'
import { DiscountsApiAdapter } from '@/features/discounts/infrastructure/discounts-api-adapter'

const useCases = createDiscountUseCases(new DiscountsApiAdapter())

export const listDiscountsUseCase = useCases.listDiscounts
export const listRolesUseCase = useCases.listRoles
export const saveDiscountUseCase = useCases.saveDiscount
