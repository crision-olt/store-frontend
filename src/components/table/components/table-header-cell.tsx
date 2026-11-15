import type { RowData } from '@tanstack/react-table'
import { useLingui } from '@lingui/react/macro'
import { useSortable } from '@dnd-kit/react/sortable'
import { flexRender, type SortDirection } from '@tanstack/react-table'
import type { DataHeader } from '@/components/table/features'
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, SearchIcon, XIcon } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { EllipsisTooltip } from '@/components/table/components/table-tooltip'
import { TextInputFilter } from '@/components/table/components/filters/text-input-filter'
import { useCellStyles } from '@/components/table/hooks/use-cell-styles'
import { ALIGN_CLASSES, LINE_CLAMP_CLASSES } from '@/components/table/utils'
import { Button } from '@/components/ui/button'
import { TableHead as UiTableHead } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export type TableHeaderCellProps<T extends RowData, U = unknown> = {
  header: DataHeader<T, U>
  /** Whether the cell starts a new column group (see `hasHeaderBorderLeft`). */
  hasBorderLeft?: boolean
  testId?: string
  onSort?: (columnId: string, state: SortDirection | false) => void
  onShowFilter?: (columnId: string) => void
  enableColumnOrdering?: boolean
}

const SortedIcon = ({ isSorted }: { isSorted: SortDirection | false }) => {
  if (isSorted === 'asc') return <ArrowUpIcon />
  if (isSorted === 'desc') return <ArrowDownIcon />
  return <ArrowUpDownIcon />
}

export const TableHeaderCell = <T extends RowData>({
  header,
  hasBorderLeft = false,
  testId = 'table-header-cell',
  onSort,
  onShowFilter,
  enableColumnOrdering = false,
}: TableHeaderCellProps<T>) => {
  const { t } = useLingui()
  const meta = header.column.columnDef.meta
  const isSorted = header.column.getIsSorted()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const canSort = header.column.getCanSort()
  const canFilter = meta?.showFilter && header.column.getCanFilter()
  // A filter that is already active (initial state, URL...) starts open so the user can see and clear it
  const [isFilterVisible, setIsFilterVisible] = useState(() =>
    Boolean(canFilter && header.column.getFilterValue() !== undefined),
  )
  const focusFilterOnOpenRef = useRef(false)
  const nextSortingOrder = header.column.getNextSortingOrder()
  const cellStyles = useCellStyles(header.column)
  const isResizing = header.column.getIsResizing()
  const isColumnOrderable = enableColumnOrdering && !header.column.getIsPinned() && !isResizing && !isFilterVisible
  // Columns can only be reordered among their siblings: the children of a group, or the top level columns and groups.
  // Placeholder cells (the empty cells above a column in a grouped header) repeat the id of their column, so they get
  // their own id and are not draggable.
  const groupId = header.column.parent?.id ?? 'root'
  const {
    ref: sortableRef,
    handleRef,
    isDragSource,
  } = useSortable({
    id: header.isPlaceholder ? header.id : header.column.id,
    index: header.column.getIndex(),
    group: groupId,
    type: groupId,
    accept: groupId,
    disabled: !isColumnOrderable || header.isPlaceholder,
  })

  const Filter = meta?.Filter ?? TextInputFilter
  const content = flexRender(header.column.columnDef.header, header.getContext())
  const align = ALIGN_CLASSES[meta?.align ?? 'left']
  const lineClamp = meta?.lineClamp ? LINE_CLAMP_CLASSES[meta.lineClamp] : undefined
  const sortLabel =
    nextSortingOrder === 'asc' ? t`Sort ascending` : nextSortingOrder === 'desc' ? t`Sort descending` : t`Clear sorting`

  const handleHideFilter = useCallback(() => {
    header.column.setFilterValue(undefined)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
    setIsFilterVisible(false)
  }, [header.column])

  const handleShowFilter = useCallback(() => {
    onShowFilter?.(header.id)
    focusFilterOnOpenRef.current = true
    setIsFilterVisible(true)
  }, [onShowFilter, header.id])

  // Custom filters receive `inputRef`, so focusing here works for them too
  useEffect(() => {
    if (!isFilterVisible || !focusFilterOnOpenRef.current) return
    focusFilterOnOpenRef.current = false
    inputRef.current?.focus()
  }, [isFilterVisible])

  const handleSort = useCallback(
    (event: unknown) => {
      onSort?.(header.id, nextSortingOrder)
      const sortingFn = header.column.getToggleSortingHandler()
      sortingFn?.(event)
    },
    [onSort, header.id, nextSortingOrder, header.column],
  )

  return (
    <UiTableHead
      ref={sortableRef}
      data-testid={testId}
      data-resizing={isResizing}
      data-dragging={isDragSource}
      className={cn(
        'group/th relative py-0 whitespace-normal break-words',
        align,
        hasBorderLeft && 'border-l',
        isColumnOrderable && 'cursor-grab',
        isDragSource && 'z-5 outline-1 -outline-offset-1 outline-dotted outline-muted-foreground',
        '[[data-resizing=true]+&_[data-sort=false]]:opacity-0!',
        meta?.className,
      )}
      colSpan={header.colSpan > 1 ? header.colSpan : undefined}
      style={{
        width: `var(--header-${header.id}-size)`,
        ...cellStyles,
      }}
    >
      {header.isPlaceholder ? null : (
        <div className="flex min-h-8 w-full items-center justify-between" ref={handleRef}>
          {canFilter && isFilterVisible ? (
            <div className="flex max-w-full grow items-center gap-1 overflow-hidden">
              <div className="flex w-full justify-between gap-2">
                <Filter<T> inputRef={inputRef} header={header} />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  data-testid="hide-search-button"
                  aria-label={t`Close filter`}
                  onClick={handleHideFilter}
                >
                  <XIcon />
                </Button>
              </div>
            </div>
          ) : (
            <EllipsisTooltip
              testId={`${testId}-ellipsis-tooltip`}
              wrapperClassName={cn(
                'flex max-w-full grow items-center gap-1 overflow-hidden empty:hidden',
                align,
                lineClamp,
              )}
              ellipsisClassName={cn('truncate', lineClamp)}
              content={content ?? ''}
              disabled={meta?.enableHeaderTooltip === false || !content}
            >
              {content}
            </EllipsisTooltip>
          )}

          <div className="flex shrink items-center gap-1 empty:hidden">
            {canFilter && !isFilterVisible && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      data-testid={`${testId}-filter-button`}
                      aria-label={t`Filter`}
                      onClick={handleShowFilter}
                    />
                  }
                >
                  <SearchIcon />
                </TooltipTrigger>
                <TooltipContent>{t`Filter`}</TooltipContent>
              </Tooltip>
            )}
            {canSort && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      data-testid={`${testId}-sort-button-${isSorted}`}
                      data-sort={isSorted}
                      aria-label={sortLabel}
                      className={cn(
                        !isSorted &&
                          'opacity-0 group-hover/th:opacity-100 group-data-[resizing=true]/th:opacity-100 focus-visible:opacity-100',
                      )}
                      onClick={handleSort}
                    />
                  }
                >
                  <SortedIcon isSorted={isSorted} />
                </TooltipTrigger>
                <TooltipContent>{sortLabel}</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      )}
      {header.column.getCanResize() && (
        <div
          onDoubleClick={header.column.resetSize}
          onMouseDown={header.getResizeHandler()}
          onTouchStart={header.getResizeHandler()}
          className="absolute top-1 right-0 bottom-1 w-[7px] cursor-col-resize touch-none border-r-2 border-muted-foreground opacity-0 select-none group-data-[resizing=true]/th:border-foreground group-data-[resizing=true]/th:opacity-100 hover:opacity-100"
          data-testid={`${testId}-resizer`}
          role="none"
        />
      )}
    </UiTableHead>
  )
}
