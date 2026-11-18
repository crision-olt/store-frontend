// @vitest-environment jsdom
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { i18n } from '@lingui/core'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import '@/test/setup-dom'
import { useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'

import { useTable, type ColumnFiltersState, type SortingState, type Updater } from '@tanstack/react-table'
import type { Category, Product, Subcategory } from '@/lib/products-api'
import { listAllProducts, ProductsApiError, updateProduct } from '@/lib/products-api'
import { defineBoundingClientRect, defineClientDimensions } from '@/test/dom'
import { AppWrapper } from '@/test/utils'
import { ProductsTable } from '@/components/products/products-table'
import { downloadExcel } from '@/lib/exports-api'
import { DownloadProductsButton } from '@/components/products/download-products-button'
import { useProductColumns } from '@/components/products/products-table-columns'
import { tableFeatureSet } from '@/components/table/features'
import { ProductsPage } from '@/pages/products'

vi.mock('@/components/auth/require-auth', () => ({
  RequireAuth: ({ children }: { children: ReactNode }) => children,
}))
vi.mock('@/components/store-layout', () => ({
  StoreLayout: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}))

vi.mock('@/lib/exports-api', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/exports-api')>(),
  downloadExcel: vi.fn(),
}))

vi.mock('@/lib/products-api', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/products-api')>(),
  listCategories: vi.fn(async () => categories),
  listSubcategories: vi.fn(async () => subcategories),
  updateProduct: vi.fn(),
  listAllProducts: vi.fn(),
}))

defineBoundingClientRect()
defineClientDimensions()

vi.mock('@/lib/allergens-api', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/allergens-api')>(),
  listAllergens: vi.fn().mockResolvedValue([
    { id: 3, code: 'eggs', name: 'Eggs', nameEs: 'Huevos' },
    { id: 7, code: 'milk', name: 'Milk', nameEs: 'Leche' },
  ]),
}))

const product: Product = {
  id: 1,
  name: 'Demo product',
  description: 'A sample product',
  sku: 'DEMO-1',
  categoryId: 1,
  categoryName: 'Accessories',
  subcategoryId: null,
  subcategoryName: null,
  allergenIds: [7],
  price: 12.5,
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
  isExportDisabled: false,
  sorting: [] as SortingState,
  onSortingChange,
  columnFilters: [] as ColumnFiltersState,
  onColumnFiltersChange,
  categories: [] as Category[],
  subcategories: [] as Subcategory[],
  onCategoryChange: vi.fn(),
}

const renderProductsTable = (props: Partial<typeof defaultProps> = {}, content?: ReactNode) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return {
    client,
    ...render(
      <AppWrapper>
        <QueryClientProvider client={client}>
          <MemoryRouter initialEntries={['/products']}>
            {content ?? <ProductsTable {...defaultProps} {...props} />}
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
    vi.mocked(downloadExcel).mockReset()
    vi.mocked(listAllProducts).mockReset()
  })

  test('exports filtered rows in their current order with only visible columns and a timestamped filename', async () => {
    vi.mocked(downloadExcel).mockResolvedValue()
    const user = userEvent.setup()
    renderProductsTable({
      products: [{ ...product, id: 2, name: 'Second', price: 20 }, product],
      sorting: [{ id: 'price', desc: true }],
      columnFilters: [{ id: 'category', value: ['1'] }],
    })
    await user.click(screen.getByRole('button', { name: 'Columns' }))
    for (const name of ['SKU', 'Subcategory', 'Created']) {
      await user.click(screen.getByRole('checkbox', { name }))
    }
    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: 'Download Excel' }))
    await waitFor(() => expect(downloadExcel).toHaveBeenCalledExactlyOnceWith({
      headers: ['Name', 'Category', 'Price'],
      rows: [
        ['Second', 'Accessories', 20],
        ['Demo product', 'Accessories', 12.5],
      ],
    }, expect.stringMatching(/^Products_\d{13}\.xlsx$/)))
    expect(onColumnFiltersChange).not.toHaveBeenCalled()
    expect(onSortingChange).not.toHaveBeenCalled()
  })

  test('prevents duplicate downloads and allows retrying after a failed export', async () => {
    let reject!: (error: Error) => void
    vi.mocked(downloadExcel).mockImplementationOnce(() => new Promise((_resolve, rejectPromise) => {
      reject = rejectPromise
    })).mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderProductsTable()
    await user.click(screen.getByRole('button', { name: 'Download Excel' }))
    expect(screen.getByRole('button', { name: 'Preparing Excel…' })).toBeDisabled()
    await act(async () => reject(new Error('Connection lost')))
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not download Excel. Please try again.')
    await user.click(screen.getByRole('button', { name: 'Download Excel' }))
    await waitFor(() => expect(downloadExcel).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
  })

  test('matches pinned and reordered columns and excludes unsaved products', async () => {
    function ReorderedDownload() {
      const table = useTable({
        features: tableFeatureSet,
        columns: useProductColumns({
          categories: [], subcategories: [], onCategoryChange: vi.fn(),
          onEditProduct: vi.fn(), onArchiveProduct: vi.fn(),
        }),
        data: [{ ...product, id: -1, name: 'Unsaved', isPending: true }, product],
        initialState: {
          columnOrder: ['price', 'category', 'sku', 'name'],
          columnVisibility: { sku: false, subcategory: false, created_at: false },
          columnPinning: { start: ['name'], end: [] },
        },
      })
      return <DownloadProductsButton table={table} disabled={false} />
    }
    vi.mocked(downloadExcel).mockResolvedValue()
    renderProductsTable({}, <ReorderedDownload />)
    await userEvent.click(screen.getByRole('button', { name: 'Download Excel' }))
    await waitFor(() => expect(downloadExcel).toHaveBeenCalledExactlyOnceWith({
      headers: ['Name', 'Price', 'Category'],
      rows: [['Demo product', 12.5, 'Accessories']],
    }, expect.stringMatching(/^Products_\d{13}\.xlsx$/)))
  })

  test('waits for changed page filters and their results before exporting', async () => {
    let finish!: (products: Product[]) => void
    vi.mocked(listAllProducts).mockImplementation((query) => query?.search
      ? new Promise((resolve) => { finish = resolve })
      : Promise.resolve([product]))
    vi.mocked(downloadExcel).mockResolvedValue()
    renderProductsTable({}, <ProductsPage />)
    const user = userEvent.setup()
    const button = screen.getByRole('button', { name: 'Download Excel' })
    await waitFor(() => expect(button).toBeEnabled())
    await user.click(screen.getByRole('button', { name: 'Filters' }))
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Target' } })
    expect(button).toBeDisabled()
    await waitFor(() => expect(listAllProducts).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'Target' }), expect.anything(),
    ))
    expect(button).toBeDisabled()
    await act(async () => finish([{ ...product, name: 'Target product' }]))
    await waitFor(() => expect(button).toBeEnabled())
    await user.click(button)
    await waitFor(() => expect(downloadExcel).toHaveBeenCalledWith(
      expect.objectContaining({
        rows: [['Target product', 'DEMO-1', 'Accessories', null, 12.5, product.created_at]],
      }),
      expect.stringMatching(/^Products_\d{13}\.xlsx$/),
    ))
    await user.click(screen.getByRole('button', { name: /Filters/ }))
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Minimum price' }), { target: { value: '30' } })
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Maximum price' }), { target: { value: '20' } })
    expect(button).toBeDisabled()
  })

  test.each([
    { isLoading: true },
    { isFetching: true },
    { products: [] },
    { isExportDisabled: true },
  ])('does not export an empty, loading or outdated table: %o', (props) => {
    renderProductsTable(props)
    expect(screen.getByRole('button', { name: 'Download Excel' })).toBeDisabled()
    expect(downloadExcel).not.toHaveBeenCalled()
  })

  test('formats prices in euros using the selected language', () => {
    renderProductsTable()
    expect(screen.getByRole('cell', { name: '€12.50' })).toBeInTheDocument()

    act(() => {
      i18n.loadAndActivate({ locale: 'es', messages: {} })
    })
    expect(screen.getByRole('cell', { name: /12,50\s€/ })).toBeInTheDocument()
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

  test('keeps the rows full width when columns are narrowed without undoing the resize', () => {
    const NativeResizeObserver = ResizeObserver
    globalThis.ResizeObserver = class extends NativeResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        super(callback)
        this.observe = (target) => {
          if (target.getAttribute('data-testid') === 'table-size-container') {
            callback([{ target, contentRect: new DOMRect(0, 0, 1050, 40) } as ResizeObserverEntry], this)
          }
        }
      }
    }
    try {
      renderProductsTable()
    } finally {
      globalThis.ResizeObserver = NativeResizeObserver
    }
    const container = screen.getByTestId('table-container')
    const width = (id: string) => Number.parseFloat(container.style.getPropertyValue(`--col-${id}-size`))
    const totalWidth = () => ['name', 'sku', 'category', 'subcategory', 'price', 'created_at', 'actions']
      .reduce((sum, id) => sum + width(id), 0)
    const initialSkuWidth = width('sku')
    const resizer = screen.getByTestId('table-header-cell-sku-resizer')

    expect(totalWidth()).toBeGreaterThan(1050)
    fireEvent.mouseDown(resizer, { clientX: 200, buttons: 1 })
    fireEvent.mouseMove(document, { clientX: 160, buttons: 1 })
    expect(width('sku')).toBe(initialSkuWidth - 40)
    expect(totalWidth()).toBeCloseTo(1050)
    fireEvent.mouseUp(document, { clientX: 160 })
    expect(width('sku')).toBe(initialSkuWidth - 40)
    expect(totalWidth()).toBeCloseTo(1050)
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
    expect(screen.queryByLabelText('Stock')).not.toBeInTheDocument()
    await user.click(screen.getByRole('combobox', { name: 'Allergens (optional)' }))
    const milk = await screen.findByRole('option', { name: 'Milk', selected: true })
    await user.click(milk)
    await user.keyboard('{Escape}')
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
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(updateProduct).toHaveBeenCalledExactlyOnceWith(7, {
      name: 'Updated product', sku: 'NEW-1', description: null,
      categoryId: 3, subcategoryId: 4, price: 0, allergenIds: [],
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

  test('places row actions in a separate final column with an empty header', () => {
    renderProductsTable()

    const header = screen.getByTestId('table-header-cell-actions')
    expect(screen.getAllByRole('columnheader').at(-1)).toBe(header)
    expect(header).toHaveTextContent(/^$/)
    expect(within(header).queryByRole('button')).not.toBeInTheDocument()
    const edit = screen.getByRole('button', { name: 'Edit product Demo product' })
    const row = screen.getByRole('row', { name: /Demo product/ })
    expect(within(row).getAllByRole('cell').at(-1)).toContainElement(edit)
    expect(within(row).getByRole('cell', { name: /Demo product\s*A sample product/ })).not.toContainElement(edit)
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
    expect(within(popup).getAllByRole('checkbox')).toHaveLength(6)
    expect(within(popup).queryByRole('checkbox', { name: /actions/i })).not.toBeInTheDocument()
    expect(within(popup).queryByRole('button', { name: /Reorder actions/i })).not.toBeInTheDocument()
    for (const name of ['Name', 'SKU', 'Category', 'Subcategory', 'Price', 'Created']) {
      expect(within(popup).getByRole('checkbox', { name })).toBeChecked()
    }
    expect(within(popup).getByRole('checkbox', { name: 'Name' })).toHaveAttribute('aria-disabled', 'true')

    await user.click(within(popup).getByRole('checkbox', { name: 'SKU' }))
    expect(screen.queryByTestId('table-header-cell-sku')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit product Demo product' })).toBeVisible()
    expect(screen.queryByRole('cell', { name: 'DEMO-1' })).not.toBeInTheDocument()
    expect(within(popup).getByRole('checkbox', { name: 'SKU' })).not.toBeChecked()
    expect(screen.getByTestId('table-header-cell-name')).toHaveStyle({ position: 'sticky', left: '0px' })

    await user.click(within(popup).getByRole('checkbox', { name: 'SKU' }))
    expect(screen.getByTestId('table-header-cell-sku')).toBeVisible()
    expect(screen.getByRole('cell', { name: 'DEMO-1' })).toBeVisible()
  })

  test('starts with collapsed filters and keeps controls outside column headers', () => {
    const { container } = renderProductsTable()

    for (const columnId of ['name', 'category', 'subcategory', 'price']) {
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
    render(
      <AppWrapper>
        <QueryClientProvider client={new QueryClient()}>
          <MemoryRouter><FilteredTable /></MemoryRouter>
        </QueryClientProvider>
      </AppWrapper>,
    )

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

  test('shows a readable summary for an existing price filter', async () => {
    renderProductsTable({ columnFilters: [{ id: 'price', value: { minPrice: '', maxPrice: '25' } }] })

    await waitFor(() => expect(screen.getByRole('dialog', { name: 'Product filters' })).toBeVisible())
    fireEvent.click(screen.getByRole('button', { name: /Filters/ }))
    expect(screen.getByRole('group', { name: 'Active filters' })).toHaveTextContent('Price: Max: 25')
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
  ])('displays multiple selected values for the %s filter', (columnId, label, selected, labels) => {
    renderProductsTable({
      columnFilters: [{ id: String(columnId), value: selected }],
      categories,
      subcategories,
    })

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
