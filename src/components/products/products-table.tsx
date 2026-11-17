import { useLingui } from '@lingui/react/macro'
import {
  useTable,
  type ColumnFiltersState,
  type OnChangeFn,
  type SortingState,
} from '@tanstack/react-table'
import { Table } from '@/components/table'
import { tableFeatureSet } from '@/components/table/features'
import { TableFeedbackState } from '@/components/table/components/table-feedback-state'
import { TableLoading } from '@/components/table/components/table-loading'
import { cn } from '@/lib/utils'
import type { Category, Product, Subcategory } from '@/lib/products-api'
import { useProductColumns } from '@/components/products/products-table-columns'

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
  const emptyState = !isLoading && rows.length === 0 ? (
    <TableFeedbackState className="static h-80" title={t`No products found.`} />
  ) : undefined

  return (
    <Table
      table={table}
      className={cn('h-96 rounded-lg border bg-card transition-opacity', isFetching && !isLoading && 'opacity-60')}
      feedbackState={isLoading ? <TableLoading /> : undefined}
      endSlot={emptyState}
    />
  )
}
