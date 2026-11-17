// @vitest-environment jsdom
import '@/test/setup-dom'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DragDropManager } from '@dnd-kit/dom'
import type { DragDropProvider } from '@dnd-kit/react'
import { isValidElement, type ComponentProps } from 'react'
import { useTable, type ColumnOrderState } from '@tanstack/react-table'
import { Table, TableColumnVisibility } from '@/components/table'
import { tableFeatureSet, type DataColumnDef } from '@/components/table/features'
import { defineBoundingClientRect, defineClientDimensions } from '@/test/dom'
import { AppWrapper } from '@/test/utils'

defineBoundingClientRect()
defineClientDimensions()

type DragEndHandler = NonNullable<ComponentProps<typeof DragDropProvider>['onDragEnd']>
type Operation = Parameters<DragEndHandler>[0]['operation']
let onColumnDragEnd: DragEndHandler | undefined
const manager = new DragDropManager({ sensors: [], plugins: [] })

vi.mock('@dnd-kit/react', async (importActual) => {
  const actual = await importActual<typeof import('@dnd-kit/react')>()
  return {
    ...actual,
    DragDropProvider: (props: ComponentProps<typeof DragDropProvider>) => {
      if (isValidElement<{ 'data-testid'?: string }>(props.children)
        && props.children.props['data-testid'] === 'column-visibility-list') {
        onColumnDragEnd = props.onDragEnd
      }
      return <actual.DragDropProvider {...props} />
    },
  }
})

function dropColumn(source: string, target: string, canceled = false) {
  expect(onColumnDragEnd).toBeDefined()
  act(() => onColumnDragEnd?.({
    canceled,
    suspend: () => ({ abort: vi.fn(), resume: vi.fn() }),
    operation: { source: { id: source }, target: { id: target } } as Operation,
  }, manager))
}

type Contact = { name: string; email: string; city: string; code: string }

const data: Contact[] = [{ name: 'Ana', email: 'ana@example.com', city: 'Paris', code: 'A1' }]
const columns: DataColumnDef<Contact>[] = [
  { accessorKey: 'name', header: 'Contact name' },
  {
    id: 'details',
    header: 'Details',
    columns: [
      { accessorKey: 'email', header: 'Email' },
      { accessorKey: 'city', header: 'City' },
    ],
  },
  { accessorKey: 'code', header: () => <span>Reference</span>, enableHiding: false },
]

const flatColumns: DataColumnDef<Contact>[] = [
  { accessorKey: 'name', header: 'Contact name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'city', header: 'City' },
  { accessorKey: 'code', header: 'Reference', enableHiding: false },
]

function ReorderableContacts({ columnOrder = [] }: { columnOrder?: ColumnOrderState }) {
  const table = useTable({
    features: tableFeatureSet,
    columns: flatColumns,
    data,
    initialState: {
      columnOrder,
      columnVisibility: { city: false },
      columnPinning: { start: ['name'], end: [] },
    },
  })

  return (
    <>
      <TableColumnVisibility table={table} />
      <Table table={table} isVirtualized={false} className="h-96" />
    </>
  )
}

function Contacts({ pinEmail = true }: { pinEmail?: boolean }) {
  const table = useTable({
    features: tableFeatureSet,
    columns,
    data,
    initialState: {
      columnVisibility: { city: false },
      columnPinning: { start: ['name'], end: pinEmail ? ['email'] : [] },
    },
  })

  return (
    <>
      <TableColumnVisibility table={table} columnLabels={{ code: 'Reference' }} />
      <Table table={table} isVirtualized={false} className="h-96" />
    </>
  )
}

describe('TableColumnVisibility', () => {
  beforeEach(() => {
    onColumnDragEnd = undefined
  })

  test('reorders table columns and hidden options from a partial initial order', async () => {
    const user = userEvent.setup()
    render(<AppWrapper><ReorderableContacts columnOrder={['code']} /></AppWrapper>)
    await user.click(screen.getByRole('button', { name: 'Columns' }))
    const optionOrder = () => screen.getAllByRole('checkbox').map((checkbox) => checkbox.getAttribute('aria-label'))
    const headerOrder = () => screen.getAllByRole('columnheader').map((header) => header.getAttribute('data-testid'))

    expect(screen.getByRole('button', { name: 'Reorder Contact name' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Reorder Reference' })).toBeEnabled()
    expect(optionOrder()).toEqual(['Contact name', 'Reference', 'Email', 'City'])

    dropColumn('email', 'code')
    expect(optionOrder()).toEqual(['Contact name', 'Email', 'Reference', 'City'])
    expect(headerOrder()).toEqual(['table-header-cell-name', 'table-header-cell-email', 'table-header-cell-code'])

    dropColumn('city', 'email')
    expect(optionOrder()).toEqual(['Contact name', 'City', 'Email', 'Reference'])
    expect(screen.getByRole('checkbox', { name: 'City' })).not.toBeChecked()
    await user.click(screen.getByRole('checkbox', { name: 'City' }))
    expect(headerOrder()).toEqual([
      'table-header-cell-name', 'table-header-cell-city', 'table-header-cell-email', 'table-header-cell-code',
    ])
    expect(screen.getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
      'Ana', 'Paris', 'ana@example.com', 'A1',
    ])

    dropColumn('code', 'city')
    expect(optionOrder()).toEqual(['Contact name', 'Reference', 'City', 'Email'])
    expect(screen.getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
      'Ana', 'A1', 'Paris', 'ana@example.com',
    ])
  })

  test.each([
    ['name', 'code', false],
    ['code', 'name', false],
    ['email', 'code', true],
  ])('does not move fixed columns or apply canceled drops (%s to %s)', async (source, target, canceled) => {
    const user = userEvent.setup()
    render(<AppWrapper><ReorderableContacts /></AppWrapper>)
    await user.click(screen.getByRole('button', { name: 'Columns' }))
    const before = screen.getAllByRole('checkbox').map((checkbox) => checkbox.getAttribute('aria-label'))

    dropColumn(source, target, canceled)

    expect(screen.getAllByRole('checkbox').map((checkbox) => checkbox.getAttribute('aria-label'))).toEqual(before)
  })

  test('does not move a column outside its parent group', async () => {
    const user = userEvent.setup()
    render(<AppWrapper><Contacts /></AppWrapper>)
    await user.click(screen.getByRole('button', { name: 'Columns' }))
    const before = screen.getAllByRole('checkbox').map((checkbox) => checkbox.getAttribute('aria-label'))

    dropColumn('code', 'city')

    expect(screen.getAllByRole('checkbox').map((checkbox) => checkbox.getAttribute('aria-label'))).toEqual(before)
  })

  test('reorders sibling columns inside a group', async () => {
    const user = userEvent.setup()
    render(<AppWrapper><Contacts pinEmail={false} /></AppWrapper>)
    await user.click(screen.getByRole('button', { name: 'Columns' }))

    dropColumn('city', 'email')
    await user.click(screen.getByRole('checkbox', { name: 'City' }))

    expect(screen.getAllByRole('checkbox').map((checkbox) => checkbox.getAttribute('aria-label'))).toEqual([
      'Contact name', 'City', 'Email', 'Reference',
    ])
    expect(screen.getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
      'Ana', 'Paris', 'ana@example.com', 'A1',
    ])
  })

  test('lists every leaf column, including hidden columns, with its current visibility', async () => {
    const user = userEvent.setup()
    render(<AppWrapper><Contacts /></AppWrapper>)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Columns' }))
    const popup = screen.getByRole('dialog', { name: 'Visible columns' })
    expect(within(popup).getAllByRole('checkbox')).toHaveLength(4)
    expect(within(popup).getByRole('checkbox', { name: 'Contact name' })).toBeChecked()
    expect(within(popup).getByRole('checkbox', { name: 'Email' })).toBeChecked()
    expect(within(popup).getByRole('checkbox', { name: 'Reference' })).toBeChecked()
    expect(within(popup).getByRole('checkbox', { name: 'City' })).not.toBeChecked()
    expect(screen.queryByTestId('table-header-cell-city')).not.toBeInTheDocument()
  })

  test('shows and hides a column without losing its option or closing the popup', async () => {
    const user = userEvent.setup()
    render(<AppWrapper><Contacts /></AppWrapper>)
    await user.click(screen.getByRole('button', { name: 'Columns' }))
    const city = screen.getByRole('checkbox', { name: 'City' })

    await user.click(city)
    expect(city).toBeChecked()
    expect(screen.getByTestId('table-header-cell-city')).toBeVisible()
    expect(screen.getByRole('cell', { name: 'Paris' })).toBeVisible()

    await user.click(city)
    expect(city).not.toBeChecked()
    expect(screen.queryByTestId('table-header-cell-city')).not.toBeInTheDocument()
    expect(screen.queryByRole('cell', { name: 'Paris' })).not.toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Visible columns' })).toBeVisible()
    expect(screen.getAllByRole('checkbox')).toHaveLength(4)
  })

  test('does not allow start-pinned, end-pinned, or required columns to be hidden', async () => {
    const user = userEvent.setup()
    render(<AppWrapper><Contacts /></AppWrapper>)
    await user.click(screen.getByRole('button', { name: 'Columns' }))

    for (const name of ['Contact name', 'Email', 'Reference']) {
      const checkbox = screen.getByRole('checkbox', { name })
      expect(checkbox).toHaveAttribute('aria-disabled', 'true')
      await user.click(checkbox)
      expect(checkbox).toBeChecked()
    }

    for (const id of ['name', 'email', 'code']) {
      for (const header of screen.getAllByTestId(`table-header-cell-${id}`)) {
        expect(header).toBeVisible()
      }
    }
  })
})
