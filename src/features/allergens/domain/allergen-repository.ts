import type { Allergen } from '@/features/allergens/domain/allergen'

export interface AllergenRepository {
  listAllergens(signal: AbortSignal): Promise<Allergen[]>
}
