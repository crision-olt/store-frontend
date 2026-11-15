import type { RowData } from '@tanstack/react-table'
import type { LegacyRow } from '@tanstack/react-table/legacy'
import type { HTMLAttributes, MouseEventHandler, Ref } from 'react'
import { TableRowCell } from '@/components/table/components/table-row-cell'
import { hasCellBorderLeft } from '@/components/table/utils'
import { TableRow as UiTableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

export type TableRowProps<T extends RowData> = Omit<HTMLAttributes<HTMLTableRowElement>, 'onClick'> & {
  ref?: Ref<HTMLTableRowElement>
  row: LegacyRow<T>
  testId: string
  getClickRow?: (row: T) => MouseEventHandler | undefined
  getDblClickRow?: (row: T) => MouseEventHandler | undefined
  rowClassName?: (row: LegacyRow<T>) => string | undefined
  dataId?: string
  dataIndex?: number
}

export const TableRow = <T extends RowData>({
  ref,
  row,
  testId,
  getClickRow,
  getDblClickRow,
  className,
  rowClassName,
  ...rest
}: TableRowProps<T>) => {
  const isClickable = Boolean(getClickRow) || Boolean(getDblClickRow)
  const cells = row.getVisibleCells()

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
      {cells.map((cell, index) => (
        <TableRowCell
          key={cell.id}
          testId={`${testId}-row-cell-${row.index}-${cell.column.id ?? index}`}
          cell={cell}
          hasBorderLeft={hasCellBorderLeft(cell, cells[index - 1])}
        />
      ))}
    </UiTableRow>
  )
}
