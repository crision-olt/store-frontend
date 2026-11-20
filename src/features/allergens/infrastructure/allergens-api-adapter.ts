import { listAllergens } from '@/lib/allergens-api'
import type { AllergenRepository } from '@/features/allergens/domain/allergen-repository'

export class AllergensApiAdapter implements AllergenRepository {
  listAllergens = listAllergens
}
