import type { RowData } from '@tanstack/react-table'
import type { DataColumn, DataTable } from '@/components/table/features'
import { createContext, useContext } from 'react'
import { isNotEmptyArray } from '@/utils/is-not-empty-array'

// Same defaults as TanStack Table's column sizing
const DEFAULT_SIZE = 150
const DEFAULT_MIN_SIZE = 20
const DEFAULT_MAX_SIZE = Number.MAX_SAFE_INTEGER

export type ColumnLayout = {
  /** Width of the `<table>`: `auto`, `100%` (full mode) or the sum of the column sizes in px (fixed mode). */
  totalSize: string
  /** Rendered width in px of every column (a group column is the sum of its visible leaf columns). */
  sizes: Map<string, number>
  /** Offset of a column from the start of its pinned region (start, center or end). */
  starts: Map<string, number>
  /** Offset of a column from the end of its pinned region. */
  afters: Map<string, number>
  /** Offset of a column from the start of the table, with pinned columns first. */
  allStarts: Map<string, number>
}

export const ColumnLayoutContext = createContext<ColumnLayout | null>(null)

export const useColumnLayout = () => useContext(ColumnLayoutContext)

/**
 * Resolves the width of every column for the available `width`, following `sizeMode` and the `meta.width` of the columns.
 *
 * TanStack Table v9 caches `column.getSize()`, so the computed sizes are not written to the column definitions: this is
 * the single source of truth for the CSS variables, the pinned offsets and the drag placeholder.
 */
export const computeColumnLayout = <T extends RowData>(
  table: DataTable<T>,
  sizeMode: 'auto' | 'fixed' | 'full',
  width: number,
): ColumnLayout => {
  const columnSizing = table.state.columnSizing
  const flatColumns = table.getAllFlatColumns()
  const computed = new Map<string, number | undefined>()
  let totalSize = 'auto'

  if (sizeMode !== 'auto' && width > 0) {
    const columns = flatColumns.filter((column) => column.getIsVisible())
    // Pixel widths are subtracted from the table width; percentages are applied to what is left
    let totalWidth = width

    columns.forEach((column) => {
      const meta = column.columnDef.meta
      if (meta?.width) {
        const metaWidth = Number.parseFloat(meta.width)
        if (!Number.isNaN(metaWidth)) {
          if (!meta.width.endsWith('%')) totalWidth -= metaWidth
          return
        }
      }
      totalWidth -= column.columnDef.size ?? 0
    })

    columns.forEach((column) => {
      const meta = column.columnDef.meta
      const metaWidth = meta?.width ? Number.parseFloat(meta.width) : Number.NaN
      if (!Number.isNaN(metaWidth)) {
        computed.set(column.id, meta?.width?.endsWith('%') ? (totalWidth * metaWidth) / 100 : metaWidth)
      } else if (column.columnDef.size) {
        computed.set(column.id, column.columnDef.size)
      }
    })

    const columnsWidth = columns.reduce((acc, column) => acc + (computed.get(column.id) ?? 0), 0)
    if (sizeMode === 'full') {
      totalSize = '100%'
      if (columnsWidth > 0 && width > columnsWidth) {
        const factor = width / columnsWidth
        columns.forEach((column) => computed.set(column.id, (computed.get(column.id) ?? 0) * factor))
      }
    }
  }

  const leafSize = (column: DataColumn<T>) => {
    const size = columnSizing[column.id] ?? computed.get(column.id) ?? column.columnDef.size ?? DEFAULT_SIZE
    return Math.min(
      Math.max(column.columnDef.minSize ?? DEFAULT_MIN_SIZE, size),
      column.columnDef.maxSize ?? DEFAULT_MAX_SIZE,
    )
  }

  const sizes = new Map<string, number>()
  for (const column of flatColumns) {
    sizes.set(
      column.id,
      column.columns.length === 0
        ? leafSize(column)
        : column
            .getLeafColumns()
            .filter((leaf) => leaf.getIsVisible())
            .reduce((acc, leaf) => acc + leafSize(leaf), 0),
    )
  }

  const starts = new Map<string, number>()
  const afters = new Map<string, number>()
  const allStarts = new Map<string, number>()
  const regions = [
    table.getStartVisibleLeafColumns(),
    table.getCenterVisibleLeafColumns(),
    table.getEndVisibleLeafColumns(),
  ]
  let allStart = 0
  for (const region of regions) {
    let start = 0
    let after = region.reduce((acc, column) => acc + (sizes.get(column.id) ?? 0), 0)
    for (const column of region) {
      const size = sizes.get(column.id) ?? 0
      after -= size
      starts.set(column.id, start)
      afters.set(column.id, after)
      allStarts.set(column.id, allStart)
      start += size
      allStart += size
    }
  }

  // A group column starts where its first leaf starts and ends where its last leaf ends
  for (const column of flatColumns) {
    if (column.columns.length === 0) continue
    const leaves = column.getLeafColumns().filter((leaf) => leaf.getIsVisible())
    if (!isNotEmptyArray(leaves)) continue
    starts.set(column.id, starts.get(leaves[0].id) ?? 0)
    allStarts.set(column.id, allStarts.get(leaves[0].id) ?? 0)
    afters.set(column.id, afters.get(leaves[leaves.length - 1].id) ?? 0)
  }

  // In fixed mode the table is exactly as wide as its visible columns
  if (sizeMode === 'fixed' && width > 0) {
    const leaves = flatColumns.filter((column) => column.columns.length === 0 && column.getIsVisible())
    totalSize = `${leaves.reduce((acc, column) => acc + (sizes.get(column.id) ?? 0), 0)}px`
  }

  return { totalSize, sizes, starts, afters, allStarts }
}
