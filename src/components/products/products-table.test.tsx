// @vitest-environment jsdom
import { fireEvent, render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import '@/test/setup-dom'

import type { ColumnFiltersState, SortingState, Updater } from '@tanstack/react-table'
import type { Category, Product, Subcategory } from '@/lib/products-api'
import { defineBoundingClientRect, defineClientDimensions } from '@/test/dom'
import { AppWrapper } from '@/test/utils'
import { ProductsTable } from '@/components/products/products-table'

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

const renderProductsTable = (props: Partial<typeof defaultProps> = {}) =>
  render(
    <AppWrapper>
      <ProductsTable {...defaultProps} {...props} />
    </AppWrapper>,
  )

describe('ProductsTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

  test('shows filters in their corresponding product column headers', () => {
    renderProductsTable()

    for (const columnId of ['name', 'category', 'subcategory', 'price', 'stock']) {
      expect(screen.getByTestId(`table-header-cell-${columnId}-filter-button`)).toBeInTheDocument()
    }

    const nameHeader = screen.getByTestId('table-header-cell-name')
    fireEvent.click(within(nameHeader).getByRole('button', { name: 'Filter' }))

    expect(within(nameHeader).getByRole('searchbox')).toHaveAttribute(
      'placeholder',
      'Name, SKU or description',
    )
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

    const header = screen.getByTestId(`table-header-cell-${String(columnId)}`)
    const trigger = within(header).getByRole('combobox', { name: String(label) })
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
