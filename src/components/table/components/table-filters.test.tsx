// @vitest-environment jsdom
import '@/test/setup-dom'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { useTable, type ColumnFiltersState } from '@tanstack/react-table'
import { TableFilters } from '@/components/table'
import { tableFeatureSet, type DataColumnDef } from '@/components/table/features'
import { AppWrapper } from '@/test/utils'

type Contact = { email: string; city: string }

const data: Contact[] = [
  { email: 'ana@example.com', city: 'Paris' },
  { email: 'ben@example.com', city: 'Paris' },
  { email: 'cara@example.com', city: 'Rome' },
]
const columns: DataColumnDef<Contact>[] = [
  { accessorKey: 'email', header: 'Email', filterFn: 'includesString' },
  { accessorKey: 'city', header: 'City', filterFn: 'includesString' },
]

function Contacts({ title, initialFilters = [] }: { title: string; initialFilters?: ColumnFiltersState }) {
  const [columnFilters, onColumnFiltersChange] = useState(initialFilters)
  const table = useTable({
    features: tableFeatureSet,
    columns,
    data,
    state: { columnFilters },
    onColumnFiltersChange,
  })
  const fields = ['email', 'city'].map((id) => {
    const value = table.getColumn(id)?.getFilterValue()
    return {
      id,
      label: id === 'email' ? 'Email' : 'City',
      value: typeof value === 'string' ? value : '',
    }
  })

  return (
    <section aria-label={title}>
      <TableFilters table={table} title={title} fields={fields} />
      <output aria-label={`${title} results`}>{table.getRowModel().rows.length}</output>
    </section>
  )
}

describe('TableFilters', () => {
  test('filters non-product rows and supports default chip removal and clearing', () => {
    render(<AppWrapper><Contacts title="Contact filters" /></AppWrapper>)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Filters' }))
    const popup = screen.getByRole('dialog', { name: 'Contact filters' })
    fireEvent.change(within(within(popup).getByRole('group', { name: 'Email' })).getByRole('textbox'), {
      target: { value: 'ana' },
    })
    fireEvent.change(within(within(popup).getByRole('group', { name: 'City' })).getByRole('textbox'), {
      target: { value: 'Paris' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Filters/ }))

    expect(screen.getByLabelText('Contact filters results')).toHaveTextContent('1')
    expect(screen.getByRole('group', { name: 'Active filters' })).toHaveTextContent('Email: ana')
    fireEvent.click(screen.getByRole('button', { name: 'Remove filter: Email' }))
    expect(screen.getByLabelText('Contact filters results')).toHaveTextContent('2')
    expect(screen.getByRole('group', { name: 'Active filters' })).toHaveTextContent('City: Paris')
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(screen.getByLabelText('Contact filters results')).toHaveTextContent('3')
    expect(screen.queryByRole('group', { name: 'Active filters' })).not.toBeInTheDocument()
  })

  test('keeps state independent when reused by two tables', async () => {
    const user = userEvent.setup()
    render(
      <AppWrapper>
        <Contacts title="Customers" initialFilters={[{ id: 'email', value: 'ana' }]} />
        <Contacts title="Suppliers" />
      </AppWrapper>,
    )

    await screen.findByRole('dialog', { name: 'Customers' })
    await user.keyboard('{Escape}')
    await user.click(within(screen.getByRole('region', { name: 'Suppliers' })).getByRole('button', { name: 'Filters' }))
    const popup = screen.getByRole('dialog', { name: 'Suppliers' })
    await user.type(within(within(popup).getByRole('group', { name: 'City' })).getByRole('textbox'), 'Rome')

    expect(screen.queryByRole('dialog', { name: 'Customers' })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Customers results')).toHaveTextContent('1')
    expect(screen.getByLabelText('Suppliers results')).toHaveTextContent('1')
    expect(within(screen.getByRole('region', { name: 'Customers' })).getByRole('group', { name: 'Active filters' })).toHaveTextContent('ana')
    expect(within(screen.getByRole('region', { name: 'Suppliers' })).getByRole('group', { name: 'Active filters' })).toHaveTextContent('Rome')
  })
})
