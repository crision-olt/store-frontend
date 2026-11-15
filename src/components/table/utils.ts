import type { RowData } from '@tanstack/react-table'
import type { LegacyCell, LegacyHeader, LegacyTable } from '@tanstack/react-table/legacy'

export type CellAlign = 'center' | 'left' | 'right'

// Text alignment for a cell and for its flex content wrapper
export const ALIGN_CLASSES: Record<CellAlign, string> = {
  left: 'justify-start text-left',
  center: 'justify-center text-center',
  right: 'justify-end text-right',
}

// Tailwind needs the full class names to be present in the source
export const LINE_CLAMP_CLASSES = { 1: 'line-clamp-1 whitespace-normal', 2: 'line-clamp-2 whitespace-normal' }

// Has footer if any of the footer cells has a defined footer
export const hasFooter = <T extends RowData>(table: LegacyTable<T>) =>
  table
    .getFooterGroups()
    .flatMap((group) => group.headers.map((header) => header.column.columnDef.footer))
    .some(Boolean)

// Check if a header has border left
export const hasHeaderBorderLeft = <T extends RowData, U = unknown>(header: LegacyHeader<T, U>) => {
  const headers = header.headerGroup?.headers ?? []
  const index = headers.findIndex((h) => h.id === header.id)
  if (index <= 0) return false
  const previousHeader = headers[index - 1]
  return header.subHeaders.length > 0 || previousHeader.column.parent?.id !== header.column.parent?.id
}

// Check if a cell has border left
export const hasCellBorderLeft = <T extends RowData, U = unknown>(cell: LegacyCell<T, U>) => {
  const visibleCells = cell.row.getVisibleCells()
  const index = visibleCells.findIndex((c) => c.id === cell.id)
  if (index <= 0) return false
  const previousCell = visibleCells[index - 1]
  return previousCell.column.parent?.id !== cell.column.parent?.id
}
