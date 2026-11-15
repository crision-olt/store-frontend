import type { RowData } from '@tanstack/react-table'
import { flexRender } from '@tanstack/react-table'
import type { LegacyHeader } from '@tanstack/react-table/legacy'
import { useCellStyles } from '@/components/table/hooks/use-cell-styles'
import { ALIGN_CLASSES, LINE_CLAMP_CLASSES, hasHeaderBorderLeft } from '@/components/table/utils'
import { TableCell as UiTableCell } from '@/components/ui/table'
import { cn } from '@/lib/utils'

export type TableFooterCellProps<T extends RowData, U = unknown> = {
  footer: LegacyHeader<T, U>
  testId?: string
}

export const TableFooterCell = <T extends RowData>({
  footer,
  testId = 'product-table-footer-cell',
}: TableFooterCellProps<T>) => {
  const meta = footer.column.columnDef.meta
  const styles = useCellStyles(footer.column)
  const align = ALIGN_CLASSES[meta?.align ?? 'left']
  const lineClamp = meta?.lineClamp ? LINE_CLAMP_CLASSES[meta.lineClamp] : undefined

  return (
    <UiTableCell
      data-testid={testId}
      className={cn(
        'border-t bg-card font-bold whitespace-normal break-words empty:contents has-[[data-slot=footer-cell-content]:empty]:contents',
        align,
        hasHeaderBorderLeft(footer) && 'border-l',
        meta?.className,
      )}
      colSpan={footer.colSpan > 1 ? footer.colSpan : undefined}
      style={{
        width: `var(--header-${footer.id}-size)`,
        ...styles,
      }}
    >
      {footer.isPlaceholder ? null : (
        <div data-slot="footer-cell-content" className={cn('empty:hidden', align, lineClamp)}>
          {flexRender(footer.column.columnDef.footer, footer.getContext())}
        </div>
      )}
    </UiTableCell>
  )
}
