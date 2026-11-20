import { createListAllergensUseCase } from '@/features/allergens/application/list-allergens'
import { AllergensApiAdapter } from '@/features/allergens/infrastructure/allergens-api-adapter'

export const listAllergensUseCase = createListAllergensUseCase(new AllergensApiAdapter())
