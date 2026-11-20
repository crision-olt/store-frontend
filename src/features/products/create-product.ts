import { createCreateProductUseCase } from '@/features/products/application/create-product'
import { ProductsApiAdapter } from '@/features/products/infrastructure/products-api-adapter'

export const createProductUseCase = createCreateProductUseCase(new ProductsApiAdapter())
