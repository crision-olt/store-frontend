import { createProductCatalogUseCases } from '@/features/products/application/product-catalog'
import { ProductsApiAdapter } from '@/features/products/infrastructure/products-api-adapter'

const useCases = createProductCatalogUseCases(new ProductsApiAdapter())

export const listAllProductsUseCase = useCases.listAllProducts
export const listCategoriesUseCase = useCases.listCategories
export const listSubcategoriesUseCase = useCases.listSubcategories
export const updateProductUseCase = useCases.updateProduct
export const archiveProductUseCase = useCases.archiveProduct
export const createCategoryUseCase = useCases.createCategory
export const updateCategoryUseCase = useCases.updateCategory
export const createSubcategoryUseCase = useCases.createSubcategory
export const updateSubcategoryUseCase = useCases.updateSubcategory
