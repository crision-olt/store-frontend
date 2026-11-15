import type { RowData } from '@tanstack/react-table'
import type { LegacyRow } from '@tanstack/react-table/legacy'
import type { ForwardedRef, HTMLAttributes, MouseEventHandler, ReactElement } from 'react'
import { forwardRef } from 'react'
import { TableRowCell } from '@/components/table/components/table-row-cell'
import { TableRow as UiTableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

export type TableRowProps<T extends RowData> = Omit<HTMLAttributes<HTMLTableRowElement>, 'onClick'> & {
  row: LegacyRow<T>
  testId: string
  getClickRow?: (row: T) => MouseEventHandler | undefined
  getDblClickRow?: (row: T) => MouseEventHandler | undefined
  rowClassName?: (row: LegacyRow<T>) => string | undefined
  dataId?: string
  dataIndex?: number
}

export const TableRow = forwardRef(function TableRowInner<T extends RowData>(
  { row, testId, getClickRow, getDblClickRow, className, rowClassName, ...rest }: TableRowProps<T>,
  ref: ForwardedRef<HTMLTableRowElement>,
) {
  const isClickable = Boolean(getClickRow) || Boolean(getDblClickRow)

  return (
    <UiTableRow
      ref={ref}
      onClick={getClickRow?.(row.original)}
      onDoubleClick={getDblClickRow?.(row.original)}
      data-testid={`${testId}-row-${row.index}`}
      data-depth={row.depth}
      data-state={row.getIsSelected() ? 'selected' : undefined}
      data-expanded={row.getCanExpand() && row.getIsExpanded() ? true : undefined}
      className={cn(
        'group/row border-0 hover:bg-transparent',
        isClickable && 'cursor-pointer',
        className,
        rowClassName?.(row),
      )}
      {...rest}
    >
      {row.getVisibleCells().map((cell, index) => (
        <TableRowCell key={cell.id} testId={`${testId}-row-cell-${row.index}-${cell.column.id ?? index}`} cell={cell} />
      ))}
    </UiTableRow>
  )
}) as <T extends RowData>(props: TableRowProps<T> & { ref?: ForwardedRef<HTMLTableRowElement> }) => ReactElement
