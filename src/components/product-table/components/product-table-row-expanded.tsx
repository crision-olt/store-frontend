import type { RowData } from '@tanstack/react-table'
import type { LegacyRow } from '@tanstack/react-table/legacy'
import type { ForwardedRef, HTMLAttributes, ReactElement } from 'react'
import { forwardRef } from 'react'
import { TableCell, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

export type ProductTableRowExpandedProps<T extends RowData> = HTMLAttributes<HTMLTableRowElement> & {
  row: LegacyRow<T>
  testId: string
  renderSubComponent: (props: { row: LegacyRow<T> }) => ReactElement
}

export const ProductTableRowExpanded = forwardRef(function ProductTableRowExpandedInner<T extends RowData>(
  { row, testId, renderSubComponent, className, ...rest }: ProductTableRowExpandedProps<T>,
  ref: ForwardedRef<HTMLTableRowElement>,
) {
  return (
    <TableRow
      ref={ref}
      data-testid={`${testId}-expanded-row-${row.index}`}
      className={cn('group/row w-(--total-size) border-0 hover:bg-transparent', className)}
      {...rest}
    >
      <TableCell
        data-testid={`${testId}-expanded-row-cell-${row.index}`}
        className="box-border w-full bg-card p-0 text-left"
        colSpan={row.getVisibleCells().length}
      >
        {renderSubComponent({ row })}
      </TableCell>
    </TableRow>
  )
}) as <T extends RowData>(
  props: ProductTableRowExpandedProps<T> & { ref?: ForwardedRef<HTMLTableRowElement> },
) => ReactElement
