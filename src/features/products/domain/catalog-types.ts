import type { Product } from '@/features/products/domain/product'

export type Category = { id: number; name: string; nameEs: string | null }
export type Subcategory = Category & { categoryId: number }
export type ProductsPage = { data: Product[]; total: number; page: number; pageSize: number }

export const SORTABLE_COLUMNS = ['name', 'sku', 'category', 'subcategory', 'price', 'created_at'] as const
export type SortableColumn = (typeof SORTABLE_COLUMNS)[number]

export type ProductsQuery = {
  search?: string
  category?: string | string[]
  subcategory?: string | string[]
  minPrice?: number
  maxPrice?: number
  sortBy?: SortableColumn
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}
