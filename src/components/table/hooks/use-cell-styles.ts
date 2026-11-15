import type { RowData } from '@tanstack/react-table'
import type { CSSProperties } from 'react'
import type { LegacyColumn } from '@tanstack/react-table/legacy'
import { useColumnLayout } from '@/components/table/column-layout'
import { useTableContext } from '@/components/table/providers/table-provider'

// These are the important styles to make sticky column pinning work!
// CSS will should apply to head cells, data cells and footer cells.
export const useCellStyles = <T extends RowData>(column: LegacyColumn<T>): CSSProperties | undefined => {
  const override = column.columnDef.meta?.style
  const isPinned = column.getIsPinned()
  const { scrollPosition } = useTableContext()
  const layout = useColumnLayout()

  if (!isPinned) {
    return override
  }

  const isLeft = isPinned === 'start'
  const isRight = isPinned === 'end'
  const isLastLeftPinnedColumn = isLeft && column.getIsLastColumn('start')
  const isFirstRightPinnedColumn = isRight && column.getIsFirstColumn('end')
  const isAtLeftEdge = isLeft && scrollPosition.scrollLeft === 0
  const isAtRightEdge = isRight && scrollPosition.offsetWidth + scrollPosition.scrollLeft >= scrollPosition.scrollWidth
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
