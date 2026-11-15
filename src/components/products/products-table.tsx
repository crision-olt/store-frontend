import { useLingui } from '@lingui/react/macro'
import {
  useTable,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
} from '@tanstack/react-table'
import { Table } from '@/components/table'
import { tableFeatureSet } from '@/components/table/features'
import { TableFeedbackState } from '@/components/table/components/table-feedback-state'
import { TableLoading } from '@/components/table/components/table-loading'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { Product } from '@/lib/products-api'
import { productColumns } from '@/components/products/products-table-columns'

const emptyProducts: Product[] = []

const PAGE_SIZES = [10, 25, 50]

type Props = {
  products: Product[] | undefined
  total: number
  isLoading: boolean
  isFetching: boolean
  sorting: SortingState
  onSortingChange: OnChangeFn<SortingState>
  pagination: PaginationState
  onPaginationChange: OnChangeFn<PaginationState>
}

export function ProductsTable({
  products,
  total,
  isLoading,
  isFetching,
  sorting,
  onSortingChange,
  pagination,
  onPaginationChange,
}: Props) {
  const { t } = useLingui()

  const table = useTable({
    features: tableFeatureSet,
    columns: productColumns,
    data: products ?? emptyProducts,
    manualSorting: true,
    enableMultiSort: false,
    enableSortingRemoval: false,
    state: { sorting },
    onSortingChange,
  })

  const { pageIndex, pageSize } = pagination
  const firstRow = total === 0 ? 0 : pageIndex * pageSize + 1
  const lastRow = Math.min((pageIndex + 1) * pageSize, total)
  const page = pageIndex + 1
  const pageCount = Math.max(Math.ceil(total / pageSize), 1)
  const rows = table.getRowModel().rows
  const feedbackState = isLoading ? (
    <TableLoading />
  ) : rows.length === 0 ? (
    <TableFeedbackState title={t`No products found.`} />
  ) : undefined

  return (
    <div className="flex flex-col gap-4">
      <Table
        table={table}
        isVirtualized={false}
        className={cn('h-96 rounded-lg border bg-card transition-opacity', isFetching && !isLoading && 'opacity-60')}
        feedbackState={feedbackState}
      />

      <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
        <p className="text-muted-foreground" aria-live="polite">
          {t`Showing ${firstRow}–${lastRow} of ${total}`}
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{t`Rows per page`}</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                const nextPageSize = Number(value)
                onPaginationChange((current) => ({
                  pageIndex: Math.floor((current.pageIndex * current.pageSize) / nextPageSize),
                  pageSize: nextPageSize,
                }))
              }}
            >
              <SelectTrigger size="sm" aria-label={t`Rows per page`} className="w-20">
                <SelectValue>{pageSize}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <span className="text-muted-foreground">{t`Page ${page} of ${pageCount}`}</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPaginationChange((current) => ({ ...current, pageIndex: current.pageIndex - 1 }))}
              disabled={pageIndex === 0}
            >
              {t`Previous`}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPaginationChange((current) => ({ ...current, pageIndex: current.pageIndex + 1 }))}
              disabled={page >= pageCount}
            >
              {t`Next`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
