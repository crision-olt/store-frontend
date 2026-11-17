import { useLingui } from '@lingui/react/macro'
import { ChevronDownIcon, ChevronUpIcon, SlidersHorizontalIcon, XIcon } from 'lucide-react'
import { useId, useRef, useState } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { columnFiltersToProductFilters, hasActiveFilters } from '@/lib/product-filters'
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
  const filters = columnFiltersToProductFilters(columnFilters)
  const [filtersVisible, setFiltersVisible] = useState(() => hasActiveFilters(filters))
  const filtersId = useId()
  const inputRef = useRef<HTMLInputElement | null>(null)

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
    { id: 'name', label: t`Search`, value: filters.search },
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
  const activeFilters = filterFields.filter((field) => field.value !== '')
  const removeFilter = (id: string) => onColumnFiltersChange((current) =>
    current.filter((filter) => filter.id !== id && !(id === 'category' && filter.id === 'subcategory')),
  )
  const emptyState = !isLoading && rows.length === 0 ? (
    <TableFeedbackState className="static h-80" title={t`No products found.`} />
  ) : undefined

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-expanded={filtersVisible}
          aria-controls={filtersId}
          onClick={() => setFiltersVisible((visible) => !visible)}
        >
          <SlidersHorizontalIcon aria-hidden="true" />
          {t`Filters`}
          {activeFilters.length > 0 && <Badge variant="secondary">{activeFilters.length}</Badge>}
          {filtersVisible ? <ChevronUpIcon aria-hidden="true" /> : <ChevronDownIcon aria-hidden="true" />}
        </Button>
        {activeFilters.length > 0 && (
          <>
            <div role="group" aria-label={t`Active filters`} className="flex min-w-0 flex-wrap gap-1.5">
              {activeFilters.map(({ id, label, value }) => (
                <Button
                  key={id}
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="min-w-0 max-w-full font-normal"
                  aria-label={t`Remove filter: ${label}`}
                  title={`${label}: ${value}`}
                  onClick={() => removeFilter(id)}
                >
                  <span className="max-w-64 truncate"><span className="text-muted-foreground">{label}:</span> {value}</span>
                  <XIcon aria-hidden="true" />
                </Button>
              ))}
            </div>
            <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={() => onColumnFiltersChange([])}>
              {t`Clear filters`}
            </Button>
          </>
        )}
      </div>
      <section id={filtersId} aria-label={t`Product filters`} hidden={!filtersVisible}>
        {filtersVisible && (
          <div className="grid grid-cols-1 gap-4 rounded-lg border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr_1fr]">
            {table.getFlatHeaders().map((header) => {
              const Filter = header.column.columnDef.meta?.Filter
              const field = filterFields.find((item) => item.id === header.column.id)
              if (!Filter || !field) return null
              return (
                <div key={header.id} role="group" aria-label={field.label} className="flex min-w-0 flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">{field.label}</span>
                  <Filter inputRef={inputRef} header={header} />
                </div>
              )
            })}
          </div>
        )}
      </section>
      <Table
        table={table}
        className={cn('h-96 rounded-lg border bg-card transition-opacity', isFetching && !isLoading && 'opacity-60')}
        feedbackState={isLoading ? <TableLoading /> : undefined}
        endSlot={emptyState}
      />
    </div>
  )
}
