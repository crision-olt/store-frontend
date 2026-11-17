// @vitest-environment jsdom

import '@/test/setup-dom'
import { type ReactNode, useState } from 'react'

import type { DragDropProvider, DragDropManager } from '@dnd-kit/react'
import type { ColumnOrderState, TableState } from '@tanstack/react-table'
import type { DataColumnDef as ColumnDef, DataRow as Row, TableFeatureSet } from '@/components/table/features'
import { useTable } from '@tanstack/react-table'
import { tableFeatureSet } from '@/components/table/features'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'

import { TableFactory, type Person } from '@/test/factory/table'
import { defineBoundingClientRect, defineClientDimensions } from '@/test/dom'
import { AppWrapper } from '@/test/utils'
import { Table } from '@/components/table'
import type { TableProps } from '@/components/table/components/table-container'

defineBoundingClientRect()
defineClientDimensions()

type Operation = Parameters<NonNullable<React.ComponentProps<typeof DragDropProvider>['onDragOver']>>[0]['operation']
let capturedOnDragOver: React.ComponentProps<typeof DragDropProvider>['onDragOver']
let capturedOnDragEnd: React.ComponentProps<typeof DragDropProvider>['onDragEnd']
const manager = undefined as unknown as DragDropManager

vi.mock('@dnd-kit/react', async (importActual) => {
  // eslint-disable-next-line typescript/consistent-type-imports typescript/no-explicit-any
  const actual = (await importActual<typeof import('@dnd-kit/react')>()) as Record<string, any>
  return {
    ...actual,
    DragDropProvider: ({ children, onDragOver, onDragEnd, ...rest }: React.ComponentProps<typeof DragDropProvider>) => {
      capturedOnDragOver = onDragOver
      capturedOnDragEnd = onDragEnd
      return <actual.DragDropProvider {...rest}>{children}</actual.DragDropProvider>
    },
  }
})

type ColumnTypes = unknown

const Wrapper = ({
  data,
  columns,
  state,
  isVirtualized = false,
  isRowSticky,
  onChangeRenderedRows,
  children,
}: {
  data: Person[]
  columns: ColumnDef<Person, ColumnTypes>[]
  state?: Partial<TableState<TableFeatureSet>>
  isVirtualized?: boolean
  isRowSticky?: TableProps<Person>['isRowSticky']
  onChangeRenderedRows?: TableProps<Person>['onChangeRenderedRows']
  children?: ReactNode
}) => {
  const table = useTable({
    features: tableFeatureSet,
    data,
    columns,
    state,
    columnResizeMode: 'onChange',
    enableColumnResizing: false,
    defaultColumn: {
      minSize: 0,
    },
  })

  return (
    <AppWrapper>
      <Table<Person>
        table={table}
        feedbackState={children}
        isVirtualized={isVirtualized}
        isRowSticky={isRowSticky}
        onChangeRenderedRows={onChangeRenderedRows}
      />
    </AppWrapper>
  )
}

const DndWrapper = ({
  data,
  columns,
  isVirtualized = false,
  enableColumnOrdering = true,
  sizeMode,
  startSlot,
  endSlot,
  className,
  onSort,
  onShowFilter,
}: {
  data: Person[]
  columns: ColumnDef<Person, ColumnTypes>[]
  isVirtualized?: boolean
  enableColumnOrdering?: boolean
  sizeMode?: TableProps<Person>['sizeMode']
  startSlot?: ReactNode
  endSlot?: ReactNode
  className?: string
  onSort?: TableProps<Person>['onSort']
  onShowFilter?: TableProps<Person>['onShowFilter']
}) => {
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(
    columns.map((c) => (c as { accessorKey: string }).accessorKey),
  )

  const table = useTable({
    features: tableFeatureSet,
    data,
    columns,
    state: { columnOrder },
    onColumnOrderChange: setColumnOrder,
    columnResizeMode: 'onChange',
    enableColumnResizing: false,
    defaultColumn: {
      minSize: 0,
    },
  })

  return (
    <AppWrapper>
      <Table<Person>
        table={table}
        isVirtualized={isVirtualized}
        enableColumnOrdering={enableColumnOrdering}
        sizeMode={sizeMode}
        startSlot={startSlot}
        endSlot={endSlot}
        className={className}
        onSort={onSort}
        onShowFilter={onShowFilter}
      />
    </AppWrapper>
  )
}

type PersonWithSubRows = Person & { subRows?: PersonWithSubRows[] }

const ExpandableWrapper = ({
  data,
  columns,
  isVirtualized = false,
  renderSubComponent,
}: {
  data: Person[]
  columns: ColumnDef<Person, ColumnTypes>[]
  isVirtualized?: boolean
  renderSubComponent: (props: { row: Row<Person> }) => React.ReactElement
}) => {
  const table = useTable({
    features: tableFeatureSet,
    data,
    columns,
    initialState: { expanded: { '0': true } },
    columnResizeMode: 'onChange',
    enableColumnResizing: false,
    defaultColumn: {
      minSize: 0,
    },
  })

  return (
    <AppWrapper>
      <Table<Person> table={table} isVirtualized={isVirtualized} renderSubComponent={renderSubComponent} />
    </AppWrapper>
  )
}

const NestedRowWrapper = ({
  data,
  columns,
  isVirtualized = false,
}: {
  data: PersonWithSubRows[]
  columns: ColumnDef<PersonWithSubRows, ColumnTypes>[]
  isVirtualized?: boolean
}) => {
  const table = useTable({
    features: tableFeatureSet,
    data,
    columns,
    initialState: { expanded: { '0': true } },
    getSubRows: (row) => row.subRows,
    columnResizeMode: 'onChange',
    enableColumnResizing: false,
    defaultColumn: {
      minSize: 0,
    },
  })

  return (
    <AppWrapper>
      <Table<PersonWithSubRows> table={table} isVirtualized={isVirtualized} />
    </AppWrapper>
  )
}

const NestedDndWrapper = ({ data, columns }: { data: Person[]; columns: ColumnDef<Person, ColumnTypes>[] }) => {
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([
    'id',
    'firstName',
    'lastName',
    'age',
    'status',
    'createdAt',
  ])

  const table = useTable({
    features: tableFeatureSet,
    data,
    columns,
    state: { columnOrder },
    onColumnOrderChange: setColumnOrder,
    columnResizeMode: 'onChange',
    enableColumnResizing: false,
    defaultColumn: {
      minSize: 0,
    },
  })

  return (
    <AppWrapper>
      <Table<Person> table={table} isVirtualized={false} enableColumnOrdering={true} />
    </AppWrapper>
  )
}

describe('Table', () => {
  test('should render correctly', () => {
    const data = TableFactory.createData(5)
    const columns = TableFactory.createColumns()
    render(<Wrapper data={data} columns={columns} isVirtualized={false} />)

    expect(screen.getByTestId('table')).toBeInTheDocument()

    // Header
    for (const column of columns) {
      expect(screen.getByTestId(`table-header-cell-${column.accessorKey}`)).toBeInTheDocument()
    }

    // Rows
    for (let i = 0; i < data.length; i++) {
      for (const column of columns) {
        expect(screen.getByTestId(`table-row-cell-${i}-${column.accessorKey}`)).toBeInTheDocument()
      }
    }
  })

  test('should render correctly with footer', () => {
    const data = TableFactory.createData(1)
    const columnsWithFooter = TableFactory.createColumns(true)
    render(<Wrapper data={data} columns={columnsWithFooter} isVirtualized={false} />)

    expect(screen.getByTestId('table')).toBeInTheDocument()

    // Footer
    for (const column of columnsWithFooter) {
      expect(screen.getByTestId(`table-footer-cell-${column.accessorKey}`)).toBeInTheDocument()
    }
  })

  test('should render correctly with nested columns', () => {
    const data = TableFactory.createData(1)
    const columnsWithFooter = TableFactory.createWithNestedColumns(true)
    render(<Wrapper data={data} columns={columnsWithFooter} isVirtualized={false} />)
    expect(screen.getByTestId('table')).toBeInTheDocument()
  })

  describe('Sorting', () => {
    test('should sort correctly', () => {
      const data = TableFactory.createData(1)
      const columns = TableFactory.createColumns()
      render(<Wrapper data={data} columns={columns} isVirtualized={false} />)
      expect(screen.getByTestId('table')).toBeInTheDocument()
      const noSortingButton = screen.getByTestId('table-header-cell-id-sort-button-false')
      fireEvent.click(noSortingButton)
      const descSortingButton = screen.getByTestId('table-header-cell-id-sort-button-desc')
      fireEvent.click(descSortingButton)
      const ascSortingButton = screen.getByTestId('table-header-cell-id-sort-button-asc')
      fireEvent.click(ascSortingButton)
    })
  })

  describe('Meta properties', () => {
    describe('align', () => {
      test('should render correctly with align left', () => {
        const data = TableFactory.createData(1)
        const columnsAlignLeft = TableFactory.createColumns(true, { align: 'left' })
        render(<Wrapper data={data} columns={columnsAlignLeft} isVirtualized={false} />)
        expect(screen.getByTestId('table-header-cell-id')).toHaveClass('text-left')
        expect(screen.getByTestId('table-row-cell-0-id')).toHaveClass('text-left')
        expect(screen.getByTestId('table-footer-cell-id')).toHaveClass('text-left')
      })

      test('should render correctly with align center', () => {
        const data = TableFactory.createData(1)
        const columnsAlignCenter = TableFactory.createColumns(true, { align: 'center' })
        render(<Wrapper data={data} columns={columnsAlignCenter} isVirtualized={false} />)
        expect(screen.getByTestId('table-header-cell-id')).toHaveClass('text-center')
        expect(screen.getByTestId('table-row-cell-0-id')).toHaveClass('text-center')
        expect(screen.getByTestId('table-footer-cell-id')).toHaveClass('text-center')
      })

      test('should render correctly with align right', () => {
        const data = TableFactory.createData(1)
        const columnsAlignRight = TableFactory.createColumns(true, { align: 'right' })
        render(<Wrapper data={data} columns={columnsAlignRight} isVirtualized={false} />)
        expect(screen.getByTestId('table-header-cell-id')).toHaveClass('text-right')
        expect(screen.getByTestId('table-row-cell-0-id')).toHaveClass('text-right')
        expect(screen.getByTestId('table-footer-cell-id')).toHaveClass('text-right')
      })
    })

    describe('className', () => {
      test('should render correctly with className', () => {
        const data = TableFactory.createData(1)
        const columnsAlignLeft = TableFactory.createColumns(true, { className: 'test-class' })
        render(<Wrapper data={data} columns={columnsAlignLeft} isVirtualized={false} />)
        expect(screen.getByTestId('table-header-cell-id')).toHaveClass('test-class')
        expect(screen.getByTestId('table-row-cell-0-id')).toHaveClass('test-class')
        expect(screen.getByTestId('table-footer-cell-id')).toHaveClass('test-class')
      })
    })

    describe('lineClamp', () => {
      test('should render correctly with LineClamp 1', () => {
        const data = TableFactory.createData(1)
        const columnsAlignLeft = TableFactory.createColumns(true, { lineClamp: 1 })
        render(<Wrapper data={data} columns={columnsAlignLeft} isVirtualized={false} />)
        expect(screen.getByTestId('table-header-cell-id').querySelector('.line-clamp-1')).toBeInTheDocument()
      })

      test('should render correctly with LineClamp 2', () => {
        const data = TableFactory.createData(1)
        const columnsAlignLeft = TableFactory.createColumns(true, { lineClamp: 2 })
        render(<Wrapper data={data} columns={columnsAlignLeft} isVirtualized={false} />)
        expect(screen.getByTestId('table-header-cell-id').querySelector('.line-clamp-2')).toBeInTheDocument()
      })

      test('should show filter button when column can filter', () => {
        const data = TableFactory.createData(3)
        const columns = TableFactory.createColumns(false, { showFilter: true })

        render(<Wrapper data={data} columns={columns} isVirtualized={false} />)
        expect(screen.getByTestId('table-header-cell-id-filter-button')).toBeInTheDocument()
      })

      describe('textEllipsis', () => {
        test('should render correctly with textEllipsis true', () => {
          const data = TableFactory.createData(1)
          const columnsAlignLeft = TableFactory.createColumns(true, { textEllipsis: true })
          render(<Wrapper data={data} columns={columnsAlignLeft} isVirtualized={false} />)
          expect(screen.getByTestId('table-row-cell-0-id')).toHaveClass('text-ellipsis')
        })
      })
    })

    describe('Filtering', () => {
      test('should show filter input when filter button is clicked', async () => {
        const data = TableFactory.createData(3)
        const columns = TableFactory.createColumns(false, { showFilter: true })

        render(<Wrapper data={data} columns={columns} isVirtualized={false} />)

        const filterButton = screen.getByTestId('table-header-cell-id-filter-button')

        fireEvent.click(filterButton)

        await waitFor(() => {
          expect(screen.getByTestId('table-filter-input')).toBeInTheDocument()
        })
      })

      test('should show filter button when column can filter', () => {
        const data = TableFactory.createData(3)
        // Crear columnas con filtrado habilitado manualmente
        const columns = [
          {
            accessorKey: 'id' as keyof Person,
            header: 'Id',
            enableColumnFilter: true,
            enableSorting: true,
            meta: { showFilter: true },
          },
          {
            accessorKey: 'name' as keyof Person,
            header: 'Name',
            enableColumnFilter: false,
            enableSorting: true,
            meta: { showFilter: true },
          },
        ]

        render(<Wrapper data={data} columns={columns} isVirtualized={false} />)

        expect(screen.getByTestId('table-header-cell-id-filter-button')).toBeInTheDocument()
      })

      test('should hide filter button when column cannot filter', () => {
        const data = TableFactory.createData(3)
        const columns = [
          {
            accessorKey: 'id' as keyof Person,
            header: 'Id',
            enableColumnFilter: false, // Explicitly disable filtering
            meta: { showFilter: false },
          },
        ]

        render(<Wrapper data={data} columns={columns} isVirtualized={false} />)

        expect(screen.queryByTestId('table-header-cell-id-filter-button')).not.toBeInTheDocument()
      })
    })

    describe('Pinning', () => {
      test('should render correctly with pinned columns', () => {
        const data = TableFactory.createData(1)
        const columns = TableFactory.createColumns(true)
        const state: Partial<TableState<TableFeatureSet>> = {
          columnPinning: {
            start: ['id', 'firstName', 'lastName'],
            end: ['status', 'createdAt'],
          },
        }

        const { rerender } = render(<Wrapper data={data} columns={columns} state={state} isVirtualized={true} />)
        rerender(<Wrapper data={data} columns={columns} state={state} isVirtualized={true} />)

        let left = 0
        state.columnPinning?.start?.forEach((columnId) => {
          expect(screen.getByTestId(`table-header-cell-${columnId}`)).toHaveStyle({
            left: `${left}px`,
            position: 'sticky',
            zIndex: 1,
          })
          left += 150 // default column width
        })

        let right = 0
        state.columnPinning?.end?.reverse().forEach((columnId) => {
          expect(screen.getByTestId(`table-header-cell-${columnId}`)).toHaveStyle({
            right: `${right}px`,
            position: 'sticky',
            zIndex: 1,
          })
          right += 150 // default column width
        })
      })
    })

    describe('Virtualization', () => {
      test('should render correctly virtualized', () => {
        const data = TableFactory.createData(5)
        const columns = TableFactory.createColumns()
        render(<Wrapper data={data} columns={columns} isVirtualized={true} />)

        expect(screen.getByTestId('table')).toBeInTheDocument()

        // Header
        for (const column of columns) {
          expect(screen.getByTestId(`table-header-cell-${column.accessorKey}`)).toBeInTheDocument()
        }

        // Only two rows in the DOM since the overscan is 1 by default
        for (let i = 0; i <= 1; i++) {
          for (const column of columns) {
            expect(screen.getByTestId(`table-row-cell-${i}-${column.accessorKey}`)).toBeInTheDocument()
          }
        }
      })
    })
  })

  describe('Drag and Drop column ordering', () => {
    test('should render with enableColumnOrdering and show orderable header cells', () => {
      const data = TableFactory.createData(3)
      const columns = TableFactory.createColumns()
      render(<DndWrapper data={data} columns={columns} isVirtualized={false} enableColumnOrdering={true} />)

      expect(screen.getByTestId('table')).toBeInTheDocument()
      for (const column of columns) {
        expect(screen.getByTestId(`table-header-cell-${column.accessorKey}`)).toBeInTheDocument()
      }
    })

    test('should reorder columns when dragging a header to a different position', async () => {
      const data = TableFactory.createData(3)
      const columns = TableFactory.createColumns()
      render(<DndWrapper data={data} columns={columns} isVirtualized={false} enableColumnOrdering={true} />)

      const firstHeader = screen.getByTestId('table-header-cell-id')
      const secondHeader = screen.getByTestId('table-header-cell-firstName')

      // Simulate pointer down on first header to start drag
      fireEvent.pointerDown(firstHeader, { pointerId: 1, clientX: 50, clientY: 10 })

      // Move pointer to second header position
      fireEvent.pointerMove(secondHeader, { pointerId: 1, clientX: 200, clientY: 10 })

      // Drop
      fireEvent.pointerUp(secondHeader, { pointerId: 1, clientX: 200, clientY: 10 })

      // Table should still be rendered (no crash)
      expect(screen.getByTestId('table')).toBeInTheDocument()
    })

    test('should render with sizeMode auto', () => {
      const data = TableFactory.createData(2)
      const columns = TableFactory.createColumns()
      render(<DndWrapper data={data} columns={columns} isVirtualized={false} sizeMode="auto" />)
      expect(screen.getByTestId('table')).toBeInTheDocument()
    })

    test('should render with sizeMode fixed', () => {
      const data = TableFactory.createData(2)
      const columns = TableFactory.createColumns()
      render(<DndWrapper data={data} columns={columns} isVirtualized={false} sizeMode="fixed" />)
      expect(screen.getByTestId('table')).toBeInTheDocument()
    })

    test('should render with custom className', () => {
      const data = TableFactory.createData(2)
      const columns = TableFactory.createColumns()
      render(<DndWrapper data={data} columns={columns} isVirtualized={false} className="custom-table-class" />)
      expect(screen.getByTestId('table-container')).toHaveClass('custom-table-class')
    })

    test('should render startSlot and endSlot', () => {
      const data = TableFactory.createData(2)
      const columns = TableFactory.createColumns()
      render(
        <DndWrapper
          data={data}
          columns={columns}
          isVirtualized={false}
          startSlot={<div data-testid="start-slot">Start</div>}
          endSlot={<div data-testid="end-slot">End</div>}
        />,
      )
      expect(screen.getByTestId('start-slot')).toBeInTheDocument()
      expect(screen.getByTestId('end-slot')).toBeInTheDocument()
    })

    test('should not show drag placeholder when not dragging', () => {
      const data = TableFactory.createData(2)
      const columns = TableFactory.createColumns()
      render(<DndWrapper data={data} columns={columns} isVirtualized={false} enableColumnOrdering={true} />)
      expect(screen.queryByTestId('table-drag-placeholder')).not.toBeInTheDocument()
    })

    test('should handle pointer events on headers without crashing', async () => {
      const data = TableFactory.createData(3)
      const columns = TableFactory.createColumns()
      render(<DndWrapper data={data} columns={columns} isVirtualized={false} enableColumnOrdering={true} />)

      const header = screen.getByTestId('table-header-cell-id')

      fireEvent.pointerDown(header, { pointerId: 1, clientX: 50, clientY: 10 })

      fireEvent.pointerMove(header, { pointerId: 1, clientX: 55, clientY: 10 })

      fireEvent.pointerUp(header, { pointerId: 1, clientX: 55, clientY: 10 })

      expect(screen.getByTestId('table')).toBeInTheDocument()
    })

    test('should render with columns using width in meta', () => {
      const data = TableFactory.createData(2)
      const columns = TableFactory.createColumns(false, { width: '100px' })
      render(<DndWrapper data={data} columns={columns} isVirtualized={false} sizeMode="full" />)
      expect(screen.getByTestId('table')).toBeInTheDocument()
    })

    test('should render with columns using percentage width in meta', () => {
      const data = TableFactory.createData(2)
      const columns = TableFactory.createColumns(false, { width: '10%' })
      render(<DndWrapper data={data} columns={columns} isVirtualized={false} sizeMode="full" />)
      expect(screen.getByTestId('table')).toBeInTheDocument()
    })

    describe('handleDragOver callback', () => {
      test('should clear placeholder when source is missing', () => {
        const data = TableFactory.createData(3)
        const columns = TableFactory.createColumns()
        render(<DndWrapper data={data} columns={columns} isVirtualized={false} enableColumnOrdering={true} />)
        act(() => {
          capturedOnDragOver?.(
            {
              preventDefault: vi.fn(),
              operation: { source: null, target: null, transform: { x: 0 } } as Operation,
              defaultPrevented: false,
              cancelable: false,
            },
            manager,
          )
        })

        expect(screen.queryByTestId('table-drag-placeholder')).not.toBeInTheDocument()
      })

      test('should clear placeholder when source and target are the same', () => {
        const data = TableFactory.createData(3)
        const columns = TableFactory.createColumns()
        render(<DndWrapper data={data} columns={columns} isVirtualized={false} enableColumnOrdering={true} />)

        act(() => {
          capturedOnDragOver?.(
            {
              preventDefault: vi.fn(),
              operation: { source: { id: 'id' }, target: { id: 'id' }, transform: { x: 0 } } as Operation,
              defaultPrevented: false,
              cancelable: false,
            },
            manager,
          )
        })

        expect(screen.queryByTestId('table-drag-placeholder')).not.toBeInTheDocument()
      })

      test('should clear placeholder when source column is not found', () => {
        const data = TableFactory.createData(3)
        const columns = TableFactory.createColumns()
        render(<DndWrapper data={data} columns={columns} isVirtualized={false} enableColumnOrdering={true} />)

        act(() => {
          capturedOnDragOver?.(
            {
              preventDefault: vi.fn(),
              defaultPrevented: false,
              cancelable: false,
              operation: {
                source: { id: 'nonexistent' },
                target: { id: 'firstName' },
                transform: { x: 10 },
              } as Operation,
            },
            manager,
          )
        })

        expect(screen.queryByTestId('table-drag-placeholder')).not.toBeInTheDocument()
      })

      test('should show placeholder when dragging to a valid target (positive x)', () => {
        const data = TableFactory.createData(3)
        const columns = TableFactory.createColumns()
        render(<DndWrapper data={data} columns={columns} isVirtualized={false} enableColumnOrdering={true} />)

        act(() => {
          capturedOnDragOver?.(
            {
              preventDefault: vi.fn(),
              defaultPrevented: false,
              cancelable: false,
              operation: {
                source: { id: 'id' },
                target: { id: 'firstName' },
                transform: { x: 50 },
              } as Operation,
            },
            manager,
          )
        })

        expect(screen.getByTestId('table-drag-placeholder')).toBeInTheDocument()
      })

      test('should show placeholder when dragging to a valid target (negative x)', () => {
        const data = TableFactory.createData(3)
        const columns = TableFactory.createColumns()
        render(<DndWrapper data={data} columns={columns} isVirtualized={false} enableColumnOrdering={true} />)

        act(() => {
          capturedOnDragOver?.(
            {
              preventDefault: vi.fn(),
              defaultPrevented: false,
              cancelable: false,
              operation: {
                source: { id: 'firstName' },
                target: { id: 'id' },
                transform: { x: -50 },
              } as Operation,
            },
            manager,
          )
        })

        expect(screen.getByTestId('table-drag-placeholder')).toBeInTheDocument()
      })

      test('should clear placeholder when dragging between headers of different depths', () => {
        const data = TableFactory.createData(3)
        const columns = TableFactory.createWithNestedColumns()
        render(<NestedDndWrapper data={data} columns={columns} />)

        act(() => {
          capturedOnDragOver?.(
            {
              preventDefault: vi.fn(),
              defaultPrevented: false,
              cancelable: false,
              operation: {
                // "firstName" is at depth 1 (child of "id" group); "age" is at depth 0
                source: { id: 'firstName' },
                target: { id: 'age' },
                transform: { x: 50 },
              } as Operation,
            },
            manager,
          )
        })

        expect(screen.queryByTestId('table-drag-placeholder')).not.toBeInTheDocument()
      })
    })

    describe('handleDragEnd callback', () => {
      test('should clear placeholder on drag end', () => {
        const data = TableFactory.createData(3)
        const columns = TableFactory.createColumns()
        render(<DndWrapper data={data} columns={columns} isVirtualized={false} enableColumnOrdering={true} />)

        // First show placeholder via dragOver
        act(() => {
          capturedOnDragOver?.(
            {
              preventDefault: vi.fn(),
              defaultPrevented: false,
              cancelable: false,
              operation: {
                source: { id: 'id' },
                target: { id: 'firstName' },
                transform: { x: 50 },
              } as Operation,
            },
            manager,
          )
        })
        expect(screen.getByTestId('table-drag-placeholder')).toBeInTheDocument()

        // Then end drag
        act(() => {
          capturedOnDragEnd?.(
            {
              canceled: false,
              suspend: () => ({ abort: vi.fn(), resume: vi.fn() }),
              operation: {
                source: { id: 'id' },
                target: { id: 'firstName' },
              } as Operation,
            },
            manager,
          )
        })

        expect(screen.queryByTestId('table-drag-placeholder')).not.toBeInTheDocument()
      })

      test('should not reorder when drag is canceled', () => {
        const data = TableFactory.createData(3)
        const columns = TableFactory.createColumns()
        render(<DndWrapper data={data} columns={columns} isVirtualized={false} enableColumnOrdering={true} />)

        act(() => {
          capturedOnDragEnd?.(
            {
              canceled: true,
              suspend: () => ({ abort: vi.fn(), resume: vi.fn() }),
              operation: {
                source: { id: 'id' },
                target: { id: 'firstName' },
              } as Operation,
            },
            manager,
          )
        })

        expect(screen.getByTestId('table')).toBeInTheDocument()
      })

      test('should not reorder when source and target are the same', () => {
        const data = TableFactory.createData(3)
        const columns = TableFactory.createColumns()
        render(<DndWrapper data={data} columns={columns} isVirtualized={false} enableColumnOrdering={true} />)

        act(() => {
          capturedOnDragEnd?.(
            {
              canceled: false,
              suspend: () => ({ abort: vi.fn(), resume: vi.fn() }),
              operation: {
                source: { id: 'id' },
                target: { id: 'id' },
              } as Operation,
            },
            manager,
          )
        })

        expect(screen.getByTestId('table')).toBeInTheDocument()
      })

      test('should not reorder when source is missing', () => {
        const data = TableFactory.createData(3)
        const columns = TableFactory.createColumns()
        render(<DndWrapper data={data} columns={columns} isVirtualized={false} enableColumnOrdering={true} />)

        act(() => {
          capturedOnDragEnd?.(
            {
              canceled: false,
              suspend: () => ({ abort: vi.fn(), resume: vi.fn() }),
              operation: {
                source: null,
                target: { id: 'firstName' },
              } as Operation,
            },
            manager,
          )
        })

        expect(screen.getByTestId('table')).toBeInTheDocument()
      })

      test('should not reorder when column is not found', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        const data = TableFactory.createData(3)
        const columns = TableFactory.createColumns()
        render(<DndWrapper data={data} columns={columns} isVirtualized={false} enableColumnOrdering={true} />)

        act(() => {
          capturedOnDragEnd?.(
            {
              canceled: false,
              suspend: () => ({ abort: vi.fn(), resume: vi.fn() }),
              operation: {
                source: { id: 'nonexistent' },
                target: { id: 'firstName' },
              } as Operation,
            },
            manager,
          )
        })

        expect(screen.getByTestId('table')).toBeInTheDocument()
        consoleSpy.mockRestore()
      })

      test('should reorder columns when dragging from left to right', () => {
        const data = TableFactory.createData(3)
        const columns = TableFactory.createColumns()
        render(<DndWrapper data={data} columns={columns} isVirtualized={false} enableColumnOrdering={true} />)

        // Get initial header order
        const headersBefore = screen.getAllByTestId(/^table-header-cell-(?!.*sort|.*filter|.*ellipsis)/)
        const firstHeaderBefore = headersBefore[0].getAttribute('data-testid')

        act(() => {
          capturedOnDragEnd?.(
            {
              canceled: false,
              suspend: () => ({ abort: vi.fn(), resume: vi.fn() }),
              operation: {
                source: { id: 'id' },
                target: { id: 'lastName' },
              } as Operation,
            },
            manager,
          )
        })

        // Table should still render after reorder
        expect(screen.getByTestId('table')).toBeInTheDocument()
        // The first header should have changed
        const headersAfter = screen.getAllByTestId(/^table-header-cell-(?!.*sort|.*filter|.*ellipsis)/)
        expect(headersAfter[0].getAttribute('data-testid')).not.toBe(firstHeaderBefore)
      })

      test('should reorder columns when dragging from right to left', () => {
        const data = TableFactory.createData(3)
        const columns = TableFactory.createColumns()
        render(<DndWrapper data={data} columns={columns} isVirtualized={false} enableColumnOrdering={true} />)

        act(() => {
          capturedOnDragEnd?.(
            {
              canceled: false,
              suspend: () => ({ abort: vi.fn(), resume: vi.fn() }),
              operation: {
                source: { id: 'lastName' },
                target: { id: 'id' },
              } as Operation,
            },
            manager,
          )
        })

        expect(screen.getByTestId('table')).toBeInTheDocument()
      })

      test('should move a column group together with its columns', () => {
        const data = TableFactory.createData(2)
        const columns = TableFactory.createWithNestedColumns()
        render(<NestedDndWrapper data={data} columns={columns} />)
        const leafHeaders = () =>
          [...document.querySelectorAll('thead tr:last-child th')].map((th) =>
            th.getAttribute('data-testid')?.replace('table-header-cell-', ''),
          )
        expect(leafHeaders()).toEqual(['id', 'firstName', 'lastName', 'age', 'status', 'createdAt'])

        act(() => {
          capturedOnDragEnd?.(
            {
              canceled: false,
              suspend: () => ({ abort: vi.fn(), resume: vi.fn() }),
              // "person" is the group of "id", "firstName" and "lastName"; "age" is a top level column
              operation: { source: { id: 'person' }, target: { id: 'age' } } as Operation,
            },
            manager,
          )
        })

        expect(leafHeaders()).toEqual(['age', 'id', 'firstName', 'lastName', 'status', 'createdAt'])
      })

      test('should reorder the columns of a group without leaving it', () => {
        const data = TableFactory.createData(2)
        const columns = TableFactory.createWithNestedColumns()
        render(<NestedDndWrapper data={data} columns={columns} />)

        act(() => {
          capturedOnDragEnd?.(
            {
              canceled: false,
              suspend: () => ({ abort: vi.fn(), resume: vi.fn() }),
              operation: { source: { id: 'lastName' }, target: { id: 'id' } } as Operation,
            },
            manager,
          )
        })

        const leafHeaders = [...document.querySelectorAll('thead tr:last-child th')].map((th) =>
          th.getAttribute('data-testid')?.replace('table-header-cell-', ''),
        )
        expect(leafHeaders).toEqual(['lastName', 'id', 'firstName', 'age', 'status', 'createdAt'])
      })

      test('should not reorder when dragging between columns of different depths', () => {
        const data = TableFactory.createData(3)
        const columns = TableFactory.createWithNestedColumns()
        render(<NestedDndWrapper data={data} columns={columns} />)

        act(() => {
          capturedOnDragEnd?.(
            {
              canceled: false,
              suspend: () => ({ abort: vi.fn(), resume: vi.fn() }),
              operation: {
                // "firstName" is at depth 1 (child of "id" group); "age" is at depth 0
                source: { id: 'firstName' },
                target: { id: 'age' },
              } as Operation,
            },
            manager,
          )
        })

        expect(screen.getByTestId('table')).toBeInTheDocument()
      })
    })

    describe('column size calculation with non-zero size rect', () => {
      let OriginalResizeObserver: typeof ResizeObserver

      beforeEach(() => {
        OriginalResizeObserver = globalThis.ResizeObserver
        globalThis.ResizeObserver = class MockResizeObserver {
          private cb: ResizeObserverCallback
          constructor(cb: ResizeObserverCallback) {
            this.cb = cb
          }
          observe() {
            this.cb(
              [{ contentRect: { width: 1920, height: 1024 } } as ResizeObserverEntry],
              this as unknown as ResizeObserver,
            )
          }
          unobserve() {}
          disconnect() {}
        }
      })

      afterEach(() => {
        globalThis.ResizeObserver = OriginalResizeObserver
      })

      test('should calculate column sizes in fixed mode with populated size rect', () => {
        const data = TableFactory.createData(2)
        const columns = TableFactory.createColumns()
        render(<DndWrapper data={data} columns={columns} isVirtualized={false} sizeMode="fixed" />)
        expect(screen.getByTestId('table')).toBeInTheDocument()
      })

      test('should calculate column sizes in full mode with populated size rect', () => {
        const data = TableFactory.createData(2)
        const columns = TableFactory.createColumns()
        render(<DndWrapper data={data} columns={columns} isVirtualized={false} sizeMode="full" />)
        expect(screen.getByTestId('table')).toBeInTheDocument()
      })

      test('should calculate column sizes with pixel width in meta', () => {
        const data = TableFactory.createData(2)
        const columns = TableFactory.createColumns(false, { width: '100px' })
        render(<DndWrapper data={data} columns={columns} isVirtualized={false} sizeMode="full" />)
        expect(screen.getByTestId('table')).toBeInTheDocument()
      })

      test('should calculate column sizes with percentage width in meta', () => {
        const data = TableFactory.createData(2)
        const columns = TableFactory.createColumns(false, { width: '50%' })
        render(<DndWrapper data={data} columns={columns} isVirtualized={false} sizeMode="full" />)
        expect(screen.getByTestId('table')).toBeInTheDocument()
      })

      test('should calculate column sizes with invalid width string in meta', () => {
        const data = TableFactory.createData(2)
        const columns = TableFactory.createColumns(false, { width: 'invalid' })
        render(<DndWrapper data={data} columns={columns} isVirtualized={false} sizeMode="full" />)
        expect(screen.getByTestId('table')).toBeInTheDocument()
      })
    })
  })

  describe('Expandable rows and sub-components', () => {
    test('should render sub-component when row is expanded (non-virtualized)', () => {
      const data = TableFactory.createData(3)
      const columns = TableFactory.createColumns()
      render(
        <ExpandableWrapper
          data={data}
          columns={columns}
          isVirtualized={false}
          renderSubComponent={({ row }) => (
            <div data-testid={`expanded-content-${row.index}`}>Sub: {row.original.firstName}</div>
          )}
        />,
      )
      expect(screen.getByTestId('table-expanded-row-0')).toBeInTheDocument()
      expect(screen.getByTestId('table-expanded-row-cell-0')).toBeInTheDocument()
      expect(screen.getByTestId('expanded-content-0')).toBeInTheDocument()
    })

    test('should render sub-component when row is expanded (virtualized)', () => {
      const data = TableFactory.createData(3)
      const columns = TableFactory.createColumns()
      render(
        <ExpandableWrapper
          data={data}
          columns={columns}
          isVirtualized={true}
          renderSubComponent={({ row }) => (
            <div data-testid={`expanded-content-${row.index}`}>Sub: {row.original.firstName}</div>
          )}
        />,
      )
      expect(screen.getByTestId('table-expanded-row-0')).toBeInTheDocument()
      expect(screen.getByTestId('table-expanded-row-cell-0')).toBeInTheDocument()
      expect(screen.getByTestId('expanded-content-0')).toBeInTheDocument()
    })

    test('should render two-level nested rows (non-virtualized)', () => {
      const parentData = TableFactory.createData(2)
      const childData = TableFactory.createData(2)
      const nestedData: PersonWithSubRows[] = parentData.map((parent, i) => ({
        ...parent,
        subRows: [{ ...childData[i % childData.length]! }],
      }))
      const columns = TableFactory.createColumns() as unknown as ColumnDef<PersonWithSubRows, ColumnTypes>[]
      render(<NestedRowWrapper data={nestedData} columns={columns} isVirtualized={false} />)
      expect(screen.getByTestId('table')).toBeInTheDocument()
      // Parent row 1 is visible
      expect(screen.getByTestId('table-row-1')).toBeInTheDocument()
      // Parent row 0 is expanded: both parent row 0 and its child (also index 0) are rendered
      expect(screen.getAllByTestId('table-row-0')).toHaveLength(2)
    })

    test('should render two-level nested rows (virtualized)', () => {
      const parentData = TableFactory.createData(2)
      const childData = TableFactory.createData(2)
      const nestedData: PersonWithSubRows[] = parentData.map((parent, i) => ({
        ...parent,
        subRows: [{ ...childData[i % childData.length]! }],
      }))
      const columns = TableFactory.createColumns() as unknown as ColumnDef<PersonWithSubRows, ColumnTypes>[]
      render(<NestedRowWrapper data={nestedData} columns={columns} isVirtualized={true} />)
      expect(screen.getByTestId('table')).toBeInTheDocument()
      // Parent row 0 and its child are both within the virtual window
      expect(screen.getAllByTestId('table-row-0')).toHaveLength(2)
    })
  })

  describe('Virtualization - sticky rows and onChangeRenderedRows', () => {
    test('should compute sticky indexes and apply sticky style when isRowSticky returns true', () => {
      const data = TableFactory.createData(5)
      const columns = TableFactory.createColumns()
      // Row at index 0 is sticky; since startIndex=0 and 0>=0, rangeExtractor lines 84-85 are reached
      const isRowSticky = (row: Row<Person>) => row.index === 0
      render(<Wrapper data={data} columns={columns} isVirtualized={true} isRowSticky={isRowSticky} />)
      expect(screen.getByTestId('table')).toBeInTheDocument()
      // Sticky row 0 is rendered and receives the sticky style position
      const stickyRow = screen.getByTestId('table-row-0')
      expect(stickyRow).toBeInTheDocument()
      expect(stickyRow).toHaveStyle({ position: 'sticky' })
    })

    test('should call onChangeRenderedRows when the virtualizer updates rendered rows', async () => {
      const mockOnChange = vi.fn()
      const columns = TableFactory.createColumns()
      const initialData = TableFactory.createData(3)

      const { rerender } = render(
        <Wrapper data={initialData} columns={columns} isVirtualized={true} onChangeRenderedRows={mockOnChange} />,
      )

      // Re-render with different data so the virtualizer updates the tbody DOM,
      // triggering the MutationObserver that calls onChangeRenderedRows
      await act(async () => {
        rerender(
          <Wrapper
            data={TableFactory.createData(5)}
            columns={columns}
            isVirtualized={true}
            onChangeRenderedRows={mockOnChange}
          />,
        )
      })

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled()
      })
    })
  })

  describe('Column ordering without an initial column order', () => {
    const EmptyOrderWrapper = ({ data, columns }: { data: Person[]; columns: ColumnDef<Person, ColumnTypes>[] }) => {
      const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([])
      const table = useTable({
        features: tableFeatureSet,
        data,
        columns,
        state: { columnOrder },
        onColumnOrderChange: setColumnOrder,
      })
      return (
        <AppWrapper>
          <Table<Person> table={table} isVirtualized={false} enableColumnOrdering />
        </AppWrapper>
      )
    }

    test('keeps every column when the column order state starts empty', () => {
      render(<EmptyOrderWrapper data={TableFactory.createData(1)} columns={TableFactory.createColumns()} />)

      act(() => {
        capturedOnDragEnd?.(
          {
            canceled: false,
            suspend: () => ({ abort: vi.fn(), resume: vi.fn() }),
            operation: { source: { id: 'id' }, target: { id: 'lastName' } } as Operation,
          },
          manager,
        )
      })

      const headers = [...document.querySelectorAll('thead th')].map((th) =>
        th.getAttribute('data-testid')?.replace('table-header-cell-', ''),
      )
      expect(headers).toEqual(['firstName', 'lastName', 'id', 'age', 'status', 'createdAt'])
    })
  })

  describe('onChangeRenderedRows callback updates', () => {
    test('calls the latest callback after it changes', async () => {
      const first = vi.fn()
      const second = vi.fn()
      const columns = TableFactory.createColumns()
      const { rerender } = render(
        <Wrapper data={TableFactory.createData(3)} columns={columns} isVirtualized onChangeRenderedRows={first} />,
      )

      await act(async () => {
        rerender(
          <Wrapper data={TableFactory.createData(3)} columns={columns} isVirtualized onChangeRenderedRows={second} />,
        )
      })
      first.mockClear()
      await act(async () => {
        rerender(
          <Wrapper data={TableFactory.createData(5)} columns={columns} isVirtualized onChangeRenderedRows={second} />,
        )
      })

      await waitFor(() => expect(second).toHaveBeenCalled())
      expect(first).not.toHaveBeenCalled()
    })
  })

  describe('Initial filter state', () => {
    test('shows the filter input with the active filter value', () => {
      const columns = TableFactory.createColumns(false, { showFilter: true })
      render(
        <Wrapper
          data={TableFactory.createData(3)}
          columns={columns}
          state={{ columnFilters: [{ id: 'firstName', value: 'First2' }] }}
        />,
      )

      const input = screen.getByTestId('table-filter-input') as HTMLInputElement
      expect(input.value).toBe('First2')
      expect(screen.getAllByTestId(/^table-row-\d+$/)).toHaveLength(1)
    })

    test('focuses the filter input when it is opened', async () => {
      const columns = TableFactory.createColumns(false, { showFilter: true })
      render(<Wrapper data={TableFactory.createData(3)} columns={columns} />)

      fireEvent.click(screen.getByTestId('table-header-cell-id-filter-button'))

      await waitFor(() => expect(document.activeElement).toBe(screen.getByTestId('table-filter-input')))
    })
  })

  describe('Sort button accessibility', () => {
    test('keeps the unsorted sort button in the tab order', () => {
      render(<Wrapper data={TableFactory.createData(1)} columns={TableFactory.createColumns()} />)

      const button = screen.getByTestId('table-header-cell-id-sort-button-false')
      expect(button).not.toHaveClass('hidden')
      expect(button).toHaveClass('opacity-0', 'focus-visible:opacity-100')
    })
  })

  describe('Group borders', () => {
    test('draws a left border where the column group changes', () => {
      render(<Wrapper data={TableFactory.createData(1)} columns={TableFactory.createWithNestedColumns(true)} />)

      expect(screen.getByTestId('table-row-cell-0-firstName')).not.toHaveClass('border-l')
      expect(screen.getByTestId('table-row-cell-0-age')).toHaveClass('border-l')
      expect(screen.getByTestId('table-row-cell-0-status')).not.toHaveClass('border-l')
      const headerRow = document.querySelectorAll('thead tr')[1]
      expect(headerRow.querySelector('[data-testid=table-header-cell-age]')).toHaveClass('border-l')
      expect(headerRow.querySelector('[data-testid=table-header-cell-lastName]')).not.toHaveClass('border-l')
    })
  })

  describe('Scroll rendering', () => {
    test('does not re-render the cells while scrolling between the edges', () => {
      let renders = 0
      const columns = TableFactory.createColumns().map((column, index) =>
        index === 0
          ? {
              ...column,
              cell: () => {
                renders++
                return 'cell'
              },
            }
          : column,
      )
      render(<Wrapper data={TableFactory.createData(1)} columns={columns} />)
      const scroller = screen.getByTestId('table-scroll-container')
      Object.defineProperty(scroller, 'scrollWidth', { configurable: true, value: 3000 })
      const scrollTo = (left: number) =>
        act(() => {
          Object.defineProperty(scroller, 'scrollLeft', { configurable: true, value: left })
          fireEvent.scroll(scroller)
        })

      scrollTo(10)
      const afterLeavingStart = renders
      scrollTo(20)
      scrollTo(30)

      expect(renders).toBe(afterLeavingStart)
    })
  })
})
