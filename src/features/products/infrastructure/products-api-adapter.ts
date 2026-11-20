import {
  archiveProduct,
  createCategory,
  createProduct,
  createSubcategory,
  listAllProducts,
  listCategories,
  listSubcategories,
  updateCategory,
  updateProduct,
  updateSubcategory,
} from '@/lib/products-api'
import type { ProductCatalogRepository } from '@/features/products/domain/product-catalog-repository'
import type { ProductInput } from '@/features/products/domain/product'

export class ProductsApiAdapter implements ProductCatalogRepository {
  createProduct(input: ProductInput) {
    return createProduct(input)
  }

  listAllProducts = listAllProducts
  listCategories = listCategories
  listSubcategories = listSubcategories
  updateProduct = updateProduct
  archiveProduct = archiveProduct
  createCategory = createCategory
  updateCategory = updateCategory
  createSubcategory = createSubcategory
  updateSubcategory = updateSubcategory
}
