import { useLingui } from '@lingui/react/macro'
import {
  useTable,
  type ColumnFiltersState,
  type OnChangeFn,
  type SortingState,
} from '@tanstack/react-table'
import { Table, TableFilters } from '@/components/table'
import { tableFeatureSet } from '@/components/table/features'
import { TableFeedbackState } from '@/components/table/components/table-feedback-state'
import { TableLoading } from '@/components/table/components/table-loading'
import { columnFiltersToProductFilters } from '@/lib/product-filters'
import { cn } from '@/lib/utils'
import type { Category, Product, Subcategory } from '@/lib/products-api'
import { useProductColumns } from '@/components/products/products-table-columns'
import { isNotEmptyArray } from '@/utils/is-not-empty-array'

const emptyProducts: Product[] = []

type Props = {
  products: Product[] | undefined
  isLoading: boolean
  isFetching: boolean
  sorting: SortingState
  onSortingChange: OnChangeFn<SortingState>
  columnFilters: ColumnFiltersState
  onColumnFiltersChange: OnChangeFn<ColumnFiltersState>
  categories: Category[]
  subcategories: Subcategory[]
  onCategoryChange: () => void
}

export function ProductsTable({
  products,
  isLoading,
  isFetching,
  sorting,
  onSortingChange,
  columnFilters,
  onColumnFiltersChange,
  categories,
  subcategories,
  onCategoryChange,
}: Props) {
  const { t } = useLingui()
  const filters = columnFiltersToProductFilters(columnFilters)

  const table = useTable({
    features: tableFeatureSet,
    columns: useProductColumns({ categories, subcategories, onCategoryChange }),
    data: products ?? emptyProducts,
    manualSorting: true,
    manualFiltering: true,
    enableMultiSort: false,
    enableSortingRemoval: false,
    state: { sorting, columnFilters },
    onSortingChange,
    onColumnFiltersChange,
  })

  const rows = table.getRowModel().rows
  const filterFields = [
    { id: 'name', label: t`Search`, value: filters.search, fullWidth: true },
    {
      id: 'category',
      label: t`Category`,
      value: filters.category.map((id) => categories.find((category) => String(category.id) === id)?.name ?? id).join(', '),
    },
    {
      id: 'subcategory',
      label: t`Subcategory`,
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
      label: t`Price`,
      value: [
        filters.minPrice !== '' ? `${t`Min`}: ${filters.minPrice}` : '',
        filters.maxPrice !== '' ? `${t`Max`}: ${filters.maxPrice}` : '',
      ].filter(Boolean).join(' · '),
    },
    {
      id: 'stock',
      label: t`Availability`,
      value: filters.stock.length === 1 ? (filters.stock[0] === 'in' ? t`In stock` : t`Out of stock`) : '',
    },
  ]
  const removeFilter = (id: string) => onColumnFiltersChange((current) =>
    current.filter((filter) => filter.id !== id && !(id === 'category' && filter.id === 'subcategory')),
  )
  const emptyState = !isLoading && !isNotEmptyArray(rows) ? (
    <TableFeedbackState className="static h-80" title={t`No products found.`} />
  ) : undefined

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <TableFilters table={table} title={t`Product filters`} fields={filterFields} onRemoveFilter={removeFilter} />
      <Table
        table={table}
        className={cn('h-96 rounded-lg border bg-card transition-opacity', isFetching && !isLoading && 'opacity-60')}
        feedbackState={isLoading ? <TableLoading /> : undefined}
        endSlot={emptyState}
      />
    </div>
  )
}
