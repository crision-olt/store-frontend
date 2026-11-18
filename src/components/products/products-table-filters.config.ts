import type { I18n } from '@lingui/core'
import { msg } from '@lingui/core/macro'
import type { ColumnFiltersState } from '@tanstack/react-table'
import type { TableFilterField } from '@/components/table'
import { columnFiltersToProductFilters } from '@/lib/product-filters'
import type { Category, Subcategory } from '@/lib/products-api'

type ProductFilterFieldOptions = {
  columnFilters: ColumnFiltersState
  categories: Category[]
  subcategories: Subcategory[]
  i18n: I18n
}

export function getProductFilterFields({
  columnFilters,
  categories,
  subcategories,
  i18n,
}: ProductFilterFieldOptions): TableFilterField[] {
  const filters = columnFiltersToProductFilters(columnFilters)

  return [
    { id: 'name', label: i18n._(msg`Search`), value: filters.search, fullWidth: true },
    {
      id: 'category',
      label: i18n._(msg`Category`),
      value: filters.category.map((id) => categories.find((category) => String(category.id) === id)?.name ?? id).join(', '),
    },
    {
      id: 'subcategory',
      label: i18n._(msg`Subcategory`),
      value: filters.subcategory.map((id) => {
        const subcategory = subcategories.find((item) => String(item.id) === id)
        const category = categories.find((item) => item.id === subcategory?.categoryId)
        return subcategory
          ? `${subcategory.name}${category ? ` (${category.name})` : ''}`
          : id
      }).join(', '),
    },
    {
      id: 'price',
      label: i18n._(msg`Price`),
      value: [
        filters.minPrice !== '' ? `${i18n._(msg`Min`)}: ${filters.minPrice}` : '',
        filters.maxPrice !== '' ? `${i18n._(msg`Max`)}: ${filters.maxPrice}` : '',
      ].filter(Boolean).join(' · '),
    },
  ]
}
