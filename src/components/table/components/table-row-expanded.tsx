import type { RowData } from '@tanstack/react-table'
import type { DataRow } from '@/components/table/features'
import type { HTMLAttributes, ReactElement, Ref } from 'react'
import { TableCell as UiTableCell, TableRow as UiTableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

export type TableRowExpandedProps<T extends RowData> = HTMLAttributes<HTMLTableRowElement> & {
  ref?: Ref<HTMLTableRowElement>
  row: DataRow<T>
  testId: string
  renderSubComponent: (props: { row: DataRow<T> }) => ReactElement
}

export const TableRowExpanded = <T extends RowData>({
  ref,
  row,
  testId,
  renderSubComponent,
  className,
  ...rest
}: TableRowExpandedProps<T>) => (
  <UiTableRow
    ref={ref}
    data-testid={`${testId}-expanded-row-${row.index}`}
    className={cn('group/row w-(--total-size) border-0 hover:bg-transparent', className)}
    {...rest}
  >
    <UiTableCell
      data-testid={`${testId}-expanded-row-cell-${row.index}`}
      className="box-border w-full bg-card p-0 text-left"
      colSpan={row.getVisibleCells().length}
    >
      {renderSubComponent({ row })}
    </UiTableCell>
  </UiTableRow>
)
