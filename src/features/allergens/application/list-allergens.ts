import type { AllergenRepository } from '@/features/allergens/domain/allergen-repository'

export function createListAllergensUseCase(repository: AllergenRepository) {
  return (signal: AbortSignal) => repository.listAllergens(signal)
}
