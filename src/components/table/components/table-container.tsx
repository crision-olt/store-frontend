import type { RowData } from '@tanstack/react-table'
import { RestrictToHorizontalAxis } from '@dnd-kit/abstract/modifiers'
import { Feedback, KeyboardSensor, PointerActivationConstraints, PointerSensor } from '@dnd-kit/dom'
import { RestrictToElement } from '@dnd-kit/dom/modifiers'
import type { DragEndEvent, DragOverEvent } from '@dnd-kit/react'
import { DragDropProvider } from '@dnd-kit/react'
import type { SortDirection } from '@tanstack/react-table'
import type { DataRow, DataTable } from '@/components/table/features'
import type {
  ComponentProps,
  ComponentType,
  MouseEventHandler,
  PropsWithChildren,
  ReactElement,
  ReactNode,
} from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ColumnLayoutContext, computeColumnLayout } from '@/components/table/column-layout'
import { TableBody } from '@/components/table/components/table-body'
import { TableBodyVirtualized } from '@/components/table/components/table-body-virtualized'
import { TableFooterCell } from '@/components/table/components/table-footer-cell'
import { TableHeaderCell } from '@/components/table/components/table-header-cell'
import { useTableContext } from '@/components/table/providers/table-provider'
import { hasFooter, hasHeaderBorderLeft, reorderTableColumns } from '@/components/table/utils'
import {
  Table as UiTable,
  TableFooter as UiTableFooter,
  TableHeader as UiTableHeader,
  TableRow as UiTableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

const COLUMN_ORDERING_SENSORS = [
  PointerSensor.configure({
    activationConstraints: [new PointerActivationConstraints.Distance({ value: 5 })],
  }),
  KeyboardSensor,
]
// The provider stays mounted so the sortable headers use this table's manager instead of dnd-kit's global one
const NO_SENSORS: typeof COLUMN_ORDERING_SENSORS = []

export type TableProps<T extends RowData> = {
  /**
   * The TanStack Table instance to be rendered, created in the parent component with
   * `useTable({ features: tableFeatureSet, columns, data })` and without a state selector (the table reads the full
   * state). This component renders it based on its state (sorting, filtering, ordering, sizing...).
   */
  table: DataTable<T>
  /**
   * Optional className to be applied to the root container of the table.
   */
  className?: string
  /**
   * Whether the header should be sticky or not. Default is `true`.
   */
  isHeaderSticky?: boolean
  /**
   * Whether the footer should be sticky or not. Default is `true`.
   */
  isFooterSticky?: boolean
  /**
   * Whether the table should use virtualization or not. Default is `true`.
   * If `true`, the table body will be rendered using tanstack-virtual and only the visible rows will be rendered in the DOM.
   * If `false`, all rows will be rendered in the DOM. Virtualization is recommended for tables with a large number of rows.
   */
  isVirtualized?: boolean
  /**
   * Whether to show the footer or not. Default is `true`. Note that the footer will only be rendered if at least
   * one column has a footer defined, otherwise it will be ignored even if this prop is `true`.
   */
  showFooter?: boolean
  /**
   * If `full` or `fixed`, the column sizes will be calculated based on the `width` property defined in the column meta (percentage or pixels)
   * or the defined column `size` property as fallback.
   * Default is `full`, which means that columns will not be auto-sized and will rely on the defined sizes for better performance.
   * If `auto`, the column sizes will be set to `auto`, so the size will be calculated based on the content of the cells, which can
   * cause performance issues when there are many rows or complex cells.
   */
  sizeMode?: 'auto' | 'fixed' | 'full'
  /**
   * Additional props to be passed to the underlying shadcn `Table` component. Can be used to customize the table. Note that some props
   * are already handled by this component (e.g., className, testId) and will be merged with the ones passed in `tableProps`,
   * so they should not be included in `tableProps` to avoid unexpected behavior.
   */
  tableProps?: ComponentProps<typeof UiTable> & { testId?: string }
  /**
   * Optional ReactNode to be rendered at the start of the scroll container, before the table.
   */
  startSlot?: ReactNode
  /**
   * Optional ReactNode to be rendered at the end of the scroll container, after the table.
   */
  endSlot?: ReactNode
  /**
   * Optional ReactNode to be rendered as feedback state, such as loading or empty state.
   */
  feedbackState?: ReactNode
  /**
   * Optional test ID to be applied to the root container of the table.
   */
  testId?: string
  /**
   * Number of rows to overscan when using virtualization. Default is `0`.
   */
  overscan?: number
  /**
   * Function to estimate the height of a row when using virtualization.
   */
  estimateSize?: (index: number) => number
  /**
   * Optional callback function that will be called when the sort icon of a column header is clicked.
   * The function will receive the column ID and the current sort state as parameters.
   */
  onSort?: (columnId: string, state: SortDirection | false) => void
  /**
   * Optional callback function (only when using virtualization) that will be called when the rendered rows change, either by sorting, filtering or pagination.
   * The function will receive an array of the currently rendered row IDs as a parameter.
   */
  onChangeRenderedRows?: (rowIds: string[]) => void
  /**
   * Optional callback function that will be called when the filter icon of a column header is clicked.
   * The function will receive the column ID as a parameter.
   */
  onShowFilter?: (columnId: string) => void
  /**
   * Optional callback function that will be called when a row is clicked. The function will receive the row data as a parameter.
   */
  getClickRow?: (row: T) => MouseEventHandler | undefined
  /**
   * Optional callback function that will be called when a row is double-clicked. The function will receive the row data as a parameter.
   */
  getDblClickRow?: (row: T) => MouseEventHandler | undefined
  /**
   * Optional callback function that will be called to render a sub-component for a row. The function will receive the row data as a parameter.
   */
  renderSubComponent?: (props: { row: DataRow<T> }) => ReactElement
  /**
   * Whether column ordering (drag & drop) is enabled or not. Default is `false`. Note that this feature requires additional
   * configuration in the table instance (see the `columnOrder` state and `onColumnOrderChange` option of `useTable`).
   */
  enableColumnOrdering?: boolean
  /**
   * Optional callback function that will be called to determine if a row is sticky. The function will receive the row data as a parameter.
   * Note that sticky rows will only work if the table is virtualized.
   */
  isRowSticky?: (row: DataRow<T>) => boolean
  /**
   * Optional offset for sticky rows. Default is `0`.
   * For example, if you have a sticky toolbar above the table header, you can set the offset to the height of the toolbar to avoid overlapping.
   */
  rowStickyOffset?: number
  /**
   * Optional callback function that will be called to determine the className of a row. The function will receive the row data as a parameter.
   * This can be used to apply custom styles to specific rows based on their data.
   */
  rowClassName?: (row: DataRow<T>) => string | undefined
  /**
   * Optional component to be used as a provider for the row context.
   * This can be used to provide additional context or functionality to the rows,
   * such as drag and drop capabilities or expandable rows. It should be used to introduce new
   * markup structure, as the component will be rendered inside the <tr> element of each row.
   * The component will receive the row data as a prop and should render its children.
   */
  RowProvider?: ComponentType<PropsWithChildren & { row: DataRow<T> }>
}

export const TableContainer = <T extends RowData>({
  table,
  startSlot,
  endSlot,
  feedbackState,
  isVirtualized = true,
  isHeaderSticky = true,
  isFooterSticky = true,
  isRowSticky,
  rowStickyOffset = 0,
  rowClassName,
  RowProvider,
  showFooter = true,
  sizeMode = 'full',
  className,
  tableProps,
  overscan,
  estimateSize,
  getClickRow,
  getDblClickRow,
  renderSubComponent,
  onChangeRenderedRows,
  onSort,
  onShowFilter,
  enableColumnOrdering = false,
  testId = 'table',
}: TableProps<T>) => {
  const { ref, scrollRef, sizeRef, sizeRect } = useTableContext()
  const [placeholderOffset, setPlaceholderOffset] = useState<number>()

  const flatHeaders = table.getFlatHeaders()
  const { columnSizing, columnPinning, columnVisibility, columnOrder } = table.state
  const flatColumns = table.getAllFlatColumns()

  // The table instance changes on every render, so the layout depends on the state it is computed from
  const layout = useMemo(
    () => computeColumnLayout(table, sizeMode, sizeRect.width),
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    [flatColumns, columnSizing, columnPinning, columnVisibility, columnOrder, sizeMode, sizeRect.width],
  )

  /**
   * Instead of resolving the size of every header and data cell on every render (very expensive), all the column
   * sizes are calculated once at the root and passed down as CSS variables to the container element.
   */
  const columnSizeVars = useMemo(() => {
    const colSizes: { [key: string]: number | string } = { ['--total-size']: layout.totalSize }
    for (const header of flatHeaders) {
      const size = layout.sizes.get(header.column.id)
      colSizes[`--header-${header.id}-size`] = sizeMode === 'auto' || size === undefined ? 'auto' : `${size}px`
      colSizes[`--col-${header.column.id}-size`] = sizeMode === 'auto' || size === undefined ? 'auto' : `${size}px`
    }
    return colSizes
  }, [layout, flatHeaders, sizeMode])

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      // Prevent optimistic sorting — we use a placeholder indicator instead
      event.preventDefault()

      const { source, target } = event.operation
      if (!source || !target || source.id === target.id) {
        setPlaceholderOffset(undefined)
        return
      }
      const headers = table.getFlatHeaders()
      const sourceCol = headers.find((header) => header.column.id === String(source.id))
      const overCol = headers.find((header) => header.column.id === String(target.id))

      if (!sourceCol || !overCol) {
        setPlaceholderOffset(undefined)
        return
      }
      if (sourceCol.depth !== overCol.depth) {
        setPlaceholderOffset(undefined)
        return
      }
      const start = layout.allStarts.get(overCol.column.id) ?? 0
      setPlaceholderOffset(event.operation.transform.x > 0 ? start + (layout.sizes.get(overCol.column.id) ?? 0) : start)
    },
    [table, layout],
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      // Abort internal reorder of dndkit since the table will handle the reordering
      // and we don't want dndkit to apply any transform to the DOM
      event.suspend().abort()

      setPlaceholderOffset(undefined)

      if (event.canceled) return

      const { source, target } = event.operation
      if (!source || !target || source.id === target.id) return

      const columns = table.getAllFlatColumns()
      const activeCol = columns.find((header) => header.id === String(source.id))
      const overCol = columns.find((header) => header.id === String(target.id))

      if (!activeCol || !overCol) return
      if (activeCol.depth !== overCol.depth) return

      reorderTableColumns(table, activeCol, overCol)
    },
    [table],
  )

  // Stop any column resize in progress when the available width changes. Only the width and the mode must trigger it:
  // the table instance changes on every render and updating its state here would loop.
  useEffect(() => {
    if (sizeMode === 'auto' || table.state.columnResizing.isResizingColumn === false) return
    table.setColumnResizing({ ...table.state.columnResizing, isResizingColumn: false })
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [sizeRect.width, sizeMode])

  // The container element is read when a drag starts, not during render (the ref is still empty on the first render)
  const modifiers = useMemo(
    () => [RestrictToHorizontalAxis, RestrictToElement.configure({ element: () => ref.current })],
    [ref],
  )

  // In `full` and `fixed` modes the table is laid out with flex/grid so the columns follow the computed sizes
  const hasFixedColumns = sizeMode !== 'auto'

  return (
    <ColumnLayoutContext.Provider value={layout}>
      <DragDropProvider
        plugins={(defaults) => [...defaults, Feedback.configure({ dropAnimation: null })]}
        modifiers={modifiers}
        sensors={enableColumnOrdering ? COLUMN_ORDERING_SENSORS : NO_SENSORS}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div
          data-testid={`${testId}-container`}
          data-size-mode={sizeMode}
          className={cn(
            'relative h-full has-[[data-slot=table-feedback-state]]:overflow-hidden has-[[data-slot=table-loading]]:overflow-hidden',
            hasFixedColumns &&
              '[&_table]:flex [&_table]:flex-col [&_tbody]:grid [&_td]:content-center [&_tfoot]:grid [&_thead]:grid [&_th]:flex [&_tr]:flex',
            className,
          )}
          style={columnSizeVars}
          ref={ref}
        >
          <div
            className="h-full overflow-auto [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]"
            data-testid={`${testId}-scroll-container`}
            ref={scrollRef}
          >
            {startSlot}
            <div className="relative w-(--total-size)" data-testid={`${testId}-size-container`} ref={sizeRef}>
              <UiTable
                {...tableProps}
                containerClassName="overflow-visible"
                data-testid={tableProps?.testId ?? testId}
                className={cn('border-separate border-spacing-0', tableProps?.className)}
              >
                <UiTableHeader
                  className={cn(
                    'bg-card [&_th]:border-b [&_th]:bg-card [&_tr:not(:last-child)_th]:border-b-0',
                    isHeaderSticky && 'sticky top-0 z-3',
                  )}
                >
                  {table.getHeaderGroups().map((headerGroup, indexGroup) => (
                    <UiTableRow key={`${headerGroup.id}-${indexGroup}`} className="border-0 hover:bg-transparent">
                      {headerGroup.headers.map((header, index) => (
                        <TableHeaderCell
                          key={`${header.column.id}-${index}`}
                          header={header}
                          hasBorderLeft={hasHeaderBorderLeft(header, headerGroup.headers[index - 1])}
                          onSort={onSort}
                          onShowFilter={onShowFilter}
                          enableColumnOrdering={enableColumnOrdering}
                          testId={`${testId}-header-cell-${header.column.id}`}
                        />
                      ))}
                    </UiTableRow>
                  ))}
                </UiTableHeader>
                {isVirtualized ? (
                  <TableBodyVirtualized
                    table={table}
                    getClickRow={getClickRow}
                    getDblClickRow={getDblClickRow}
                    renderSubComponent={renderSubComponent}
                    onChangeRenderedRows={onChangeRenderedRows}
                    isHeaderSticky={isHeaderSticky}
                    isRowSticky={isRowSticky}
                    rowStickyOffset={rowStickyOffset}
                    rowClassName={rowClassName}
                    RowProvider={RowProvider}
                    overscan={overscan}
                    estimateSize={estimateSize}
                    testId={testId}
                  />
                ) : (
                  <TableBody
                    table={table}
                    getClickRow={getClickRow}
                    getDblClickRow={getDblClickRow}
                    renderSubComponent={renderSubComponent}
                    rowClassName={rowClassName}
                    RowProvider={RowProvider}
                    testId={testId}
                  />
                )}
                {showFooter && hasFooter<T>(table) && (
                  <UiTableFooter
                    className={cn('border-t-0 bg-card font-bold', isFooterSticky && 'sticky bottom-0 z-3')}
                  >
                    {table.getFooterGroups().map((footerGroup) => (
                      <UiTableRow key={footerGroup.id} className="border-0 hover:bg-transparent">
                        {footerGroup.headers.map((header, index) => (
                          <TableFooterCell
                            key={header.id}
                            footer={header}
                            hasBorderLeft={hasHeaderBorderLeft(header, footerGroup.headers[index - 1])}
                            testId={`${testId}-footer-cell-${header.id}`}
                          />
                        ))}
                      </UiTableRow>
                    ))}
                  </UiTableFooter>
                )}
              </UiTable>
              {placeholderOffset !== undefined ? (
                <div
                  className="absolute top-0 z-4 h-full w-0.5 bg-foreground"
                  style={{ left: placeholderOffset + 'px' }}
                  data-testid={`${testId}-drag-placeholder`}
                />
              ) : null}
            </div>
            {endSlot}
          </div>
          {feedbackState}
        </div>
      </DragDropProvider>
    </ColumnLayoutContext.Provider>
  )
}
