import type { RowData } from '@tanstack/react-table'
import type { CSSProperties } from 'react'
import type { DataColumn } from '@/components/table/features'
import { useColumnLayout } from '@/components/table/column-layout'
import { useTableContext } from '@/components/table/providers/table-provider'

// These are the important styles to make sticky column pinning work!
// They apply to header, data and footer cells.
export const useCellStyles = <T extends RowData>(column: DataColumn<T>): CSSProperties | undefined => {
  const override = column.columnDef.meta?.style
  const isPinned = column.getIsPinned()
  const { scrollEdges } = useTableContext()
  const layout = useColumnLayout()

  if (!isPinned) {
    return override
  }

  const isLeft = isPinned === 'start'
  const isRight = isPinned === 'end'
  const isLastLeftPinnedColumn = isLeft && column.getIsLastColumn('start')
  const isFirstRightPinnedColumn = isRight && column.getIsFirstColumn('end')
  const isAtLeftEdge = isLeft && scrollEdges.atStart
  const isAtRightEdge = isRight && scrollEdges.atEnd
  const borderColor = isAtLeftEdge || isAtRightEdge ? 'var(--border)' : 'var(--foreground)'
  const border = `1px solid ${borderColor}`

  return {
    borderRight: isLastLeftPinnedColumn ? border : undefined,
    borderLeft: isFirstRightPinnedColumn ? border : undefined,
    left: isLeft ? `${layout?.starts.get(column.id) ?? column.getStart('start')}px` : undefined,
    right: isRight ? `${layout?.afters.get(column.id) ?? column.getAfter('end')}px` : undefined,
    position: 'sticky',
    zIndex: 1,
    ...override,
  }
}
