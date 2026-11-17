import { z } from 'zod'
import { resolveServiceUrl } from '@/lib/http'

const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  sku: z.string(),
  categoryId: z.number().int().positive(),
  categoryName: z.string(),
  subcategoryId: z.number().int().positive().nullable(),
  subcategoryName: z.string().nullable(),
  price: z.number(),
  stock: z.number(),
  created_at: z.string(),
})

const productsPageSchema = z.object({
  data: z.array(productSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
})

const categorySchema = z.object({ id: z.number().int().positive(), name: z.string() })
const subcategorySchema = categorySchema.extend({ categoryId: z.number().int().positive() })

export type Product = z.infer<typeof productSchema>
export type ProductInput = Pick<Product, 'name' | 'description' | 'sku' | 'categoryId' | 'subcategoryId' | 'price' | 'stock'>
export type ProductsPage = z.infer<typeof productsPageSchema>
export type Category = z.infer<typeof categorySchema>
export type Subcategory = z.infer<typeof subcategorySchema>

export const SORTABLE_COLUMNS = ['name', 'sku', 'category', 'subcategory', 'price', 'stock', 'created_at'] as const
export type SortableColumn = (typeof SORTABLE_COLUMNS)[number]

export type ProductsQuery = {
  search?: string
  category?: string | string[]
  subcategory?: string | string[]
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  sortBy?: SortableColumn
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export class ProductsApiError extends Error {
  readonly status: number

  constructor(status: number) {
    super(`Products request failed with HTTP ${status}`)
    this.name = 'ProductsApiError'
    this.status = status
  }
}

export function createProductsApi(serviceUrl: string) {
  async function get(path: string, signal?: AbortSignal) {
    const response = await fetch(resolveServiceUrl(serviceUrl, path), {
      credentials: 'include',
      ...(signal ? { signal } : {}),
    })
    if (!response.ok) throw new ProductsApiError(response.status)
    return response.json()
  }

  async function post(path: string, body: object) {
    const response = await fetch(resolveServiceUrl(serviceUrl, path), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!response.ok) throw new ProductsApiError(response.status)
    return response.json()
  }

  async function listProducts(query: ProductsQuery = {}, signal?: AbortSignal) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) {
      if (Array.isArray(value)) {
        for (const item of value) params.append(key, item)
      } else if (value !== undefined && value !== '') {
        params.set(key, String(value))
      }
    }
    const suffix = params.size ? `?${params}` : ''
    return productsPageSchema.parse(await get(`/products${suffix}`, signal))
  }

  return {
    async createProduct(input: ProductInput) {
      return productSchema.parse(await post('/products', input))
    },
    listProducts,
    async listAllProducts(query: Omit<ProductsQuery, 'page' | 'pageSize'> = {}, signal?: AbortSignal) {
      const products: Product[] = []
      let page = 1
      while (true) {
        const result = await listProducts({ ...query, page, pageSize: 100 }, signal)
        products.push(...result.data)
        if (products.length >= result.total) return products
        if (result.data.length === 0) throw new Error('Product listing ended before all products were returned')
        page += 1
      }
    },
    async listCategories() {
      return z.array(categorySchema).parse(await get('/products/categories'))
    },
    async listSubcategories(category?: string) {
      const suffix = category ? `?${new URLSearchParams({ category })}` : ''
      return z.array(subcategorySchema).parse(await get(`/products/subcategories${suffix}`))
    },
    async createCategory(name: string) {
      return categorySchema.parse(await post('/products/categories', { name }))
    },
    async createSubcategory(name: string, categoryId: number) {
      return subcategorySchema.parse(await post('/products/subcategories', { name, categoryId }))
    },
  }
}

export const { createProduct, listProducts, listAllProducts, listCategories, listSubcategories, createCategory, createSubcategory } =
  createProductsApi(import.meta.env.AUTH_SERVICE_URL)
