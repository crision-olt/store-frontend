// @vitest-environment jsdom
import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import '@/test/setup-dom'

import type { PaginationState, SortingState, Updater } from '@tanstack/react-table'
import type { Product } from '@/lib/products-api'
import { AppWrapper } from '@/test/utils'
import { ProductsTable } from '@/components/products/products-table'

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
const onPaginationChange = vi.fn<(updater: Updater<PaginationState>) => void>()

const defaultProps = {
  products: [product],
  total: 1,
  isLoading: false,
  isFetching: false,
  sorting: [] as SortingState,
  onSortingChange,
  pagination: { pageIndex: 0, pageSize: 10 },
  onPaginationChange,
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

    fireEvent.click(within(screen.getByTestId('table-header-cell-name')).getByRole('button'))

    const updater = onSortingChange.mock.calls[0]?.[0]
    expect(typeof updater).toBe('function')
    if (typeof updater === 'function') {
      expect(updater([])).toEqual([{ id: 'name', desc: false }])
    }
  })

  test('shows the shared loading state', () => {
    renderProductsTable({ isLoading: true })

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
  })

  test('shows the shared empty state', () => {
    renderProductsTable({ products: [], total: 0 })

    expect(screen.getByTestId('table-feedback-state')).toHaveTextContent('No products found.')
  })

  test('delegates server-side page changes', () => {
    renderProductsTable({ total: 21 })

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    const updater = onPaginationChange.mock.calls[0]?.[0]
    expect(typeof updater).toBe('function')
    if (typeof updater === 'function') {
      expect(updater({ pageIndex: 0, pageSize: 10 })).toEqual({ pageIndex: 1, pageSize: 10 })
    }
  })
})
