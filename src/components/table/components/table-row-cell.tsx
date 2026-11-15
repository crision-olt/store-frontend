import type { RowData } from '@tanstack/react-table'
import { flexRender } from '@tanstack/react-table'
import type { LegacyCell } from '@tanstack/react-table/legacy'
import type { ReactNode } from 'react'
import { EllipsisTooltip } from '@/components/table/components/table-tooltip'
import { useCellStyles } from '@/components/table/hooks/use-cell-styles'
import { ALIGN_CLASSES, hasCellBorderLeft } from '@/components/table/utils'
import { TableCell as UiTableCell } from '@/components/ui/table'
import { cn } from '@/lib/utils'

export type TableRowCellTooltipProps = {
  testId?: string
  children: ReactNode
}

export const TableRowCellTooltip = ({
  testId = 'product-table-row-cell-tooltip',
  children,
}: TableRowCellTooltipProps) => (
  <EllipsisTooltip
    testId={testId}
    content={children ?? ''}
    wrapperClassName="block"
    ellipsisSlot="cell-ellipsis"
    disabled={!children}
  >
    {children}
  </EllipsisTooltip>
)

export type TableRowCellProps<T extends RowData> = {
  cell: LegacyCell<T, unknown>
  testId?: string
  className?: string
}

export const TableRowCell = <T extends RowData>({
  cell,
  testId = 'product-table-row-cell',
  className,
}: TableRowCellProps<T>) => {
  const meta = cell.column.columnDef.meta
  const styles = useCellStyles(cell.column)
  const content = flexRender(cell.column.columnDef.cell, cell.getContext())

  return (
    <UiTableCell
      data-testid={testId}
      className={cn(
        'box-border border-t bg-card whitespace-normal break-words group-first/row:border-t-0 group-hover/row:bg-muted group-data-[state=selected]/row:bg-accent',
        ALIGN_CLASSES[meta?.align ?? 'left'],
        hasCellBorderLeft(cell) && 'border-l',
        meta?.textEllipsis && 'text-ellipsis **:data-[slot=cell-ellipsis]:truncate',
        className,
        meta?.className,
      )}
      style={{
        width: `var(--col-${cell.column.id}-size)`,
        ...styles,
      }}
    >
      {meta?.enableCellTooltip ? (
        <TableRowCellTooltip testId={`${testId}-ellipsis-tooltip`}>{content}</TableRowCellTooltip>
      ) : (
        <div className="block">{content}</div>
      )}
    </UiTableCell>
  )
}
