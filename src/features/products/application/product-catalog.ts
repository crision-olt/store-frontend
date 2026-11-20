import type { ProductCatalogRepository } from '@/features/products/domain/product-catalog-repository'
import type { ProductInput } from '@/features/products/domain/product'
import type { ProductsQuery } from '@/features/products/domain/catalog-types'

export function createProductCatalogUseCases(repository: ProductCatalogRepository) {
  return {
    listAllProducts: (query?: Omit<ProductsQuery, 'page' | 'pageSize'>, signal?: AbortSignal) =>
      repository.listAllProducts(query, signal),
    listCategories: () => repository.listCategories(),
    listSubcategories: (category?: string) => repository.listSubcategories(category),
    updateProduct: (id: number, input: ProductInput) => repository.updateProduct(id, input),
    archiveProduct: (id: number) => repository.archiveProduct(id),
    createCategory: (input: { name: string; nameEs: string }) => repository.createCategory(input),
    updateCategory: (id: number, input: { name: string; nameEs: string }) => repository.updateCategory(id, input),
    createSubcategory: (input: { name: string; nameEs: string; categoryId: number }) =>
      repository.createSubcategory(input),
    updateSubcategory: (id: number, input: { name: string; nameEs: string }) =>
      repository.updateSubcategory(id, input),
  }
}
