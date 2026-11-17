import type { ColumnFiltersState } from '@tanstack/react-table'
import type { ProductsQuery } from '@/lib/products-api'

export type StockFilter = 'in' | 'out'

export type ProductFilterValues = {
  search: string
  category: string[]
  subcategory: string[]
  minPrice: string
  maxPrice: string
  stock: StockFilter[]
}

export const emptyFilters: ProductFilterValues = {
  search: '',
  category: [],
  subcategory: [],
  minPrice: '',
  maxPrice: '',
  stock: [],
}

function getStringValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function getStringValues(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

export function columnFiltersToProductFilters(columnFilters: ColumnFiltersState): ProductFilterValues {
  const getValue = (id: string) => columnFilters.find((filter) => filter.id === id)?.value
  const price = getValue('price')
  const minPrice =
    typeof price === 'object' && price !== null && 'minPrice' in price ? getStringValue(price.minPrice) : ''
  const maxPrice =
    typeof price === 'object' && price !== null && 'maxPrice' in price ? getStringValue(price.maxPrice) : ''
  const stock = getValue('stock')

  return {
    search: getStringValue(getValue('name')),
    category: getStringValues(getValue('category')),
    subcategory: getStringValues(getValue('subcategory')),
    minPrice,
    maxPrice,
    stock: getStringValues(stock).filter((value): value is StockFilter => value === 'in' || value === 'out'),
  }
}

function parsePrice(raw: string): number | undefined {
  if (raw.trim() === '') return undefined
  const value = Number(raw)
  return Number.isFinite(value) && value >= 0 ? value : undefined
}

export function hasInvalidPrice(raw: string): boolean {
  return raw.trim() !== '' && parsePrice(raw) === undefined
}

export function hasInvalidPriceRange(filters: ProductFilterValues): boolean {
  const min = parsePrice(filters.minPrice)
  const max = parsePrice(filters.maxPrice)
  return (
    hasInvalidPrice(filters.minPrice) ||
    hasInvalidPrice(filters.maxPrice) ||
    (min !== undefined && max !== undefined && min > max)
  )
}

export function hasActiveFilters(filters: ProductFilterValues): boolean {
  return (
    filters.search !== '' ||
    filters.category.length > 0 ||
    filters.subcategory.length > 0 ||
    filters.minPrice !== '' ||
    filters.maxPrice !== '' ||
    filters.stock.length === 1
  )
}

export function toProductsQuery(filters: ProductFilterValues): ProductsQuery {
  return {
    search: filters.search.trim() || undefined,
    category: filters.category.length > 0 ? filters.category : undefined,
    subcategory: filters.subcategory.length > 0 ? filters.subcategory : undefined,
    minPrice: parsePrice(filters.minPrice),
    maxPrice: parsePrice(filters.maxPrice),
    inStock: filters.stock.length === 1 ? filters.stock[0] === 'in' : undefined,
  }
}
