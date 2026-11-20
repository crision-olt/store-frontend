import type { Product, ProductInput } from '@/features/products/domain/product'
import type { ProductCreationRepository } from '@/features/products/domain/product-creation-repository'
import type { Category, ProductsQuery, Subcategory } from '@/features/products/domain/catalog-types'

export interface ProductCatalogRepository extends ProductCreationRepository {
  listAllProducts(query?: Omit<ProductsQuery, 'page' | 'pageSize'>, signal?: AbortSignal): Promise<Product[]>
  listCategories(): Promise<Category[]>
  listSubcategories(category?: string): Promise<Subcategory[]>
  updateProduct(id: number, input: ProductInput): Promise<Product>
  archiveProduct(id: number): Promise<void>
  createCategory(input: { name: string; nameEs: string }): Promise<Category>
  updateCategory(id: number, input: { name: string; nameEs: string }): Promise<Category>
  createSubcategory(input: { name: string; nameEs: string; categoryId: number }): Promise<Subcategory>
  updateSubcategory(id: number, input: { name: string; nameEs: string }): Promise<Subcategory>
}
