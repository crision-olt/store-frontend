import type { ProductCreationRepository } from '@/features/products/domain/product-creation-repository'
import type { Product, ProductInput } from '@/features/products/domain/product'

export function createCreateProductUseCase(repository: ProductCreationRepository) {
  return (input: ProductInput): Promise<Product> => {
    return repository.createProduct({
      ...input,
      name: input.name.trim(),
      nameEs: input.nameEs.trim(),
      sku: input.sku.trim(),
      description: input.description?.trim() || null,
    })
  }
}
