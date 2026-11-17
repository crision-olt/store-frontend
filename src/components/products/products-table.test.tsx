// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import '@/test/setup-dom'
import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'

import type { ColumnFiltersState, SortingState, Updater } from '@tanstack/react-table'
import type { Category, Product, Subcategory } from '@/lib/products-api'
import { ProductsApiError, updateProduct } from '@/lib/products-api'
import { defineBoundingClientRect, defineClientDimensions } from '@/test/dom'
import { AppWrapper } from '@/test/utils'
import { ProductsTable } from '@/components/products/products-table'

vi.mock('@/lib/products-api', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/products-api')>(),
  listCategories: vi.fn(async () => categories),
  listSubcategories: vi.fn(async () => subcategories),
  updateProduct: vi.fn(),
}))

defineBoundingClientRect()
defineClientDimensions()

const product: Product = {
  id: 1,
  name: 'Demo product',
  description: 'A sample product',
  sku: 'DEMO-1',
  categoryId: 1,
  categoryName: 'Accessories',
  subcategoryId: null,
  subcategoryName: null,
  price: 12.5,
  stock: 4,
  created_at: '2025-01-01T00:00:00.000Z',
}

const onSortingChange = vi.fn<(updater: Updater<SortingState>) => void>()
const onColumnFiltersChange = vi.fn<(updater: Updater<ColumnFiltersState>) => void>()
const categories = [
  { id: 1, name: 'Accessories' },
  { id: 3, name: 'Hardware' },
]
const subcategories = [
  { id: 2, name: 'Cases', categoryId: 1 },
  { id: 4, name: 'Tools', categoryId: 3 },
]

const defaultProps = {
  products: [product],
  isLoading: false,
  isFetching: false,
  sorting: [] as SortingState,
  onSortingChange,
  columnFilters: [] as ColumnFiltersState,
  onColumnFiltersChange,
  categories: [] as Category[],
  subcategories: [] as Subcategory[],
  onCategoryChange: vi.fn(),
}

const renderProductsTable = (props: Partial<typeof defaultProps> = {}) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return {
    client,
    ...render(
      <AppWrapper>
        <QueryClientProvider client={client}>
          <MemoryRouter initialEntries={['/products']}>
            <ProductsTable {...defaultProps} {...props} />
          </MemoryRouter>
        </QueryClientProvider>
      </AppWrapper>,
    ),
  }
}

describe('ProductsTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(updateProduct).mockReset()
  })

  test('updates column widths while dragging and keeps the final width after release', async () => {
    renderProductsTable()
    const container = screen.getByTestId('table-container')
    const resizer = screen.getByTestId('table-header-cell-sku-resizer')
    const width = () => Number.parseFloat(container.style.getPropertyValue('--col-sku-size'))
    const initialWidth = width()

    fireEvent.mouseDown(resizer, { clientX: 200, buttons: 1 })
    fireEvent.mouseMove(document, { clientX: 260, buttons: 1 })
    expect(width()).toBe(initialWidth + 60)
    fireEvent.mouseMove(document, { clientX: 180, buttons: 1 })
    await waitFor(() => expect(width()).toBe(initialWidth - 20))
    fireEvent.mouseUp(document, { clientX: 180 })
    expect(width()).toBe(initialWidth - 20)

    expect(onSortingChange).not.toHaveBeenCalled()
    expect(onColumnFiltersChange).not.toHaveBeenCalled()
  })

  test('opens one prefilled editor and saves the chosen product with compatible category selections', async () => {
    let finish!: () => void
    vi.mocked(updateProduct).mockImplementation((id, input) => new Promise((resolve) => {
      finish = () => resolve({ ...product, ...input, id, categoryName: 'Hardware', subcategoryName: 'Tools' })
    }))
    const user = userEvent.setup()
    const { client } = renderProductsTable({
      products: [product, { ...product, id: 7, name: 'Target product', subcategoryId: 2, subcategoryName: 'Cases' }],
      categories, subcategories,
    })
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    await user.click(screen.getByRole('button', { name: 'Edit product Target product' }))
    expect(await screen.findByRole('dialog', { name: 'Edit product' })).toBeVisible()
    expect(screen.getByLabelText('Name')).toHaveValue('Target product')
    expect(screen.getByLabelText('SKU')).toHaveValue('DEMO-1')
    expect(screen.getByLabelText('Description (optional)')).toHaveValue('A sample product')
    expect(screen.getByLabelText('Price')).toHaveValue(12.5)
    expect(screen.getByLabelText('Stock')).toHaveValue(4)
    expect(screen.getByRole('combobox', { name: 'Category' })).toHaveTextContent('Accessories')
    expect(screen.getByRole('combobox', { name: 'Subcategory (optional)' })).toHaveTextContent('Cases')
    await user.clear(screen.getByLabelText('Name'))
    await user.type(screen.getByLabelText('Name'), 'Updated product')
    await user.clear(screen.getByLabelText('SKU'))
    await user.type(screen.getByLabelText('SKU'), 'NEW-1')
    await user.clear(screen.getByLabelText('Description (optional)'))
    await user.click(screen.getByRole('combobox', { name: 'Category' }))
    await user.click(await screen.findByRole('option', { name: 'Hardware' }))
    expect(screen.getByRole('combobox', { name: 'Subcategory (optional)' })).toHaveTextContent('None')
    await user.click(screen.getByRole('combobox', { name: 'Subcategory (optional)' }))
    expect(screen.queryByRole('option', { name: 'Cases' })).not.toBeInTheDocument()
    await user.click(await screen.findByRole('option', { name: 'Tools' }))
    fireEvent.change(screen.getByLabelText('Price'), { target: { value: '0' } })
    fireEvent.change(screen.getByLabelText('Stock'), { target: { value: '0' } })
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(updateProduct).toHaveBeenCalledExactlyOnceWith(7, {
      name: 'Updated product', sku: 'NEW-1', description: null,
      categoryId: 3, subcategoryId: 4, price: 0, stock: 0,
    })
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled()
    await user.keyboard('{Escape}')
    expect(screen.getByRole('dialog', { name: 'Edit product' })).toBeInTheDocument()
    finish()
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Edit product' })).not.toBeInTheDocument())
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['products'] })
  })

  test.each([
    [409, 'A product with this SKU already exists.'],
    [404, 'This product no longer exists.'],
  ])('keeps edits on HTTP %s and discards them on cancel', async (status, message) => {
    vi.mocked(updateProduct).mockRejectedValueOnce(new ProductsApiError(status))
    const user = userEvent.setup()
    renderProductsTable({ categories, subcategories })
    const trigger = screen.getByRole('button', { name: 'Edit product Demo product' })
    await user.click(trigger)
    await screen.findByRole('dialog', { name: 'Edit product' })
    await user.clear(screen.getByLabelText('Name'))
    await user.type(screen.getByLabelText('Name'), 'Unsaved name')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(screen.getByLabelText('Name')).toHaveValue('Unsaved name')
    expect(screen.getByText('Demo product')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await user.click(trigger)
    expect(await screen.findByLabelText('Name')).toHaveValue('Demo product')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(updateProduct).toHaveBeenCalledOnce()
  })

  test('renders products in the shared table and delegates sorting changes', () => {
    renderProductsTable()

    expect(screen.getByTestId('table-container')).toBeInTheDocument()
    expect(screen.getByText('Demo product')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('table-header-cell-name-sort-button-false'))

    const updater = onSortingChange.mock.calls[0]?.[0]
    expect(typeof updater).toBe('function')
    if (typeof updater === 'function') {
      expect(updater([])).toEqual([{ id: 'name', desc: false }])
    }
  })

  test('pins the product name header and cells while leaving other columns unpinned', () => {
    renderProductsTable()

    expect(screen.getByTestId('table-header-cell-name')).toHaveStyle({ position: 'sticky', left: '0px' })
    expect(screen.getByRole('cell', { name: /Demo product/ })).toHaveStyle({
      position: 'sticky',
      left: '0px',
    })
    expect(screen.getByTestId('table-header-cell-sku')).not.toHaveStyle({ position: 'sticky' })
    expect(screen.getByRole('cell', { name: 'DEMO-1' })).not.toHaveStyle({ position: 'sticky' })
  })

  test('lets users configure all product columns while keeping the name visible', async () => {
    const user = userEvent.setup()
    renderProductsTable()

    await user.click(screen.getByRole('button', { name: 'Columns' }))
    const popup = screen.getByRole('dialog', { name: 'Visible columns' })
    expect(within(popup).getAllByRole('checkbox')).toHaveLength(7)
    for (const name of ['Name', 'SKU', 'Category', 'Subcategory', 'Price', 'Stock', 'Created']) {
      expect(within(popup).getByRole('checkbox', { name })).toBeChecked()
    }
    expect(within(popup).getByRole('checkbox', { name: 'Name' })).toHaveAttribute('aria-disabled', 'true')

    await user.click(within(popup).getByRole('checkbox', { name: 'SKU' }))
    expect(screen.queryByTestId('table-header-cell-sku')).not.toBeInTheDocument()
    expect(screen.queryByRole('cell', { name: 'DEMO-1' })).not.toBeInTheDocument()
    expect(within(popup).getByRole('checkbox', { name: 'SKU' })).not.toBeChecked()
    expect(screen.getByTestId('table-header-cell-name')).toHaveStyle({ position: 'sticky', left: '0px' })

    await user.click(within(popup).getByRole('checkbox', { name: 'SKU' }))
    expect(screen.getByTestId('table-header-cell-sku')).toBeVisible()
    expect(screen.getByRole('cell', { name: 'DEMO-1' })).toBeVisible()
  })

  test('starts with collapsed filters and keeps controls outside column headers', () => {
    const { container } = renderProductsTable()

    for (const columnId of ['name', 'category', 'subcategory', 'price', 'stock']) {
      expect(screen.queryByTestId(`table-header-cell-${columnId}-filter-button`)).not.toBeInTheDocument()
    }

    const toggle = screen.getByRole('button', { name: 'Filters' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    fireEvent.click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('searchbox')).toHaveAttribute(
      'placeholder',
      'Name, SKU or description',
    )
    const dropdown = screen.getByRole('dialog', { name: 'Product filters' })
    expect(dropdown).toContainElement(screen.getByRole('searchbox'))
    expect(container).not.toContainElement(dropdown)
    expect(screen.getByTestId('table-header-cell-name')).not.toContainElement(screen.getByRole('searchbox'))
  })

  test('dismisses the dropdown without clearing filters and restores keyboard focus', async () => {
    const user = userEvent.setup()
    renderProductsTable({ columnFilters: [{ id: 'name', value: 'Demo' }] })

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Product filters' })).not.toBeInTheDocument())
    const toggle = screen.getByRole('button', { name: /Filters/ })
    await waitFor(() => expect(toggle).toHaveFocus())
    expect(screen.getByRole('group', { name: 'Active filters' })).toHaveTextContent('Demo')

    await user.click(toggle)
    await user.click(screen.getByText('Demo product'))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Product filters' })).not.toBeInTheDocument())

    await user.click(toggle)
    await user.click(screen.getByRole('button', { name: 'Close filter' }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Product filters' })).not.toBeInTheDocument())
    expect(onColumnFiltersChange).not.toHaveBeenCalled()
  })

  test('keeps the filter dropdown open when choosing a nested category option', async () => {
    const user = userEvent.setup()
    renderProductsTable({ categories })

    await user.click(screen.getByRole('button', { name: 'Filters' }))
    await user.click(screen.getByRole('combobox', { name: 'Filter by category' }))
    await user.click(await screen.findByRole('option', { name: 'Accessories' }))

    expect(screen.getByRole('dialog', { name: 'Product filters' })).toBeVisible()
    expect(defaultProps.onCategoryChange).toHaveBeenCalledOnce()
    expect(onColumnFiltersChange).toHaveBeenCalledOnce()
  })

  test('keeps active filters visible when collapsed and supports removing and clearing them', () => {
    function FilteredTable() {
      const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
      return (
        <ProductsTable
          {...defaultProps}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
        />
      )
    }
    render(<AppWrapper><FilteredTable /></AppWrapper>)

    fireEvent.click(screen.getByRole('button', { name: 'Filters' }))
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Demo' } })
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Minimum price' }), { target: { value: '0' } })
    fireEvent.click(screen.getByRole('button', { name: /Filters/ }))

    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    const summary = screen.getByRole('group', { name: 'Active filters' })
    expect(summary).toHaveTextContent('Demo')
    expect(summary).toHaveTextContent('0')
    expect(screen.getByRole('button', { name: /Filters/ })).toHaveTextContent('2')

    fireEvent.click(screen.getByRole('button', { name: /Filters/ }))
    expect(screen.getByRole('searchbox')).toHaveValue('Demo')
    expect(screen.getByRole('spinbutton', { name: 'Minimum price' })).toHaveValue(0)
    fireEvent.click(screen.getByRole('button', { name: /Filters/ }))

    fireEvent.click(screen.getByRole('button', { name: 'Remove filter: Search' }))
    expect(summary).not.toHaveTextContent('Demo')
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(screen.queryByRole('group', { name: 'Active filters' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Filters' })).toHaveAttribute('aria-expanded', 'false')
  })

  test.each([
    ['price', { minPrice: '', maxPrice: '25' }, 'Price: Max: 25'],
    ['stock', ['out'], 'Availability: Out of stock'],
  ])('shows a readable summary for an existing %s filter', async (id, value, summary) => {
    renderProductsTable({ columnFilters: [{ id, value }] })

    await waitFor(() => expect(screen.getByRole('dialog', { name: 'Product filters' })).toBeVisible())
    fireEvent.click(screen.getByRole('button', { name: /Filters/ }))
    expect(screen.getByRole('group', { name: 'Active filters' })).toHaveTextContent(summary)
    expect(screen.queryByRole('dialog', { name: 'Product filters' })).not.toBeInTheDocument()
  })

  test('removing a category also clears its dependent subcategory', () => {
    renderProductsTable({
      columnFilters: [
        { id: 'category', value: ['1'] },
        { id: 'subcategory', value: ['2'] },
      ],
      categories,
      subcategories,
    })

    expect(screen.getByRole('button', { name: /Filters/ })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('group', { name: 'Active filters' })).toHaveTextContent('Accessories')
    fireEvent.click(screen.getByRole('button', { name: 'Remove filter: Category' }))
    const updater = onColumnFiltersChange.mock.calls[0]?.[0]
    expect(typeof updater).toBe('function')
    if (typeof updater === 'function') {
      expect(updater([
        { id: 'category', value: ['1'] },
        { id: 'subcategory', value: ['2'] },
        { id: 'name', value: 'Demo' },
      ])).toEqual([{ id: 'name', value: 'Demo' }])
    }
  })

  test.each([
    ['category', 'Filter by category', ['1', '3'], ['Accessories', 'Hardware']],
    ['subcategory', 'Filter by subcategory', ['2', '4'], ['Cases (Accessories)', 'Tools (Hardware)']],
    ['stock', 'Filter by availability', ['in', 'out'], ['All']],
  ])('displays multiple selected values for the %s filter', (columnId, label, selected, labels) => {
    renderProductsTable({
      columnFilters: [{ id: String(columnId), value: selected }],
      categories,
      subcategories,
    })

    if (selected.length === 2 && columnId === 'stock') {
      fireEvent.click(screen.getByRole('button', { name: 'Filters' }))
    }
    const trigger = screen.getByRole('combobox', { name: String(label) })
    for (const value of labels) expect(trigger).toHaveTextContent(String(value))
  })

  test('shows the shared loading state', () => {
    renderProductsTable({ isLoading: true })

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
  })

  test('shows the empty state below the sortable column headers', () => {
    renderProductsTable({ products: [] })

    const feedback = screen.getByTestId('table-feedback-state')
    const header = screen.getByTestId('table-header-cell-name')
    const scrollContainer = screen.getByTestId('table-scroll-container')

    expect(feedback).toHaveTextContent('No products found.')
    expect(feedback).toHaveClass('static')
    expect(scrollContainer).toContainElement(feedback)
    expect(header).toBeVisible()
    fireEvent.click(within(header).getByTestId('table-header-cell-name-sort-button-false'))
    expect(onSortingChange).toHaveBeenCalledOnce()
  })

  test('does not show pagination controls', () => {
    renderProductsTable()

    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Previous' })).not.toBeInTheDocument()
    expect(screen.queryByText('Rows per page')).not.toBeInTheDocument()
  })
})
