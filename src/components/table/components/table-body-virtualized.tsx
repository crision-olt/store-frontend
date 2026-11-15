import type { RowData } from '@tanstack/react-table'
import type { DataRow, DataTable } from '@/components/table/features'
import type { Range } from '@tanstack/react-virtual'
import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual'
import type { ComponentType, MouseEventHandler, PropsWithChildren, ReactElement } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { TableRow } from '@/components/table/components/table-row'
import { TableRowExpanded } from '@/components/table/components/table-row-expanded'
import { useTableContext } from '@/components/table/providers/table-provider'
import { TableBody as UiTableBody } from '@/components/ui/table'

type FlatRow<T extends RowData> = { type: 'row' | 'sub'; row: DataRow<T> }

export type TableBodyVirtualizedProps<T extends RowData> = {
  table: DataTable<T>
  testId: string
  getClickRow?: (row: T) => MouseEventHandler | undefined
  getDblClickRow?: (row: T) => MouseEventHandler | undefined
  renderSubComponent?: (props: { row: DataRow<T> }) => ReactElement
  onChangeRenderedRows?: (rowIds: string[]) => void
  isHeaderSticky?: boolean
  isRowSticky?: (row: DataRow<T>) => boolean
  rowStickyOffset?: number
  rowClassName?: (row: DataRow<T>) => string | undefined
  RowProvider?: ComponentType<PropsWithChildren & { row: DataRow<T> }>
  overscan?: number
  estimateSize?: (index: number) => number
}

const defaultEstimateSize = () => 40 //default row height if not provided

const DefaultRowProvider = ({ children }: PropsWithChildren) => <>{children}</>

export const TableBodyVirtualized = <T extends RowData>({
  table,
  getClickRow,
  getDblClickRow,
  onChangeRenderedRows,
  isHeaderSticky,
  isRowSticky,
  rowStickyOffset = 0,
  rowClassName,
  RowProvider = DefaultRowProvider,
  overscan = 1,
  estimateSize = defaultEstimateSize,
  renderSubComponent,
  testId,
}: TableBodyVirtualizedProps<T>) => {
  const { scrollRef, tbodyRef, sizeRef } = useTableContext()
  const [isMounted, setIsMounted] = useState(false)

  const rows = table.getRowModel().rows

  const flatRows = useMemo<FlatRow<T>[]>(
    () =>
      rows.flatMap((row) => {
        const items: FlatRow<T>[] = [{ type: 'row', row }]
        if (row.getIsExpanded() && renderSubComponent) {
          items.push({ type: 'sub', row })
        }
        return items
      }),
    [rows, renderSubComponent],
  )

  const stickyIndexes = useMemo(() => {
    const stickyIndexes: number[] = []
    if (!isRowSticky) return stickyIndexes
    for (let i = flatRows.length - 1; i >= 0; i--) {
      if (flatRows[i].type === 'row' && isRowSticky(flatRows[i].row)) {
        stickyIndexes.push(i)
      }
    }
    return stickyIndexes
  }, [flatRows, isRowSticky])

  const getItemKey = useCallback(
    (index: number) => {
      const item = flatRows[index]
      return item.type === 'row' ? item.row.id : `${item.row.id}-sub`
    },
    [flatRows],
  )

  const currentStickyIndexRef = useRef<number | undefined>(undefined)

  const rangeExtractor = useCallback(
    (range: Range) => {
      const defaultRange = defaultRangeExtractor(range)
      currentStickyIndexRef.current = stickyIndexes.find((index) => range.startIndex >= index)
      if (currentStickyIndexRef.current === undefined) return defaultRange
      const next = new Set([currentStickyIndexRef.current, ...defaultRange])
      return Array.from(next).sort((a, b) => a - b)
    },
    [stickyIndexes],
  )

  const isCurrentSticky = useCallback((index: number) => index === currentStickyIndexRef.current, [])

  const isSticky = useCallback((index: number) => stickyIndexes.includes(index), [stickyIndexes])

  const getScrollElement = useCallback(() => scrollRef.current, [scrollRef])

  const measureElement = useCallback((element: HTMLElement) => element.getBoundingClientRect().height, [])

  // Keep the latest callback without re-creating the observer when the parent passes a new function
  const onChangeRenderedRowsRef = useRef(onChangeRenderedRows)
  useEffect(() => {
    onChangeRenderedRowsRef.current = onChangeRenderedRows
  })
  const hasOnChangeRenderedRows = Boolean(onChangeRenderedRows)

  const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    count: flatRows.length,
    estimateSize, //estimate row height for accurate scrollbar dragging
    enabled: isMounted,
    getScrollElement,
    getItemKey,
    measureElement,
    scrollMargin: (sizeRef.current?.offsetTop ?? 0) - rowStickyOffset,
    overscan,
    useAnimationFrameWithResizeObserver: true,
    rangeExtractor,
  })

  useEffect(() => {
    if (!scrollRef.current) return
    setIsMounted(true)
  }, [scrollRef])

  useEffect(() => {
    // Detect with MutationObserver when tbody child nodes are rendered to trigger onChange
    if (!isMounted || !tbodyRef.current || !hasOnChangeRenderedRows) return
    const observer = new MutationObserver((mutations) => {
      const items: string[] = []
      mutations[0]?.target?.childNodes?.forEach((node) => {
        const row = node as HTMLElement
        const item = row.dataset.id
        if (item !== undefined) items.push(item)
      })
      onChangeRenderedRowsRef.current?.(items)
    })
    observer.observe(tbodyRef.current, { childList: true, attributes: true, attributeFilter: ['data-id'] })
    return () => {
      observer.disconnect()
    }
  }, [isMounted, tbodyRef, hasOnChangeRenderedRows])

  if (!isMounted) return null

  return (
    <UiTableBody ref={tbodyRef} className="relative" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
        const item = flatRows[virtualRow.index]

        if (item.type === 'sub') {
          return (
            <TableRowExpanded
              key={`${item.row.id}-sub`}
              ref={rowVirtualizer.measureElement}
              row={item.row}
              renderSubComponent={renderSubComponent!}
              style={{
                position: 'absolute',
                transform: `translateY(${virtualRow.start - rowVirtualizer.options.scrollMargin}px)`,
                order: virtualRow.index,
              }}
              data-index={virtualRow.index}
              testId={testId}
            />
          )
        }

        return (
          <RowProvider key={item.row.id} row={item.row}>
            <TableRow
              ref={rowVirtualizer.measureElement}
              row={item.row}
              getClickRow={getClickRow}
              getDblClickRow={getDblClickRow}
              rowClassName={rowClassName}
              style={
                isCurrentSticky(virtualRow.index)
                  ? {
                      position: 'sticky',
                      width: '100%',
                      left: 0,
                      top: `${rowStickyOffset + (isHeaderSticky ? (tbodyRef.current?.offsetTop ?? 0) : 0)}px`,
                      height: `${virtualRow.size}px`,
                      order: virtualRow.index,
                      zIndex: 1,
                    }
                  : {
                      position: 'absolute',
                      transform: `translateY(${virtualRow.start - rowVirtualizer.options.scrollMargin}px)`,
                      order: virtualRow.index,
                      zIndex: isSticky(virtualRow.index) ? 2 : undefined,
                    }
              }
              data-id={item.row.id}
              data-index={virtualRow.index}
              testId={testId}
            />
          </RowProvider>
        )
      })}
    </UiTableBody>
  )
}
