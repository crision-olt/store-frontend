import type { RowData } from '@tanstack/react-table'
import type { DataCell, DataHeader, DataTable } from '@/components/table/features'

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
export const hasFooter = <T extends RowData>(table: DataTable<T>) =>
  table
    .getFooterGroups()
    .flatMap((group) => group.headers.map((header) => header.column.columnDef.footer))
    .some(Boolean)

// A header has a left border when it starts a new column group. `previous` is the header rendered before it in the
// same header group; the caller passes it so each check is O(1) instead of searching the whole group.
export const hasHeaderBorderLeft = <T extends RowData, U = unknown>(
  header: DataHeader<T, U>,
  previous: DataHeader<T, unknown> | undefined,
) => previous !== undefined && (header.subHeaders.length > 0 || previous.column.parent?.id !== header.column.parent?.id)

// A cell has a left border when its column starts a new column group. `previous` is the cell rendered before it.
export const hasCellBorderLeft = <T extends RowData, U = unknown>(
  cell: DataCell<T, U>,
  previous: DataCell<T, unknown> | undefined,
) => previous !== undefined && previous.column.parent?.id !== cell.column.parent?.id
