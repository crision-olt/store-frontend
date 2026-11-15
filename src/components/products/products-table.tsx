import { useLingui } from '@lingui/react/macro'
import {
  useTable,
  type OnChangeFn,
  type SortingState,
} from '@tanstack/react-table'
import { Table } from '@/components/table'
import { tableFeatureSet } from '@/components/table/features'
import { TableFeedbackState } from '@/components/table/components/table-feedback-state'
import { TableLoading } from '@/components/table/components/table-loading'
import { cn } from '@/lib/utils'
import type { Product } from '@/lib/products-api'
import { productColumns } from '@/components/products/products-table-columns'

const emptyProducts: Product[] = []

type Props = {
  products: Product[] | undefined
  isLoading: boolean
  isFetching: boolean
  sorting: SortingState
  onSortingChange: OnChangeFn<SortingState>
}

export function ProductsTable({
  products,
  isLoading,
  isFetching,
  sorting,
  onSortingChange,
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

  const rows = table.getRowModel().rows
  const feedbackState = isLoading ? (
    <TableLoading />
  ) : rows.length === 0 ? (
    <TableFeedbackState title={t`No products found.`} />
  ) : undefined

  return (
    <Table
      table={table}
      className={cn('h-96 rounded-lg border bg-card transition-opacity', isFetching && !isLoading && 'opacity-60')}
      feedbackState={feedbackState}
    />
  )
}
