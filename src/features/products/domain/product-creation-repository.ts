import type { Product, ProductInput } from './product'

export interface ProductCreationRepository {
  createProduct(input: ProductInput): Promise<Product>
}
