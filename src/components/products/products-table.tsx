import { useLingui } from '@lingui/react/macro'
import {
  useTable,
  type ColumnFiltersState,
  type OnChangeFn,
  type SortingState,
} from '@tanstack/react-table'
import { Table, TableColumnVisibility, TableFilters } from '@/components/table'
import { tableFeatureSet } from '@/components/table/features'
import { TableFeedbackState } from '@/components/table/components/table-feedback-state'
import { TableLoading } from '@/components/table/components/table-loading'
import { cn } from '@/lib/utils'
import type { Category, Product, Subcategory } from '@/lib/products-api'
import { useProductColumns } from '@/components/products/products-table-columns'
import { getProductColumnLabels } from '@/components/products/products-table-columns.config'
import { getProductFilterFields } from '@/components/products/products-table-filters.config'
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
  const { t, i18n } = useLingui()

  const table = useTable({
    features: tableFeatureSet,
    columns: useProductColumns({ categories, subcategories, onCategoryChange }),
    data: products ?? emptyProducts,
    manualSorting: true,
    manualFiltering: true,
    enableMultiSort: false,
    enableSortingRemoval: false,
    initialState: { columnPinning: { start: ['name'], end: [] } },
    state: { sorting, columnFilters },
    onSortingChange,
    onColumnFiltersChange,
  })

  const rows = table.getRowModel().rows
  const filterFields = getProductFilterFields({ columnFilters, categories, subcategories, i18n })
  const removeFilter = (id: string) => onColumnFiltersChange((current) =>
    current.filter((filter) => filter.id !== id && !(id === 'category' && filter.id === 'subcategory')),
  )
  const emptyState = !isLoading && !isNotEmptyArray(rows) ? (
    <TableFeedbackState className="static h-80" title={t`No products found.`} />
  ) : undefined

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <TableFilters table={table} title={t`Product filters`} fields={filterFields} onRemoveFilter={removeFilter} />
        <TableColumnVisibility table={table} columnLabels={getProductColumnLabels(i18n)} />
      </div>
      <Table
        table={table}
        className={cn('h-96 rounded-lg border bg-card transition-opacity', isFetching && !isLoading && 'opacity-60')}
        feedbackState={isLoading ? <TableLoading /> : undefined}
        endSlot={emptyState}
      />
    </div>
  )
}
