import type { RowData } from '@tanstack/react-table'
import type { LegacyRow } from '@tanstack/react-table/legacy'
import type { ForwardedRef, HTMLAttributes, ReactElement } from 'react'
import { forwardRef } from 'react'
import { TableCell as UiTableCell, TableRow as UiTableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

export type TableRowExpandedProps<T extends RowData> = HTMLAttributes<HTMLTableRowElement> & {
  row: LegacyRow<T>
  testId: string
  renderSubComponent: (props: { row: LegacyRow<T> }) => ReactElement
}

export const TableRowExpanded = forwardRef(function TableRowExpandedInner<T extends RowData>(
  { row, testId, renderSubComponent, className, ...rest }: TableRowExpandedProps<T>,
  ref: ForwardedRef<HTMLTableRowElement>,
) {
  return (
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
}) as <T extends RowData>(props: TableRowExpandedProps<T> & { ref?: ForwardedRef<HTMLTableRowElement> }) => ReactElement
