import { useLingui } from '@lingui/react/macro'
import { useMemo, useState } from 'react'
import { useMutationState, type Mutation } from '@tanstack/react-query'
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
import type { Category, Product, ProductInput, Subcategory } from '@/lib/products-api'
import { useProductColumns, type ProductTableRow } from '@/components/products/products-table-columns'
import { EditProductDialog } from '@/components/products/create-product-dialog'
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
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const pending = useMutationState({
    filters: { mutationKey: ['create-product'], status: 'pending' },
    select: (mutation: Mutation<unknown, Error, ProductInput>) => ({
      input: mutation.state.variables,
      submittedAt: mutation.state.submittedAt,
      id: mutation.mutationId,
    }),
  })
  const data = useMemo<ProductTableRow[]>(() => pending.length === 0 ? products ?? emptyProducts : [
    ...pending.flatMap(({ input, submittedAt, id }) => input ? [{
      ...input,
      // Mutation IDs are display-only keys; server product IDs stay untouched.
      id: -id,
      categoryName: categories.find((category) => category.id === input.categoryId)?.name ?? String(input.categoryId),
      subcategoryName: input.subcategoryId === null ? null
        : subcategories.find((subcategory) => subcategory.id === input.subcategoryId)?.name ?? String(input.subcategoryId),
      created_at: new Date(submittedAt).toISOString(),
      isPending: true,
    }] : []),
    ...(products ?? emptyProducts),
  ], [pending, products, categories, subcategories])

  const table = useTable({
    features: tableFeatureSet,
    columns: useProductColumns({ categories, subcategories, onCategoryChange, onEditProduct: setEditingProduct }),
    data,
    getRowId: ({ id }) => String(id),
    manualSorting: true,
    manualFiltering: true,
    columnResizeMode: 'onChange',
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
    <TableFeedbackState className="static h-24" title={t`No products found.`} />
  ) : undefined

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <TableFilters table={table} title={t`Product filters`} fields={filterFields} onRemoveFilter={removeFilter} />
        <TableColumnVisibility table={table} columnLabels={getProductColumnLabels(i18n)} excludedColumnIds={['actions']} />
      </div>
      <Table
        table={table}
        className={cn(
          'h-auto rounded-lg border bg-card transition-opacity [&>div]:max-h-96',
          isLoading && pending.length === 0 && 'h-40',
          isFetching && !isLoading && 'opacity-60',
        )}
        feedbackState={isLoading && pending.length === 0 ? <TableLoading /> : undefined}
        endSlot={emptyState}
        rowClassName={(row) => row.original.isPending ? 'bg-muted/40' : undefined}
      />
      {editingProduct && <EditProductDialog product={editingProduct} onClose={() => setEditingProduct(null)} />}
    </div>
  )
}
